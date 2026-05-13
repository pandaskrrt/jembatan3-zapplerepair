import { db } from '$lib/server/db';
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ depends }) => {
    // Register dependency key untuk invalidate
    depends('admin:data');
    
    try {
        // Ambil semua cabinet dengan sections dan cards
        const cabinets = await db.cabinet.findMany({
            include: {
                sections: {
                    include: {
                        cards: {
                            include: {
                                prices: true
                            }
                        },
                        _count: {
                            select: { cards: true }
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

        // Ambil semua cards untuk flat view dan search
        const cards = await db.card.findMany({
            include: {
                section: {
                    include: {
                        cabinet: true
                    }
                },
                prices: true
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
            cards, 
            sections 
        };
    } catch (error) {
        console.error('Load cards error:', error);
        return { 
            cabinets: [], 
            cards: [], 
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
                return fail(400, { success: false, message: 'Invalid card ID' });
            }

            const card = await db.card.findUnique({ 
                where: { id },
                select: { imageUrl: true }
            });
            
            if (!card) {
                return fail(404, { success: false, message: 'Card not found' });
            }
            
            // Delete image file if exists
            if (card.imageUrl) {
                const { deleteFile } = await import('$lib/helper/write-file');
                await deleteFile(card.imageUrl);
            }
            
            await db.card.delete({ where: { id } });
            
            return { success: true, message: 'Card deleted successfully!' };
            
        } catch (error) {
            console.error('Delete error:', error);
            return fail(500, { success: false, message: error.message || 'Failed to delete card' });
        }
    }
};