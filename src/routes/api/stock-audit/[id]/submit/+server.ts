import { db } from '$lib/server/db';
import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, params, locals }) => {
  try {
    const session = locals.session;
    if (!session) {
      return json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const auditId = params.id;
    if (!auditId) {
      return json({ success: false, message: 'Audit ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { items, newEntries, auditNote } = body;

    console.log('=== SUBMIT API ===');
    console.log('Audit ID:', auditId);
    console.log('User:', session.id);
    console.log('Items count:', items?.length || 0);
    console.log('New Entries count:', newEntries?.length || 0);

    // Ambil audit dengan include section dan items
    const audit = await db.stockAudit.findUnique({
      where: { id: auditId },
      include: { 
        items: true, 
        section: {
          include: { cabinet: true }
        }
      }
    });

    if (!audit) {
      return json({ success: false, message: 'Audit tidak ditemukan' }, { status: 404 });
    }

    if (audit.auditorId !== session.id && session.role !== 'ADMIN') {
      return json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    // Jika sudah COMPLETED, langsung redirect ke laporan
    if (audit.status === 'COMPLETED') {
      // Cek apakah laporan sudah ada
      const existingReport = await db.report.findUnique({
        where: { auditId: audit.id }
      });
      
      if (!existingReport) {
        await db.report.create({
          data: {
            auditId: audit.id,
            responsibleId: null,
            status: 'DRAFT',
            notes: audit.note || null
          }
        });
      }
      
      return json({
        success: true,
        message: 'Audit sudah disubmit sebelumnya',
        auditId: audit.id,
        redirectTo: `/stock-audit/laporan/${audit.id}`
      });
    }

    if (audit.status !== 'DRAFT') {
      return json({ success: false, message: 'Audit tidak dapat diproses' }, { status: 400 });
    }

    let totalMatch = 0;
    let totalMismatch = 0;
    let totalMissing = 0;
    let totalNewEntry = 0;

    // Proses dalam transaksi
    await db.$transaction(async (tx) => {
      // 1. Proses items yang sudah ada (MATCH, MISMATCH, MISSING)
      for (const item of items) {
        const existingItem = audit.items.find(i => i.id === item.id);
        if (!existingItem) continue;

        if (item.itemStatus === 'MATCH') {
          totalMatch++;
          await tx.stockAuditItem.update({
            where: { id: item.id },
            data: {
              itemStatus: 'MATCH',
              physicalStock: item.physicalStock,
              note: item.note || null
            }
          });
        } 
        else if (item.itemStatus === 'MISMATCH') {
          totalMismatch++;
          
          await tx.stockAuditItem.update({
            where: { id: item.id },
            data: {
              itemStatus: 'MISMATCH',
              physicalStock: item.physicalStock,
              note: item.note || null
            }
          });

          if (existingItem.cardId) {
            const oldStock = existingItem.systemStock || 0;
            const newStock = item.physicalStock || 0;

            if (oldStock !== newStock) {
              await tx.card.update({
                where: { id: existingItem.cardId },
                data: { stock: newStock }
              });

              await tx.cardHistory.create({
                data: {
                  cardId: existingItem.cardId,
                  action: 'STOCK_UPDATED',
                  oldStock,
                  newStock,
                  triggeredBy: session.id,
                  auditId: audit.id,
                  note: `Audit: stok diupdate dari ${oldStock} menjadi ${newStock}`
                }
              });
            }
          }
        }
        else if (item.itemStatus === 'MISSING') {
          totalMissing++;
          
          await tx.stockAuditItem.update({
            where: { id: item.id },
            data: {
              itemStatus: 'MISSING',
              physicalStock: 0,
              note: item.note || null
            }
          });

          if (existingItem.cardId) {
            const oldStock = existingItem.systemStock || 0;
            if (oldStock !== 0) {
              await tx.card.update({
                where: { id: existingItem.cardId },
                data: { stock: 0 }
              });

              await tx.cardHistory.create({
                data: {
                  cardId: existingItem.cardId,
                  action: 'MARKED_MISSING',
                  oldStock,
                  newStock: 0,
                  triggeredBy: session.id,
                  auditId: audit.id,
                  note: `Audit: card tidak ditemukan, stok diubah dari ${oldStock} menjadi 0`
                }
              });
            }
          }
        }
      }

      // 2. Proses NEW_ENTRY (card baru)
      for (const entry of newEntries) {
        totalNewEntry++;

        // Cek apakah card dengan nama yang sama sudah ada di section ini
        const existingCardInSection = await tx.card.findFirst({
          where: {
            name: entry.name,
            sectionId: audit.sectionId
          }
        });

        let newCard;

        if (existingCardInSection) {
          // Jika card sudah ada, update stoknya
          const oldStock = existingCardInSection.stock;
          const newStock = oldStock + 1;
          
          await tx.card.update({
            where: { id: existingCardInSection.id },
            data: { stock: newStock }
          });
          
          newCard = existingCardInSection;
          
          await tx.cardHistory.create({
            data: {
              cardId: existingCardInSection.id,
              action: 'STOCK_UPDATED',
              oldStock,
              newStock,
              triggeredBy: session.id,
              auditId: audit.id,
              note: `Audit: stok ditambah dari ${oldStock} menjadi ${newStock} (ditemukan di fisik)`
            }
          });
        } else {
          // Buat card baru
          newCard = await tx.card.create({
            data: {
              name: entry.name,
              stock: 1,
              location: entry.location || audit.section?.name || 'Unknown',
              category: entry.category,
              subCategory: entry.subCategory,
              imageUrl: entry.imageUrl || '',
              sectionId: audit.sectionId,
              prices: {
                create: [
                  ...(entry.priceIDR ? [{
                    currency: 'IDR',
                    amount: entry.priceIDR,
                    priceNote: 'New from audit',
                    isActive: true
                  }] : []),
                  ...(entry.priceSGD ? [{
                    currency: 'SGD',
                    amount: entry.priceSGD,
                    priceNote: 'New from audit',
                    isActive: true
                  }] : [])
                ]
              }
            }
          });

          await tx.cardHistory.create({
            data: {
              cardId: newCard.id,
              action: 'CREATED',
              oldStock: null,
              newStock: 1,
              triggeredBy: session.id,
              auditId: audit.id,
              note: `Card baru dibuat dari audit di section ${audit.section?.name}`
            }
          });
        }

        // Buat StockAuditItem untuk card baru ini
        await tx.stockAuditItem.create({
          data: {
            auditId: audit.id,
            cardId: newCard.id,
            itemStatus: 'NEW_ENTRY',
            systemStock: existingCardInSection ? (existingCardInSection.stock) : null,
            physicalStock: 1,
            note: entry.note || null,
            newCardName: entry.name,
            newCardCategory: entry.category,
            newCardSubCategory: entry.subCategory,
            newCardImageUrl: entry.imageUrl,
            newCardLocation: entry.location,
            newCardPriceIDR: entry.priceIDR,
            newCardPriceSGD: entry.priceSGD
          }
        });
      }
    });

    // Update audit status menjadi COMPLETED
    const updatedAudit = await db.stockAudit.update({
      where: { id: auditId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        note: auditNote || null,
        totalCards: audit.items.length + newEntries.length,
        totalMatch,
        totalMismatch,
        totalMissing,
        totalNewEntry
      }
    });

    console.log('Audit completed successfully:', updatedAudit.id);

    // Cek apakah laporan sudah ada
    const existingReport = await db.report.findUnique({
      where: { auditId: audit.id }
    });

    if (!existingReport) {
      // Buat laporan baru dengan status DRAFT
      await db.report.create({
        data: {
          auditId: audit.id,
          responsibleId: null,
          status: 'DRAFT',
          notes: auditNote || null
        }
      });
      console.log('Report created for audit:', audit.id);
    }

    return json({
      success: true,
      message: 'Audit berhasil disubmit',
      auditId: audit.id,
      redirectTo: `/stock-audit/laporan/${audit.id}`
    });

  } catch (error) {
    console.error('Submit audit error:', error);
    return json({
      success: false,
      message: 'Terjadi kesalahan saat submit audit: ' + (error as Error).message
    }, { status: 500 });
  }
};