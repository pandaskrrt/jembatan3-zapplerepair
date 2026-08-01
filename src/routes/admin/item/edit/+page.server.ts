import { db } from '$lib/server/db';
import { error, fail, redirect, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
    const id = Number(url.searchParams.get('id'));
    if (!id || isNaN(id)) throw error(400, 'Item ID is required');

    const item = await db.item.findUnique({
        where: { id },
        include: {
            section: { include: { cabinet: true } },
            serials: {
                include: { images: { orderBy: { sortOrder: 'asc' } } },
                orderBy: { createdAt: 'asc' }
            }
        }
    });
    if (!item) throw error(404, 'Item not found');

    const sections = await db.section.findMany({
        where: {
            deletedAt: null,
            OR: [
                { isProtected: false, cabinet: { isProtected: false } },
                { isProtected: true },
                { cabinet: { isProtected: true } },
                { id: item.sectionId ?? -1 }
            ]
        },
        include: { cabinet: true },
        orderBy: { name: 'asc' }
    });

    return { item, sections };
};

export const actions: Actions = {
    default: async (event) => {
        const formData = await event.request.formData();
        const id = Number(event.url.searchParams.get('id'));
        if (!id || isNaN(id)) return fail(400, { message: 'Invalid item ID!' });

        const name = formData.get('name') as string;
        const location = formData.get('location') as string;
        const category = formData.get('category') as any;
        const subCategory = formData.get('subCategory') as string;
        const sectionId = Number(formData.get('sectionId'));
        const isCustomer = formData.get('isCustomer') === 'true';

        if (!name || !location || !category || !subCategory || !sectionId) {
            return fail(400, { message: 'Missing required fields!' });
        }

        const existingItem = await db.item.findUnique({
            where: { id },
            include: { section: { include: { cabinet: true } } }
        });
        if (!existingItem) return fail(404, { message: 'Item not found!' });

        if (sectionId !== existingItem.sectionId) {
            const targetSection = await db.section.findUnique({
                where: { id: sectionId },
                include: { cabinet: { include: { sections: { include: { items: true } } } } }
            });
            if (!targetSection?.cabinet) return fail(404, { message: 'Target section or cabinet not found!' });

            const isExistingPaten = existingItem.section?.isProtected || existingItem.section?.cabinet?.isProtected;
            const isTargetPaten = targetSection.isProtected || targetSection.cabinet.isProtected;
            if (isExistingPaten && !isCustomer && !isTargetPaten) {
                return fail(400, { message: 'Barang non-customer di lokasi paten bersifat final dan tidak bisa dipindahkan kembali ke rak biasa!' });
            }

            const cabinet = targetSection.cabinet;
            const currentTotalItems = cabinet.sections.reduce((sum, s) => sum + s.items.length, 0);
            if (currentTotalItems >= cabinet.maxSlots) {
                return fail(400, { message: `Cabinet "${cabinet.name}" is full! Max ${cabinet.maxSlots} slots.` });
            }
        }

        await db.item.update({
            where: { id },
            data: {
                name,
                location,
                category,
                subCategory,
                section: { connect: { id: sectionId } },
                isCustomer,
                ...(isCustomer && !existingItem.isCustomer ? { originSectionId: sectionId, originSectionName: existingItem.section?.name ?? null } : {}),
                ...(isCustomer && existingItem.isCustomer && sectionId !== existingItem.sectionId ? { originSectionId: sectionId, originSectionName: existingItem.section?.name ?? null } : {}),
                ...(!isCustomer ? { originSectionId: null, originSectionName: null } : {})
            }
        });

        // Catat riwayat perubahan (hanya field yang berubah) — menjaga fitur riwayat J3
        try {
            const changes: Record<string, { old: any; new: any }> = {};
            if (name !== existingItem.name) changes['name'] = { old: existingItem.name, new: name };
            if (location !== existingItem.location) changes['location'] = { old: existingItem.location, new: location };
            if (category !== existingItem.category) changes['category'] = { old: existingItem.category, new: category };
            if (subCategory !== existingItem.subCategory) changes['subCategory'] = { old: existingItem.subCategory, new: subCategory };
            if (sectionId !== existingItem.sectionId) changes['sectionId'] = { old: existingItem.sectionId, new: sectionId };
            if (isCustomer !== existingItem.isCustomer) changes['isCustomer'] = { old: existingItem.isCustomer, new: isCustomer };

            if (Object.keys(changes).length > 0) {
                await db.itemHistory.create({
                    data: {
                        itemId: id,
                        action: 'STOCK_UPDATED',
                        // Stok dihitung otomatis dari jumlah serial, jadi tidak berubah di halaman edit
                        oldStock: null,
                        newStock: null,
                        triggeredBy: event.locals.session?.id || '',
                        oldValue: changes,
                        note: `Item diupdate oleh ${event.locals.session?.username || 'unknown'}`
                    }
                });
            }
        } catch (err) {
            console.error('Gagal mencatat riwayat (non-critical):', err);
        }

        throw redirect(303, '/admin/item');
    }
};
