import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';

/**
 * GET /api/stock/sections
 */
export const GET: RequestHandler = async ({ url }) => {
    const cabinetId = url.searchParams.get('cabinetId');

    const where: any = { deletedAt: null };
    if (cabinetId) {
        where.cabinetId = Number(cabinetId);
    }

    const sections = await db.section.findMany({
        where,
        include: {
            cabinet: { select: { id: true, name: true } },
            _count: { select: { items: { where: { deletedAt: null } } } }
        },
        orderBy: { name: 'asc' }
    });

    return json({
        success: true,
        data: sections.map(s => ({
            id: s.id,
            name: s.name,
            type: s.type,
            cabinetId: s.cabinetId,
            cabinetName: s.cabinet?.name,
            itemCount: s._count.items
        }))
    });
};

/**
 * POST /api/stock/sections
 * 
 * Body: { name: string, type: string, cabinetId: number }
 */
export const POST: RequestHandler = async ({ request }) => {
    const body = await request.json();
    const { name, type, cabinetId } = body;

    if (!name || !name.trim() || !cabinetId) {
        return json({ error: 'name and cabinetId are required' }, { status: 400 });
    }

    const cabinet = await db.cabinet.findUnique({ where: { id: cabinetId } });
    if (!cabinet) {
        return json({ error: 'Cabinet not found' }, { status: 404 });
    }

    const section = await db.section.create({
        data: {
            name: name.trim(),
            type: type?.trim() || 'Sparepart',
            cabinetId
        }
    });

    return json({
        success: true,
        section: { id: section.id, name: section.name, type: section.type, cabinetId: section.cabinetId }
    });
};
