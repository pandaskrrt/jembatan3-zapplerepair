import { db } from '$lib/server/db';
import { redirect, error, type PageServerLoad } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
    const session = locals.session;

    if (!session) {
        throw redirect(302, '/login');
    }

    // Cek apakah user adalah admin
    if (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN') {
        throw error(403, 'Access denied');
    }

    try {
        // Ambil semua report yang statusnya PENDING_SIGN
        const reports = await db.report.findMany({
            where: {
                status: 'PENDING_SIGN'
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

        // Filter report yang user adalah penanggung jawab
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
            hasSigned: report.signatures.length > 0,
            report: report // Kirim data report lengkap untuk keperluan signature
        }));

        return {
            reports: formattedReports
        };
    } catch (error) {
        console.error('Error loading reports:', error);
        throw error(500, 'Failed to load reports');
    }
};