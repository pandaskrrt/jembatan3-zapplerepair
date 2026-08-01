import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const session = locals.session;
	if (!session) return json({ error: 'Unauthorized' }, { status: 401 });

	const serialId = parseInt(params.id);
	if (isNaN(serialId)) return json({ error: 'Invalid serial ID' }, { status: 400 });

	const body = await request.json();
	const { isDisplay } = body;

	const serial = await db.itemSerial.findUnique({
		where: { id: serialId },
		include: { item: { include: { serials: { where: { isDisplay: true } } } } }
	});
	if (!serial) return json({ error: 'Serial not found' }, { status: 404 });

	if (isDisplay) {
		if (serial.item.serials[0]?.id !== serialId) {
			await db.itemSerial.updateMany({
				where: { itemId: serial.itemId, isDisplay: true },
				data: { isDisplay: false }
			});
		}
	}

	const updated = await db.itemSerial.update({
		where: { id: serialId },
		data: { isDisplay },
		include: { images: { orderBy: { sortOrder: 'asc' } } }
	});

	return json({ data: updated });
};