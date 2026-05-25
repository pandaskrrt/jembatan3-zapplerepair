import { db } from '$lib/server/db'
import type { Section } from '../../../../generated/prisma/client'
import { fail, type Actions } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
    try {
        // 1. FIX: Hanya ambil Section yang aktif (belum di-soft-delete) beserta Kabinetnya yang juga aktif
        const sections = await db.section.findMany({
            where: {
                deletedAt: null,
                cabinet: {
                    deletedAt: null // Memastikan kabinet induknya juga tidak terhapus
                }
            },
            include: {
                cabinet: true 
            },
            orderBy: {
                name: 'asc'
            }
        })

        // 2. FIX: Hanya ambil Kabinet aktif untuk kebutuhan pilihan dropdown form tambah/edit rak
        const cabinets = await db.cabinet.findMany({
            where: {
                deletedAt: null
            },
            orderBy: {
                name: 'asc'
            }
        })

        return { 
            sections,
            cabinets 
        }
    } catch (error) {
        console.error('Load sections error:', error)
        return { 
            sections: [] as Section[],
            cabinets: [] 
        }
    }
}

export const actions: Actions = {
    delete: async ({ request, locals }) => {
        const formData = await request.formData()
        const id = Number(formData.get('id'))
        const reason = formData.get('reason')?.toString() || 'Rak (Section) dihapus oleh Admin'

        if (isNaN(id)) {
            return fail(400, { success: false, message: 'Invalid section ID' })
        }

        // Ambil ID admin pelaksana dari session locals aplikasi Anda
        const currentUserId = locals.session?.id?.toString() || 'ADMIN_SYSTEM'

        try {
            // Ambil data Section beserta semua Item aktif di dalamnya sebelum di-delete untuk arsip log lokasi asal
            const sectionBeforeDelete = await db.section.findUnique({
                where: { id },
                include: {
                    cabinet: true,
                    items: {
                        where: { deletedAt: null } // Kumpulkan barang aktif di dalam rak ini saja
                    }
                }
            })

            if (!sectionBeforeDelete) {
                return fail(404, { success: false, message: 'Section tidak ditemukan!' })
            }

            if (sectionBeforeDelete.deletedAt) {
                return fail(400, { success: false, message: 'Section ini sudah berada di tempat sampah.' })
            }

            const impactedItems = sectionBeforeDelete.items

            // JALANKAN ATOMIC TRANSACTION (Semua sukses atau semua batal sekaligus)
            await db.$transaction([
                // A. Ubah status Section menjadi soft-deleted
                db.section.update({
                    where: { id },
                    data: {
                        deletedAt: new Date(),
                        deletedBy: currentUserId,
                        deleteNote: reason
                    }
                }),

                // B. Otomatis soft-delete seluruh barang (Item) yang berada di dalam rak ini
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

                // C. TULIS LOG KE `cabinetLog`: Catat histori mutasi fisik tata letak (Gunakan field performedById)
                db.cabinetLog.create({
                    data: {
                        action: 'SECTION_DELETED', // Sesuai dengan Enum CabinetLogAction Anda
                        cabinetId: sectionBeforeDelete.cabinetId,
                        cabinetName: sectionBeforeDelete.cabinet?.name || '-',
                        sectionId: sectionBeforeDelete.id,
                        sectionName: sectionBeforeDelete.name,
                        itemName: '-',
                        note: `Rak "${sectionBeforeDelete.name}" (Kabinet: ${sectionBeforeDelete.cabinet?.name || '-'}) beserta sejumlah ${impactedItems.length} item di dalamnya dipindahkan ke tempat sampah. Alasan: ${reason}`,
                        performedById: currentUserId // ← FIX: Aman sesuai skema database Anda
                    }
                }),

                // D. TULIS LOG MULTIPLE KE `itemHistory`: Catat sejarah perpindahan barang yang terdampak (Gunakan field triggeredBy)
                ...(impactedItems.map(item => 
                    db.itemHistory.create({
                        data: {
                            itemId: item.id,
                            action: 'SECTION_DELETED', // Sesuai dengan Enum ItemHistoryAction Anda
                            note: `Item otomatis ikut ter-soft-delete akibat penghapusan struktur rak asal "${sectionBeforeDelete.name}". Alasan: ${reason}`,
                            triggeredBy: currentUserId // ← FIX: Aman dari error TypeScript tipe data
                        }
                    })
                ))
            ])

            return { 
                success: true, 
                message: `Rak "${sectionBeforeDelete.name}" beserta seluruh item di dalamnya berhasil dipindahkan ke tempat sampah.` 
            }

        } catch (error) {
            console.error('Delete section error:', error)
            return fail(500, { 
                success: false, 
                message: (error as Error).message || 'Gagal memproses penghapusan rak ke database.' 
            })
        }
    }
}