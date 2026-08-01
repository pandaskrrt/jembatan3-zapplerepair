import { db } from '$lib/server/db';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url, locals }) => {
  const session = locals.session;
  if (!session) throw error(401, 'Unauthorized');

  const itemId = parseInt(params.itemId);
  if (isNaN(itemId)) throw error(400, 'Invalid item ID');

  const item = await db.item.findUnique({
    where: { id: itemId },
    include: { section: { include: { cabinet: true } } }
  });
  if (!item) throw error(404, 'Item not found');

  const serialId = parseInt(url.searchParams.get('serialId') || '');
  let serial = null;
  if (serialId) {
    serial = await db.itemSerial.findUnique({
      where: { id: serialId },
      include: { images: { orderBy: { sortOrder: 'asc' } } }
    });
    if (!serial || serial.itemId !== itemId) throw error(404, 'Serial not found');
  }

  return { item, serial, isEdit: !!serial, userRole: (session as any).role };
};