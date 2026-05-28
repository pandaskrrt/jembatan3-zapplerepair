import { db } from '$lib/server/db';
import { redirect, type PageServerLoad } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
    const session = locals.session;

    if (!session) {
        throw redirect(302, '/login');
    }

    // Ambil semua data audit dengan relasi yang dibutuhkan
    const audits = await db.stockAudit.findMany({
        where: {
            status: {
                in: ['DRAFT', 'COMPLETED']
            }
        },
        include: {
            section: {
                include: {
                    cabinet: true
                }
            },
            auditor: {
                select: {
                    id: true,
                    name: true,
                    username: true
                }
            },
            report: {
                select: {
                    id: true,
                    status: true,
                    completedAt: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    // Format data untuk frontend
    const formattedAudits = audits.map(audit => ({
        id: audit.id,
        createdAt: audit.createdAt.toISOString(),
        completedAt: audit.completedAt?.toISOString() || null,
        status: audit.status,
        totalCards: audit.totalItems ?? 0,
        totalMatch: audit.totalMatch ?? 0,
        totalMismatch: audit.totalMismatch ?? 0,
        totalMissing: audit.totalMissing ?? 0,
        totalNewEntry: audit.totalNewEntry ?? 0,
        note: audit.note,
        section: audit.section ? {
            id: audit.section.id,
            name: audit.section.name,
            cabinet: audit.section.cabinet ? {
                id: audit.section.cabinet.id,
                name: audit.section.cabinet.name
            } : null
        } : null,
        auditor: audit.auditor ? {
            id: audit.auditor.id,
            name: audit.auditor.name,
            username: audit.auditor.username
        } : null,
        report: audit.report ? {
            id: audit.report.id,
            status: audit.report.status,
            completedAt: audit.report.completedAt
        } : null
    }));

    // Hitung statistik untuk dashboard
    const stats = {
        totalAudits: formattedAudits.length,
        completedAudits: formattedAudits.filter(a => a.status === 'COMPLETED').length,
        draftAudits: formattedAudits.filter(a => a.status === 'DRAFT').length,
        totalItemsAudited: formattedAudits.reduce((sum, a) => sum + a.totalCards, 0)
    };

    // Hitung data chart per bulan
    const monthlyData = new Array(12).fill(0);
    formattedAudits.forEach(audit => {
        const date = new Date(audit.createdAt);
        const month = date.getMonth();
        monthlyData[month]++;
    });

    return {
        audits: formattedAudits,
        stats,
        chartData: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
            datasets: monthlyData
        }
    };
};