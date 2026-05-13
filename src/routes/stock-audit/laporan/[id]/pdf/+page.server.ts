import { db } from '$lib/server/db';
import { error, redirect, type PageServerLoad } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
    const auditId = params.id;
    const session = locals.session;

    if (!session) {
        throw redirect(302, '/login');
    }

    const audit = await db.stockAudit.findUnique({
        where: { id: auditId },
        include: {
            section: {
                include: { cabinet: true }
            },
            auditor: { select: { id: true, name: true } },
            report: {
                include: {
                    signatures: {
                        include: {
                            signer: { select: { id: true, name: true, username: true } }
                        },
                        orderBy: { order: 'asc' }
                    }
                }
            },
            items: {
                include: {
                    card: {
                        include: {
                            prices: true
                        }
                    }
                },
                take: 50
            }
        }
    });

    if (!audit) {
        throw error(404, 'Audit tidak ditemukan');
    }

    // Parse responsibleIds
    const responsibleIdsArray = audit.report?.responsibleIds as string[] || [];
    let responsiblePersons = [];
    if (responsibleIdsArray.length > 0) {
        responsiblePersons = await db.user.findMany({
            where: { id: { in: responsibleIdsArray } },
            select: { id: true, name: true, username: true }
        });
    }

    // Hitung ringkasan perubahan
    const mismatches = audit.items.filter(i => i.itemStatus === 'MISMATCH');
    const missing = audit.items.filter(i => i.itemStatus === 'MISSING');
    const newEntries = audit.items.filter(i => i.itemStatus === 'NEW_ENTRY');

    return {
        audit: {
            id: audit.id,
            createdAt: audit.createdAt,
            completedAt: audit.completedAt,
            note: audit.note,
            totalCards: audit.totalCards,
            totalMatch: audit.totalMatch,
            totalMismatch: audit.totalMismatch,
            totalMissing: audit.totalMissing,
            totalNewEntry: audit.totalNewEntry,
            cabinetName: audit.section?.cabinet?.name,
            sectionName: audit.section?.name,
            sectionType: audit.section?.type,
            auditorName: audit.auditor?.name
        },
        report: {
            status: audit.report?.status,
            auditorSignature: audit.report?.auditorSignature,
            auditorSignedAt: audit.report?.auditorSignedAt,
            responsiblePersons,
            signatures: audit.report?.signatures || []
        },
        summary: {
            mismatches: mismatches.map(i => ({
                cardName: i.card?.name,
                systemStock: i.systemStock,
                physicalStock: i.physicalStock,
                note: i.note
            })),
            missing: missing.map(i => ({
                cardName: i.card?.name,
                stock: i.systemStock,
                note: i.note
            })),
            newEntries: newEntries.map(i => ({
                cardName: i.newCardName,
                category: i.newCardCategory,
                subCategory: i.newCardSubCategory,
                priceIDR: i.newCardPriceIDR,
                priceSGD: i.newCardPriceSGD
            }))
        }
    };
};