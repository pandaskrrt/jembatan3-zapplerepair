import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';

// POST: Terima barang masuk dari cabang lain (Roxy)
export const POST: RequestHandler = async ({ request, locals }) => {
    try {
        const body = await request.json();
        const { items, referenceNo, source, customerName, senderName, senderSignature, pdfDocument } = body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return json({ success: false, error: 'items wajib diisi' }, { status: 400 });
        }

        const actorId = (locals.session as any)?.id?.toString() || 'system';

        const created: any[] = [];
        let skipped = 0;

        for (const item of items) {
            if (!item.name || !item.name.trim()) { skipped++; continue; }

            try {
                const incoming = await db.incomingItemCabang.create({
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
                        createdById: actorId,
                        senderName: senderName || null,
                        senderSignature: senderSignature || null,
                        pdfDocument: pdfDocument || null
                    }
                });

                created.push({
                    id: incoming.id,
                    name: incoming.name,
                    serialNumber: incoming.serialNumber,
                    quantity: incoming.quantity,
                    status: incoming.status
                });
            } catch (itemError: any) {
                console.error('Error creating incoming item:', itemError.message);
                skipped++;
            }
        }

        return json({
            success: true,
            message: `${created.length} barang masuk diterima (${skipped} di-skip)`,
            items: created
        });
    } catch (error: any) {
        console.error('Error in POST /api/incoming:', error);
        return json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
    }
};

// GET: List barang masuk (filter by status)
export const GET: RequestHandler = async ({ url, locals }) => {
    const session = locals.session;
    if (!session) return json({ error: 'Unauthorized' }, { status: 401 });

    const status = url.searchParams.get('status') || 'PENDING';
    const items = await db.incomingItemCabang.findMany({
        where: { status },
        orderBy: { createdAt: 'desc' }
    });

    return json({ success: true, data: items });
};
