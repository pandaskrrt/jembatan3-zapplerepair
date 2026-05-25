import { db } from '$lib/server/db';
import { fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  try {
    // Ambil item yang di-soft-delete (deletedAt tidak null)
    const deletedItemsData = await db.item.findMany({
      where: {
        deletedAt: {
          not: null
        }
      },
      include: {
        section: {
          include: {
            cabinet: true
          }
        },
        price: true,
        costPrice: true,
        histories: { // ← FIX: pakai 'histories' sesuai schema prisma Anda, bukan 'history'
          include: {
            user: { select: { name: true } }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        deletedAt: 'desc'
      }
    });

    // Transformasi data agar bersih saat dikonsumsi di frontend
    const deletedItems = deletedItemsData.map((item) => {
      // Cari log aktivitas saat item ini dihapus
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
        cabinetName: item.section?.cabinet?.name || item.deletedFromCabinetName || '-'
      };
    });

    return {
      deletedItems
    };
  } catch (error) {
    console.error('Error loading deleted items:', error);
    return {
      deletedItems: []
    };
  }
};

export const actions: Actions = {
  restoreItem: async ({ request, locals }) => {
    const formData = await request.formData();
    const itemId = formData.get('itemId')?.toString();

    if (!itemId) {
      return fail(400, { success: false, message: 'ID Item tidak valid!' });
    }

    // Ambil penanggung jawab dari session locals
    const currentUserId = locals.session?.id?.toString() || 'SYSTEM_ADMIN';

    try {
      const existingItem = await db.item.findUnique({
        where: { id: itemId }
      });

      if (!existingItem || !existingItem.deletedAt) {
        return fail(404, { success: false, message: 'Item tidak ditemukan atau sudah aktif!' });
      }

      // Transaksi atomik: Kembalikan status item & catat mutasi log
      await db.$transaction([
        db.item.update({
          where: { id: itemId },
          data: {
            deletedAt: null,
            deleteReason: null,
            deletedFromSectionName: null,
            deletedFromCabinetName: null
          }
        }),
        db.itemHistory.create({
          data: {
            itemId: itemId,
            userId: currentUserId,
            action: 'RESTORED',
            note: 'Item dipulihkan kembali oleh Super Admin dari tempat sampah.'
          }
        }),
        db.cabinetLog.create({
          data: {
            action: 'ITEM_RESTORED',
            cabinetName: existingItem.deletedFromCabinetName || '-',
            sectionName: existingItem.deletedFromSectionName || '-',
            itemName: existingItem.name,
            note: 'Item dikembalikan ke struktur rak aktif.',
            performedById: currentUserId
          }
        })
      ]);

      return { success: true, message: `Item "${existingItem.name}" berhasil di-restore!` };
    } catch (error) {
      console.error('Error restoring item:', error);
      return fail(500, { success: false, message: 'Gagal melakukan pemulihan barang.' });
    }
  }
};