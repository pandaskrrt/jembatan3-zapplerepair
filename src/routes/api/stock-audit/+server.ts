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

    // AMBIL SEMUA ITEMS DI SECTION (ubah dari card ke item)
    const items = await db.item.findMany({
      where: { sectionId },
      select: {
        id: true,
        stock: true,
        name: true
      },
      orderBy: { name: 'asc' }
    });

    console.log(`Found ${items.length} items in section ${sectionId}`);

    if (items.length === 0) {
      return json({
        success: false,
        message: 'Section ini tidak memiliki item untuk diaudit'
      }, { status: 400 });
    }

    // Buat audit dengan semua items sebagai audit items
    const audit = await db.stockAudit.create({
      data: {
        auditorId: session.id,
        sectionId,
        status: 'DRAFT',
        items: {
          create: items.map(item => ({
            itemId: item.id,        // ← ubah dari cardId ke itemId
            itemStatus: 'MATCH',
            systemStock: item.stock,
            physicalStock: item.stock
          }))
        }
      },
      include: {
        items: true
      }
    });

    console.log(`Created audit with ${audit.items.length} items`);

    return json({ success: true, auditId: audit.id });

  } catch (error) {
    console.error('Create audit error:', error);
    return json({ success: false, message: 'Internal server error: ' + (error as Error).message }, { status: 500 });
  }
};