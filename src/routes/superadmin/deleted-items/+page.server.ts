import { db } from '$lib/server/db'
import { fail, type Actions } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
    // 1. Ambil semua item yang statusnya terhapus (soft-delete, deletedAt tidak null)
    const deletedItems = await db.item.findMany({
        where: {
            deletedAt: { not: null }
        },
        include: {
            // Ambil riwayat khusus RESTORED untuk log indikator di UI
            history: {
                where: {
                    action: 'RESTORED'
                },
                orderBy: {
                    createdAt: 'desc'
                }
            },
            // Ambil info section lama tempat item ini berada sebelum dihapus
            section: {
                include: {
                    cabinet: true
                }
            }
        },
        orderBy: {
            deletedAt: 'desc'
        }
    })

    // 2. Ambil semua section/rak aktif sebagai tujuan opsi pemulihan di dropdown frontend
    const activeSections = await db.section.findMany({
        where: {
            deletedAt: null // Memastikan rak/section tujuan belum dihapus
        },
        include: {
            cabinet: true
        },
        orderBy: {
            name: 'asc'
        }
    })

    // Format data agar sesuai dengan struktur properti yang dibaca halaman .svelte Anda
    const formattedDeletedItems = deletedItems.map(item => ({
        id: item.id,
        name: item.name,
        stock: item.stock,
        serialNumber: item.serialNumber,
        category: item.category || 'Umum',
        subCategory: item.subCategory || '-',
        imageUrl: item.imageUrl,
        deletedAt: item.deletedAt,
        deletedBy: item.deletedById || 'Sistem',
        deletedFromSectionName: item.section?.name || 'Gudang Utama',
        deletedFromCabinetName: item.section?.cabinet?.name || null,
        deleteReason: item.deleteReason || 'Tanpa alasan',
        restoreLogs: item.history || []
    }))

    return {
        deletedItems: formattedFormattedDeletedItems,
        activeSections
    }
}

export const actions: Actions = {
    restore: async ({ request, locals }) => {
        const formData = await request.formData()
        const itemId = formData.get('itemId')?.toString()
        const restoredToSectionId = formData.get('restoredToSectionId')?.toString()
        const note = formData.get('note')?.toString() || ''

        if (!itemId || !restoredToSectionId) {
            return fail(400, { success: false, message: 'Item ID dan Rak tujuan wajib diisi!' })
        }

        // Ambil user ID dari locals session (pastikan hooks.server.ts Anda menyuplai data ini)
        const currentUserId = locals.user?.id || 'SYSTEM_ADMIN'

        try {
            // Gunakan Prisma transaction melalui instans `db` Anda
            await db.$transaction(async (tx) => {
                // 1. Ambil data item sebelum di-update untuk keperluan nama log kabinet
                const oldItem = await tx.item.findUnique({
                    where: { id: itemId }
                })

                if (!oldItem) throw new Error('Item tidak ditemukan')

                // 2. Update status item agar kembali aktif di rak yang baru dipilih
                await tx.item.update({
                    where: { id: itemId },
                    data: {
                        sectionId: restoredToSectionId,
                        deletedAt: null,
                        deletedById: null,
                        deleteReason: null
                    }
                })

                // 3. Catat ke ItemHistory (sesuai Enum ItemHistoryAction: RESTORED)
                await tx.itemHistory.create({
                    data: {
                        itemId: itemId,
                        userId: currentUserId,
                        action: 'RESTORED',
                        note: note || 'Item dipulihkan oleh Super Admin'
                    }
                })

                // 4. Catat ke CabinetLog (sesuai Enum CabinetLogAction: ITEM_RESTORED)
                await tx.cabinetLog.create({
                    data: {
                        action: 'ITEM_RESTORED',
                        sectionId: restoredToSectionId,
                        itemId: itemId,
                        itemName: oldItem.name,
                        note: note || 'Item dikembalikan ke struktur rak aktif'
                    }
                })
            })

            return { success: true, message: 'Item berhasil dipulihkan!' }
        } catch (error) {
            console.error(error)
            return fail(500, { success: false, message: 'Gagal memulihkan item dari server.' })
        }
    }
}