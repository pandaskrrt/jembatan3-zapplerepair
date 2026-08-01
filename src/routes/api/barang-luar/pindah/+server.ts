import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';

export const POST: RequestHandler = async ({ request, locals }) => {
    const session = locals.session;
    if (!session) return json({ error: 'Unauthorized' }, { status: 401 });

    const { serialId, targetSectionId, modal, jual } = await request.json();

    const serial = await db.itemSerial.findUnique({
        where: { id: serialId },
        include: { item: { include: { section: { include: { cabinet: true } } } } }
    });
    if (!serial) return json({ error: 'Serial not found' }, { status: 404 });

    const targetSection = await db.section.findUnique({ where: { id: targetSectionId } });
    if (!targetSection || targetSection.deletedAt) return json({ error: 'Target section tidak ditemukan' }, { status: 404 });

    try {
        await db.$transaction(async (tx) => {
            await tx.itemSerial.update({
                where: { id: serialId },
                data: { costPrice: modal || 0, price: jual || 0 }
            });
            await tx.item.update({
                where: { id: serial.itemId },
                data: { sectionId: targetSectionId, location: targetSection.name }
            });
            await tx.itemHistory.create({
                data: {
                    itemId: serial.item.id,
                    action: 'MOVED_IN',
                    triggeredBy: session.id?.toString() ?? '',
                    note: `Serial ${serial.serialNumber} dipindah dari Barang Luar ke ${targetSection.name}`
                }
            });
        });
        return json({ success: true, message: `Berhasil dipindah ke ${targetSection.name}` });
    } catch (err: any) {
        return json({ error: err.message }, { status: 500 });
    }
};
