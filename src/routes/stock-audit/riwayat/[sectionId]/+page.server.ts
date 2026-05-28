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
      items: {
        where: {
          deletedAt: null  // Hanya ambil item yang tidak dihapus
        },
        include: {
          price: {
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

  // Hitung accuracy rate
  const totalPossibleMatches = section.items.length * (completedAudits.length || 1);
  const accuracyRate = totalPossibleMatches > 0 
    ? Math.round((totalMatch / totalPossibleMatches) * 100)
    : 0;

  const stats = {
    totalCards: section.items.length,
    totalAudits: completedAudits.length,
    draftAudits: draftAudits.length,
    totalMatch,
    totalMismatch,
    totalMissing,
    totalNewEntry,
    lastAudit: completedAudits[0]?.createdAt || null,
    lastAuditor: completedAudits[0]?.auditor?.name || null,
    accuracyRate
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
    items: section.items.map(item => ({
      id: item.id,
      name: item.name,
      imageUrl: item.imageUrl,
      category: item.category,
      subCategory: item.subCategory,
      stock: item.stock,
      location: item.location,
      serialNumber: item.serialNumber,
      videoUrl: item.videoUrl,
      qrCustomUrl: item.qrCustomUrl,
      price: item.price ? {
        amount: item.price.amount,
        priceNote: item.price.priceNote,
        currency: 'IDR'
      } : null,
      costPrice: null  // CostPrice terpisah, bisa ditambahkan jika perlu
    })),
    audits: section.audits.map(audit => ({
      id: audit.id,
      status: audit.status,
      createdAt: audit.createdAt,
      completedAt: audit.completedAt,
      totalCards: audit.totalItems ?? 0,
      totalMatch: audit.totalMatch ?? 0,
      totalMismatch: audit.totalMismatch ?? 0,
      totalMissing: audit.totalMissing ?? 0,
      totalNewEntry: audit.totalNewEntry ?? 0,
      note: audit.note,
      auditorName: audit.auditor?.name
    }))
  };
};