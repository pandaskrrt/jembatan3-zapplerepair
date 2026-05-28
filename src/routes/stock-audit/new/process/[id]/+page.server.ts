import { db } from '$lib/server/db';
import { redirect, type PageServerLoad } from '@sveltejs/kit';

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
      items: {
        // Hanya ambil item yang bukan NEW_ENTRY (NEW_ENTRY sudah tersimpan terpisah)
        where: {
          itemStatus: { not: 'NEW_ENTRY' }
        },
        include: {
          item: {
            include: {
              price: true
            }
          }
        },
        orderBy: { id: 'asc' }
      }
    }
  });

  if (!audit) {
    throw redirect(302, '/stock-audit');
  }

  if (audit.auditorId !== session.id && session.role !== 'ADMIN') {
    throw redirect(302, '/stock-audit');
  }

  const formattedItems = audit.items.map(auditItem => {
    const masterItem = auditItem.item;
    const activePrice = masterItem?.price?.isActive ? masterItem.price : null;

    return {
      // Cast ke string karena frontend pakai type AuditItem dengan id: string
      id: String(auditItem.id),
      cardId: auditItem.itemId ?? 0,
      itemStatus: auditItem.itemStatus as 'MATCH' | 'MISMATCH' | 'MISSING',
      systemStock: auditItem.systemStock ?? 0,
      // Biarkan null — frontend butuh null untuk deteksi "belum dicek"
      physicalStock: auditItem.physicalStock ?? null,
      note: auditItem.note ?? null,
      card: masterItem
        ? {
            id: masterItem.id,
            name: masterItem.name,
            imageUrl: masterItem.imageUrl ?? '',
            category: masterItem.category,
            subCategory: masterItem.subCategory,
            // Schema hanya punya 1 price IDR, bungkus ke array sesuai ekspektasi frontend
            prices: activePrice
              ? [
                  {
                    currency: 'IDR' as const,
                    amount: activePrice.amount,
                    priceNote: activePrice.priceNote
                  }
                ]
              : []
          }
        : {
            // Fallback jika item terhapus (deletedAt !== null)
            id: 0,
            name: '(Item dihapus)',
            imageUrl: '',
            category: '-',
            subCategory: '-',
            prices: []
          }
    };
  });

  return {
    audit: {
      id: audit.id,
      status: audit.status,
      note: audit.note ?? '',           // Untuk auditNote di frontend
      sectionName: audit.section?.name ?? '',
      cabinetName: audit.section?.cabinet?.name ?? ''
    },
    items: formattedItems
  };
};