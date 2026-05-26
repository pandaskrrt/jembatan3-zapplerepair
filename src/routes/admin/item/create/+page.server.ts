import { writeImageFile, deleteFile } from '$lib/helper/write-file';
import ItemSchema from '$lib/schemas/item';
import { db } from '$lib/server/db';
import { fail, redirect, type Actions } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 as zod } from 'sveltekit-superforms/adapters';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    const sections = await db.section.findMany({
        include: {
            cabinet: true
        }
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

        console.log('Form data received:', {
            name,
            sectionId,
            priceIdr,
            costPrice,
            serialNumber,
            qrCustomUrl
        });

        const targetSection = await db.section.findUnique({
            where: { id: sectionId },
            include: {
                cabinet: {
                    include: {
                        sections: {
                            include: {
                                items: true
                            }
                        }
                    }
                }
            }
        });

        if (!targetSection?.cabinet) {
            console.log('Section or cabinet not found');
            return fail(404, { form, message: 'Section or Cabinet not found!' });
        }

        const cabinet = targetSection.cabinet;

        const currentTotalItems = cabinet.sections.reduce((sum, section) => {
            return sum + section.items.length;
        }, 0);

        if (currentTotalItems >= cabinet.maxSlots) {
            console.log('Cabinet full:', cabinet.name, currentTotalItems, cabinet.maxSlots);
            return fail(400, {
                form,
                message: `Cabinet "${cabinet.name}" is full! Max ${cabinet.maxSlots} slots.`
            });
        }


        if (serialNumber) {
            const existingSerial = await db.item.findFirst({
                where: { serialNumber: serialNumber }
            });
            if (existingSerial) {
                return fail(400, { form, message: 'Serial number already exists! Please use a unique serial number.' });
            }
        }

        if (file && file instanceof File && file.size > 0) {
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
            if (!allowedTypes.includes(file.type)) {
                console.log('Invalid image type:', file.type);
                return fail(400, { form, message: 'Invalid image format! Use JPG, PNG, or WEBP' });
            }

            try {
                imageUrl = await writeImageFile(file);
                console.log('Image uploaded:', imageUrl);
                if (!imageUrl) {
                    return fail(500, { form, message: 'Failed to upload image!' });
                }
            } catch (error) {
                console.error('Upload error:', error);
                return fail(500, { form, message: 'Error when uploading the image!' });
            }
        }

<<<<<<< HEAD
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
                    imageUrl: imageUrl,
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
=======
		// Create item with price and costPrice
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
					imageUrl: imageUrl,
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
>>>>>>> 0236b5542668f4824ebcff75d276c590dbf4e8a9

            console.log('Item created successfully:', newItem.id);

<<<<<<< HEAD
            // TAMBAHAN: Mencatat ke ItemHistory agar muncul di Laporan Mingguan
            await db.itemHistory.create({
                data: {
                    action: 'CREATED',
                    itemId: newItem.id,
                    userId: event.locals.user?.id || 'SYSTEM',
                    note: `Item "${name}" berhasil dibuat.`
                }
            });
            console.log('History item created successfully');
=======
		} catch (error) {
			console.error('Create item error:', error);
			if (imageUrl) {
				await deleteFile(imageUrl);
			}
			return fail(500, { form, message: 'Failed to create item: ' + (error as Error).message });
		}
>>>>>>> 0236b5542668f4824ebcff75d276c590dbf4e8a9

        } catch (error) {
            console.error('Create item error:', error);
            if (imageUrl) {
                await deleteFile(imageUrl);
            }
            return fail(500, { form, message: 'Failed to create item: ' + (error as Error).message });
        }

        console.log('Redirecting to /admin/item');
        throw redirect(303, '/admin/item');
    }
};