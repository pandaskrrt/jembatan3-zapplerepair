import { db } from '$lib/server/db';

export async function checkSectionLock(sectionId: number, userId: string, userRole: string) {
    // Ambil section beserta audit yang menguncinya
    const section = await db.section.findUnique({
        where: { id: sectionId },
        include: {
            audits: {
                where: { status: 'DRAFT' },
                take: 1
            }
        }
    });

    if (!section) return { locked: false, message: null, remainingMinutes: 0 };

    const now = new Date();
    const isLocked = section.lockedUntil && section.lockedUntil > now;
    
    // Cari audit aktif yang mengunci section ini
    let isAuditor = false;
    if (section.lockedByAuditId) {
        const lockingAudit = await db.stockAudit.findUnique({
            where: { id: section.lockedByAuditId },
            select: { auditorId: true }
        });
        isAuditor = lockingAudit?.auditorId === userId;
    }
    
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

    if (isLocked && !isAuditor && isAdmin) {
        const remainingMinutes = Math.ceil((section.lockedUntil.getTime() - now.getTime()) / (1000 * 60));
        return {
            locked: true,
            message: `Section sedang dalam proses audit. Terkunci selama ${remainingMinutes} menit lagi. Hanya auditor yang dapat mengedit.`,
            remainingMinutes
        };
    }

    return { locked: false, message: null, remainingMinutes: 0 };
}

// Guard untuk API endpoints yang mengedit item
export async function guardSectionEdit(sectionId: number, userId: string, userRole: string) {
    const { locked, message } = await checkSectionLock(sectionId, userId, userRole);
    
    if (locked) {
        throw new Error(message || 'Section sedang terkunci oleh proses audit');
    }
    
    return true;
}