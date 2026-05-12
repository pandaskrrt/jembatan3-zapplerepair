import { db } from '$lib/server/db'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ cookies }) => {
    // Ambil authToken dari cookie
    const authToken = cookies.get('authToken')
    
    if (!authToken) {
        return {
            audits: [],
            stats: { draft: 0, pending: 0, approved: 0, rejected: 0 },
            user: null
        }
    }
    
    // TODO: Verify JWT dan ambil user info
    // Untuk sementara, ambil user dari database langsung
    const user = await db.user.findFirst({
        where: { role: 'STOCK_AUDIT' }
    })
    
    if (!user) {
        return {
            audits: [],
            stats: { draft: 0, pending: 0, approved: 0, rejected: 0 },
            user: null
        }
    }
    
    // Ambil semua audit milik user ini
    const audits = await db.stockAudit.findMany({
        where: { auditorId: user.id },
        include: {
            section: {
                include: {
                    cabinet: true
                }
            },
            items: {
                include: {
                    card: {
                        select: {
                            name: true,
                            imageUrl: true
                        }
                    }
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    })
    
    // Hitung statistik
    const stats = {
        draft: audits.filter(a => a.status === 'DRAFT').length,
        pending: audits.filter(a => a.status === 'PENDING').length,
        approved: audits.filter(a => a.status === 'APPROVED').length,
        rejected: audits.filter(a => a.status === 'REJECTED').length
    }
    
    // Format audit untuk frontend
    const formattedAudits = audits.map(audit => ({
        id: audit.id,
        status: audit.status,
        createdAt: audit.createdAt,
        updatedAt: audit.updatedAt,
        sectionName: audit.section?.name || 'Unknown Section',
        cabinetName: audit.section?.cabinet?.name || 'Unknown Cabinet',
        totalCards: audit.items.length,
        matchCount: audit.items.filter(i => i.systemStock === i.physicalStock).length,
        differenceCount: audit.items.filter(i => i.systemStock !== i.physicalStock).length,
        reviewedAt: audit.reviewedAt,
        reviewNote: audit.reviewNote
    }))
    
    return {
        audits: formattedAudits,
        stats,
        user: {
            id: user.id,
            name: user.name,
            username: user.username,
            role: user.role
        }
    }
}