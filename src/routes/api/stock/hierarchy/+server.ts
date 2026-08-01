import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';

export const GET: RequestHandler = async ({ url }) => {
    const sectionId = url.searchParams.get('sectionId');

    const cabinets = await db.cabinet.findMany({
        where: { deletedAt: null, isProtected: false },
        include: {
            sections: {
                where: { deletedAt: null },
                include: sectionId ? {
                    items: {
                        where: { deletedAt: null, category: { in: ['Accessories', 'Sparepart'] } },
                        include: {
                            serials: { where: { status: 'AVAILABLE' }, select: { id: true, serialNumber: true, category: true, price: true, costPrice: true, grade: true, status: true } },
                            section: { select: { name: true } }
                        },
                        orderBy: { name: 'asc' }
                    }
                } : undefined
            }
        },
        orderBy: { name: 'asc' }
    });

    const formatted = cabinets.map(c => ({
        id: c.id,
        name: c.name,
        sections: c.sections.map(s => ({
            id: s.id,
            name: s.name,
            items: sectionId && sectionId === String(s.id) ? (s as any).items?.map((i: any) => ({
                id: i.id,
                name: i.name,
                category: i.category,
                stock: i.serials?.filter((ser: any) => ser.status === 'AVAILABLE').length || 0,
                serials: i.serials?.filter((ser: any) => ser.status === 'AVAILABLE').map((ser: any) => ({
                    id: ser.id,
                    serialNumber: ser.serialNumber,
                    category: ser.category,
                    price: ser.price,
                    costPrice: ser.costPrice,
                    grade: ser.grade,
                    status: ser.status
                })) || []
            })) : []
        }))
    }));

    return json({ success: true, data: formatted });
};
