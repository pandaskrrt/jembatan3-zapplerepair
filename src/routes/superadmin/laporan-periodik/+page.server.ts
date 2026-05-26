import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';

function calculateWeekRange(y: number, m: number, w: number) {
    const startDay = (w - 1) * 7 + 1;
    const endDay = w * 7;
    const startDate = new Date(y, m - 1, startDay, 0, 0, 0, 0);
    let endDate = new Date(y, m - 1, endDay, 23, 59, 59, 999);
    const lastDayOfMonth = new Date(y, m, 0).getDate();
    if (endDay > lastDayOfMonth || w === 4) {
        endDate = new Date(y, m - 1, lastDayOfMonth, 23, 59, 59, 999);
    }
    return { startDate, endDate };
}

export const load: PageServerLoad = async ({ url }) => {
    const now = new Date();
    const month = parseInt(url.searchParams.get('month') || String(now.getMonth() + 1));
    const year = parseInt(url.searchParams.get('year') || String(now.getFullYear()));
    const weekOfMonth = parseInt(url.searchParams.get('week') || '1');

    const weeksInMonth = [1, 2, 3, 4].map(w => calculateWeekRange(year, month, w));
    const currentRange = weeksInMonth[weekOfMonth - 1];

    const auditsInPeriodRaw = await db.stockAudit.findMany({
        where: { createdAt: { gte: currentRange.startDate, lte: currentRange.endDate } },
        include: { section: { include: { cabinet: true } }, auditor: true },
        orderBy: { createdAt: 'desc' }
    });

    const itemLogsRaw = await db.itemHistory.findMany({
        where: { createdAt: { gte: currentRange.startDate, lte: currentRange.endDate } },
        include: { user: true, item: { include: { price: true, costPrice: true } } },
        orderBy: { createdAt: 'desc' }
    });

    // FILTER YANG DIUPDATE: Menampung CREATED, STOCK_UPDATED, dan RESTORED
    const itemsAdded = itemLogsRaw
        .filter(log => ['CREATED', 'STOCK_UPDATED', 'RESTORED'].includes(log.action))
        .map(log => ({
            id: log.id,
            createdAt: log.createdAt.toISOString(),
            action: log.action,
            item: {
                name: log.item?.name || 'Item Hilang',
                serialNumber: log.item?.serialNumber || null,
                category: log.item?.category || '-',
                location: log.item?.location || '-',
                costPrice: { amount: log.item?.costPrice?.amount || 0 },
                price: { amount: log.item?.price?.amount || 0 }
            },
            user: { name: log.user?.name || 'Staff', role: log.user?.role || '' }
        }));

    const itemsDeleted = itemLogsRaw
        .filter(log => log.action === 'SOFT_DELETED')
        .map(log => ({
            id: log.id,
            createdAt: log.createdAt.toISOString(),
            action: log.action,
            item: {
                name: log.item?.name || 'Item Hilang',
                deletedFromSectionName: log.item?.deletedFromSectionName || '-',
                deletedFromCabinetName: log.item?.deletedFromCabinetName || '-',
                deleteReason: log.note || log.item?.deleteReason || 'Tanpa keterangan'
            },
            user: { name: log.user?.name || 'Staff' }
        }));

    // RESTORED sudah masuk ke itemsAdded, jadi kita bisa kosongkan atau biarkan
    const itemsRestored = itemLogsRaw
        .filter(log => log.action === 'RESTORED')
        .map(log => ({
            id: log.id,
            createdAt: log.createdAt.toISOString(),
            action: log.action,
            item: { 
                name: log.item?.name || 'Item Berhasil Pulih', 
                location: log.item?.location || 'Lokasi Default' 
            },
            note: log.note || 'Stok dikembalikan ke posisi semula',
            user: { name: log.user?.name || 'Admin' }
        }));

    const cabinetLogsRaw = await db.cabinetLog.findMany({
        where: { createdAt: { gte: currentRange.startDate, lte: currentRange.endDate } },
        include: { performedBy: true },
        orderBy: { createdAt: 'desc' }
    });

    const cabinetLogs = cabinetLogsRaw.map(log => ({
        id: log.id,
        createdAt: log.createdAt.toISOString(),
        action: log.action,
        cabinetName: log.cabinetName,
        sectionName: log.sectionName,
        itemName: log.itemName,
        note: log.note,
        onBehalfOf: log.onBehalfOf,
        performedBy: { name: log.performedBy?.name || 'Staff', role: log.performedBy?.role || '' }
    }));

    const savedReport = await db.periodicReport.findUnique({
        where: { month_year_weekOfMonth: { month, year, weekOfMonth } }
    }).catch(() => null);

    let hasNewData = false;
    if (savedReport && savedReport.status === 'COMPLETED' && savedReport.updatedAt) {
        const bufferTime = new Date(savedReport.updatedAt.getTime() + 5000);
        const newDataCount = await db.itemHistory.count({
            where: { createdAt: { gte: bufferTime, lte: currentRange.endDate } }
        });
        if (newDataCount > 0) hasNewData = true;
    }

    return {
        period: { month, year, weekOfMonth },
        weeksInMonth: weeksInMonth.map(w => ({ startDate: w.startDate.toISOString(), endDate: w.endDate.toISOString() })),
        summary: {
            totalAudits: auditsInPeriodRaw.length,
            totalItemsAdded: itemsAdded.length,
            totalItemsDeleted: itemsDeleted.length,
            totalItemsRestored: itemsRestored.length
        },
        auditsInPeriod: auditsInPeriodRaw.map(audit => ({
            id: audit.id,
            createdAt: audit.createdAt.toISOString(),
            status: audit.status,
            section: { name: audit.section?.name || 'Section Terhapus', cabinet: audit.section?.cabinet ? { name: audit.section.cabinet.name } : null },
            auditor: { name: audit.auditor?.name || 'Sistem' }
        })),
        itemsAdded,
        itemsDeleted,
        itemsRestored,
        cabinetLogs,
        savedReport: savedReport ? { status: savedReport.status, notes: savedReport.notes } : null,
        hasNewData
    };
};

