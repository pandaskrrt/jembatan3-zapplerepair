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
            
            // Mengamankan parsing JSON dari model Report field 'responsibleIds' (Json type di MySQL)
            if (report.responsibleIds) {
                if (typeof report.responsibleIds === 'string') {
                    try {
                        responsibleIds = JSON.parse(report.responsibleIds);
                    } catch {
                        responsibleIds = [];
                    }
                } else if (Array.isArray(report.responsibleIds)) {
                    responsibleIds = report.responsibleIds as string[];
                }
            }
            
            const isResponsible = responsibleIds.includes(session.id);
            const userSignature = report.signatures.find(s => s.signerId === session.id);
            const hasSigned = !!userSignature;
            
            // Filter: Hanya tampilkan laporan yang penanggung jawabnya adalah user yang sedang login, dan belum ia tanda tangani
            if (isResponsible && !hasSigned) {
                const order = responsibleIds.indexOf(session.id) + 1;
                
                pendingReports.push({
                    id: report.id,
                    status: report.status,
                    createdAt: report.createdAt,
                    completedAt: report.completedAt,
                    // FIX: Mengubah dari totalCards menjadi totalItems sesuai schema.prisma baru Anda
                    totalCards: report.audit.totalItems ?? 0, 
                    totalMatch: report.audit.totalMatch ?? 0,
                    totalMismatch: report.audit.totalMismatch ?? 0,
                    totalMissing: report.audit.totalMissing ?? 0,
                    totalNewEntry: report.audit.totalNewEntry ?? 0,
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
    } catch (err) {
        console.error('Error loading reports:', err);
        return { reports: [] };
    }
};