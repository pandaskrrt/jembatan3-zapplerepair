import { db } from '$lib/server/db'
import type { Section } from '../../../../generated/prisma/client'
import { fail, type Actions, error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
    const session = locals.session;
    
    if (!session) {
        throw error(401, 'Unauthorized');
    }

    const now = new Date();

    try {
        // 1. Ambil sections yang aktif (belum di-soft-delete) dengan informasi lock
        const sections = await db.section.findMany({
            where: {
                deletedAt: null,
                cabinet: {
                    deletedAt: null
                }
            },
            include: {
                cabinet: true,
                items: {
                    select: { id: true }
                },
                audits: {
                    where: {
                        status: 'DRAFT'
                    },
                    select: {
                        id: true,
                        status: true,
                        createdAt: true,
                        auditor: {
                            select: { id: true, name: true, username: true }
                        }
                    },
                    take: 1,
                    orderBy: { createdAt: 'desc' }
                }
            },
            orderBy: {
                name: 'asc'
            }
        })

        // 2. Format sections dengan status lock
        const formattedSections = sections.map(section => {
            const isLocked = section.lockedUntil && section.lockedUntil > now;
            const lockRemaining = section.lockedUntil 
                ? Math.ceil((section.lockedUntil.getTime() - now.getTime()) / (1000 * 60))
                : 0;
            
            // Cari audit aktif yang mengunci section ini
            const activeAudit = section.audits[0];
            const isLockedByCurrentUser = activeAudit?.auditorId === session.id;
            
            return {
                id: section.id,
                name: section.name,
                type: section.type,
                cabinetId: section.cabinetId,
                cabinetName: section.cabinet?.name,
                itemCount: section.items.length,
                createdAt: section.createdAt,
                updatedAt: section.updatedAt,
                deletedAt: section.deletedAt,
                deletedBy: section.deletedBy,
                deleteNote: section.deleteNote,
                // Lock info
                isLocked,
                lockRemaining,
                lockRemainingHours: Math.floor(lockRemaining / 60),
                lockRemainingMinutes: lockRemaining % 60,
                lockedUntil: section.lockedUntil,
                lockedByAuditId: section.lockedByAuditId,
                // Active audit info
                hasActiveAudit: !!activeAudit,
                activeAuditId: activeAudit?.id,
                activeAuditorId: activeAudit?.auditor?.id,
                activeAuditorName: activeAudit?.auditor?.name,
                isLockedByCurrentUser
            };
        });

        // 3. Hitung statistik
        const stats = {
            totalSections: formattedSections.length,
            lockedSections: formattedSections.filter(s => s.isLocked).length,
            types: [...new Set(formattedSections.map(s => s.type))].length,
            cabinets: [...new Set(formattedSections.map(s => s.cabinetId))].filter(Boolean).length
        };

        // 4. Ambil cabinets aktif untuk dropdown
        const cabinets = await db.cabinet.findMany({
            where: {
                deletedAt: null
            },
            orderBy: {
                name: 'asc'
            }
        });

        return { 
            sections: formattedSections,
            cabinets,
            stats,
            userRole: session.role,
            userId: session.id,
            userName: session.name
        };
        
    } catch (err) {
        console.error('Load sections error:', err);
        return { 
            sections: [],
            cabinets: [],
            stats: { totalSections: 0, lockedSections: 0, types: 0, cabinets: 0 },
            userRole: session.role,
            userId: session.id,
            userName: session.name
        };
    }
}

