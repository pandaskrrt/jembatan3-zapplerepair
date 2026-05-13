import { db } from '$lib/server/db';
import { redirect, error, type PageServerLoad } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
    const auditId = params.id;
    const session = locals.session;

    if (!session) {
        throw redirect(302, '/login');
    }

    // Ambil audit dan report
    const audit = await db.stockAudit.findUnique({
        where: { id: auditId },
        include: {
            section: {
                include: { cabinet: true }
            },
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

    if (!audit) {
        throw error(404, 'Audit tidak ditemukan');
    }

    // Cek akses
    if (audit.auditorId !== session.id && session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN') {
        throw error(403, 'Anda tidak memiliki akses');
    }

    // Ambil daftar admin untuk dipilih
    const availableAdmins = await db.user.findMany({
        where: {
            role: 'ADMIN',
            isActive: true
        },
        select: {
            id: true,
            name: true,
            username: true
        },
        orderBy: { name: 'asc' }
    });

    // Pastikan report ada
    let report = audit.report;
    if (!report) {
        report = await db.report.create({
            data: {
                auditId: audit.id,
                responsibleIds: [],
                status: 'DRAFT',
                notes: audit.note || null
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

    // Parse responsibleIds dari JSON
    const responsibleIdsArray = report.responsibleIds as string[] || [];
    
    // Ambil data penanggung jawab
    let responsiblePersons = [];
    if (responsibleIdsArray.length > 0) {
        responsiblePersons = await db.user.findMany({
            where: {
                id: { in: responsibleIdsArray }
            },
            select: {
                id: true,
                name: true,
                username: true
            }
        });
    }

    return {
        audit: {
            id: audit.id,
            sectionId: audit.sectionId,  // ← TAMBAHKAN INI
            createdAt: audit.createdAt,
            completedAt: audit.completedAt,
            note: audit.note,
            totalCards: audit.totalCards,
            totalMatch: audit.totalMatch,
            totalMismatch: audit.totalMismatch,
            totalMissing: audit.totalMissing,
            totalNewEntry: audit.totalNewEntry,
            cabinetName: audit.section?.cabinet?.name,
            sectionName: audit.section?.name,
            auditorName: audit.auditor?.name
        },
        report: {
            id: report.id,
            status: report.status,
            auditorSignature: report.auditorSignature,
            auditorSignedAt: report.auditorSignedAt,
            responsibleIds: responsibleIdsArray,
            responsiblePersons: responsiblePersons,
            notes: report.notes,
            createdAt: report.createdAt,
            completedAt: report.completedAt,
            signatures: report.signatures
        },
        availableAdmins
    };
};