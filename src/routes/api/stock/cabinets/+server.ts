import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';

/**
 * GET /api/stock/cabinets
 */
export const GET: RequestHandler = async ({ url }) => {
    const includeSections = url.searchParams.get('includeSections') === 'true';

    const cabinets = await db.cabinet.findMany({
        where: { deletedAt: null },
        include: includeSections ? {
            sections: {
                where: { deletedAt: null },
                select: { id: true, name: true, type: true },
                orderBy: { name: 'asc' }
            }
        } : undefined,
        orderBy: { name: 'asc' }
    });

    return json({
        success: true,
        data: cabinets.map(c => ({
            id: c.id,
            name: c.name,
            maxSlots: c.maxSlots,
            ...(includeSections ? { sections: c.sections } : {})
        }))
    });
};

/**
 * POST /api/stock/cabinets
 * 
 * Body: { name: string, maxSlots?: number }
 */
export const POST: RequestHandler = async ({ request }) => {
    const body = await request.json();
    const { name, maxSlots } = body;

    if (!name || !name.trim()) {
        return json({ error: 'name is required' }, { status: 400 });
    }

    const cabinet = await db.cabinet.create({
        data: {
            name: name.trim(),
            maxSlots: maxSlots || 10
        }
    });

    return json({
        success: true,
        cabinet: { id: cabinet.id, name: cabinet.name, maxSlots: cabinet.maxSlots }
    });
};
