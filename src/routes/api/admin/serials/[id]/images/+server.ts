import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { writeImageFile } from '$lib/helper/write-file';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const session = locals.session;
	if (!session) return json({ error: 'Unauthorized' }, { status: 401 });

	const serialId = parseInt(params.id);
	if (isNaN(serialId)) return json({ error: 'Invalid serial ID' }, { status: 400 });

	const formData = await request.formData();
	const files = formData.getAll('images') as File[];

	if (!files.length) return json({ error: 'No images provided' }, { status: 400 });

	const serial = await db.itemSerial.findUnique({ where: { id: serialId }, include: { images: true } });
	if (!serial) return json({ error: 'Serial not found' }, { status: 404 });

	const existingMain = serial.images.find(i => i.isMain);
	const startSort = serial.images.length;

	const uploaded = [];
	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		const url = await writeImageFile(file);
		if (!url) continue;

		const image = await db.itemSerialImage.create({
			data: {
				url,
				isMain: !existingMain && i === 0,
				sortOrder: startSort + i,
				serialId
			}
		});
		uploaded.push(image);
	}

	return json({ data: uploaded }, { status: 201 });
};