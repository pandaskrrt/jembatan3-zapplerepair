import { db } from '$lib/server/db';
import { redirect, type PageServerLoad } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
    const session = locals.session;
    
    if (!session) {
        throw redirect(302, '/login');
    }

    // Ambil semua audit dengan status DRAFT milik user ini
    const draftAudits = await db.stockAudit.findMany({
        where: {
            auditorId: session.id,
            status: 'DRAFT'
        },
        include: {
            section: {
                include: {
                    cabinet: true
                }
            },
            items: true
        },
        orderBy: { createdAt: 'desc' }
    });

    const formattedAudits = draftAudits.map(audit => ({
        id: audit.id,
        status: audit.status,
        createdAt: audit.createdAt,
        updatedAt: audit.updatedAt,
        totalCards: audit.items.length,
        cabinetName: audit.section?.cabinet?.name || '-',
        sectionName: audit.section?.name || '-',
        sectionType: audit.section?.type || '-'
    }));

    return {
        audits: formattedAudits,
        count: formattedAudits.length
    };
};