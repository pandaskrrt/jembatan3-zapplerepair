import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';

export const POST: RequestHandler = async ({ request, locals }) => {
    const session = locals.session;
    if (!session) return json({ error: 'Unauthorized' }, { status: 401 });

    const { cabinetId, name, type } = await request.json();
    if (!cabinetId || !name || !name.trim()) return json({ error: 'cabinetId dan nama section wajib' }, { status: 400 });

    const section = await db.section.create({
        data: {
            name: name.trim(),
            type: type || 'Storage',
            cabinetId
        }
    });

    return json({ success: true, data: section });
};
