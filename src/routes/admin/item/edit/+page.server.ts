import { deleteFile, writeVideoFile, writeImageFile } from '$lib/helper/write-file';
import ItemSchema from '$lib/schemas/item';
import { db } from '$lib/server/db';
import { error, fail, redirect, type Actions } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 as zod } from 'sveltekit-superforms/adapters';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
    const id = Number(url.searchParams.get('id'));

    if (!id || isNaN(id)) {
        throw error(400, 'Item ID is required');
    }

    const item = await db.item.findUnique({
        where: { id },
        include: {
            section: {
                include: { cabinet: true }
            },
            price: true,      // ← one-to-one: harga jual IDR
            costPrice: true   // ← one-to-one: harga modal IDR
        }
    });

    if (!item) {
        throw error(404, 'Item not found');
    }

    const sections = await db.section.findMany({
        include: { cabinet: true }
    });

    const form = await superValidate(
        {
            name: item.name,
            stock: item.stock,
            location: item.location,
            category: item.category,
            subCategory: item.subCategory,
            serialNumber: item.serialNumber ?? undefined,
            videoUrl: item.videoUrl ?? undefined,
            qrCustomUrl: item.qrCustomUrl ?? undefined,
            sectionId: item.sectionId,
            priceIdr: item.price?.amount ?? 0,
            priceNoteIdr: item.price?.priceNote ?? '',
            costPrice: item.costPrice?.amount ?? 0,
            costNote: item.costPrice?.note ?? '',
        },
        zod(ItemSchema)
    );

    return { form, item, sections };
};

