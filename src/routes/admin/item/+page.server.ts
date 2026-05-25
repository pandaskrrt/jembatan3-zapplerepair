import { db } from '$lib/server/db';
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ depends }) => {
    // Register dependency key untuk invalidate
    depends('admin:data');

    try {
        // 1. FIX: Hanya ambil Cabinet, Sections, dan Items yang BELUM di-soft-delete (deletedAt: null)
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
                                deletedAt: null // ← FIX: Filter item aktif saja di dalam kabinet
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

        // 2. FIX: Ambil items aktif saja untuk flat view dan search
        const items = await db.item.findMany({
            where: {
                deletedAt: null // ← FIX: Jangan tampilkan item terhapus di view utama admin
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

        // 3. FIX: Ambil sections yang aktif saja untuk filter
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

        return {
            cabinets,
            items,
            sections
        };
    } catch (error) {
        console.error('Load items error:', error);
        return {
            cabinets: [],
            items: [],
            sections: []
        };
    }
};

export const actions: Actions = {
    delete: async ({ request, locals }) => {
        const formData = await request.formData();
        const id = Number(formData.get('id'));
        const reason = formData.get('reason')?.toString() || 'Dihapus oleh Admin melalui manajemen item';

        if (isNaN(id)) {
            return fail(400, { success: false, message: 'Invalid item ID' });
        }

        // Ambil ID admin pelaksana dari session locals
        const currentUserId = locals.session?.id?.toString() || 'ADMIN_SYSTEM';

        try {
            // Ambil detail lengkap Item beserta lokasi fisik rak asalnya sebelum di-soft-delete
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

            // ⚠️ CATATAN: File gambar JANGAN didelete di sini agar saat di-restore oleh Super Admin, 
            // gambar barang tidak hilang/rusak. Gambar baru benar-benar dihapus jika dilakukan Hard Delete permanen.

            // JALANKAN ATOMIC TRANSACTION (Soft-Delete & Tulis Log Aktivitas sekaligus)
            await db.$transaction([
                // A. Lakukan SOFT-DELETE pada item dengan mengisi field deletedAt & data lokasi asal
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

                // B. TULIS LOG KE `itemHistory`: Menggunakan field triggeredBy sesuai skema Anda
                db.itemHistory.create({
                    data: {
                        itemId: id,
                        action: 'SOFT_DELETED', // Sesuai dengan Enum ItemHistoryAction di schema.prisma
                        note: reason,
                        triggeredBy: currentUserId // ← FIX: Langsung isi field String triggeredBy Anda
                    }
                }),

                // C. TULIS LOG KE `cabinetLog`: Menggunakan field performedById sesuai skema Anda
                db.cabinetLog.create({
                    data: {
                        action: 'ITEM_REMOVED', // Sesuai dengan Enum CabinetLogAction di schema.prisma
                        cabinetId: itemBeforeDelete.section?.cabinetId ?? null,
                        cabinetName: itemBeforeDelete.section?.cabinet?.name || '-',
                        sectionId: itemBeforeDelete.sectionId,
                        sectionName: itemBeforeDelete.section?.name || '-',
                        itemId: itemBeforeDelete.id,
                        itemName: itemBeforeDelete.name,
                        note: `Barang "${itemBeforeDelete.name}" dipindahkan ke tempat sampah. Alasan: ${reason}`,
                        performedById: currentUserId // ← FIX: Langsung isi field String performedById Anda
                    }
                })
            ]);

            return { success: true, message: 'Item berhasil dipindahkan ke tempat sampah!' };

        } catch (error) {
            console.error('Delete error:', error);
            return fail(500, { success: false, message: (error as Error).message || 'Failed to soft delete item' });
        }
    }
};