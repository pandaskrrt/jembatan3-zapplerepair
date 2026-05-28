import { db } from '$lib/server/db';
import { redirect, type PageServerLoad } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
  const session = locals.session;
  if (!session) {
    throw redirect(302, '/login');
  }

  // 1. Ambil & Validasi filter dari URL query params
  const selectedCabinetId = url.searchParams.get('cabinet') ? Number(url.searchParams.get('cabinet')) : null;
  const selectedSectionId = url.searchParams.get('section') ? Number(url.searchParams.get('section')) : null;

  // 2. Query Ringan: Hanya mengambil struktur dasar untuk Dropdown Filter
  const cabinetsFilterRaw = await db.cabinet.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      sections: {
        orderBy: { name: 'asc' },
        select: { id: true, name: true }
      }
    }
  });

  const filterOptions = {
    cabinets: cabinetsFilterRaw.map(c => ({ id: c.id, name: c.name })),
    sections: selectedCabinetId 
      ? cabinetsFilterRaw.find(c => c.id === selectedCabinetId)?.sections.map(s => ({ id: s.id, name: s.name })) || []
      : []
  };

  // 3. Jalankan Query Utama Berdasarkan Kondisi Filter yang Dipilih
  let cabinetsData: any[] = [];
  let selectedSectionData: any = null;

  if (selectedSectionId) {
    // JIKA USER MEMILIH SECTION SPESIFIK
    const section = await db.section.findUnique({
      where: { id: selectedSectionId },
      include: {
        cabinet: { select: { name: true } },
        _count: { select: { items: true } }, // <--- SUDAH DIPERBAIKI (cards -> items)
        audits: {
          orderBy: { createdAt: 'desc' },
          include: {
            auditor: { select: { name: true } }
          }
        }
      }
    });

    if (section) {
      const completedAudits = section.audits.filter(a => a.status === 'COMPLETED');
      let totalMatch = 0, totalMismatch = 0, totalMissing = 0, totalNewEntry = 0;

      completedAudits.forEach(audit => {
        totalMatch += audit.totalMatch || 0;
        totalMismatch += audit.totalMismatch || 0;
        totalMissing += audit.totalMissing || 0;
        totalNewEntry += audit.totalNewEntry || 0;
      });

      selectedSectionData = {
        id: section.id,
        name: section.name,
        type: section.type,
        cabinetName: section.cabinet.name,
        totalCards: section._count.items, // <--- DI-MAP KE totalCards AGAR FRONTEND TETAP NORMAL
        audits: section.audits.map(a => ({
          id: a.id,
          status: a.status,
          createdAt: a.createdAt,
          completedAt: a.completedAt,
          totalCards: a.totalItems, // <--- SUDAH DIPERBAIKI (Sesuai database baru)
          totalMatch: a.totalMatch,
          totalMismatch: a.totalMismatch,
          totalMissing: a.totalMissing,
          totalNewEntry: a.totalNewEntry,
          note: a.note,
          auditorName: a.auditor?.name
        }))
      };
    }
  } else {
    // JIKA TIDAK ADA FILTER SECTION
    const cabinets = await db.cabinet.findMany({
      orderBy: { name: 'asc' },
      where: selectedCabinetId ? { id: selectedCabinetId } : undefined,
      include: {
        sections: {
          orderBy: { name: 'asc' },
          include: {
            _count: { select: { items: true } }, // <--- SUDAH DIPERBAIKI (cards -> items)
            audits: {
              orderBy: { createdAt: 'desc' },
              include: {
                auditor: { select: { name: true } }
              }
            }
          }
        }
      }
    });

    cabinetsData = cabinets.map(cabinet => ({
      id: cabinet.id,
      name: cabinet.name,
      sections: cabinet.sections.map(section => {
        const completedAudits = section.audits.filter(a => a.status === 'COMPLETED');
        const draftAudits = section.audits.filter(a => a.status === 'DRAFT');
        
        let totalMatch = 0, totalMismatch = 0, totalMissing = 0, totalNewEntry = 0;
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
          totalCards: section._count.items, // <--- DI-MAP KE totalCards AGAR FRONTEND TETAP NORMAL
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
            totalCards: audit.totalItems, // <--- SUDAH DIPERBAIKI (Sesuai database baru)
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
  }

  return {
    cabinets: cabinetsData,
    filterOptions,
    selectedCabinetId,
    selectedSectionId,
    selectedSection: selectedSectionData
  };
};