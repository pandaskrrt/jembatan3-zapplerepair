import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';

export const GET: RequestHandler = async ({ locals }) => {
    const session = locals.session;
    if (!session) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sections = await db.section.findMany({
        where: {
            deletedAt: null,
            OR: [
                { isProtected: true },
                { cabinet: { isProtected: true } }
            ]
        },
        include: { cabinet: true },
        orderBy: { name: 'asc' }
    });

    const locations = sections.map(sec => ({
        id: sec.id,
        name: sec.cabinet?.name ?? sec.name
    }));

    return json({ data: locations });
};
