import { db } from '$lib/server/db';
import { redirect, error, type PageServerLoad } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
    const auditId = params.id;
    const session = locals.session;

    if (!session) throw redirect(302, '/login');

    // Ambil audit dengan items (seperti referensi)
    const audit = await db.stockAudit.findUnique({
        where: { id: auditId },
        include: {
            section: {
                include: { cabinet: true }
            },
            auditor: { select: { id: true, name: true } },
            items: {
                include: {
                    item: {
                        include: {
                            price: true,
                            costPrice: true  // Tambahkan costPrice
                        }
                    }
                },
                orderBy: { id: 'asc' }
            },
            report: {
                include: {
                    signatures: {
                        include: {
                            signer: { select: { id: true, name: true, username: true } }
                        },
                        orderBy: { order: 'asc' }
                    }
                }
            }
        }
    });

    if (!audit) throw error(404, 'Audit tidak ditemukan');

    // Proteksi akses
    if (
        audit.auditorId !== session.id &&
        session.role !== 'ADMIN' &&
        session.role !== 'SUPER_ADMIN'
    ) {
        throw error(403, 'Anda tidak memiliki akses ke laporan ini');
    }

    // ** HITUNG STATISTIK DARI audit.items **
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

    // Format items seperti referensi
    const formattedItems = audit.items.map(auditItem => {
        const masterItem = auditItem.item;
        const activePrice = masterItem?.price?.isActive ? masterItem.price : null;
        
        // Format prices array (bisa multiple di masa depan, tapi sekarang single)
        const prices = [];
        if (activePrice) {
            prices.push({
                currency: 'IDR' as const,
                amount: activePrice.amount,
                priceNote: activePrice.priceNote
            });
        }
        
        // Tambahkan cost price jika ada
        const costPrice = masterItem?.costPrice;
        if (costPrice) {
            prices.push({
                currency: 'IDR' as const,
                amount: costPrice.amount,
                priceNote: `Cost Price: ${costPrice.note || 'Harga Modal'}`
            });
        }

        return {
            id: String(auditItem.id),
            cardId: auditItem.itemId ?? 0,
            itemStatus: auditItem.itemStatus as 'MATCH' | 'MISMATCH' | 'MISSING' | 'NEW_ENTRY',
            systemStock: auditItem.systemStock ?? 0,
            physicalStock: auditItem.physicalStock ?? null,
            note: auditItem.note ?? null,
            card: masterItem
                ? {
                    id: masterItem.id,
                    name: masterItem.name,
                    imageUrl: masterItem.imageUrl ?? '',
                    category: masterItem.category,
                    subCategory: masterItem.subCategory,
                    location: masterItem.location ?? '',  // Tambahkan location
                    prices: prices,
                    // Tambahkan data untuk new entries
                    isNewEntry: auditItem.itemStatus === 'NEW_ENTRY',
                    newItemData: auditItem.itemStatus === 'NEW_ENTRY' ? {
                        name: auditItem.newItemName,
                        category: auditItem.newItemCategory,
                        subCategory: auditItem.newItemSubCategory,
                        imageUrl: auditItem.newItemImageUrl,
                        location: auditItem.newItemLocation,
                        priceIDR: auditItem.newItemPriceIDR,
                        costPrice: auditItem.newItemCostPrice
                    } : null
                }
                : {
                    id: 0,
                    name: '(Item dihapus)',
                    imageUrl: '',
                    category: '-',
                    subCategory: '-',
                    location: '',
                    prices: [],
                    isNewEntry: false,
                    newItemData: null
                }
        };
    });

    // Ambil daftar admin untuk penanda tangan
    const availableAdmins = await db.user.findMany({
        where: { 
            role: { in: ['ADMIN', 'SUPER_ADMIN'] }, 
            isActive: true 
        },
        select: { id: true, name: true, username: true, role: true },
        orderBy: { name: 'asc' }
    });

    // Handle report
    let report = audit.report;
    
    if (!report) {
        report = await db.report.create({
            data: {
                auditId: audit.id,
                status: 'DRAFT',
                notes: audit.note ?? null
            },
            include: {
                signatures: {
                    include: {
                        signer: { select: { id: true, name: true, username: true } }
                    },
                    orderBy: { order: 'asc' }
                }
            }
        });
    }

    // Parse responsibleIds
    let responsibleIds: string[] = [];
    if (report.responsibleIds) {
        if (typeof report.responsibleIds === 'string') {
            try {
                responsibleIds = JSON.parse(report.responsibleIds);
            } catch {
                responsibleIds = [];
            }
        } else if (Array.isArray(report.responsibleIds)) {
            responsibleIds = report.responsibleIds as string[];
        }
    }

    // Ambil data responsible persons
    let responsiblePersons: { id: string; name: string; username: string }[] = [];
    if (responsibleIds.length > 0) {
        const users = await db.user.findMany({
            where: { id: { in: responsibleIds } },
            select: { id: true, name: true, username: true }
        });
        
        responsiblePersons = users.sort((a, b) => {
            return responsibleIds.indexOf(a.id) - responsibleIds.indexOf(b.id);
        });
    }

    return {
        audit: {
            id: audit.id,
            auditorId: audit.auditorId,
            sectionId: audit.sectionId,
            createdAt: audit.createdAt,
            completedAt: audit.completedAt,
            note: audit.note ?? '',
            // Gunakan hasil hitungan
            totalCards: audit.items.length,
            totalMatch: totalMatch,
            totalMismatch: totalMismatch,
            totalMissing: totalMissing,
            totalNewEntry: totalNewEntry,
            cabinetName: audit.section?.cabinet?.name ?? '-',
            sectionName: audit.section?.name ?? '-',
            auditorName: audit.auditor?.name ?? '(Tidak diketahui)',
            status: audit.status
        },
        report: {
            id: report.id,
            status: report.status,
            auditorSignature: report.auditorSignature,
            auditorSignedAt: report.auditorSignedAt,
            responsibleIds: responsibleIds,
            responsiblePersons: responsiblePersons,
            responsibleSignedAt1: report.responsibleSignedAt1,
            responsibleSignedAt2: report.responsibleSignedAt2,
            notes: report.notes ?? '',
            createdAt: report.createdAt,
            completedAt: report.completedAt,
            signatures: report.signatures
        },
        availableAdmins,
        items: formattedItems  // Sertakan items untuk kemungkinan penggunaan lain
    };
};