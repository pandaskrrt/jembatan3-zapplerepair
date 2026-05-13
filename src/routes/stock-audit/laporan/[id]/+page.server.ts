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
                    },
                    responsible: { select: { id: true, name: true, username: true } }
                }
            }
        }
    });

    if (!audit) {
        throw error(404, 'Audit tidak ditemukan');
    }

    // Cek akses: auditor sendiri atau admin
    if (audit.auditorId !== session.id && session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN') {
        throw error(403, 'Anda tidak memiliki akses');
    }

    // Ambil daftar admin untuk dipilih (role ADMIN)
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

    return {
        audit: {
            id: audit.id,
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
        report: audit.report,
        availableAdmins
    };
};