export const actions: Actions = {
    delete: async ({ request, locals }) => {
        const session = locals.session;
        
        if (!session) {
            return fail(401, { success: false, message: 'Unauthorized' });
        }

        const formData = await request.formData();
        const id = Number(formData.get('id'));
        const reason = formData.get('reason')?.toString() || 'Rak (Section) dihapus oleh Admin';

        if (isNaN(id)) {
            return fail(400, { success: false, message: 'Invalid section ID' });
        }

        const currentUserId = session.id?.toString() || 'ADMIN_SYSTEM';

        try {
            // Ambil data Section sebelum di-delete
            const sectionBeforeDelete = await db.section.findUnique({
                where: { id },
                include: {
                    cabinet: true,
                    items: {
                        where: { deletedAt: null }
                    }
                }
            });

            if (!sectionBeforeDelete) {
                return fail(404, { success: false, message: 'Section tidak ditemukan!' });
            }

            if (sectionBeforeDelete.deletedAt) {
                return fail(400, { success: false, message: 'Section ini sudah berada di tempat sampah.' });
            }

            // ========== CEK LOCK SECTION ==========
            const now = new Date();
            const isLocked = sectionBeforeDelete.lockedUntil && sectionBeforeDelete.lockedUntil > now;
            
            // Jika section sedang terkunci, admin tidak bisa menghapus
            if (isLocked && session.role !== 'SUPER_ADMIN') {
                const lockRemaining = Math.ceil((sectionBeforeDelete.lockedUntil!.getTime() - now.getTime()) / (1000 * 60));
                return fail(403, { 
                    success: false, 
                    message: `Section sedang dalam proses audit! Terkunci selama ${lockRemaining} menit lagi. Tidak dapat dihapus.`,
                    code: 'SECTION_LOCKED'
                });
            }

            const impactedItems = sectionBeforeDelete.items;

            // JALANKAN ATOMIC TRANSACTION
            await db.$transaction([
                // A. Ubah status Section menjadi soft-deleted
                db.section.update({
                    where: { id },
                    data: {
                        deletedAt: new Date(),
                        deletedBy: currentUserId,
                        deleteNote: reason,
                        // Hapus lock info saat section dihapus
                        lockedUntil: null,
                        lockedByAuditId: null
                    }
                }),

                // B. Soft-delete seluruh item di dalam section ini
                db.item.updateMany({
                    where: { sectionId: id },
                    data: {
                        deletedAt: new Date(),
                        deletedBy: currentUserId,
                        deleteReason: `Otomatis terhapus karena Rak (Section) "${sectionBeforeDelete.name}" dihapus.`,
                        deletedFromSectionId: sectionBeforeDelete.id,
                        deletedFromCabinetId: sectionBeforeDelete.cabinetId,
                        deletedFromSectionName: sectionBeforeDelete.name,
                        deletedFromCabinetName: sectionBeforeDelete.cabinet?.name || '-'
                    }
                }),

                // C. TULIS LOG KE cabinetLog
                db.cabinetLog.create({
                    data: {
                        action: 'SECTION_DELETED',
                        cabinetId: sectionBeforeDelete.cabinetId,
                        cabinetName: sectionBeforeDelete.cabinet?.name || '-',
                        sectionId: sectionBeforeDelete.id,
                        sectionName: sectionBeforeDelete.name,
                        itemName: '-',
                        note: `Rak "${sectionBeforeDelete.name}" (Kabinet: ${sectionBeforeDelete.cabinet?.name || '-'}) beserta sejumlah ${impactedItems.length} item di dalamnya dipindahkan ke tempat sampah. Alasan: ${reason}`,
                        performedById: currentUserId
                    }
                }),

                // D. TULIS LOG KE itemHistory untuk setiap item terdampak
                ...(impactedItems.map(item => 
                    db.itemHistory.create({
                        data: {
                            itemId: item.id,
                            action: 'SECTION_DELETED',
                            note: `Item otomatis ter-soft-delete akibat penghapusan struktur rak asal "${sectionBeforeDelete.name}". Alasan: ${reason}`,
                            triggeredBy: currentUserId
                        }
                    })
                ))
            ]);

            return { 
                success: true, 
                message: `Rak "${sectionBeforeDelete.name}" beserta seluruh item di dalamnya berhasil dipindahkan ke tempat sampah.` 
            };

        } catch (err) {
            console.error('Delete section error:', err);
            return fail(500, { 
                success: false, 
                message: (err as Error).message || 'Gagal memproses penghapusan rak ke database.' 
            });
        }
    }
};