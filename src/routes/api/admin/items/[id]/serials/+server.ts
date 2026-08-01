import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';

export const GET: RequestHandler = async ({ params, locals }) => {
	const session = locals.session;
	if (!session) return json({ error: 'Unauthorized' }, { status: 401 });

	const itemId = parseInt(params.id);
	if (isNaN(itemId)) return json({ error: 'Invalid item ID' }, { status: 400 });

	const item = await db.item.findUnique({
		where: { id: itemId },
		include: {
			serials: {
				include: { images: { orderBy: { sortOrder: 'asc' } } },
				orderBy: { createdAt: 'desc' }
			}
		}
	});

	if (!item) return json({ error: 'Item not found' }, { status: 404 });

	return json({ data: item.serials });
};

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const session = locals.session;
	if (!session) return json({ error: 'Unauthorized' }, { status: 401 });

	const itemId = parseInt(params.id);
	if (isNaN(itemId)) return json({ error: 'Invalid item ID' }, { status: 400 });

	const body = await request.json();
	const { serialNumber, grade, spec, status = 'AVAILABLE', price = 0, costPrice = 0, videoUrl, qrCustomUrl } = body;

	const item = await db.item.findUnique({ where: { id: itemId } });
	if (!item) return json({ error: 'Item not found' }, { status: 404 });

	let serial;
	try {
		serial = await db.itemSerial.create({
			data: {
				serialNumber: serialNumber || null,
				grade: grade || null,
				spec: spec || null,
				status,
				price,
				costPrice,
				videoUrl: videoUrl || null,
				qrCustomUrl: qrCustomUrl || null,
				itemId
			},
			include: { images: true }
		});
	} catch (err: any) {
		if (err.code === 'P2002') return json({ error: 'Serial number sudah ada, gunakan yang lain' }, { status: 409 });
		throw err;
	}

	// Sync stock
	const total = await db.itemSerial.count({ where: { itemId, status: 'AVAILABLE' } });
	await db.item.update({ where: { id: itemId }, data: { stock: total } });

	return json({ data: serial }, { status: 201 });
};