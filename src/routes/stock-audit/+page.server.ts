import { db } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const session = locals.session;
  
  if (!session) {
    return {
      stats: { total: 0, draft: 0, completed: 0, completionRate: 0 },
      user: null,
      recentAudits: []
    };
  }

  // Ambil user berdasarkan session
  const user = await db.user.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, role: true }
  });

  // Ambil semua audit milik user ini
  const audits = await db.stockAudit.findMany({
    where: { auditorId: session.id },
    select: {
      id: true,
      status: true,
      createdAt: true,
      completedAt: true,
      totalCards: true,
      totalMatch: true,
      totalMismatch: true,
      totalMissing: true,
      totalNewEntry: true,
      section: {
        select: {
          name: true,
          cabinet: {
            select: { name: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 5 // hanya 5 audit terbaru
  });

  // Hitung statistik
  const total = audits.length;
  const draft = audits.filter(a => a.status === 'DRAFT').length;
  const completed = audits.filter(a => a.status === 'COMPLETED').length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Format audit untuk frontend
  const formattedAudits = audits.map(audit => ({
    id: audit.id,
    status: audit.status,
    createdAt: audit.createdAt,
    completedAt: audit.completedAt,
    totalCards: audit.totalCards,
    totalMatch: audit.totalMatch,
    totalMismatch: audit.totalMismatch,
    totalMissing: audit.totalMissing,
    totalNewEntry: audit.totalNewEntry,
    cabinetName: audit.section?.cabinet?.name || '-',
    sectionName: audit.section?.name || '-'
  }));

  return {
    stats: {
      total,
      draft,
      completed,
      completionRate
    },
    user: user ? { name: user.name, role: user.role } : null,
    recentAudits: formattedAudits
  };
};