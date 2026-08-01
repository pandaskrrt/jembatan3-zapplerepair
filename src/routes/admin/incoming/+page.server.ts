import { db } from '$lib/server/db';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    const session = locals.session;
    if (!session) throw error(401, 'Unauthorized');

    const incoming = await db.incomingItemCabang.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' }
    });

    const eksekusi = await db.incomingItemCabang.findMany({
        where: { status: 'EKSEKUSI' },
        orderBy: { createdAt: 'desc' }
    });

    const confirmed = await db.incomingItemCabang.findMany({
        where: { status: 'CONFIRMED' },
        orderBy: { confirmedAt: 'desc' },
        take: 50
    });

    // Cabinet & section tujuan untuk form pindah stock
    const cabinets = await db.cabinet.findMany({
        where: { deletedAt: null },
        include: {
            sections: {
                where: { deletedAt: null },
                include: {
                    items: {
                        where: { deletedAt: null }
                    }
                }
            }
        },
        orderBy: { id: 'asc' }
    });

    // Resolve nama user dari confirmedBy (user id) untuk ditampilkan di riwayat
    const allItems = [...incoming, ...eksekusi, ...confirmed];
    const actorIds = [...new Set(allItems.map((i: any) => i.confirmedBy).filter(Boolean))];
    const users = actorIds.length
        ? await db.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, name: true, username: true } })
        : [];
    const userNames = new Map(users.map((u: any) => [u.id, u.name || u.username]));
    const withName = (items: any[]) => items.map((i: any) => ({
        ...i,
        confirmedByName: i.confirmedBy ? userNames.get(i.confirmedBy) || i.confirmedBy : null
    }));

    return { incoming: withName(incoming), eksekusi: withName(eksekusi), confirmed: withName(confirmed), cabinets, user: session };
};
