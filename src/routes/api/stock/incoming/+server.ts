import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';

/**
 * POST /api/stock/incoming
 * 
 * Terima item dari service-form-jakut
 * 
 * Logic duplicate:
 * - Cek nama + serial number yang sama di section yang sama
 * - Jika sama → tambah stok
 * - Jika serial number beda → buat item baru terpisah
 * 
 * Body:
 * {
 *   items: [{ name, serialNumber, quantity, unitPrice, location, category, sectionId, note }],
 *   referenceNo: "SF-20260721-001",
 *   customerName: "John Doe"
 * }
 */
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

        // Cek duplicate: nama + serial number sama di section yang sama
        const whereClause: any = {
            name: cleanName,
            sectionId: sectionId,
            deletedAt: null
        };

        if (cleanSN) {
            whereClause.serialNumber = cleanSN;
        } else {
            // Jika SN kosong, cari yang SN-nya juga kosong
            whereClause.serialNumber = null;
        }

        const existingItem = await db.item.findFirst({
            where: whereClause,
            include: { price: true }
        });

        if (existingItem) {
            // Tambah stok pada item yang sudah ada
            const oldStock = existingItem.stock;
            const addQty = quantity || 1;
            const newStock = oldStock + addQty;

            await db.item.update({
                where: { id: existingItem.id },
                data: {
                    stock: newStock,
                    updatedAt: new Date()
                }
            });

            // Update price jika berubah
            if (unitPrice && unitPrice > 0 && existingItem.price?.amount !== unitPrice) {
                if (existingItem.price) {
                    await db.price.update({
                        where: { id: existingItem.price.id },
                        data: { amount: unitPrice }
                    });
                } else {
                    await db.price.create({
                        data: {
                            itemId: existingItem.id,
                            amount: unitPrice,
                            priceNote: `Dari ${referenceNo || 'service form'}`,
                            isActive: true
                        }
                    });
                }
            }

            await db.itemHistory.create({
                data: {
                    itemId: existingItem.id,
                    action: 'STOCK_UPDATED',
                    oldStock,
                    newStock,
                    triggeredBy: 'SYSTEM',
                    note: note || `Stok tambahan dari ${customerName || 'customer'} - ${referenceNo || ''}`
                }
            });

            createdItems.push({
                id: existingItem.id,
                name: cleanName,
                serialNumber: cleanSN,
                isNew: false,
                stockAdded: addQty
            });
        } else {
            // Buat item baru
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
                    itemId: newItem.id,
                    action: 'CREATED',
                    newStock: quantity || 1,
                    triggeredBy: 'SYSTEM',
                    note: note || `Beli dari customer ${customerName || ''} - ${referenceNo || ''}`
                }
            });

            await db.cabinetLog.create({
                data: {
                    action: 'ITEM_ADDED',
                    performedById: 'SYSTEM',
                    cabinetId: section.cabinetId,
                    cabinetName: (await db.cabinet.findUnique({ where: { id: section.cabinetId } }))?.name || '',
                    sectionId: section.id,
                    sectionName: section.name,
                    itemId: newItem.id,
                    itemName: cleanName,
                    note: `Barang dari customer ${customerName || ''} - ${referenceNo || ''}`
                }
            });

            createdItems.push({
                id: newItem.id,
                name: cleanName,
                serialNumber: cleanSN,
                isNew: true,
                stockAdded: quantity || 1
            });
        }
    }

    return json({
        success: true,
        message: `${createdItems.length} item diproses`,
        items: createdItems
    });
};
