import { db } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    const totalUsers = await db.user.count();
    const totalAdmins = await db.user.count({ where: { role: 'ADMIN' } });
    const totalAuditors = await db.user.count({ where: { role: 'STOCK_AUDIT' } });
    const totalAudits = await db.stockAudit.count();
    const completedAudits = await db.stockAudit.count({ where: { status: 'COMPLETED' } });
    const draftAudits = await db.stockAudit.count({ where: { status: 'DRAFT' } });
    
    const recentAudits = await db.stockAudit.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
            auditor: { select: { name: true } },
            section: { select: { name: true, cabinet: { select: { name: true } } } }
        }
    });
    
    return {
        stats: {
            totalUsers,
            totalAdmins,
            totalAuditors,
            totalAudits,
            completedAudits,
            draftAudits,
            completionRate: totalAudits > 0 ? Math.round((completedAudits / totalAudits) * 100) : 0
        },
        recentAudits: recentAudits.map(a => ({
            id: a.id,
            status: a.status,
            createdAt: a.createdAt,
            auditorName: a.auditor?.name,
            sectionName: a.section?.name,
            cabinetName: a.section?.cabinet?.name
        }))
    };
};