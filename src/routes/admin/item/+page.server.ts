import { db } from '$lib/server/db';
import type { PageServerLoad, Actions } from './$types';
import { fail, error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ depends, locals }) => {
    // Register dependency key untuk invalidate
    depends('admin:data');
    
    const session = locals.session;
    
    if (!session) {
        throw error(401, 'Unauthorized');
    }

    const now = new Date();

    try {
        // 1. Ambil Cabinet, Sections, dan Items yang BELUM di-soft-delete (deletedAt: null)
        const cabinets = await db.cabinet.findMany({
            where: {
                deletedAt: null
            },
            include: {
                sections: {
                    where: {
                        deletedAt: null
                    },
                    include: {
                        items: {
                            where: { 
                                deletedAt: null
                            },
                            include: {
                                price: true,      
                                costPrice: true   
                            }
                        },
                        _count: {
                            select: { 
                                items: { where: { deletedAt: null } } 
                            }
                        }
                    }
                },
                _count: {
                    select: { 
                        sections: { where: { deletedAt: null } } 
                    }
                }
            },
            orderBy: {
                id: 'asc'
            }
        });

        // 2. Ambil items aktif saja untuk flat view dan search, SERTAKAN INFORMASI LOCK
        const items = await db.item.findMany({
            where: {
                deletedAt: null
            },
            include: {
                section: {
                    include: {
                        cabinet: true
                    }
                },
                price: true,      
                costPrice: true
            },
            orderBy: {
                id: 'desc'
            }
        });

        // 3. Format items dengan informasi lock dari section
        const formattedItems = items.map(item => {
            const section = item.section;
            const isSectionLocked = section?.lockedUntil && section.lockedUntil > now;
            const lockRemaining = section?.lockedUntil 
                ? Math.ceil((section.lockedUntil.getTime() - now.getTime()) / (1000 * 60))
                : 0;
            
            // Cari audit aktif yang mengunci section ini
            let activeAudit = null;
            if (section?.lockedByAuditId) {
                // Bisa fetch active audit jika perlu, atau dari data yang sudah ada
                activeAudit = {
                    id: section.lockedByAuditId
                };
            }

            return {
                id: item.id,
                name: item.name,
                stock: item.stock,
                location: item.location,
                category: item.category,
                subCategory: item.subCategory,
                serialNumber: item.serialNumber,
                videoUrl: item.videoUrl,
                imageUrl: item.imageUrl,
                qrCustomUrl: item.qrCustomUrl,
                sectionId: item.sectionId,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
                deletedAt: item.deletedAt,
                deletedBy: item.deletedBy,
                deleteReason: item.deleteReason,
                price: item.price,
                costPrice: item.costPrice,
                section: item.section ? {
                    id: item.section.id,
                    name: item.section.name,
                    type: item.section.type,
                    cabinetId: item.section.cabinetId,
                    cabinet: item.section.cabinet,
                    // Lock info dari section
                    isLocked: isSectionLocked,
                    lockRemaining,
                    lockRemainingHours: Math.floor(lockRemaining / 60),
                    lockRemainingMinutes: lockRemaining % 60,
                    lockedUntil: section?.lockedUntil,
                    lockedByAuditId: section?.lockedByAuditId,
                    activeAuditId: activeAudit?.id
                } : null
            };
        });

        // 4. Ambil sections yang aktif saja untuk filter, SERTAKAN INFORMASI LOCK
        const sections = await db.section.findMany({
            where: {
                deletedAt: null
            },
            include: {
                cabinet: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        // 5. Format sections dengan informasi lock
        const formattedSections = sections.map(section => {
            const isLocked = section.lockedUntil && section.lockedUntil > now;
            const lockRemaining = section.lockedUntil 
                ? Math.ceil((section.lockedUntil.getTime() - now.getTime()) / (1000 * 60))
                : 0;
            
            return {
                id: section.id,
                name: section.name,
                type: section.type,
                cabinetId: section.cabinetId,
                cabinetName: section.cabinet?.name,
                isLocked,
                lockRemaining,
                lockRemainingHours: Math.floor(lockRemaining / 60),
                lockRemainingMinutes: lockRemaining % 60,
                lockedUntil: section.lockedUntil,
                lockedByAuditId: section.lockedByAuditId
            };
        });

        // 6. Hitung statistik items
        const stats = {
            totalItems: formattedItems.length,
            lockedSections: formattedSections.filter(s => s.isLocked).length,
            itemsInLockedSections: formattedItems.filter(i => i.section?.isLocked).length,
            categories: [...new Set(formattedItems.map(i => i.category))].length
        };

        return {
            cabinets,
            items: formattedItems,
            sections: formattedSections,
            stats,
            userRole: session.role,
            userId: session.id,
            userName: session.name
        };
        
    } catch (err) {
        console.error('Load items error:', err);
        return {
            cabinets: [],
            items: [],
            sections: [],
            stats: { totalItems: 0, lockedSections: 0, itemsInLockedSections: 0, categories: 0 },
            userRole: session.role,
            userId: session.id,
            userName: session.name
        };
    }
};

export const actions: Actions = {
    delete: async ({ request, locals }) => {
        const session = locals.session;
        
        if (!session) {
            return fail(401, { success: false, message: 'Unauthorized' });
        }

        const formData = await request.formData();
        const id = Number(formData.get('id'));
        const reason = formData.get('reason')?.toString() || 'Dihapus oleh Admin melalui manajemen item';

        if (isNaN(id)) {
            return fail(400, { success: false, message: 'Invalid item ID' });
        }

        const currentUserId = session.id?.toString() || 'ADMIN_SYSTEM';

        try {
            // Ambil detail lengkap Item beserta lokasi fisik rak asalnya
            const itemBeforeDelete = await db.item.findUnique({
                where: { id },
                include: {
                    section: {
                        include: {
                            cabinet: true
                        }
                    }
                }
            });

            if (!itemBeforeDelete) {
                return fail(404, { success: false, message: 'Item not found' });
            }

            if (itemBeforeDelete.deletedAt) {
                return fail(400, { success: false, message: 'Item sudah berada di tempat sampah.' });
            }

            // ========== CEK LOCK SECTION ==========
            const now = new Date();
            const section = await db.section.findUnique({
                where: { id: itemBeforeDelete.sectionId! },
                select: { lockedUntil: true, lockedByAuditId: true }
            });
            
            const isSectionLocked = section?.lockedUntil && section.lockedUntil > now;
            
            // Jika section sedang terkunci, admin tidak bisa menghapus item (kecuali SUPER_ADMIN)
            if (isSectionLocked && session.role !== 'SUPER_ADMIN') {
                const lockRemaining = Math.ceil((section!.lockedUntil!.getTime() - now.getTime()) / (1000 * 60));
                return fail(403, { 
                    success: false, 
                    message: `Item berada di section yang sedang dalam proses audit! Section terkunci selama ${lockRemaining} menit lagi. Tidak dapat dihapus.`,
                    code: 'SECTION_LOCKED'
                });
            }

            // JALANKAN ATOMIC TRANSACTION (Soft-Delete & Tulis Log Aktivitas sekaligus)
            await db.$transaction([
                // A. Lakukan SOFT-DELETE pada item
                db.item.update({
                    where: { id },
                    data: {
                        deletedAt: new Date(),
                        deletedBy: currentUserId,
                        deleteReason: reason,
                        deletedFromSectionId: itemBeforeDelete.sectionId,
                        deletedFromCabinetId: itemBeforeDelete.section?.cabinetId ?? null,
                        deletedFromSectionName: itemBeforeDelete.section?.name || '-',
                        deletedFromCabinetName: itemBeforeDelete.section?.cabinet?.name || '-'
                    }
                }),

                // B. TULIS LOG KE `itemHistory`
                db.itemHistory.create({
                    data: {
                        itemId: id,
                        action: 'SOFT_DELETED',
                        note: reason,
                        triggeredBy: currentUserId
                    }
                }),

                // C. TULIS LOG KE `cabinetLog`
                db.cabinetLog.create({
                    data: {
                        action: 'ITEM_REMOVED',
                        cabinetId: itemBeforeDelete.section?.cabinetId ?? null,
                        cabinetName: itemBeforeDelete.section?.cabinet?.name || '-',
                        sectionId: itemBeforeDelete.sectionId,
                        sectionName: itemBeforeDelete.section?.name || '-',
                        itemId: itemBeforeDelete.id,
                        itemName: itemBeforeDelete.name,
                        note: `Barang "${itemBeforeDelete.name}" dipindahkan ke tempat sampah. Alasan: ${reason}`,
                        performedById: currentUserId
                    }
                })
            ]);

            return { success: true, message: 'Item berhasil dipindahkan ke tempat sampah!' };

        } catch (err) {
            console.error('Delete error:', err);
            return fail(500, { success: false, message: (err as Error).message || 'Failed to soft delete item' });
        }
    }
};