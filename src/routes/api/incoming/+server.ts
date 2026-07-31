import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';

// POST: Terima barang masuk dari cabang lain (Roxy)
export const POST: RequestHandler = async ({ request, locals }) => {
    const body = await request.json();
    const { items, referenceNo, source, customerName } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
        return json({ success: false, error: 'items wajib diisi' }, { status: 400 });
    }

    const actorId = (locals.session as any)?.id?.toString() || 'system';

    const created: any[] = [];
    let skipped = 0;

    for (const item of items) {
        if (!item.name || !item.name.trim()) { skipped++; continue; }

        const incoming = await db.incomingItem.create({
            data: {
                name: item.name.trim(),
                serialNumber: item.serialNumber || null,
                quantity: item.quantity || 1,
                costPrice: item.costPrice || item.costPriceSgd || 0,
                sellPrice: item.sellPrice || item.sellPriceSgd || item.price || 0,
                category: item.category || 'Sparepart',
                source: source || 'Roxy',
                referenceNo: referenceNo || null,
                note: item.note || customerName || null,
                status: 'PENDING',
                createdById: actorId
            }
        });

        created.push({
            id: incoming.id,
            name: incoming.name,
            serialNumber: incoming.serialNumber,
            quantity: incoming.quantity,
            status: incoming.status
        });
    }

    return json({
        success: true,
        message: `${created.length} barang masuk diterima (${skipped} di-skip)`,
        items: created
    });
};

// GET: List barang masuk (filter by status)
export const GET: RequestHandler = async ({ url, locals }) => {
    const session = locals.session;
    if (!session) return json({ error: 'Unauthorized' }, { status: 401 });

    const status = url.searchParams.get('status') || 'PENDING';
    const items = await db.incomingItem.findMany({
        where: { status },
        orderBy: { createdAt: 'desc' }
    });

    return json({ success: true, data: items });
};
