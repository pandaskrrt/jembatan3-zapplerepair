import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';

export const GET: RequestHandler = async ({ locals }) => {
    const session = locals.session;

    if (!session) {
        return json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Cek apakah user adalah admin
    if (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN') {
        return json({ success: false, message: 'Access denied' }, { status: 403 });
    }

    try {
        // Cari semua report yang statusnya PENDING_SIGN
        // dan user adalah penanggung jawab
        const reports = await db.report.findMany({
            where: {
                status: 'PENDING_SIGN',
                responsibleIds: {
                    // Untuk Prisma, gunakan contains atau raw query
                    // Sesuaikan dengan database yang Anda gunakan
                }
            },
            include: {
                audit: {
                    include: {
                        section: {
                            include: {
                                cabinet: true
                            }
                        },
                        auditor: true
                    }
                },
                signatures: {
                    where: {
                        signerId: session.id
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Filter manual untuk responsibleIds (karena JSON)
        const filteredReports = reports.filter(report => {
            const responsibleIds = report.responsibleIds as string[] || [];
            return responsibleIds.includes(session.id);
        });

        const formattedReports = filteredReports.map(report => ({
            id: report.id,
            status: report.status,
            createdAt: report.createdAt,
            completedAt: report.completedAt,
            totalCards: report.audit.totalCards,
            totalMatch: report.audit.totalMatch,
            totalMismatch: report.audit.totalMismatch,
            totalMissing: report.audit.totalMissing,
            totalNewEntry: report.audit.totalNewEntry,
            sectionName: report.audit.section?.name,
            cabinetName: report.audit.section?.cabinet?.name,
            auditorName: report.audit.auditor?.name,
            hasSigned: report.signatures.length > 0
        }));

        return json({ success: true, reports: formattedReports });
    } catch (error) {
        console.error('Error loading reports:', error);
        return json({ success: false, message: 'Failed to load reports' }, { status: 500 });
    }
};