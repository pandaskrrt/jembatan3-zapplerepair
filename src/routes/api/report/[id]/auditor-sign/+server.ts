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
        const report = await db.report.findUnique({
            where: { id: reportId },
            include: {
                audit: {
                    select: { auditorId: true }
                }
            }
        });

        if (!report) {
            return json({ success: false, message: 'Report tidak ditemukan' }, { status: 404 });
        }

        // Cek apakah user adalah auditor yang ditugaskan
        const isAuditor = report.audit?.auditorId === session.id;
        const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN';

        if (!isAuditor && !isAdmin) {
            return json({ 
                success: false, 
                message: 'Hanya auditor yang ditugaskan yang dapat menandatangani' 
            }, { status: 403 });
        }

        // Simpan tanda tangan
        await db.report.update({
            where: { id: reportId },
            data: {
                auditorSignature: signature,
                auditorSignedAt: new Date(),
                status: report.status === 'DRAFT' ? 'PENDING_SIGN' : report.status
            }
        });

        return json({ success: true, message: 'Tanda tangan berhasil disimpan' });

    } catch (error) {
        console.error('Error:', error);
        return json({ success: false, message: 'Gagal menyimpan tanda tangan' }, { status: 500 });
    }
};