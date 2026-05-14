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
        const report = await db.report.findUnique({
            where: { id: reportId },
            include: { audit: { select: { auditorId: true } } }
        });

        if (!report) {
            return json({ success: false, message: 'Report tidak ditemukan' }, { status: 404 });
        }

        const isAuditor = report.audit?.auditorId === session.id;
        const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN';

        if (!isAuditor && !isAdmin) {
            return json({ success: false, message: 'Hanya auditor yang dapat memilih penanggung jawab' }, { status: 403 });
        }

        // Update responsibleIds sebagai JSON
        await db.report.update({
            where: { id: reportId },
            data: {
                responsibleIds: responsibleIds
                // TIDAK ADA update status di sini!
            }
        });

        return json({ success: true, message: 'Penanggung jawab berhasil dipilih' });
    } catch (error) {
        console.error('Error:', error);
        return json({ success: false, message: 'Gagal menyimpan' }, { status: 500 });
    }
};