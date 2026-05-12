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
    throw redirect(302, '/stock-audit');
  }

  if (audit.auditorId !== session.id && session.role !== 'ADMIN') {
    throw redirect(302, '/stock-audit');
  }

  const formattedItems = audit.items.map(item => ({
    id: item.id,
    cardId: item.cardId,
    itemStatus: item.itemStatus,
    systemStock: item.systemStock,
    physicalStock: item.physicalStock,
    note: item.note,
    card: item.card ? {
      id: item.card.id,
      name: item.card.name,
      imageUrl: item.card.imageUrl,
      category: item.card.category,
      subCategory: item.card.subCategory,
      prices: item.card.prices
    } : null
  }));

  return {
    audit: {
      id: audit.id,
      status: audit.status,
      sectionName: audit.section?.name,
      cabinetName: audit.section?.cabinet?.name
    },
    items: formattedItems
  };
};