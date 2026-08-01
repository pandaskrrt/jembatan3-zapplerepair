import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';

async function getActorId(session: { id: number; username?: string }) {
    const user = await db.user.findFirst({
        where: { username: session.username },
        select: { id: true }
    });

    if (!user) {
        throw new Error('User tidak ditemukan');
    }

    return user.id;
}

export const POST: RequestHandler = async ({ params, locals }) => {
    const session = locals.session;
    if (!session) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const itemId = parseInt(params.id || '');
    if (isNaN(itemId)) {
        return json({ error: 'Invalid item ID' }, { status: 400 });
    }

    const item = await db.item.findUnique({
        where: { id: itemId },
        include: {
            section: {
                include: { cabinet: true }
            }
        }
    });

    if (!item || item.deletedAt) {
        return json({ error: 'Item not found' }, { status: 404 });
    }

    if (!item.isCustomer) {
        return json({ error: 'Hanya barang customer yang bisa dikembalikan ke lokasi asal' }, { status: 403 });
    }

    const isCurrentlyPermanent = item.section?.isProtected || item.section?.cabinet?.isProtected;
    if (!isCurrentlyPermanent) {
        return json({ error: 'Item tidak berada di permanent location' }, { status: 400 });
    }

    if (!item.originSectionId) {
        return json({ error: 'Lokasi asal tidak diketahui' }, { status: 400 });
    }

    // Cek apakah section asal masih ada dan tidak dihapus
    const originSection = await db.section.findUnique({
        where: { id: item.originSectionId }
    });

    if (!originSection || originSection.deletedAt) {
        return json({ error: 'Lokasi asal (section) sudah tidak tersedia' }, { status: 400 });
    }

    try {
        const actorId = await getActorId(session);

        await db.$transaction(async (tx) => {
            await tx.item.update({
                where: { id: itemId },
                data: {
                    sectionId: item.originSectionId,
                    location: originSection.name // Kembalikan string lokasi ke section name
                }
            });

            await tx.itemHistory.create({
                data: {
                    itemId,
                    action: 'RETURNED_TO_ORIGIN',
                    oldStock: item.stock,
                    newStock: item.stock,
                    triggeredBy: actorId,
                    oldValue: {
                        fromPermanentLocation: item.section?.cabinet?.name ?? item.section?.name ?? 'Lokasi Paten',
                        toSection: originSection.name
                    },
                    note: `Barang customer dikembalikan ke "${originSection.name}" oleh ${session.username}`
                }
            });
        });

        return json({ success: true });
    } catch (error) {
        console.error('Error returning item:', error);
        return json({ error: 'Gagal mengembalikan item' }, { status: 500 });
    }
};
