import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';

export const POST: RequestHandler = async ({ params, locals }) => {
    console.log('=== SUBMIT LAPORAN ENDPOINT ===');
    console.log('Report ID:', params.id);
    
    const session = locals.session;
    const reportId = params.id;

    if (!session) {
        console.log('No session, unauthorized');
        return json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    console.log('User ID:', session.id);
    console.log('User Role:', session.role);

    try {
        // Ambil report LENGKAP dengan audit-nya
        const report = await db.report.findUnique({
            where: { id: reportId },
            include: {
                audit: {
                    select: {
                        auditorId: true
                    }
                }
            }
        });

        if (!report) {
            console.log('Report not found:', reportId);
            return json({ success: false, message: 'Report tidak ditemukan' }, { status: 404 });
        }

        console.log('Report found');
        console.log('Auditor ID from audit:', report.audit?.auditorId);
        console.log('Current user ID:', session.id);
        console.log('Current user role:', session.role);
        console.log('Report status:', report.status);
        
        // Cek apakah user adalah auditor (dari audit) atau admin
        const isAuditor = report.audit?.auditorId === session.id;
        const isAdmin = session.role === 'ADMIN' || session.role === 'SUPER_ADMIN';

        console.log('Is Auditor:', isAuditor);
        console.log('Is Admin:', isAdmin);

        if (!isAuditor && !isAdmin) {
            console.log('User not authorized');
            return json({ 
                success: false, 
                message: `Hanya auditor yang dapat mengirim laporan. Your ID: ${session.id}, Auditor ID: ${report.audit?.auditorId}` 
            }, { status: 403 });
        }

        // Validasi: harus sudah tanda tangan
        if (!report.auditorSignature) {
            console.log('No auditor signature');
            return json({ success: false, message: 'Auditor harus tanda tangan terlebih dahulu' }, { status: 400 });
        }

        // Validasi: harus sudah ada penanggung jawab
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

        console.log('Responsible IDs:', responsibleIds);

        if (responsibleIds.length === 0) {
            console.log('No responsible persons selected');
            return json({ success: false, message: 'Pilih penanggung jawab terlebih dahulu' }, { status: 400 });
        }

        console.log('All validations passed, updating status to PENDING_SIGN');

        // Update status menjadi PENDING_SIGN
        await db.report.update({
            where: { id: reportId },
            data: {
                status: 'PENDING_SIGN'
            }
        });

        console.log('Status updated successfully');

        return json({ success: true, message: 'Laporan berhasil dikirim ke penanggung jawab' });
    } catch (error) {
        console.error('Error in submit endpoint:', error);
        return json({ 
            success: false, 
            message: 'Terjadi kesalahan: ' + (error as Error).message 
        }, { status: 500 });
    }
};