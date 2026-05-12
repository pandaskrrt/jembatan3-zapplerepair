import { db } from '$lib/server/db';
import { redirect, error, type PageServerLoad } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
  const sectionId = Number(params.sectionId);
  const session = locals.session;

  if (!session) {
    throw redirect(302, '/login');
  }

  const section = await db.section.findUnique({
    where: { id: sectionId },
    include: {
      cabinet: true,
      cards: {
        include: {
          prices: {
            where: { isActive: true }
          }
        },
        orderBy: { name: 'asc' }
      },
      audits: {
        orderBy: { createdAt: 'desc' },
        include: {
          auditor: {
            select: { name: true, username: true }
          }
        }
      }
    }
  });

  if (!section) {
    throw error(404, 'Section tidak ditemukan');
  }

  // Hitung statistik audit
  const completedAudits = section.audits.filter(a => a.status === 'COMPLETED');
  const draftAudits = section.audits.filter(a => a.status === 'DRAFT');

  let totalMatch = 0;
  let totalMismatch = 0;
  let totalMissing = 0;
  let totalNewEntry = 0;

  completedAudits.forEach(audit => {
    totalMatch += audit.totalMatch || 0;
    totalMismatch += audit.totalMismatch || 0;
    totalMissing += audit.totalMissing || 0;
    totalNewEntry += audit.totalNewEntry || 0;
  });

  const stats = {
    totalCards: section.cards.length,
    totalAudits: completedAudits.length,
    draftAudits: draftAudits.length,
    totalMatch,
    totalMismatch,
    totalMissing,
    totalNewEntry,
    lastAudit: completedAudits[0]?.createdAt || null,
    lastAuditor: completedAudits[0]?.auditor?.name || null,
    accuracyRate: section.cards.length 
      ? Math.round((totalMatch / (section.cards.length * completedAudits.length || 1)) * 100)
      : 0
  };

  return {
    section: {
      id: section.id,
      name: section.name,
      type: section.type,
      cabinetName: section.cabinet?.name,
      cabinetId: section.cabinet?.id,
      ...stats
    },
    cards: section.cards.map(card => ({
      id: card.id,
      name: card.name,
      imageUrl: card.imageUrl,
      category: card.category,
      subCategory: card.subCategory,
      stock: card.stock,
      location: card.location,
      prices: card.prices
    })),
    audits: section.audits.map(audit => ({
      id: audit.id,
      status: audit.status,
      createdAt: audit.createdAt,
      completedAt: audit.completedAt,
      totalCards: audit.totalCards,
      totalMatch: audit.totalMatch,
      totalMismatch: audit.totalMismatch,
      totalMissing: audit.totalMissing,
      totalNewEntry: audit.totalNewEntry,
      note: audit.note,
      auditorName: audit.auditor?.name
    }))
  };
};