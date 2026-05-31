import { db } from '$lib/server/db';
import { redirect, type PageServerLoad } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
    const session = locals.session;

    if (!session) {
        throw redirect(302, '/login');
    }

    // Ambil semua audit berdasarkan role user
    let audits;

    if (session.role === 'SUPER_ADMIN' || session.role === 'ADMIN') {
        // Admin dan Super Admin bisa lihat semua audit
        audits = await db.stockAudit.findMany({
            include: {
                section: {
                    select: {
                        name: true,
                        cabinet: { select: { name: true } },
                        lockedUntil: true,
                        lockedByAuditId: true
                    }
                },
                auditor: {
                    select: { name: true, username: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    } else {
        // User biasa hanya lihat audit miliknya sendiri
        audits = await db.stockAudit.findMany({
            where: { auditorId: session.id },
            include: {
                section: {
                    select: {
                        name: true,
                        cabinet: { select: { name: true } },
                        lockedUntil: true,
                        lockedByAuditId: true
                    }
                },
                auditor: {
                    select: { name: true, username: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    // Format data dengan status lock
    const formattedAudits = audits.map(audit => {
        const now = new Date();
        const isLocked = audit.section?.lockedUntil && audit.section.lockedUntil > now;
        const lockRemaining = audit.section?.lockedUntil 
            ? Math.ceil((audit.section.lockedUntil.getTime() - now.getTime()) / (1000 * 60))
            : 0;
        
        // Hitung progress audit (berapa item yang sudah dicek)
        let completedItems = 0;
        let totalItems = 0;
        
        // Progress dihitung dari items yang sudah memiliki physicalStock
        // Ini bisa disesuaikan dengan logika Anda
        
        return {
            ...audit,
            isLocked,
            lockRemaining,
            lockRemainingHours: Math.floor(lockRemaining / 60),
            lockRemainingMinutes: lockRemaining % 60,
            // Progress bisa dihitung dari total items di audit (jika ada field totalItems)
            progress: audit.totalItems ? Math.round((audit.totalMatch + audit.totalMismatch + audit.totalMissing) / audit.totalItems * 100) : 0
        };
    });

    // Hitung statistik untuk dashboard
    const stats = {
        total: formattedAudits.length,
        completed: formattedAudits.filter(a => a.status === 'COMPLETED').length,
        draft: formattedAudits.filter(a => a.status === 'DRAFT').length,
        locked: formattedAudits.filter(a => a.isLocked).length
    };

    return {
        audits: formattedAudits,
        stats,
        userRole: session.role,
        userName: session.name
    };
};