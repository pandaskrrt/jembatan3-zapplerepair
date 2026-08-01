import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';

// POST: Tanda tangan penerima saja — status berubah PENDING → EKSEKUSI (belum pindah stock)
export const POST: RequestHandler = async ({ request, locals }) => {
    const session = locals.session;
    if (!session) return json({ error: 'Unauthorized' }, { status: 401 });

    const { incomingId, receiverName, receiverSignature, pdfDocumentFinal } = await request.json();

    if (!incomingId) return json({ error: 'incomingId wajib' }, { status: 400 });
    if (!receiverName || !receiverSignature) return json({ error: 'Nama penerima dan tanda tangan wajib diisi' }, { status: 400 });

    const incoming = await db.incomingItemCabang.findUnique({ where: { id: incomingId } });
    if (!incoming) return json({ error: 'Barang masuk tidak ditemukan' }, { status: 404 });
    if (incoming.status === 'CONFIRMED') return json({ error: 'Barang sudah dikonfirmasi' }, { status: 400 });

    try {
        const updated = await db.incomingItemCabang.update({
            where: { id: incomingId },
            data: {
                status: 'EKSEKUSI',
                signedAt: new Date(),
                receiverName,
                receiverSignature,
                pdfDocumentFinal: pdfDocumentFinal || null
            }
        });

        return json({
            success: true,
            message: 'Tanda tangan penerima disimpan, status menjadi Eksekusi',
            data: {
                id: updated.id,
                status: updated.status,
                receiverName: updated.receiverName,
                hasReceiverSignature: !!updated.receiverSignature
            }
        });
    } catch (err: any) {
        return json({ error: err.message }, { status: 500 });
    }
};
