import { db } from '$lib/server/db'
import { fail, type Actions } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ url }) => {
    const now = new Date()

    const month = parseInt(url.searchParams.get('month') || String(now.getMonth() + 1))
    const year = parseInt(url.searchParams.get('year') || String(now.getFullYear()))
    const weekOfMonth = parseInt(url.searchParams.get('week') || '1')

    function getWeekDateRange(y: number, m: number, w: number) {
        const startDay = (w - 1) * 7 + 1
        const endDay = w === 4 ? new Date(y, m, 0).getDate() : w * 7
        return {
            startDate: new Date(y, m - 1, startDay, 0, 0, 0, 0),
            endDate: new Date(y, m - 1, endDay, 23, 59, 59, 999)
        }
    }

    const weeksInMonth = [1, 2, 3, 4].map(w => {
        const range = getWeekDateRange(year, month, w)
        return { week: w, startDate: range.startDate, endDate: range.endDate }
    })

    const currentRange = weeksInMonth[weekOfMonth - 1]

    // ── Audits ───────────────────────────────
    const auditsInPeriod = await db.stockAudit.findMany({
        where: {
            createdAt: { gte: currentRange.startDate, lte: currentRange.endDate }
        },
        include: {
            section: { include: { cabinet: true } },
            auditor: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
    })

    const formattedAudits = auditsInPeriod.map(audit => ({
        id: audit.id,
        createdAt: audit.createdAt,
        status: audit.status,
        section: {
            name: audit.section?.name || 'Tidak Diketahui',
            cabinet: audit.section?.cabinet ? { name: audit.section.cabinet.name } : null
        },
        auditor: { name: audit.auditor?.name || 'Petugas Lapangan' }
    }))

    // ── Item History ─────────────────────────
    const historyLogs = await db.itemHistory.findMany({
        where: {
            createdAt: { gte: currentRange.startDate, lte: currentRange.endDate }
        },
        include: {
            item: {
                include: {
                    price: true,
                    costPrice: true
                }
            },
            user: { select: { name: true, role: true } }
        },
        orderBy: { createdAt: 'desc' }
    })

    const itemsAdded = historyLogs
        .filter(log => log.action === 'CREATED')
        .map(log => ({
            id: log.id,
            createdAt: log.createdAt,
            user: { name: log.user?.name || 'Sistem', role: log.user?.role || 'USER' },
            item: {
                name: log.item?.name || 'Item Tanpa Nama',
                category: log.item?.category || 'Umum',
                serialNumber: log.item?.serialNumber ?? null,
                location: log.item?.location || '-',
                price: log.item?.price ? { amount: log.item.price.amount } : null,
                costPrice: log.item?.costPrice ? { amount: log.item.costPrice.amount } : null
            }
        }))

    const itemsDeleted = historyLogs
        .filter(log => ['SOFT_DELETED', 'SECTION_DELETED', 'CABINET_DELETED'].includes(log.action))
        .map(log => ({
            id: log.id,
            action: log.action,
            note: log.note,
            createdAt: log.createdAt,
            user: { name: log.user?.name || 'Sistem' },
            item: {
                name: log.item?.name || 'Item Dihapus',
                location: log.item?.location || '-',
                deletedFromSectionName: log.item?.deletedFromSectionName ?? null,
                deletedFromCabinetName: log.item?.deletedFromCabinetName ?? null,
                deleteReason: log.item?.deleteReason || log.note || 'Tanpa alasan'
            }
        }))

    const itemsRestored = historyLogs
        .filter(log => log.action === 'RESTORED')
        .map(log => ({
            id: log.id,
            note: log.note,
            createdAt: log.createdAt,
            user: { name: log.user?.name || 'Sistem' },
            item: {
                name: log.item?.name || 'Item Dikembalikan',
                location: log.item?.location || 'Kembali ke Rak Aktif'
            }
        }))

    // ── Cabinet Logs ─────────────────────────
    const cabinetLogsData = await db.cabinetLog.findMany({
        where: {
            createdAt: { gte: currentRange.startDate, lte: currentRange.endDate }
        },
        include: {
            performedBy: { select: { name: true, role: true } }
        },
        orderBy: { createdAt: 'desc' }
    })

    const cabinetLogs = cabinetLogsData.map(log => ({
        id: log.id,
        createdAt: log.createdAt,
        action: log.action,
        cabinetName: log.cabinetName,
        sectionName: log.sectionName,
        itemName: log.itemName,
        note: log.note || '—',
        onBehalfOf: log.onBehalfOf,
        performedBy: {
            name: log.performedBy?.name || 'Admin',
            role: log.performedBy?.role || 'ADMIN'
        }
    }))

    // ── Saved Report ─────────────────────────
    const savedReport = await db.periodicReport.findUnique({
        where: { month_year_weekOfMonth: { month, year, weekOfMonth } }
    }).catch(() => null)

    // ── Summary ──────────────────────────────
    const summary = {
        totalAudits: formattedAudits.length,
        totalItemsAdded: itemsAdded.length,
        totalItemsDeleted: itemsDeleted.length,
        totalItemsRestored: itemsRestored.length
    }

    return {
        period: { month, year, weekOfMonth },
        weeksInMonth,
        summary,
        auditsInPeriod: formattedAudits,
        itemsAdded,
        itemsDeleted,
        itemsRestored,
        cabinetLogs,
        savedReport
    }
}

export const actions: Actions = {
    saveReport: async ({ request, locals }) => {
        const formData = await request.formData()
        const month = parseInt(formData.get('month')?.toString() || '0')
        const year = parseInt(formData.get('year')?.toString() || '0')
        const weekOfMonth = parseInt(formData.get('weekOfMonth')?.toString() || '0')
        const notes = formData.get('notes')?.toString() || ''

        if (!month || !year || !weekOfMonth) {
            return fail(400, { success: false, message: 'Parameter tanggal tidak sah!' })
        }

        const currentUserId = locals.session?.id?.toString() || 'SYSTEM_ADMIN'

        function getWeekDateRange(y: number, m: number, w: number) {
            const startDay = (w - 1) * 7 + 1
            const endDay = w === 4 ? new Date(y, m, 0).getDate() : w * 7
            return {
                startDate: new Date(y, m - 1, startDay, 0, 0, 0, 0),
                endDate: new Date(y, m - 1, endDay, 23, 59, 59, 999)
            }
        }

        const { startDate, endDate } = getWeekDateRange(year, month, weekOfMonth)

        try {
            // ── Hitung Ulang Data Riil secara On-The-Fly Sebelum Dikunci ──
            const totalAudits = await db.stockAudit.count({
                where: { createdAt: { gte: startDate, lte: endDate } }
            })

            const historyLogs = await db.itemHistory.findMany({
                where: { createdAt: { gte: startDate, lte: endDate } },
                select: { action: true }
            })

            const totalAdded = historyLogs.filter(l => l.action === 'CREATED').length
            const totalDeleted = historyLogs.filter(l => ['SOFT_DELETED', 'SECTION_DELETED', 'CABINET_DELETED'].includes(l.action)).length
            const totalRestored = historyLogs.filter(l => l.action === 'RESTORED').length

            // Simpan data kalkulasi riil ke database periodicReport
            const report = await db.periodicReport.upsert({
                where: { month_year_weekOfMonth: { month, year, weekOfMonth } },
                update: {
                    notes,
                    status: 'COMPLETED',
                    totalAuditCount: totalAudits,
                    totalItemsAdded: totalAdded,
                    totalItemsDeleted: totalDeleted,
                    totalItemsRestored: totalRestored
                },
                create: {
                    month,
                    year,
                    weekOfMonth,
                    notes,
                    createdById: currentUserId,
                    status: 'COMPLETED',
                    periodStart: startDate,
                    periodEnd: endDate,
                    totalAuditCount: totalAudits,
                    totalItemsAdded: totalAdded,
                    totalItemsDeleted: totalDeleted,
                    totalItemsRestored: totalRestored,
                    totalStockChanged: 0
                }
            })

            return { success: true, message: 'Laporan berhasil disimpan dan dikunci!', report }
        } catch (error) {
            console.error('Error saving periodic report:', error)
            return fail(500, { success: false, message: 'Gagal menyimpan laporan.' })
        }
    }
}