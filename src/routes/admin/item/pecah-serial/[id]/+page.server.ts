import { db } from '$lib/server/db';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
    const serialId = Number(params.id);
    if (!serialId || isNaN(serialId)) throw error(400, 'Serial ID is required');

    const serial = await db.itemSerial.findUnique({
        where: { id: serialId },
        include: {
            item: { include: { price: true, costPrice: true } },
            images: { orderBy: { sortOrder: 'asc' } }
        }
    });
    if (!serial) throw error(404, 'Serial not found');

    const cabinets = await db.cabinet.findMany({
        where: { deletedAt: null, isProtected: false },
        include: {
            sections: {
                where: { deletedAt: null },
                select: {
                    id: true, name: true, type: true,
                    items: {
                        where: { deletedAt: null },
                        select: { id: true, name: true, category: true, subCategory: true },
                        orderBy: { name: 'asc' }
                    }
                }
            }
        },
        orderBy: { name: 'asc' }
    });

    const barangLuarSections = await db.section.findMany({
        where: { deletedAt: null, cabinet: { name: 'Barang Luar', isProtected: true } },
        include: { cabinet: true }
    });

    return { serial, cabinets, barangLuarSections };
};