export const actions: Actions = {
    saveReport: async ({ request }) => {
        const formData = await request.formData();
        const month = parseInt(formData.get('month')?.toString() || '0');
        const year = parseInt(formData.get('year')?.toString() || '0');
        const weekOfMonth = parseInt(formData.get('weekOfMonth')?.toString() || '0');
        const notes = formData.get('notes')?.toString() || '';

        if (!month || !year || !weekOfMonth) return fail(400, { success: false });

        const ranges = calculateWeekRange(year, month, weekOfMonth);
        try {
            const existingReport = await db.periodicReport.findUnique({
                where: { month_year_weekOfMonth: { month, year, weekOfMonth } }
            });

            if (existingReport) {
                await db.periodicReport.update({
                    where: { month_year_weekOfMonth: { month, year, weekOfMonth } },
                    data: { status: 'COMPLETED', notes, periodStart: ranges.startDate, periodEnd: ranges.endDate, updatedAt: new Date() }
                });
            } else {
                await db.periodicReport.create({
                    data: { month, year, weekOfMonth, status: 'COMPLETED', notes, periodStart: ranges.startDate, periodEnd: ranges.endDate, createdById: "SYSTEM" }
                });
            }
            return { success: true };
        } catch (error) {
            return fail(500, { success: false });
        }
    },

    unlockReport: async ({ request }) => {
        const formData = await request.formData();
        const month = parseInt(formData.get('month')?.toString() || '0');
        const year = parseInt(formData.get('year')?.toString() || '0');
        const weekOfMonth = parseInt(formData.get('weekOfMonth')?.toString() || '0');

        if (!month || !year || !weekOfMonth) return fail(400, { success: false });

        try {
            await db.periodicReport.update({
                where: { month_year_weekOfMonth: { month, year, weekOfMonth } },
                data: { status: 'DRAFT', updatedAt: new Date() }
            });
            return { success: true };
        } catch (error) {
            return fail(500, { success: false });
        }
    }
};