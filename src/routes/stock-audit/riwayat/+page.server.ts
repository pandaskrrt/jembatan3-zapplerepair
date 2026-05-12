import { db } from '$lib/server/db';
import { redirect, type PageServerLoad } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
  const session = locals.session;
  if (!session) {
    throw redirect(302, '/login');
  }

  // Ambil filter dari URL
  const selectedCabinetId = url.searchParams.get('cabinet') ? Number(url.searchParams.get('cabinet')) : null;
  const selectedSectionId = url.searchParams.get('section') ? Number(url.searchParams.get('section')) : null;

  // Ambil semua cabinet dengan sections
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
            orderBy: { createdAt: 'desc' },
            include: {
              auditor: {
                select: { name: true, username: true }
              },
              items: {
                select: { itemStatus: true }
              }
            }
          }
        }
      }
    }
  });

  // Transformasi data untuk frontend
  const cabinetsData = cabinets.map(cabinet => ({
    id: cabinet.id,
    name: cabinet.name,
    sections: cabinet.sections.map(section => {
      const completedAudits = section.audits.filter(a => a.status === 'COMPLETED');
      const draftAudits = section.audits.filter(a => a.status === 'DRAFT');
      
      // Hitung statistik per section
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

      return {
        id: section.id,
        name: section.name,
        type: section.type,
        totalCards: section._count.cards,
        auditCount: completedAudits.length,
        draftCount: draftAudits.length,
        lastAudit: completedAudits[0]?.createdAt || null,
        lastAuditor: completedAudits[0]?.auditor?.name || null,
        totalMatch,
        totalMismatch,
        totalMissing,
        totalNewEntry,
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
    })
  }));

  // Data untuk filter dropdown
  const filterOptions = {
    cabinets: cabinets.map(c => ({ id: c.id, name: c.name })),
    sections: selectedCabinetId 
      ? cabinets.find(c => c.id === selectedCabinetId)?.sections.map(s => ({ id: s.id, name: s.name })) || []
      : []
  };

  // Ambil data section yang dipilih jika ada
  let selectedSectionData = null;
  if (selectedSectionId) {
    for (const cabinet of cabinets) {
      const section = cabinet.sections.find(s => s.id === selectedSectionId);
      if (section) {
        selectedSectionData = {
          id: section.id,
          name: section.name,
          type: section.type,
          cabinetName: cabinet.name,
          totalCards: section._count.cards,
          audits: section.audits.map(a => ({
            id: a.id,
            status: a.status,
            createdAt: a.createdAt,
            completedAt: a.completedAt,
            totalCards: a.totalCards,
            totalMatch: a.totalMatch,
            totalMismatch: a.totalMismatch,
            totalMissing: a.totalMissing,
            totalNewEntry: a.totalNewEntry,
            note: a.note,
            auditorName: a.auditor?.name
          }))
        };
        break;
      }
    }
  }

  return {
    cabinets: cabinetsData,
    filterOptions,
    selectedCabinetId,
    selectedSectionId,
    selectedSection: selectedSectionData
  };
};