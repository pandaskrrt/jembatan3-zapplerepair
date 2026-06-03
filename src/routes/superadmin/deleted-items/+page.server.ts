import { db } from '$lib/server/db';
import { fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    try {
        const deletedItemsData = await db.item.findMany({
            where: { deletedAt: { not: null } },
            include: {
                section: { include: { cabinet: true } },
                price: true,
                costPrice: true,
                histories: {
                    include: { user: { select: { name: true } } },
                    orderBy: { createdAt: 'desc' }
                }
            },
            orderBy: { deletedAt: 'desc' }
        });

        const deletedItems = deletedItemsData.map((item) => {
            const deleteLog = item.histories.find((h) =>
                ['SOFT_DELETED', 'SECTION_DELETED', 'CABINET_DELETED'].includes(h.action)
            );

            return {
                id: item.id,
                name: item.name,
                serialNumber: item.serialNumber ?? null,
                category: item.category || 'Umum',
                location: item.location || '-',
                deletedAt: item.deletedAt,
                costPrice: item.costPrice ? { amount: item.costPrice.amount } : null,
                price: item.price ? { amount: item.price.amount } : null,
                deleteReason: item.deleteReason || deleteLog?.note || 'Tanpa alasan spesifik',
                deletedBy: deleteLog?.user?.name || 'Sistem',
                sectionName: item.section?.name || item.deletedFromSectionName || '-',
                cabinetName: item.section?.cabinet?.name || item.deletedFromCabinetName || '-',
                // Tambah info asal untuk pilihan restore
                deletedFromSectionId: item.deletedFromSectionId,
                deletedFromCabinetId: item.deletedFromCabinetId,
                deletedFromSectionName: item.deletedFromSectionName,
                deletedFromCabinetName: item.deletedFromCabinetName
            };
        });

        // Section aktif untuk pilihan tujuan restore
        const activeSections = await db.section.findMany({
            where: { deletedAt: null },
            include: { cabinet: true },
            orderBy: { name: 'asc' }
        });

        return { deletedItems, activeSections };
    } catch (error) {
        console.error('Error loading deleted items:', error);
        return { deletedItems: [], activeSections: [] };
    }
};

