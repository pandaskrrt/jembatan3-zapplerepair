import { db } from '$lib/server/db';
import { redirect, error, type PageServerLoad } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
    const auditId = params.id;
    const session = locals.session;

    if (!session) throw redirect(302, '/login');

    const audit = await db.stockAudit.findUnique({
        where: { id: auditId },
        include: {
            section: { include: { cabinet: true } },
            auditor: { select: { id: true, name: true } },
            report: {
                include: {
                    signatures: {
                        include: {
                            signer: { select: { id: true, name: true, username: true } }
                        },
                        orderBy: { order: 'asc' }
                    }
                }
            }
        }
    });

    if (!audit) throw error(404, 'Audit tidak ditemukan');

    if (
        audit.auditorId !== session.id &&
        session.role !== 'ADMIN' &&
        session.role !== 'SUPER_ADMIN'
    ) {
        throw error(403, 'Anda tidak memiliki akses');
    }

    const availableAdmins = await db.user.findMany({
        where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] }, isActive: true },
        select: { id: true, name: true, username: true, role: true },
        orderBy: { name: 'asc' }
    });

    let report = audit.report;
    if (!report) {
        report = await db.report.create({
            data: {
                auditId: audit.id,
                status: 'DRAFT',
                notes: audit.note ?? null
            },
            include: {
                signatures: {
                    include: {
                        signer: { select: { id: true, name: true, username: true } }
                    },
                    orderBy: { order: 'asc' }
                }
            }
        });
    }

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

    let responsiblePersons: { id: string; name: string; username: string }[] = [];
    if (responsibleIds.length > 0) {
        responsiblePersons = await db.user.findMany({
            where: { id: { in: responsibleIds } },
            select: { id: true, name: true, username: true }
        });
        responsiblePersons.sort((a, b) => {
            return responsibleIds.indexOf(a.id) - responsibleIds.indexOf(b.id);
        });
    }

    return {
        audit: {
            id:            audit.id,
            auditorId:  audit.auditorId,
            sectionId:     audit.sectionId,
            createdAt:     audit.createdAt,
            completedAt:   audit.completedAt,
            note:          audit.note,
            totalCards:    audit.totalCards,
            totalMatch:    audit.totalMatch,
            totalMismatch: audit.totalMismatch,
            totalMissing:  audit.totalMissing,
            totalNewEntry: audit.totalNewEntry,
            cabinetName:   audit.section?.cabinet?.name,
            sectionName:   audit.section?.name,
            auditorName:   audit.auditor?.name
        },
        report: {
            id:                   report.id,
            status:               report.status,
            auditorSignature:     report.auditorSignature,
            auditorSignedAt:      report.auditorSignedAt,
            responsibleIds:       responsibleIds,
            responsiblePersons:   responsiblePersons,
            responsibleSignedAt1: report.responsibleSignedAt1,
            responsibleSignedAt2: report.responsibleSignedAt2,
            notes:                report.notes,
            createdAt:            report.createdAt,
            completedAt:          report.completedAt,
            signatures:           report.signatures
        },
        availableAdmins
    };
};