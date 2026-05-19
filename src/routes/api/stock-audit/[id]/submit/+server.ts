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

    if (audit.status === 'COMPLETED') {
      return json({
        success: true,
        message: 'Audit sudah disubmit',
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
      // 1. Proses items yang sudah ada
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

          if (existingItem.itemId) {
            const oldStock = existingItem.systemStock || 0;
            const newStock = item.physicalStock || 0;

            if (oldStock !== newStock) {
              await tx.item.update({
                where: { id: existingItem.itemId },
                data: { stock: newStock }
              });

              await tx.itemHistory.create({
                data: {
                  itemId: existingItem.itemId,
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

          if (existingItem.itemId) {
            const oldStock = existingItem.systemStock || 0;
            if (oldStock !== 0) {
              await tx.item.update({
                where: { id: existingItem.itemId },
                data: { stock: 0 }
              });

              await tx.itemHistory.create({
                data: {
                  itemId: existingItem.itemId,
                  action: 'MARKED_MISSING',
                  oldStock,
                  newStock: 0,
                  triggeredBy: session.id,
                  auditId: audit.id,
                  note: `Audit: item tidak ditemukan, stok diubah dari ${oldStock} menjadi 0`
                }
              });
            }
          }
        }
      }

      // 2. Proses NEW_ENTRY (item baru)
      for (const entry of newEntries) {
        totalNewEntry++;

        const existingItemInSection = await tx.item.findFirst({
          where: {
            name: entry.name,
            sectionId: audit.sectionId
          }
        });

        let newItem;

        if (existingItemInSection) {
          const oldStock = existingItemInSection.stock;
          const newStock = oldStock + 1;

          await tx.item.update({
            where: { id: existingItemInSection.id },
            data: { stock: newStock }
          });

          newItem = existingItemInSection;

          await tx.itemHistory.create({
            data: {
              itemId: existingItemInSection.id,
              action: 'STOCK_UPDATED',
              oldStock,
              newStock,
              triggeredBy: session.id,
              auditId: audit.id,
              note: `Audit: stok ditambah dari ${oldStock} menjadi ${newStock}`
            }
          });
        } else {
          newItem = await tx.item.create({
            data: {
              name: entry.name,
              stock: 1,
              location: entry.location || audit.section?.name || 'Unknown',
              category: entry.category,
              subCategory: entry.subCategory,
              imageUrl: entry.imageUrl || null,
              sectionId: audit.sectionId,
              price: entry.priceIDR ? {
                create: {
                  amount: entry.priceIDR,
                  priceNote: 'New from audit',
                  isActive: true
                }
              } : undefined
            }
          });

          await tx.itemHistory.create({
            data: {
              itemId: newItem.id,
              action: 'CREATED',
              oldStock: null,
              newStock: 1,
              triggeredBy: session.id,
              auditId: audit.id,
              note: `Item baru dibuat dari audit di section ${audit.section?.name}`
            }
          });
        }

        await tx.stockAuditItem.create({
          data: {
            auditId: audit.id,
            itemId: newItem.id,
            itemStatus: 'NEW_ENTRY',
            systemStock: existingItemInSection ? (existingItemInSection.stock) : null,
            physicalStock: 1,
            note: entry.note || null,
            newItemName: entry.name,
            newItemCategory: entry.category,
            newItemSubCategory: entry.subCategory,
            newItemImageUrl: entry.imageUrl,
            newItemLocation: entry.location,
            newItemPriceIDR: entry.priceIDR,
            newItemCostPrice: entry.costPrice || null
          }
        });
      }
    });

    // Update audit status menjadi COMPLETED
    await db.stockAudit.update({
      where: { id: auditId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        note: auditNote || null,
        totalItems: audit.items.length + newEntries.length,
        totalMatch,
        totalMismatch,
        totalMissing,
        totalNewEntry
      }
    });

    // Buat report
    await db.report.upsert({
      where: { auditId: audit.id },
      update: {
        notes: auditNote || null,
        status: 'DRAFT'
      },
      create: {
        auditId: audit.id,
        responsibleIds: [],
        status: 'DRAFT',
        notes: auditNote || null
      }
    });

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