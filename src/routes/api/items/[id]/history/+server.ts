import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';

export const GET: RequestHandler = async ({ params, locals }) => {
    const session = locals.session;
    if (!session) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rawId = params.id;
    if (!rawId) {
        return json({ error: 'Item ID is required' }, { status: 400 });
    }

    const itemId = parseInt(rawId);
    if (isNaN(itemId)) {
        return json({ error: 'Invalid item ID' }, { status: 400 });
    }

    const item = await db.item.findUnique({
        where: { id: itemId },
        select: { name: true }
    });

    if (!item) {
        return json({ error: 'Item not found' }, { status: 404 });
    }

    const histories = await db.itemHistory.findMany({
        where: { itemId },
        include: { user: { select: { name: true, username: true } } },
        orderBy: { createdAt: 'desc' }
    });

    return json({
        success: true,
        data: {
            item: { id: itemId, name: item.name },
            histories: histories.map(h => ({
                id: h.id,
                action: h.action,
                oldStock: h.oldStock,
                newStock: h.newStock,
                oldValue: h.oldValue,
                newValue: h.newValue,
                note: h.note,
                triggeredBy: h.user?.name || h.triggeredBy,
                createdAt: h.createdAt
            }))
        }
    });
};
