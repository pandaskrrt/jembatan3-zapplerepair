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

export const POST: RequestHandler = async ({ params, request, locals }) => {
    const session = locals.session;
    if (!session) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const itemId = parseInt(params.id || '');
    if (isNaN(itemId)) {
        return json({ error: 'Invalid item ID' }, { status: 400 });
    }

    const body = await request.json();
    const targetSectionId = Number(body?.targetSectionId);
    if (!targetSectionId || Number.isNaN(targetSectionId)) {
        return json({ error: 'targetSectionId required' }, { status: 400 });
    }

    const targetSection = await db.section.findUnique({
        where: { id: targetSectionId },
        include: { cabinet: true }
    });

    if (!targetSection || targetSection.deletedAt) {
        return json({ error: 'Target section not found' }, { status: 404 });
    }

    if (!targetSection.isProtected && !targetSection.cabinet?.isProtected) {
        return json({ error: 'Target section is not a permanent location' }, { status: 400 });
    }

    const item = await db.item.findUnique({
        where: { id: itemId },
        include: { section: { include: { cabinet: true } } }
    });

    if (!item || item.deletedAt) {
        return json({ error: 'Item not found' }, { status: 404 });
    }

    // Catat section asal jika barang customer dan origin belum diset
    let originUpdate: any = {};
    if (item.isCustomer && !item.originSectionId) {
        originUpdate = {
            originSectionId: item.sectionId,
            originSectionName: item.section?.name ?? null
        };
    }

    try {
        const actorId = await getActorId(session);

        await db.$transaction(async (tx) => {
            // Update item: pindahkan ke target section paten
            await tx.item.update({
                where: { id: itemId },
                data: {
                    sectionId: targetSectionId,
                    location: targetSection.cabinet?.name ?? targetSection.name,
                    ...originUpdate
                }
			});

            // Catat history
            await tx.itemHistory.create({
                data: {
                    itemId,
                    action: 'MOVED_TO_PERMANENT',
                    oldStock: item.stock,
                    newStock: item.stock,
                    triggeredBy: actorId,
                    oldValue: {
                        fromSection: item.section?.name ?? null,
                        toPermanentLocation: targetSection.cabinet?.name ?? targetSection.name
                    },
                    note: `Item dipindahkan ke "${targetSection.cabinet?.name ?? targetSection.name}" oleh ${session.username}`
                }
            });
        });

        return json({ success: true });
    } catch (error) {
        console.error('Error moving item:', error);
        return json({
            error: 'Gagal memindahkan item',
            detail: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
};
