import { writeImageFile, deleteFile } from '$lib/helper/write-file';
import ItemSchema from '$lib/schemas/item';
import { db } from '$lib/server/db';
import { fail, redirect, type Actions } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 as zod } from 'sveltekit-superforms/adapters';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    // Hanya section aktif (tidak soft-deleted)
    const sections = await db.section.findMany({
        where: { deletedAt: null },
        include: { cabinet: true }
    });

    return {
        form: await superValidate(zod(ItemSchema)),
        sections
    };
};

export const actions: Actions = {
    default: async (event) => {
        const form = await superValidate(event, zod(ItemSchema));

        console.log('Form validation:', form.valid);
        console.log('Form errors:', form.errors);

        if (!form.valid) {
            return fail(400, { form, message: 'Invalid input!' });
        }

        const {
            name,
            stock,
            location,
            category,
            subCategory,
            serialNumber,
            videoUrl,
            qrCustomUrl,
            sectionId,
            priceIdr,
            priceNoteIdr,
            costPrice,
            costNote
        } = form.data;

        const file = form.data.file as File | undefined;
        let imageUrl: string | null = null;

        // FIX: locals.session bukan locals.user
        const currentUserId = event.locals.session?.id?.toString() ?? '';

        console.log('Form data received:', { name, sectionId, priceIdr, costPrice, serialNumber, qrCustomUrl });

        // ── Cek section & cabinet ────────────────
        const targetSection = await db.section.findUnique({
            where: { id: sectionId },
            include: {
                cabinet: {
                    include: {
                        sections: {
                            where: { deletedAt: null }, // hanya section aktif
                            include: {
                                items: { where: { deletedAt: null } } // FIX: hanya item aktif
                            }
                        }
                    }
                }
            }
        });

        if (!targetSection?.cabinet) {
            return fail(404, { form, message: 'Section atau Cabinet tidak ditemukan!' });
        }

        const cabinet = targetSection.cabinet;

        // FIX: hitung hanya item aktif (bukan soft-deleted)
        const currentTotalItems = cabinet.sections.reduce((sum, section) => {
            return sum + section.items.length;
        }, 0);

        console.log('Item count (aktif saja):', cabinet.name, currentTotalItems, '/', cabinet.maxSlots);

        // Jika cabinet full — auto expand maxSlots + catat warning
        let cabinetExpandedWarning: string | null = null;
        if (currentTotalItems >= cabinet.maxSlots) {
            const newMaxSlots = cabinet.maxSlots + 1;
            await db.cabinet.update({
                where: { id: cabinet.id },
                data: { maxSlots: newMaxSlots }
            });
            cabinetExpandedWarning =
                `Slot cabinet "${cabinet.name}" otomatis ditambah ` +
                `dari ${cabinet.maxSlots} menjadi ${newMaxSlots} karena sudah penuh.`;
            console.log('Cabinet slot expanded:', cabinet.name, cabinet.maxSlots, '→', newMaxSlots);
        }

        // ── Cek serial number duplikat ───────────
        if (serialNumber) {
            const existingSerial = await db.item.findFirst({
                where: { serialNumber }
            });
            if (existingSerial) {
                return fail(400, {
                    form,
                    message: 'Serial number sudah digunakan! Gunakan serial number yang unik.'
                });
            }
        }

        // ── Upload image ─────────────────────────
        if (file && file instanceof File && file.size > 0) {
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
            if (!allowedTypes.includes(file.type)) {
                return fail(400, { form, message: 'Format gambar tidak valid! Gunakan JPG, PNG, atau WEBP.' });
            }

            try {
                imageUrl = await writeImageFile(file);
                console.log('Image uploaded:', imageUrl);
                if (!imageUrl) {
                    return fail(500, { form, message: 'Gagal upload gambar!' });
                }
            } catch (error) {
                console.error('Upload error:', error);
                return fail(500, { form, message: 'Error saat upload gambar!' });
            }
        }

        // ── Create item ──────────────────────────
        try {
            const newItem = await db.item.create({
                data: {
                    name,
                    stock,
                    location,
                    category,
                    subCategory,
                    serialNumber: serialNumber || null,
                    videoUrl: videoUrl || null,
                    qrCustomUrl: qrCustomUrl || null,
                    imageUrl,
                    sectionId,
                    price: priceIdr > 0 ? {
                        create: {
                            amount: priceIdr,
                            priceNote: priceNoteIdr,
                            isActive: true
                        }
                    } : undefined,
                    costPrice: costPrice > 0 ? {
                        create: {
                            amount: costPrice,
                            note: costNote || null
                        }
                    } : undefined
                }
            });

            console.log('Item created successfully:', newItem.id);

            // FIX: triggeredBy bukan userId, sesuai schema ItemHistory
            if (currentUserId) {
                await db.$transaction([
                    db.itemHistory.create({
                        data: {
                            action: 'CREATED',
                            itemId: newItem.id,
                            triggeredBy: currentUserId, // ← FIX
                            note: cabinetExpandedWarning
                                ? `Item "${name}" dibuat. ${cabinetExpandedWarning}`
                                : `Item "${name}" berhasil dibuat.`
                        }
                    }),
                    db.cabinetLog.create({
                        data: {
                            action: 'ITEM_ADDED',
                            performedById: currentUserId,
                            cabinetId: cabinet.id,
                            cabinetName: cabinet.name,
                            sectionId: targetSection.id,
                            sectionName: targetSection.name,
                            itemId: newItem.id,
                            itemName: name,
                            note: cabinetExpandedWarning
                                ?? `Item "${name}" ditambahkan ke section "${targetSection.name}"`
                        }
                    })
                ]);
            }

            console.log('History & cabinet log created');

        } catch (error) {
            console.error('Create item error:', error);
            if (imageUrl) await deleteFile(imageUrl);
            return fail(500, {
                form,
                message: 'Gagal membuat item: ' + (error as Error).message
            });
        }

        // Redirect dengan warning kalau slot di-expand
        if (cabinetExpandedWarning) {
            throw redirect(303, `/admin/item?warning=${encodeURIComponent(cabinetExpandedWarning)}`);
        }

        throw redirect(303, '/admin/item');
    }
};