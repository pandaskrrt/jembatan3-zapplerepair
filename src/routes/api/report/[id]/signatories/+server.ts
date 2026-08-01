import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';

export const GET: RequestHandler = async ({ params, locals }) => {
    const session = locals.session;
    const reportId = params.id;

    if (!session) {
        return json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const report = await db.report.findUnique({
            where: { id: reportId },
            include: {
                audit: {
                    include: {
                        section: {
                            include: { cabinet: true }
                        },
                        auditor: { select: { id: true, name: true } }
                    }
                },
                signatures: {
                    include: {
                        signer: { select: { id: true, name: true, username: true } }
                    },
                    orderBy: { order: 'asc' }
                }
            }
        });

        if (!report) {
            return json({ success: false, message: 'Report not found' }, { status: 404 });
        }

        // Parse responsibleIds
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

        // Ambil data penanggung jawab
        const responsiblePersons = responsibleIds.length > 0
            ? await db.user.findMany({
                where: { id: { in: responsibleIds } },
                select: { id: true, name: true, username: true }
            })
            : [];

        return json({
            success: true,
            data: {
                audit: {
                    id: report.audit.id,
                    createdAt: report.audit.createdAt,
                    completedAt: report.audit.completedAt,
                    note: report.audit.note,
                    totalItems: report.audit.totalItems,
                    totalMatch: report.audit.totalMatch,
                    totalMismatch: report.audit.totalMismatch,
                    totalMissing: report.audit.totalMissing,
                    totalNewEntry: report.audit.totalNewEntry,
                    cabinetName: report.audit.section?.cabinet?.name,
                    sectionName: report.audit.section?.name,
                    auditorName: report.audit.auditor?.name
                },
                report: {
                    ...report,
                    responsibleIds,
                    responsiblePersons
                }
            }
        });
    } catch (error) {
        console.error('Error fetching signatories:', error);
        return json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
};