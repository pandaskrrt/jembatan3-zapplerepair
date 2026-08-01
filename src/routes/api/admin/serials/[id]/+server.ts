import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';

export const GET: RequestHandler = async ({ params, locals }) => {
	const session = locals.session;
	if (!session) return json({ error: 'Unauthorized' }, { status: 401 });

	const serialId = parseInt(params.id ?? '');
	if (isNaN(serialId)) return json({ error: 'Invalid serial ID' }, { status: 400 });

	const serial = await db.itemSerial.findUnique({
		where: { id: serialId },
		include: { images: { orderBy: { sortOrder: 'asc' } }, item: true }
	});

	if (!serial) return json({ error: 'Serial not found' }, { status: 404 });

	return json({ data: serial });
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const session = locals.session;
	if (!session) return json({ error: 'Unauthorized' }, { status: 401 });

	const serialId = parseInt(params.id ?? '');
	if (isNaN(serialId)) return json({ error: 'Invalid serial ID' }, { status: 400 });

	const body = await request.json();
	const { serialNumber, grade, spec, status, price, costPrice, videoUrl, qrCustomUrl } = body;

	const serial = await db.itemSerial.update({
		where: { id: serialId },
		data: {
			serialNumber: serialNumber !== undefined ? serialNumber : undefined,
			grade: grade !== undefined ? grade : undefined,
			spec: spec !== undefined ? spec : undefined,
			status: status !== undefined ? status : undefined,
			price: price !== undefined ? price : undefined,
			costPrice: costPrice !== undefined ? costPrice : undefined,
			videoUrl: videoUrl !== undefined ? videoUrl : undefined,
			qrCustomUrl: qrCustomUrl !== undefined ? qrCustomUrl : undefined,
		},
		include: { images: { orderBy: { sortOrder: 'asc' } } }
	});

	// Sync item stock when status changes (mirror the POST create handler)
	if (status !== undefined) {
		const total = await db.itemSerial.count({ where: { itemId: serial.itemId, status: 'AVAILABLE' } });
		await db.item.update({ where: { id: serial.itemId }, data: { stock: total } });
	}

	return json({ data: serial });
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const session = locals.session;
	if (!session) return json({ error: 'Unauthorized' }, { status: 401 });

	const serialId = parseInt(params.id ?? '');
	if (isNaN(serialId)) return json({ error: 'Invalid serial ID' }, { status: 400 });

	const serial = await db.itemSerial.findUnique({ where: { id: serialId } });
	if (!serial) return json({ error: 'Serial not found' }, { status: 404 });

	await db.itemSerial.delete({ where: { id: serialId } });

	// Sync item stock after deletion (mirror the PATCH/POST handlers)
	const total = await db.itemSerial.count({ where: { itemId: serial.itemId, status: 'AVAILABLE' } });
	await db.item.update({ where: { id: serial.itemId }, data: { stock: total } });

	return json({ success: true });
};