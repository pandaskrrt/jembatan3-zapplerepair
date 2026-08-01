import { db } from '$lib/server/db';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const itemId = parseInt(params.id);
  if (isNaN(itemId)) throw error(404, 'Item not found');

  const item = await db.item.findUnique({
    where: { id: itemId, deletedAt: null },
		include: {
			section: {
				include: { cabinet: true }
			},
			serials: {
				include: { images: { orderBy: { sortOrder: 'asc' } } },
				orderBy: { createdAt: 'asc' }
			}
		}
	});

	if (!item) throw error(404, 'Item not found');

	const displaySerial = item.serials.find(s => s.isDisplay) || item.serials[0];

	return {
		item: {
			...item,
			serialNumber: undefined,
			imageUrl: undefined,
			stock: undefined
		},
		serials: item.serials,
		displaySerial,
		totalStock: item.serials.filter((s: any) => s.status === 'AVAILABLE').length
	};
};