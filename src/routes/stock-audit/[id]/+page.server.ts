import { db } from '$lib/server/db';
import { redirect, error, type PageServerLoad } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
  const auditId = params.id;
  const session = locals.session;

  if (!session) {
    throw redirect(302, '/login');
  }

  const audit = await db.stockAudit.findUnique({
    where: { id: auditId },
    include: {
      auditor: {
        select: { id: true, name: true, username: true }
      },
      section: {
        include: { cabinet: true }
      },
      items: {
        include: {
          card: {
            include: {
              prices: {
                where: { isActive: true }
              }
            }
          }
        },
        orderBy: { id: 'asc' }
      }
    }
  });

  if (!audit) {
    throw error(404, 'Audit tidak ditemukan');
  }

  // Cek akses: auditor sendiri atau admin
  if (audit.auditorId !== session.id && session.role !== 'ADMIN') {
    throw error(403, 'Anda tidak memiliki akses ke audit ini');
  }

  // Format data untuk frontend
  const formattedAudit = {
    id: audit.id,
    status: audit.status,
    createdAt: audit.createdAt,
    completedAt: audit.completedAt,
    note: audit.note,
    totalCards: audit.totalCards,
    totalMatch: audit.totalMatch,
    totalMismatch: audit.totalMismatch,
    totalMissing: audit.totalMissing,
    totalNewEntry: audit.totalNewEntry,
    cabinetName: audit.section?.cabinet?.name,
    sectionName: audit.section?.name,
    sectionType: audit.section?.type,
    auditorName: audit.auditor?.name
  };

  const formattedItems = audit.items.map(item => ({
    id: item.id,
    itemStatus: item.itemStatus,
    systemStock: item.systemStock,
    physicalStock: item.physicalStock,
    note: item.note,
    newCardName: item.newCardName,
    newCardCategory: item.newCardCategory,
    newCardSubCategory: item.newCardSubCategory,
    card: item.card ? {
      id: item.card.id,
      name: item.card.name,
      imageUrl: item.card.imageUrl,
      category: item.card.category,
      subCategory: item.card.subCategory,
      prices: item.card.prices
    } : null
  }));

  // Hitung selisih untuk setiap item
  const itemsWithDiff = formattedItems.map(item => {
    let difference = null;
    if (item.systemStock !== null && item.physicalStock !== null) {
      difference = item.physicalStock - item.systemStock;
    }
    return { ...item, difference };
  });

  return {
    audit: formattedAudit,
    items: itemsWithDiff
  };
};