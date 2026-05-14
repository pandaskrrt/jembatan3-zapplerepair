import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';

export const POST: RequestHandler = async ({ params, locals, request }) => {
    const session = locals.session;
    const reportId = params.id;
    const { responsibleIds } = await request.json();

    if (!session) {
        return json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Ambil report dengan audit
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

        // Hanya auditor atau admin yang bisa memilih penanggung jawab
        const isAuditor = report.audit?.auditorId === session.id;
        const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN';

        if (!isAuditor && !isAdmin) {
            return json({ 
                success: false, 
                message: 'Hanya auditor atau admin yang dapat memilih penanggung jawab' 
            }, { status: 403 });
        }

        // Update responsibleIds
        const updatedReport = await db.report.update({
            where: { id: reportId },
            data: {
                responsibleIds: responsibleIds
            }
        });

        return json({ 
            success: true, 
            message: 'Penanggung jawab berhasil dipilih',
            data: updatedReport
        });

    } catch (error) {
        console.error('Error saving responsible:', error);
        return json({ 
            success: false, 
            message: 'Terjadi kesalahan saat menyimpan data' 
        }, { status: 500 });
    }
};