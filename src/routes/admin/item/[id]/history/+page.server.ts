import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
    const rawId = params.id;
    if (!rawId) {
        throw error(400, 'Item ID is required');
    }

    const itemId = Number(rawId);
    if (!itemId || isNaN(itemId)) {
        throw error(400, 'Item ID is required');
    }

    const item = await db.item.findUnique({
        where: { id: itemId },
        include: { price: true, costPrice: true }
    });

    if (!item) {
        throw error(404, 'Item not found');
    }

    const histories = await db.itemHistory.findMany({
        where: { itemId },
        include: { user: { select: { name: true, username: true } } },
        orderBy: { createdAt: 'desc' }
    });

    return { item, histories };
};
