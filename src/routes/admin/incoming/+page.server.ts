import { db } from '$lib/server/db';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    const session = locals.session;
    if (!session) throw error(401, 'Unauthorized');

    const incoming = await db.incomingItem.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' }
    });

    const confirmed = await db.incomingItem.findMany({
        where: { status: 'CONFIRMED' },
        orderBy: { confirmedAt: 'desc' },
        take: 50
    });

    const cabinets = await db.cabinet.findMany({
        where: { deletedAt: null },
        include: {
            sections: {
                where: { deletedAt: null },
                include: {
                    items: { where: { deletedAt: null }, select: { id: true, name: true }, orderBy: { name: 'asc' } }
                },
                orderBy: { name: 'asc' }
            }
        },
        orderBy: { name: 'asc' }
    });

    return { incoming, confirmed, cabinets };
};
