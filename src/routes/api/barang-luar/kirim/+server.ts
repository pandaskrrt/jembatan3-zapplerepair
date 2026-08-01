import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request, locals }) => {
    const session = locals.session;
    if (!session) return json({ error: 'Unauthorized' }, { status: 401 });

    const { serialId, tujuan, modal, jual, externalUrl, senderName, senderSignature, pdfDocument } = await request.json();
    if (!serialId || !tujuan) return json({ error: 'serialId & tujuan required' }, { status: 400 });
    if (!senderName || !senderSignature) return json({ error: 'Nama pengirim dan tanda tangan wajib diisi' }, { status: 400 });

    const serial = await db.itemSerial.findUnique({
        where: { id: serialId },
        include: { item: { include: { section: { include: { cabinet: true } } } } }
    });
    if (!serial) return json({ error: 'Serial not found' }, { status: 404 });

    const isBarangLuar = serial.item.section?.cabinet?.isProtected;
    if (!isBarangLuar) return json({ error: 'Hanya item di Barang Luar yang bisa dikirim' }, { status: 400 });

    try {
        // 1. Kirim ke jembatan3 (cabang penerima) via API
        const j3Url = env.JEMBATAN3_API_URL || 'http://localhost:3000';
        let kirimResult: any = null;
        try {
            const res = await fetch(`${j3Url}/api/incoming`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    referenceNo: `ROXY-${Date.now()}`,
                    source: 'Roxy',
                    senderName,
                    senderSignature,
                    pdfDocument,
                    items: [{
                        name: serial.item.name,
                        serialNumber: serial.serialNumber,
                        quantity: 1,
                        costPrice: (modal && modal > 0) ? modal : (serial.costPrice || 0),
                        sellPrice: (jual && jual > 0) ? jual : (serial.price || 0),
                        category: serial.category || serial.item.category,
                        note: tujuan
                    }]
                })
            });
            kirimResult = await res.json();
            if (!res.ok) throw new Error(kirimResult.error || 'Gagal kirim ke jembatan3');
        } catch (fetchErr: any) {
            return json({ error: 'Gagal terhubung ke jembatan3: ' + fetchErr.message }, { status: 502 });
        }

        // 2. Update lokal: serial jadi SOLD
        await db.$transaction(async (tx) => {
            await tx.itemSerial.update({
                where: { id: serialId },
                data: { status: 'SOLD', costPrice: (modal && modal > 0) ? modal : (serial.costPrice || 0), price: (jual && jual > 0) ? jual : (serial.price || 0) }
            });
            await tx.itemHistory.create({
                data: {
                    itemId: serial.item.id,
                    action: 'TRANSFERRED',
                    triggeredBy: session.id?.toString() ?? '',
                    note: `Serial ${serial.serialNumber} dikirim ke ${tujuan} (${kirimResult.message || 'ok'})`
                }
            });
        });

        return json({ success: true, message: `Berhasil dikirim ke ${tujuan}`, remote: kirimResult });
    } catch (err: any) {
        return json({ error: err.message }, { status: 500 });
    }
};
