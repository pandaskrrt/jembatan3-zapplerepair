import { db } from '$lib/server/db';
import { json } from '@sveltejs/kit';

export async function POST({ params, request, locals }) {
    try {
        const session = locals.session;
        if (!session) {
            return json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { signature, signatureType } = await request.json();
        const reportId = params.id;

        // Cari signature yang sesuai dengan user ini
        const signatureRecord = await db.reportSignature.findFirst({
            where: {
                reportId: reportId,
                signerId: session.id,
                isSigned: false
            }
        });

        if (!signatureRecord) {
            return json({ success: false, message: 'Tanda tangan tidak ditemukan atau sudah ditandatangani' }, { status: 404 });
        }

        // Update signature
        await db.reportSignature.update({
            where: { id: signatureRecord.id },
            data: {
                isSigned: true,
                signedAt: new Date(),
                signature: signature,
                signatureType: signatureType || 'canvas',
                ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip') || 'unknown',
                userAgent: request.headers.get('user-agent') || 'unknown'
            }
        });

        // Cek apakah semua signature sudah selesai
        const allSignatures = await db.reportSignature.findMany({
            where: { reportId: reportId }
        });

        const allSigned = allSignatures.every(s => s.isSigned);

        if (allSigned) {
            // Update status laporan menjadi COMPLETED
            await db.report.update({
                where: { id: reportId },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date()
                }
            });
        } else {
            // Update status menjadi PARTIALLY_SIGNED
            await db.report.update({
                where: { id: reportId },
                data: { status: 'PARTIALLY_SIGNED' }
            });
        }

        return json({ success: true, message: 'Tanda tangan berhasil disimpan' });

    } catch (error) {
        console.error('Sign error:', error);
        return json({ success: false, message: 'Terjadi kesalahan: ' + (error as Error).message }, { status: 500 });
    }
}