export const actions: Actions = {
    default: async (event) => {
        const requestFormData = await event.request.formData();

        // Extract text fields dari formData
        const name = requestFormData.get('name') as string;
        const stock = Number(requestFormData.get('stock'));
        const location = requestFormData.get('location') as string;
        const category = requestFormData.get('category') as string;
        const subCategory = requestFormData.get('subCategory') as string;
        const serialNumber = requestFormData.get('serialNumber') as string || null;
        const videoUrl = requestFormData.get('videoUrl') as string;
        const qrCustomUrl = requestFormData.get('qrCustomUrl') as string;
        const sectionId = Number(requestFormData.get('sectionId'));
        const priceIdr = Number(requestFormData.get('priceIdr'));
        const priceNoteIdr = requestFormData.get('priceNoteIdr') as string;
        const costPrice = Number(requestFormData.get('costPrice') || 0);
        const costNote = requestFormData.get('costNote') as string || '';

        const id = Number(event.url.searchParams.get('id'));

        if (!id || isNaN(id)) {
            return fail(400, { message: 'Invalid item ID!' });
        }

        // Validasi sederhana
        if (!name || !location || !category || !subCategory || !sectionId) {
            return fail(400, { message: 'Missing required fields!' });
        }

        const existingItem = await db.item.findUnique({
            where: { id },
            include: {
                section: true,
                price: true,
                costPrice: true
            }
        });

        if (!existingItem) {
            return fail(404, { message: 'Item not found!' });
        }

        // Validasi serial number unik (jika diisi dan berubah)
        if (serialNumber && serialNumber !== existingItem.serialNumber) {
            const existingSerial = await db.item.findFirst({
                where: {
                    serialNumber: serialNumber,
                    id: { not: id }
                }
            });
            if (existingSerial) {
                return fail(400, { message: 'Serial number already exists! Please use a unique serial number.' });
            }
        }

        // Handle video upload
        let newVideoUrl: string | null = null;
        const uploadedVideo = requestFormData.get('videoFile') as File | null;
        if (uploadedVideo && uploadedVideo instanceof File && uploadedVideo.size > 0) {
            if (!['video/mp4', 'video/webm'].includes(uploadedVideo.type)) {
                return fail(400, { message: 'Invalid video format! Use MP4 or WEBM.' });
            }

            try {
                const fileName = await writeVideoFile(uploadedVideo);
                if (fileName) {
                    newVideoUrl = `/upload/videos/${fileName}`;
                    if (existingItem.videoUrl) {
                        await deleteFile(existingItem.videoUrl);
                    }
                }
            } catch {
                return fail(500, { message: 'Error when uploading the video!' });
            }
        }

        // Handle image upload (OPTIONAL - hanya jika ada file)
        let newImageUrl: string | null = null;
        const uploadedImage = requestFormData.get('file') as File | null;
        if (uploadedImage && uploadedImage instanceof File && uploadedImage.size > 0) {
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
            if (!allowedTypes.includes(uploadedImage.type)) {
                return fail(400, { message: 'Invalid image format! Use JPG, PNG, or WEBP.' });
            }

            try {
                newImageUrl = await writeImageFile(uploadedImage);
                if (newImageUrl && existingItem.imageUrl) {
                    await deleteFile(existingItem.imageUrl);
                }
            } catch {
                return fail(500, { message: 'Error when uploading the image!' });
            }
        }

        // Cek apakah section berpindah
        if (sectionId !== existingItem.sectionId) {
            const targetSection = await db.section.findUnique({
                where: { id: sectionId },
                include: {
                    cabinet: {
                        include: {
                            sections: {
                                include: { items: true }
                            }
                        }
                    }
                }
            });

            if (!targetSection?.cabinet) {
                return fail(404, { message: 'Target section or cabinet not found!' });
            }

            const cabinet = targetSection.cabinet;
            const currentTotalItems = cabinet.sections.reduce(
                (sum, s) => sum + s.items.length,
                0
            );

            if (currentTotalItems >= cabinet.maxSlots) {
                return fail(400, {
                    message: `Cabinet "${cabinet.name}" is full! Max ${cabinet.maxSlots} slots.`
                });
            }
        }

        // Catat perubahan sebelum update
        const changes: Record<string, { old: any; new: any }> = {};
        if (name !== existingItem.name) changes['name'] = { old: existingItem.name, new: name };
        if (stock !== existingItem.stock) changes['stock'] = { old: existingItem.stock, new: stock };
        if (category !== existingItem.category) changes['category'] = { old: existingItem.category, new: category };
        if (subCategory !== existingItem.subCategory) changes['subCategory'] = { old: existingItem.subCategory, new: subCategory };
        if (location !== existingItem.location) changes['location'] = { old: existingItem.location, new: location };
        if (serialNumber !== existingItem.serialNumber) changes['serialNumber'] = { old: existingItem.serialNumber, new: serialNumber };
        if (sectionId !== existingItem.sectionId) changes['sectionId'] = { old: existingItem.sectionId, new: sectionId };
        if (priceIdr !== (existingItem.price?.amount ?? 0)) changes['price'] = { old: existingItem.price?.amount ?? 0, new: priceIdr };
        if (costPrice !== (existingItem.costPrice?.amount ?? 0)) changes['costPrice'] = { old: existingItem.costPrice?.amount ?? 0, new: costPrice };

        // Update item, price, dan costPrice
        try {
            await db.$transaction(async (tx) => {
                // Update item
                await tx.item.update({
                    where: { id: existingItem.id },
                    data: {
                        name,
                        stock,
                        location,
                        category,
                        subCategory,
                        serialNumber: serialNumber || null,
                        videoUrl: newVideoUrl ?? (videoUrl || null),
                        qrCustomUrl: qrCustomUrl || null,
                        ...(newImageUrl && { imageUrl: newImageUrl }),
                        section: {
                            connect: { id: sectionId }
                        }
                    }
                });

                // Update atau buat Price (harga jual IDR)
                if (existingItem.price) {
                    await tx.price.update({
                        where: { id: existingItem.price.id },
                        data: { amount: priceIdr, priceNote: priceNoteIdr }
                    });
                } else if (priceIdr > 0) {
                    await tx.price.create({
                        data: {
                            itemId: existingItem.id,
                            amount: priceIdr,
                            priceNote: priceNoteIdr,
                            isActive: true
                        }
                    });
                }

                // Update atau buat CostPrice (harga modal IDR)
                if (costPrice > 0) {
                    if (existingItem.costPrice) {
                        await tx.costPrice.update({
                            where: { id: existingItem.costPrice.id },
                            data: { amount: costPrice, note: costNote || null }
                        });
                    } else {
                        await tx.costPrice.create({
                            data: {
                                itemId: existingItem.id,
                                amount: costPrice,
                                note: costNote || null
                            }
                        });
                    }
                } else if (existingItem.costPrice) {
                    // Hapus cost price jika costPrice = 0
                    await tx.costPrice.delete({
                        where: { id: existingItem.costPrice.id }
                    });
                }

                // Catat history perubahan
                if (Object.keys(changes).length > 0) {
                    await tx.itemHistory.create({
                        data: {
                            itemId: existingItem.id,
                            action: 'STOCK_UPDATED',
                            oldStock: existingItem.stock,
                            newStock: stock,
                            triggeredBy: event.locals.session?.id || '',
                            oldValue: changes,
                            note: `Item diupdate oleh ${event.locals.session?.username || 'unknown'}`
                        }
                    });
                }
            });
        } catch (err) {
            console.error('Update error:', err);
            return fail(500, { message: 'Failed to update item: ' + (err as Error).message });
        }

        throw redirect(303, '/admin/item');
    }
};