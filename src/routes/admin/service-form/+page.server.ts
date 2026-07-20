import { db } from '$lib/server/db';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    const session = locals.session;
    if (!session) throw error(401, 'Unauthorized');

    const serviceForms = await db.serviceForm.findMany({
        include: {
            items: {
                include: { item: true }
            },
            invoice: true,
            createdBy: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    return { serviceForms };
};
