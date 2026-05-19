import { db } from '$lib/server/db';
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ depends }) => {
    // Register dependency key untuk invalidate
    depends('admin:data');

    try {
        // Ambil semua cabinet dengan sections dan items
        const cabinets = await db.cabinet.findMany({
            include: {
                sections: {
                    include: {
                        items: {
                            include: {
                                price: true,      // ← DIUBAH: price (one-to-one)
                                costPrice: true   // ← DIUBAH: costPrice (one-to-one)
                            }
                        },
                        _count: {
                            select: { items: true }
                        }
                    }
                },
                _count: {
                    select: { sections: true }
                }
            },
            orderBy: {
                id: 'asc'
            }
        });

        // Ambil semua items untuk flat view dan search
        const items = await db.item.findMany({
            include: {
                section: {
                    include: {
                        cabinet: true
                    }
                },
                price: true,      // ← DIUBAH: price (one-to-one)
                costPrice: true   // ← DIUBAH: costPrice (one-to-one)
            },
            orderBy: {
                id: 'desc'
            }
        });

        // Ambil semua sections untuk filter
        const sections = await db.section.findMany({
            include: {
                cabinet: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        return {
            cabinets,
            items,
            sections
        };
    } catch (error) {
        console.error('Load items error:', error);
        return {
            cabinets: [],
            items: [],
            sections: []
        };
    }
};

export const actions: Actions = {
    delete: async ({ request }) => {
        try {
            const formData = await request.formData();
            const id = Number(formData.get('id'));

            if (isNaN(id)) {
                return fail(400, { success: false, message: 'Invalid item ID' });
            }

            const item = await db.item.findUnique({
                where: { id },
                select: { imageUrl: true }
            });

            if (!item) {
                return fail(404, { success: false, message: 'Item not found' });
            }

            // Delete image file if exists
            if (item.imageUrl) {
                const { deleteFile } = await import('$lib/helper/write-file');
                await deleteFile(item.imageUrl);
            }

            // Delete price (harga jual) - one-to-one
            await db.price.deleteMany({
                where: { itemId: id }
            });

            // Delete cost price (harga modal) - one-to-one
            await db.costPrice.deleteMany({
                where: { itemId: id }
            });

            // Delete order histories if any
            await db.orderHistory.deleteMany({
                where: { itemId: id }
            });

            // Update stock audit items to set itemId to null
            await db.stockAuditItem.updateMany({
                where: { itemId: id },
                data: { itemId: null }
            });

            // Delete item history records
            await db.itemHistory.deleteMany({
                where: { itemId: id }
            });

            // Delete the item
            await db.item.delete({ where: { id } });

            return { success: true, message: 'Item deleted successfully!' };

        } catch (error) {
            console.error('Delete error:', error);
            return fail(500, { success: false, message: (error as Error).message || 'Failed to delete item' });
        }
    }
};