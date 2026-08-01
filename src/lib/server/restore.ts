import { db } from '$lib/server/db';

/**
 * Restore item yang sudah di-soft-delete
 * Hanya bisa dipanggil oleh SUPER_ADMIN (sudah diproteksi di hooks.server.ts)
 */
export async function restoreItem({
    itemId,
    restoredById,
    restoredToSectionId,
    note
}: {
    itemId: number;
    restoredById: string;
    restoredToSectionId?: number;
    note?: string;
}) {
    // Ambil detail item yang mau di-restore
    const item = await db.item.findUnique({ where: { id: itemId } });

    if (!item) throw new Error('Item tidak ditemukan');
    if (!item.deletedAt) throw new Error('Item ini tidak dalam status terhapus');

    // Tentukan section tujuan — pilihan user atau section asal
    const targetSectionId = restoredToSectionId ?? item.deletedFromSectionId ?? null;

    let slotExpandedWarning: string | null = null;

    // Validasi section tujuan
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

        if (!targetSection) throw new Error('Section tujuan tidak ditemukan');
        if (targetSection.deletedAt) {
            throw new Error(
                `Section "${targetSection.name}" sudah dihapus. Pilih section lain untuk restore.`
            );
        }

        // Cek apakah section sedang terkunci (audit sedang berjalan)
        const now = new Date();
        if (targetSection.lockedUntil && targetSection.lockedUntil > now) {
            const lockRemaining = Math.ceil(
                (targetSection.lockedUntil.getTime() - now.getTime()) / (1000 * 60)
            );
            throw new Error(
                `Section "${targetSection.name}" sedang terkunci karena proses audit. ` +
                `Terkunci selama ${lockRemaining} menit lagi.`
            );
        }

        // Cek kapasitas cabinet — hanya hitung item aktif
        if (targetSection.cabinet) {
            const cabinet = targetSection.cabinet;
            const activeItemCount = cabinet.sections.reduce(
                (sum, s) => sum + s.items.length, 0
            );

            if (activeItemCount >= cabinet.maxSlots) {
                // Auto expand slot + catat warning
                const newMaxSlots = cabinet.maxSlots + 1;
                await db.cabinet.update({
                    where: { id: cabinet.id },
                    data: { maxSlots: newMaxSlots }
                });
                slotExpandedWarning =
                    `Slot cabinet "${cabinet.name}" otomatis ditambah ` +
                    `dari ${cabinet.maxSlots} menjadi ${newMaxSlots} karena sudah penuh.`;
                console.log('[Restore] Cabinet slot expanded:', cabinet.name, cabinet.maxSlots, '→', newMaxSlots);
            }
        }
    }

    const now = new Date();

    // Jalankan restore dalam satu transaction
    await db.$transaction([
        // A. Restore item — bersihkan semua soft-delete field
        db.item.update({
            where: { id: itemId },
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

        // B. Catat di RestoreLog
        db.restoreLog.create({
            data: {
                itemId,
                restoredById,
                status: 'APPROVED',
                restoredToSectionId: targetSectionId,
                executedAt: now,
                note: slotExpandedWarning
                    ? `${note ?? ''} | ${slotExpandedWarning}`.trim()
                    : note ?? null
            }
        }),

        // C. Catat di ItemHistory
        db.itemHistory.create({
            data: {
                itemId,
                action: 'RESTORED',
                triggeredBy: restoredById,
                note: slotExpandedWarning
                    ? `Item di-restore. ${slotExpandedWarning}`
                    : note ?? 'Item di-restore oleh Super Admin'
            }
        }),

        // D. Catat di CabinetLog
        db.cabinetLog.create({
            data: {
                action: 'ITEM_RESTORED',
                performedById: restoredById,
                itemId: item.id,
                itemName: item.name,
                note: slotExpandedWarning
                    ? `Item di-restore. ${slotExpandedWarning}`
                    : note ?? 'Item di-restore oleh Super Admin'
            }
        })
    ]);

    return { slotExpandedWarning };
}