import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';

export const POST: RequestHandler = async ({ params, locals, request }) => {
    const session = locals.session;
    const reportId = params.id;
    const { signature } = await request.json();

    if (!session) {
        return json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Cek apakah user adalah penanggung jawab yang ditunjuk
        const report = await db.report.findUnique({
            where: { id: reportId },
            select: { responsibleIds: true }
        });

        const responsibleIds = report?.responsibleIds as string[] || [];
        if (!responsibleIds.includes(session.id)) {
            return json({ success: false, message: 'Anda tidak ditunjuk sebagai penanggung jawab' }, { status: 403 });
        }

        // Simpan atau update signature
        const existingSignature = await db.signature.findUnique({
            where: {
                reportId_signerId: {
                    reportId: reportId,
                    signerId: session.id
                }
            }
        });

        if (existingSignature) {
            await db.signature.update({
                where: { id: existingSignature.id },
                data: {
                    signature: signature,
                    signedAt: new Date()
                }
            });
        } else {
            // Cari order terakhir
            const lastSignature = await db.signature.findFirst({
                where: { reportId: reportId },
                orderBy: { order: 'desc' }
            });
            
            await db.signature.create({
                data: {
                    reportId: reportId,
                    signerId: session.id,
                    signature: signature,
                    signedAt: new Date(),
                    order: (lastSignature?.order || 0) + 1
                }
            });
        }

        // Cek apakah semua penanggung jawab sudah menandatangani
        const allSignatures = await db.signature.findMany({
            where: { reportId: reportId }
        });

        if (allSignatures.length === responsibleIds.length) {
            await db.report.update({
                where: { id: reportId },
                data: { status: 'COMPLETED' }
            });
        } else if (report?.status === 'DRAFT') {
            await db.report.update({
                where: { id: reportId },
                data: { status: 'PENDING_SIGN' }
            });
        }

        return json({ success: true });
    } catch (error) {
        console.error('Error saving signature:', error);
        return json({ success: false, message: 'Gagal menyimpan tanda tangan' }, { status: 500 });
    }
};