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

        const responsibleIds = report.responsibleIds as string[] || [];
        
        if (!responsibleIds.includes(session.id)) {
            return json({ success: false, message: 'You are not assigned as responsible person' }, { status: 403 });
        }

        // Cek signature yang sudah ada
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

        // Cek apakah semua sudah tanda tangan
        const allSignatures = await db.signature.findMany({
            where: { reportId: reportId }
        });

        if (allSignatures.length === responsibleIds.length) {
            await db.report.update({
                where: { id: reportId },
                data: { status: 'COMPLETED' }
            });
        }

        return json({ success: true, message: 'Signature saved successfully' });
    } catch (error) {
        console.error('Error saving signature:', error);
        return json({ success: false, message: 'Failed to save signature' }, { status: 500 });
    }
};