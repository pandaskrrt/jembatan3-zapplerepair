import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';

export const POST: RequestHandler = async ({ request }) => {
    const body = await request.json();
    const { items, referenceNo, customerName } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
        return json({ error: 'items array is required' }, { status: 400 });
    }

    const createdItems: Array<{ id: number; name: string; serialNumber: string; isNew: boolean; stockAdded: number }> = [];

    for (const item of items) {
        const { name, serialNumber, quantity, unitPrice, sectionId, note } = item;
        if (!name || !sectionId) continue;

        const section = await db.section.findUnique({ where: { id: sectionId } });
        if (!section) continue;

        const cleanName = name.trim();
        const cleanSN = (serialNumber || '').trim();

        const whereClause: any = { name: cleanName, sectionId: sectionId, deletedAt: null };
        if (cleanSN) whereClause.serialNumber = cleanSN; else whereClause.serialNumber = null;

        const existingItem = await db.item.findFirst({ where: whereClause, include: { price: true } });

        if (existingItem) {
            const oldStock = existingItem.stock;
            const addQty = quantity || 1;
            const newStock = oldStock + addQty;

            await db.item.update({
                where: { id: existingItem.id },
                data: { stock: newStock, updatedAt: new Date() }
            });

            if (unitPrice && unitPrice > 0 && existingItem.price?.amount !== unitPrice) {
                if (existingItem.price) {
                    await db.price.update({ where: { id: existingItem.price.id }, data: { amount: unitPrice } });
                } else {
                    await db.price.create({ data: { itemId: existingItem.id, amount: unitPrice, priceNote: `Dari ${referenceNo || 'service form'}`, isActive: true } });
                }
            }

            await db.itemHistory.create({
                data: {
                    action: 'STOCK_UPDATED',
                    oldStock,
                    newStock,
                    note: note || `Stok tambahan dari ${customerName || 'customer'} - ${referenceNo || ''}`,
                    item: { connect: { id: existingItem.id } }
                }
            });

            createdItems.push({ id: existingItem.id, name: cleanName, serialNumber: cleanSN, isNew: false, stockAdded: addQty });
        } else {
            const newItem = await db.item.create({
                data: {
                    name: cleanName,
                    serialNumber: cleanSN || null,
                    stock: quantity || 1,
                    location: 'Service Purchase',
                    category: 'Customer Purchase',
                    subCategory: 'Sparepart',
                    sectionId,
                    price: unitPrice && unitPrice > 0 ? {
                        create: {
                            amount: unitPrice,
                            priceNote: `Dari ${referenceNo || 'service form'}`,
                            isActive: true
                        }
                    } : undefined
                }
            });

            await db.itemHistory.create({
                data: {
                    action: 'CREATED',
                    newStock: quantity || 1,
                    note: note || `Beli dari customer ${customerName || ''} - ${referenceNo || ''}`,
                    item: { connect: { id: newItem.id } }
                }
            });

            await db.cabinetLog.create({
                data: {
                    action: 'ITEM_ADDED',
                    performedById: 'system-user-id',
                    cabinetId: section.cabinetId,
                    cabinetName: (await db.cabinet.findUnique({ where: { id: section.cabinetId } }))?.name || '',
                    sectionId: section.id,
                    sectionName: section.name,
                    itemId: newItem.id,
                    itemName: cleanName,
                    note: `Barang dari customer ${customerName || ''} - ${referenceNo || ''}`
                }
            });

            createdItems.push({ id: newItem.id, name: cleanName, serialNumber: cleanSN, isNew: true, stockAdded: quantity || 1 });
        }
    }

    return json({ success: true, message: `${createdItems.length} item diproses`, items: createdItems });
};
