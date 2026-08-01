import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const session = locals.session;
	if (!session) return json({ error: 'Unauthorized' }, { status: 401 });

	const itemId = parseInt(params.id);
	if (isNaN(itemId)) return json({ error: 'Invalid item ID' }, { status: 400 });

	const body = await request.json();
	const stock = body.stock ?? 0;

	await db.item.update({
		where: { id: itemId },
		data: { stock }
	});

	return json({ success: true, stock });
};