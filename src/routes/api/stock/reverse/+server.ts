import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';

/**
 * POST /api/stock/reverse
 * 
 * Mengurangi atau menghapus item yang sebelumnya ditambahkan via stok customer.
 * 
 * Body:
 * {
 *   items: [{ name, serialNumber, quantity }]
 * }
 */
export const POST: RequestHandler = async ({ request }) => {
    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
        return json({ error: 'items array is required' }, { status: 400 });
    }

    const results: Array<{ name: string; success: boolean; message: string }> = [];

    for (const item of items) {
        const { name, serialNumber, quantity } = item;
        if (!name) continue;

        const cleanName = name.trim();
        const cleanSN = (serialNumber || '').trim();

        // Cari item dengan nama + serial number yang sama
        const whereClause: any = { name: cleanName, deletedAt: null };
        if (cleanSN) whereClause.serialNumber = cleanSN;

        const existingItem = await db.item.findFirst({
            where: whereClause,
            include: { price: true }
        });

        if (!existingItem) {
            results.push({ name: cleanName, success: false, message: 'Item tidak ditemukan' });
            continue;
        }

        const oldStock = existingItem.stock;
        const reduceQty = quantity || 1;
        const newStock = Math.max(0, oldStock - reduceQty);

        await db.item.update({
            where: { id: existingItem.id },
            data: { stock: newStock, updatedAt: new Date() }
        });

        // Jika stock 0, soft delete item
        if (newStock === 0) {
            await db.item.update({
                where: { id: existingItem.id },
                data: {
                    deletedAt: new Date(),
                    deletedBy: 'SYSTEM',
                    deleteReason: 'Dikembalikan dari invoice - stok customer'
                }
            });
        }

        await db.itemHistory.create({
            data: {
                itemId: existingItem.id,
                item: { connect: { id: existingItem.id } },
                action: 'STOCK_UPDATED',
                oldStock,
                newStock,
                note: `Stok dikembalikan: ${reduceQty} unit (reverse dari invoice)`
            }
        });

        results.push({ name: cleanName, success: true, message: `Stok dikurangi dari ${oldStock} ke ${newStock}` });
    }

    return json({ success: true, message: `${results.length} item diproses`, items: results });
};
