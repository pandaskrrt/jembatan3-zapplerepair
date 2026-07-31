import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';

// POST: Konfirmasi barang masuk → masuk ke cabinet/section/item
export const POST: RequestHandler = async ({ request, locals }) => {
    const session = locals.session;
    if (!session) return json({ error: 'Unauthorized' }, { status: 401 });
    const actorId = session.id?.toString() || '';

    const { incomingId, sectionId, existingItemId, newItemName, newItemCategory, newItemSubCategory } = await request.json();

    const incoming = await db.incomingItem.findUnique({ where: { id: incomingId } });
    if (!incoming) return json({ error: 'Barang masuk tidak ditemukan' }, { status: 404 });
    if (incoming.status === 'CONFIRMED') return json({ error: 'Barang sudah dikonfirmasi' }, { status: 400 });

    if (!sectionId) return json({ error: 'sectionId wajib' }, { status: 400 });

    const section = await db.section.findUnique({
        where: { id: sectionId },
        include: { cabinet: true }
    });
    if (!section || section.deletedAt) return json({ error: 'Section tidak ditemukan' }, { status: 404 });

    try {
        await db.$transaction(async (tx) => {
            let itemId: number;

            if (existingItemId) {
                // Masuk ke item existing
                const existing = await tx.item.findFirst({
                    where: { id: existingItemId, sectionId, deletedAt: null }
                });
                if (!existing) throw new Error('Item existing tidak ditemukan di section ini');
                itemId = existing.id;
                await tx.item.update({
                    where: { id: existing.id },
                    data: { stock: { increment: incoming.quantity } }
                });
                await tx.itemHistory.create({
                    data: {
                        itemId,
                        action: 'STOCK_UPDATED',
                        oldStock: existing.stock,
                        newStock: existing.stock + incoming.quantity,
                        triggeredBy: actorId,
                        note: `Barang masuk dari ${incoming.source} (${incoming.serialNumber || 'no-sn'})`
                    }
                });
            } else {
                // Buat item baru
                const name = newItemName || incoming.name;
                const cat = newItemCategory || incoming.category || 'Sparepart';
                const sub = newItemSubCategory || '';
                const newItem = await tx.item.create({
                    data: {
                        name,
                        stock: incoming.quantity,
                        location: section.name,
                        category: cat,
                        subCategory: sub,
                        serialNumber: incoming.serialNumber || null,
                        sectionId,
                        price: incoming.sellPrice > 0 ? {
                            create: { amount: incoming.sellPrice, priceNote: 'Barang masuk', isActive: true }
                        } : undefined,
                        costPrice: incoming.costPrice > 0 ? {
                            create: { amount: incoming.costPrice, note: 'Barang masuk' }
                        } : undefined
                    }
                });
                itemId = newItem.id;
                await tx.itemHistory.create({
                    data: {
                        itemId,
                        action: 'CREATED',
                        newStock: incoming.quantity,
                        triggeredBy: actorId,
                        note: `Barang masuk dari ${incoming.source} (${incoming.serialNumber || 'no-sn'})`
                    }
                });
                await tx.cabinetLog.create({
                    data: {
                        cabinetId: section.cabinetId,
                        cabinetName: section.cabinet?.name || null,
                        sectionId,
                        sectionName: section.name,
                        itemId,
                        itemName: name,
                        action: 'ITEM_ADDED',
                        performedById: actorId,
                        note: `Barang masuk dari ${incoming.source}`
                    }
                });
            }

            // Update status incoming
            await tx.incomingItem.update({
                where: { id: incomingId },
                data: {
                    status: 'CONFIRMED',
                    confirmedAt: new Date(),
                    confirmedBy: actorId,
                    targetSectionId: sectionId,
                    targetItemId: itemId
                }
            });
        });

        return json({ success: true, message: 'Barang masuk dikonfirmasi' });
    } catch (err: any) {
        return json({ error: err.message }, { status: 500 });
    }
};
