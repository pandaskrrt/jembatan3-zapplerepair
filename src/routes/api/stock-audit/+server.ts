import { db } from '$lib/server/db';
import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const session = locals.session;
    if (!session) {
      return json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    if (session.role !== 'STOCK_AUDIT' && session.role !== 'ADMIN') {
      return json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { sectionId } = await request.json();
    if (!sectionId) {
      return json({ success: false, message: 'sectionId required' }, { status: 400 });
    }

    // Cek section
    const section = await db.section.findUnique({
      where: { id: sectionId },
      include: { cabinet: true }
    });

    if (!section) {
      return json({ success: false, message: 'Section not found' }, { status: 404 });
    }

    // Cek existing draft dari auditor lain
    const existingDraft = await db.stockAudit.findFirst({
      where: {
        sectionId,
        status: 'DRAFT',
        auditorId: { not: session.id }
      }
    });

    if (existingDraft) {
      return json({
        success: false,
        message: 'Section sedang diaudit oleh auditor lain'
      }, { status: 409 });
    }

    // Cek draft milik sendiri
    const myDraft = await db.stockAudit.findFirst({
      where: { sectionId, status: 'DRAFT', auditorId: session.id }
    });

    if (myDraft) {
      return json({ success: true, auditId: myDraft.id });
    }

    // AMBIL SEMUA CARD DI SECTION
    const cards = await db.card.findMany({
      where: { sectionId },
      select: { 
        id: true, 
        stock: true,
        name: true 
      },
      orderBy: { name: 'asc' }
    });

    console.log(`Found ${cards.length} cards in section ${sectionId}`); // Debug

    if (cards.length === 0) {
      return json({
        success: false,
        message: 'Section ini tidak memiliki kartu untuk diaudit'
      }, { status: 400 });
    }

    // Buat audit dengan semua card sebagai items
    const audit = await db.stockAudit.create({
      data: {
        auditorId: session.id,
        sectionId,
        status: 'DRAFT',
        items: {
          create: cards.map(card => ({
            cardId: card.id,
            itemStatus: 'MATCH',
            systemStock: card.stock,
            physicalStock: card.stock
          }))
        }
      },
      include: {
        items: true  // Include items untuk verifikasi
      }
    });

    console.log(`Created audit with ${audit.items.length} items`); // Debug

    return json({ success: true, auditId: audit.id });

  } catch (error) {
    console.error('Create audit error:', error);
    return json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
};