import { db } from '$lib/server/db';
import { redirect, error, type PageServerLoad } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
    const session = locals.session;

    if (!session) {
        throw redirect(302, '/login');
    }

    if (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN') {
        throw error(403, 'Access denied');
    }

    try {
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
                    include: {
                        signer: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        const pendingReports = [];

        for (const report of reports) {
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
            const userSignature = report.signatures.find(s => s.signerId === session.id);
            const hasSigned = !!userSignature;
            
            if (isResponsible && !hasSigned) {
                const order = responsibleIds.indexOf(session.id) + 1;
                
                pendingReports.push({
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
                    hasSigned: hasSigned,
                    order: order,
                    otherSignedCount: report.signatures.length,
                    totalResponsible: responsibleIds.length
                });
            }
        }

        return {
            reports: pendingReports
        };
    } catch (error) {
        console.error('Error loading reports:', error);
        return { reports: [] };
    }
};