import { db } from '$lib/server/db';
import { redirect, type PageServerLoad } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
    const session = locals.session;
    
    if (!session) {
        throw redirect(302, '/login');
    }

    // Ambil semua audit dengan status COMPLETED milik user ini
    const completedAudits = await db.stockAudit.findMany({
        where: {
            auditorId: session.id,
            status: 'COMPLETED'
        },
        include: {
            section: {
                include: {
                    cabinet: true
                }
            },
            items: true
        },
        orderBy: { completedAt: 'desc' }
    });

    const formattedAudits = completedAudits.map(audit => ({
        id: audit.id,
        status: audit.status,
        createdAt: audit.createdAt,
        completedAt: audit.completedAt,
        totalCards: audit.items.length,
        totalMatch: audit.totalMatch,
        totalMismatch: audit.totalMismatch,
        totalMissing: audit.totalMissing,
        totalNewEntry: audit.totalNewEntry,
        cabinetName: audit.section?.cabinet?.name || '-',
        sectionName: audit.section?.name || '-',
        sectionType: audit.section?.type || '-',
        note: audit.note
    }));

    return {
        audits: formattedAudits,
        count: formattedAudits.length
    };
};