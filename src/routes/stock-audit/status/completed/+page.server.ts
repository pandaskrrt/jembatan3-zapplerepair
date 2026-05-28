import { db } from '$lib/server/db';
import { redirect, type PageServerLoad } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
    const session = locals.session;
    
    console.log('=== LOAD RIWAYAT SELESAI ===');
    console.log('User ID:', session?.id);
    
    if (!session) {
        throw redirect(302, '/login');
    }

    // Ambil SEMUA audit COMPLETED (tanpa filter user dulu untuk test)
    const completedAudits = await db.stockAudit.findMany({
        where: {
            status: 'COMPLETED'
        },
        include: {
            section: {
                include: {
                    cabinet: true
                }
            },
            items: {
                select: {
                    itemStatus: true
                }
            },
            auditor: {
                select: {
                    id: true,
                    name: true,
                    username: true
                }
            }
        },
        orderBy: { completedAt: 'desc' }
    });

    console.log('Total completed audits found:', completedAudits.length);

    const formattedAudits = completedAudits.map(audit => {
        // Hitung statistik dari items
        let totalMatch = 0;
        let totalMismatch = 0;
        let totalMissing = 0;
        let totalNewEntry = 0;
        
        for (const item of audit.items) {
            switch (item.itemStatus) {
                case 'MATCH':
                    totalMatch++;
                    break;
                case 'MISMATCH':
                    totalMismatch++;
                    break;
                case 'MISSING':
                    totalMissing++;
                    break;
                case 'NEW_ENTRY':
                    totalNewEntry++;
                    break;
            }
        }
        
        console.log(`Audit ${audit.id}: Match=${totalMatch}, Mismatch=${totalMismatch}, Missing=${totalMissing}, New=${totalNewEntry}`);
        
        return {
            id: audit.id,
            status: audit.status,
            createdAt: audit.createdAt,
            completedAt: audit.completedAt,
            totalCards: audit.items.length,
            totalMatch: totalMatch,
            totalMismatch: totalMismatch,
            totalMissing: totalMissing,
            totalNewEntry: totalNewEntry,
            cabinetName: audit.section?.cabinet?.name ?? '-',
            sectionName: audit.section?.name ?? '-',
            sectionType: audit.section?.type ?? '-',
            note: audit.note,
            auditorName: audit.auditor?.name ?? 'Unknown'
        };
    });

    // Hitung summary
    const summary = {
        totalMatch: formattedAudits.reduce((sum, a) => sum + a.totalMatch, 0),
        totalMismatch: formattedAudits.reduce((sum, a) => sum + a.totalMismatch, 0),
        totalMissing: formattedAudits.reduce((sum, a) => sum + a.totalMissing, 0),
        totalNewEntry: formattedAudits.reduce((sum, a) => sum + a.totalNewEntry, 0),
        totalItemsAudited: formattedAudits.reduce((sum, a) => sum + a.totalCards, 0),
        averageAccuracy: formattedAudits.length > 0 && formattedAudits.reduce((sum, a) => sum + a.totalCards, 0) > 0
            ? Math.round((formattedAudits.reduce((sum, a) => sum + a.totalMatch, 0) / formattedAudits.reduce((sum, a) => sum + a.totalCards, 0)) * 100)
            : 0
    };

    console.log('Summary:', summary);
    console.log('Returning audits count:', formattedAudits.length);

    return {
        audits: formattedAudits,
        count: formattedAudits.length,
        summary
    };
};