import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';

export const POST: RequestHandler = async ({ locals, request }) => {
    const session = locals.session;
    const { reportId, signature } = await request.json();

    if (!session) {
        return json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    if (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN') {
        return json({ success: false, message: 'Access denied' }, { status: 403 });
    }

    try {
        const report = await db.report.findUnique({
            where: { id: reportId }
        });

        if (!report) {
            return json({ success: false, message: 'Report not found' }, { status: 404 });
        }

        // Parse responsibleIds
        let responsibleIds: string[] = [];
        if (report.responsibleIds) {
            if (typeof report.responsibleIds === 'string') {
                try {
                    responsibleIds = JSON.parse(report.responsibleIds);
                } catch {
                    responsibleIds = [];
                }
            } else if (Array.isArray(report.responsibleIds)) {
                responsibleIds = report.responsibleIds;
            }
        }

        if (!responsibleIds.includes(session.id)) {
            return json({ success: false, message: 'You are not assigned as responsible person' }, { status: 403 });
        }

        // Hitung order berdasarkan index di responsibleIds
        const order = responsibleIds.indexOf(session.id) + 1;

        // Cek signature yang sudah ada di model ReportSignature
        const existingSignature = await db.reportSignature.findFirst({
            where: {
                reportId: reportId,
                signerId: session.id
            }
        });

        if (existingSignature) {
            await db.reportSignature.update({
                where: { id: existingSignature.id },
                data: {
                    signature: signature,
                    signedAt: new Date()
                }
            });
        } else {
            await db.reportSignature.create({
                data: {
                    reportId: reportId,
                    signerId: session.id,
                    signature: signature,
                    signedAt: new Date(),
                    order: order
                }
            });
        }

        // Update timestamp di report berdasarkan order
        if (order === 1) {
            await db.report.update({
                where: { id: reportId },
                data: { responsibleSignedAt1: new Date() }
            });
        } else if (order === 2) {
            await db.report.update({
                where: { id: reportId },
                data: { responsibleSignedAt2: new Date() }
            });
        }

        // Cek apakah semua sudah tanda tangan
        const allSignatures = await db.reportSignature.findMany({
            where: { reportId: reportId }
        });

        let newStatus = report.status;

        if (allSignatures.length === responsibleIds.length) {
            newStatus = 'COMPLETED';
            await db.report.update({
                where: { id: reportId },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date()
                }
            });
        } else if (report.status === 'PENDING_SIGN') {
            newStatus = 'PARTIALLY_SIGNED';
            await db.report.update({
                where: { id: reportId },
                data: { status: 'PARTIALLY_SIGNED' }
            });
        }

        const remaining = responsibleIds.length - allSignatures.length;
        const message = allSignatures.length === responsibleIds.length
            ? 'Tanda tangan berhasil! Laporan telah selesai.'
            : `Tanda tangan berhasil! Menunggu ${remaining} penanggung jawab lainnya.`;

        return json({
            success: true,
            message,
            allSigned: allSignatures.length === responsibleIds.length,
            remaining,
            status: newStatus
        });
    } catch (error) {
        console.error('Error saving signature:', error);
        return json({
            success: false,
            message: 'Terjadi kesalahan saat menyimpan tanda tangan: ' + (error as Error).message
        }, { status: 500 });
    }
};