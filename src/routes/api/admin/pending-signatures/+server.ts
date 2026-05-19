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
        // Ambil semua report yang STATUSnya PENDING_SIGN atau PARTIALLY_SIGNED
        const reports = await db.report.findMany({
            where: {
                status: {
                    in: ['PENDING_SIGN', 'PARTIALLY_SIGNED']
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

        // Filter report yang user adalah penanggung jawab
        const filteredReports = reports.filter(report => {
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

            const isResponsible = responsibleIds.includes(session.id);
            const hasSigned = report.signatures.length > 0;

            return isResponsible && !hasSigned;
        });

        const formattedReports = filteredReports.map(report => {
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

            const order = responsibleIds.indexOf(session.id) + 1;
            const otherSignedCount = report.signatures.length;

            return {
                id: report.id,
                status: report.status,
                createdAt: report.createdAt,
                completedAt: report.completedAt,
                totalItems: report.audit.totalItems,      // ← ganti totalCards jadi totalItems
                totalMatch: report.audit.totalMatch,
                totalMismatch: report.audit.totalMismatch,
                totalMissing: report.audit.totalMissing,
                totalNewEntry: report.audit.totalNewEntry,
                sectionName: report.audit.section?.name,
                cabinetName: report.audit.section?.cabinet?.name,
                auditorName: report.audit.auditor?.name,
                hasSigned: report.signatures.length > 0,
                order: order,
                otherSigned: otherSignedCount,
                totalResponsible: responsibleIds.length
            };
        });

        return json({ success: true, reports: formattedReports });
    } catch (error) {
        console.error('Error loading reports:', error);
        return json({ success: false, message: 'Failed to load reports' }, { status: 500 });
    }
};