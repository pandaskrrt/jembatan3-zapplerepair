import { db } from '$lib/server/db'
import type { Cabinet } from '../../../../generated/prisma/client'
import { fail, type Actions } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
    try {
        // Hanya ambil Kabinet yang BELUM dihapus (deletedAt bernilai null)
        const cabinets = await db.cabinet.findMany({
            where: {
                deletedAt: null
            },
            include: {
                sections: {
                    where: { deletedAt: null }, // Hanya section aktif
                    include: {
                        items: {
                            where: { deletedAt: null } // Hanya item aktif di dalam rak
                        }
                    }
                }
            }
        })

        return { cabinets }
    } catch (error) {
        console.error('Error loading active cabinets:', error)
        return { cabinets: [] as Cabinet[] }
    }
}

export const actions: Actions = {
    default: async ({ request, locals }) => {
        const formData = await request.formData()
        const id = Number(formData.get('id'))
        const reason = formData.get('reason')?.toString() || 'Kabinet dihapus oleh Admin'

        if (!id) {
            return fail(400, { success: false, message: 'ID Kabinet tidak valid!' })
        }

        // Ambil ID pelaksana dari session locals aplikasi Anda
        const currentUserId = locals.session?.id?.toString() || 'SYSTEM_ADMIN'

        try {
            // Ambil detail Kabinet beserta seluruh Item aktif di dalamnya sebelum di-delete
            const cabinetBeforeDelete = await db.cabinet.findUnique({
                where: { id },
                include: {
                    sections: {
                        where: { deletedAt: null },
                        include: {
                            items: {
                                where: { deletedAt: null }
                            }
                        }
                    }
                }
            })

            if (!cabinetBeforeDelete) {
                return fail(404, { success: false, message: 'Kabinet tidak ditemukan atau sudah dihapus!' })
            }

            // Kumpulkan semua item aktif yang terdampak di dalam kabinet ini
            const impactedItems = cabinetBeforeDelete.sections.flatMap(sec => sec.items)

            // JALANKAN ATOMIC TRANSACTION (Semua sukses atau gagal sama sekali)
            await db.$transaction([
                // A. Soft-delete data Kabinet utama
                db.cabinet.update({
                    where: { id },
                    data: {
                        deletedAt: new Date(),
                        deletedBy: currentUserId,
                        deleteNote: reason
                    }
                }),

                // B. Otomatis soft-delete seluruh Section di bawah kabinet ini
                db.section.updateMany({
                    where: { cabinetId: id },
                    data: {
                        deletedAt: new Date(),
                        deletedBy: currentUserId,
                        deleteNote: `Mengikuti penghapusan Kabinet: ${cabinetBeforeDelete.name}`
                    }
                }),

                // C. Otomatis soft-delete seluruh Item yang berada di dalam kabinet ini
                db.item.updateMany({
                    where: {
                        section: { cabinetId: id }
                    },
                    data: {
                        deletedAt: new Date(),
                        deletedBy: currentUserId,
                        deleteReason: `Otomatis terhapus karena Kabinet "${cabinetBeforeDelete.name}" dihapus.`,
                        deletedFromCabinetId: cabinetBeforeDelete.id,
                        deletedFromCabinetName: cabinetBeforeDelete.name
                    }
                }),

                // D. TULIS LOG: Catat ke `cabinetLog` menggunakan performedById (Sesuai schema.prisma)
                db.cabinetLog.create({
                    data: {
                        action: 'CABINET_DELETED', 
                        cabinetId: cabinetBeforeDelete.id,
                        cabinetName: cabinetBeforeDelete.name,
                        sectionName: '-',
                        itemName: '-',
                        note: `Kabinet "${cabinetBeforeDelete.name}" beserta ${impactedItems.length} item di dalamnya dipindahkan ke tempat sampah.`,
                        performedById: currentUserId // ← AMAN: Sesuai nama field schema.prisma
                    }
                }),

                // E. TULIS LOG MULTIPLE: Catat ke `itemHistory` menggunakan triggeredBy (Sesuai schema.prisma)
                ...(impactedItems.map(item => 
                    db.itemHistory.create({
                        data: {
                            itemId: item.id,
                            action: 'CABINET_DELETED', 
                            note: `Item terhapus otomatis karena Kabinet "${cabinetBeforeDelete.name}" dibuang. Alasan: ${reason}`,
                            triggeredBy: currentUserId // ← AMAN: Sesuai nama field schema.prisma
                        }
                    })
                ))
            ])

            return { 
                success: true, 
                message: `Kabinet "${cabinetBeforeDelete.name}" beserta seluruh item di dalamnya berhasil dipindahkan ke Tempat Sampah.` 
            }
        } catch (error) {
            console.error('Error during cabinet soft-delete transaction:', error)
            return fail(500, { success: false, message: 'Gagal memproses penghapusan kabinet.' })
        }
    }
}