export const actions: Actions = {
    restoreItem: async ({ request, locals }) => {
        const formData = await request.formData();
        const id = Number(formData.get('itemId'));
        const restoredToSectionId = formData.get('restoredToSectionId')
            ? Number(formData.get('restoredToSectionId'))
            : undefined;
        const note = formData.get('note')?.toString() ?? undefined;

        if (!id || isNaN(id)) {
            return fail(400, { success: false, message: 'ID Item tidak valid!' });
        }

        const currentUserId = locals.session?.id?.toString() || 'SYSTEM_ADMIN';

        try {
            const existingItem = await db.item.findUnique({ where: { id } });

            if (!existingItem || !existingItem.deletedAt) {
                return fail(404, { success: false, message: 'Item tidak ditemukan atau sudah aktif!' });
            }

            // Tentukan section tujuan — pilihan user atau section asal
            const targetSectionId = restoredToSectionId ?? existingItem.deletedFromSectionId ?? null;

            let slotExpandedWarning: string | null = null;

            // ── Validasi section tujuan ──────────────
            if (targetSectionId) {
                const targetSection = await db.section.findUnique({
                    where: { id: targetSectionId },
                    include: {
                        cabinet: {
                            include: {
                                sections: {
                                    where: { deletedAt: null },
                                    include: {
                                        items: { where: { deletedAt: null } }
                                    }
                                }
                            }
                        }
                    }
                });

                if (!targetSection) {
                    return fail(404, { success: false, message: 'Section tujuan tidak ditemukan!' });
                }

                if (targetSection.deletedAt) {
                    return fail(400, {
                        success: false,
                        message: `Section "${targetSection.name}" sudah dihapus. Pilih section lain.`
                    });
                }

                // Cek section terkunci audit
                const now = new Date();
                if (targetSection.lockedUntil && targetSection.lockedUntil > now) {
                    const lockRemaining = Math.ceil(
                        (targetSection.lockedUntil.getTime() - now.getTime()) / (1000 * 60)
                    );
                    return fail(403, {
                        success: false,
                        message: `Section "${targetSection.name}" sedang terkunci proses audit. Terkunci ${lockRemaining} menit lagi.`
                    });
                }

                // Cek kapasitas cabinet — hanya item aktif
                if (targetSection.cabinet) {
                    const cabinet = targetSection.cabinet;
                    const activeItemCount = cabinet.sections.reduce(
                        (sum, s) => sum + s.items.length, 0
                    );

                    if (activeItemCount >= cabinet.maxSlots) {
                        // Auto expand slot
                        const newMaxSlots = cabinet.maxSlots + 1;
                        await db.cabinet.update({
                            where: { id: cabinet.id },
                            data: { maxSlots: newMaxSlots }
                        });
                        slotExpandedWarning =
                            `Slot cabinet "${cabinet.name}" otomatis ditambah ` +
                            `dari ${cabinet.maxSlots} menjadi ${newMaxSlots} karena sudah penuh.`;
                        console.log('[Restore] Slot expanded:', cabinet.name, cabinet.maxSlots, '→', newMaxSlots);
                    }
                }
            }

            const now = new Date();

            // Atomic transaction — restore + semua log sekaligus
            await db.$transaction([
                // A. Restore item
                db.item.update({
                    where: { id },
                    data: {
                        deletedAt: null,
                        deletedBy: null,
                        deleteReason: null,
                        deletedFromSectionId: null,
                        deletedFromCabinetId: null,
                        deletedFromSectionName: null,
                        deletedFromCabinetName: null,
                        sectionId: targetSectionId
                    }
                }),

                // B. Catat RestoreLog
                db.restoreLog.create({
                    data: {
                        itemId: id,
                        restoredById: currentUserId,
                        status: 'APPROVED',
                        restoredToSectionId: targetSectionId,
                        executedAt: now,
                        note: slotExpandedWarning
                            ? `${note ?? ''} | ${slotExpandedWarning}`.trim()
                            : note ?? null
                    }
                }),

                // C. Catat ItemHistory
                db.itemHistory.create({
                    data: {
                        itemId: id,
                        action: 'RESTORED',
                        triggeredBy: currentUserId,
                        note: slotExpandedWarning
                            ? `Item di-restore. ${slotExpandedWarning}`
                            : note ?? 'Item dipulihkan kembali oleh Super Admin.'
                    }
                }),

                // D. Catat CabinetLog
                db.cabinetLog.create({
                    data: {
                        action: 'ITEM_RESTORED',
                        cabinetId: existingItem.deletedFromCabinetId,
                        cabinetName: existingItem.deletedFromCabinetName || '-',
                        sectionId: targetSectionId,
                        sectionName: existingItem.deletedFromSectionName || '-',
                        itemId: existingItem.id,
                        itemName: existingItem.name,
                        note: slotExpandedWarning
                            ? `Item di-restore. ${slotExpandedWarning}`
                            : 'Item dikembalikan ke struktur rak aktif oleh Super Admin.',
                        performedById: currentUserId
                    }
                })
            ]);

            // Kirim warning ke UI kalau slot di-expand
            if (slotExpandedWarning) {
                return {
                    success: true,
                    warning: true,
                    message: `Item "${existingItem.name}" berhasil di-restore! ⚠️ ${slotExpandedWarning}`
                };
            }

            return {
                success: true,
                warning: false,
                message: `Item "${existingItem.name}" berhasil di-restore!`
            };

        } catch (error) {
            console.error('Error restoring item:', error);
            return fail(500, { success: false, message: 'Gagal melakukan pemulihan barang.' });
        }
    }
};