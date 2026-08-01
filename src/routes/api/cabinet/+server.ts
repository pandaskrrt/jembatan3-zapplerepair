import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';

export const POST: RequestHandler = async ({ request, locals }) => {
    const session = locals.session;
    if (!session) return json({ error: 'Unauthorized' }, { status: 401 });

    const { name, sectionName, sectionType } = await request.json();
    if (!name || !name.trim()) return json({ error: 'Nama cabinet wajib diisi' }, { status: 400 });

    const cabinet = await db.cabinet.create({
        data: { name: name.trim(), maxSlots: 100 }
    });

    let section = null;
    if (sectionName && sectionName.trim()) {
        section = await db.section.create({
            data: {
                name: sectionName.trim(),
                type: sectionType || 'Storage',
                cabinetId: cabinet.id
            }
        });
    }

    return json({ success: true, data: { cabinet, section } });
};
