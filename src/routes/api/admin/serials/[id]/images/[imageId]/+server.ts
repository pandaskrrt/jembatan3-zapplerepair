import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const session = locals.session;
	if (!session) return json({ error: 'Unauthorized' }, { status: 401 });

	const serialId = parseInt(params.id);
	const imageId = parseInt(params.imageId);
	if (isNaN(serialId) || isNaN(imageId)) return json({ error: 'Invalid ID' }, { status: 400 });

	const serial = await db.itemSerial.findUnique({
		where: { id: serialId },
		include: { images: true }
	});
	if (!serial) return json({ error: 'Serial not found' }, { status: 404 });

	const targetImage = serial.images.find(i => i.id === imageId);
	if (!targetImage) return json({ error: 'Image not found' }, { status: 404 });

	await db.$transaction([
		db.itemSerialImage.updateMany({
			where: { serialId },
			data: { isMain: false }
		}),
		db.itemSerialImage.update({
			where: { id: imageId },
			data: { isMain: true }
		})
	]);

	return json({ success: true, data: { serialId, mainImageId: imageId } });
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const session = locals.session;
	if (!session) return json({ error: 'Unauthorized' }, { status: 401 });

	const imageId = parseInt(params.imageId);
	if (isNaN(imageId)) return json({ error: 'Invalid image ID' }, { status: 400 });

	await db.itemSerialImage.delete({ where: { id: imageId } });
	return json({ success: true });
};