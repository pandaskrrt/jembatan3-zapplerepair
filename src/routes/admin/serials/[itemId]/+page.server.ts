import { db } from '$lib/server/db';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
  const session = locals.session;
  if (!session) throw error(401, 'Unauthorized');

  const itemId = parseInt(params.itemId);
  if (isNaN(itemId)) throw error(400, 'Invalid item ID');

  const item = await db.item.findUnique({
    where: { id: itemId },
    include: {
      serials: {
        include: { images: { orderBy: { sortOrder: 'asc' } } },
        orderBy: { createdAt: 'asc' }
      },
      section: { include: { cabinet: true } },
      price: true
    }
  });

  if (!item) throw error(404, 'Item not found');

  return {
    item: {
      ...item,
    },
    userRole: (session as any).role
  };
};