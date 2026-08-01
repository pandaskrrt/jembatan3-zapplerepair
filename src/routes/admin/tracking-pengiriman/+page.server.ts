import { db } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.session;
	if (!session) {
		return { status: 401, error: 'Unauthorized' };
	}

	// Get all IncomingItemCabang records yang dikirim dari Roxy
	const pengiriman = await db.incomingItemCabang.findMany({
		where: {
			source: 'Roxy'
		},
		orderBy: {
			createdAt: 'desc'
		}
	});

	return {
		pengiriman
	};
};
