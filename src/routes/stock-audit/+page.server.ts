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

  // Menjalankan query paralel dengan properti yang sudah diperbarui
  const [user, recentAuditsRaw, auditCounts] = await Promise.all([
    db.user.findUnique({
      where: { id: session.id },
      select: { id: true, name: true, role: true }
    }),

    db.stockAudit.findMany({
      where: { auditorId: session.id },
      select: {
        id: true,
        status: true,
        createdAt: true,
        completedAt: true,
        totalItems: true, // <--- SUDAH DIPERBAIKI (Sesuai Skema DB)
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
      take: 5
    }),

    db.stockAudit.groupBy({
      by: ['status'],
      where: { auditorId: session.id },
      _count: { _all: true }
    })
  ]);

  let total = 0;
  let draft = 0;
  let completed = 0;

  for (const group of auditCounts) {
    const count = group._count._all;
    total += count;
    if (group.status === 'DRAFT') draft = count;
    if (group.status === 'COMPLETED') completed = count;
  }

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Format pemetaan data untuk Frontend komponen Svelte
  const formattedAudits = recentAuditsRaw.map(audit => ({
    id: audit.id,
    status: audit.status,
    createdAt: audit.createdAt,
    completedAt: audit.completedAt,
    totalCards: audit.totalItems, // <--- Dipetakan ke 'totalCards' agar UI frontend Anda tidak perlu diubah!
    totalMatch: audit.totalMatch,
    totalMismatch: audit.totalMismatch,
    totalMissing: audit.totalMissing,
    totalNewEntry: audit.totalNewEntry,
    cabinetName: audit.section?.cabinet?.name || '-',
    sectionName: audit.section?.name || '-'
  }));

  return {
    stats: { total, draft, completed, completionRate },
    user: user ? { name: user.name, role: user.role } : null,
    recentAudits: formattedAudits
  };
};