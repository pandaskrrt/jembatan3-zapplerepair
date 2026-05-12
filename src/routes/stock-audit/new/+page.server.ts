import { db } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  const session = locals.session;
  if (!session) {
    return { cabinets: [], user: null };
  }

  const user = await db.user.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, role: true }
  });

  const cabinets = await db.cabinet.findMany({
    orderBy: { name: 'asc' },
    include: {
      sections: {
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { cards: true }
          },
          audits: {
            where: {
              status: 'DRAFT'
            },
            select: {
              id: true,
              auditorId: true,
              auditor: { select: { name: true } }
            }
          }
        }
      }
    }
  });

  const cabinetsData = cabinets.map(cabinet => ({
    id: cabinet.id,
    name: cabinet.name,
    maxSlots: cabinet.maxSlots,
    sections: cabinet.sections.map(section => {
      const activeDraft = section.audits[0] ?? null;
      const isLockedByOther = activeDraft !== null && activeDraft.auditorId !== session.id;
      const isMyDraft = activeDraft !== null && activeDraft.auditorId === session.id;

      return {
        id: section.id,
        name: section.name,
        type: section.type,
        totalCards: section._count.cards,
        isLockedByOther,
        lockedBy: isLockedByOther ? activeDraft?.auditor.name : null,
        isMyDraft,
        myDraftId: isMyDraft ? activeDraft?.id : null
      };
    })
  }));

  return {
    user: user ? { id: user.id, name: user.name, role: user.role } : null,
    cabinets: cabinetsData
  };
};