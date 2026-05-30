// routes/api/stock-audit/[id]/submit/+server.ts
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
    console.log('New entries count:', newEntries?.length || 0);
    
    // DEBUG: Lihat raw data dari frontend
    console.log('=== RAW ITEMS FROM FRONTEND ===');
    items?.forEach((item: any, i: number) => {
      console.log(`Item ${i}:`, {
        id: item.id,
        itemStatus: item.itemStatus,
        physicalStock: item.physicalStock,
        note: item.note
      });
    });

    // Debug new entries
    console.log('=== RAW NEW ENTRIES FROM FRONTEND ===');
    newEntries?.forEach((entry: any, i: number) => {
      console.log(`New Entry ${i}:`, {
        name: entry.name,
        category: entry.category,
        subCategory: entry.subCategory,
        priceIDR: entry.priceIDR,
        costPrice: entry.costPrice,
        location: entry.location,
        imageUrl: entry.imageUrl,
        note: entry.note
      });
    });

    // Ambil audit dengan include section dan items
    const audit = await db.stockAudit.findUnique({
      where: { id: auditId },
      include: {
        items: {
          include: {
            item: true
          }
        },
        section: {
          include: { cabinet: true }
        }
      }
    });

    if (!audit) {
      return json({ success: false, message: 'Audit tidak ditemukan' }, { status: 404 });
    }

    if (audit.auditorId !== session.id && session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN') {
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
        const existingItem = audit.items.find(i => i.id === parseInt(item.id));
        if (!existingItem) {
          console.log(`Item ${item.id} not found in audit items`);
          continue;
        }

        // Gunakan status dari frontend
        let status = item.itemStatus;
        if (status) {
          status = status.toUpperCase();
        }
        
        console.log(`Processing item ${item.id}: frontend status = ${status}, physicalStock = ${item.physicalStock}`);

        // Proses berdasarkan status dari frontend
        if (status === 'MATCH') {
          totalMatch++;
          console.log(`  -> Marking as MATCH`);
          
          await tx.stockAuditItem.update({
            where: { id: existingItem.id },
            data: {
              itemStatus: 'MATCH',
              physicalStock: item.physicalStock ?? existingItem.systemStock,
              note: item.note || null,
              updatedAt: new Date()
            }
          });
          
          // Jika ada perubahan stok (misal MATCH tapi stok berbeda)
          if (existingItem.itemId && item.physicalStock !== undefined && item.physicalStock !== null) {
            const oldStock = existingItem.systemStock || 0;
            const newStock = item.physicalStock;
            
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
                  note: `Audit: stok disamakan (MATCH) dari ${oldStock} menjadi ${newStock}`
                }
              });
            }
          }
        }
        else if (status === 'MISMATCH') {
          totalMismatch++;
          console.log(`  -> Marking as MISMATCH, physicalStock: ${item.physicalStock}`);
          
          await tx.stockAuditItem.update({
            where: { id: existingItem.id },
            data: {
              itemStatus: 'MISMATCH',
              physicalStock: item.physicalStock,
              note: item.note || null,
              updatedAt: new Date()
            }
          });

          // Update stok item jika mismatch dan physicalStock tersedia
          if (existingItem.itemId && item.physicalStock !== undefined && item.physicalStock !== null) {
            const oldStock = existingItem.systemStock || 0;
            const newStock = item.physicalStock;

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
                  note: `Audit: stok diupdate dari ${oldStock} menjadi ${newStock} (MISMATCH)`
                }
              });
            }
          }
        }
        else if (status === 'MISSING') {
          totalMissing++;
          console.log(`  -> Marking as MISSING`);
          
          await tx.stockAuditItem.update({
            where: { id: existingItem.id },
            data: {
              itemStatus: 'MISSING',
              physicalStock: 0,
              note: item.note || null,
              updatedAt: new Date()
            }
          });

          // Update stok menjadi 0 jika missing
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
                  note: item.note || `Audit: item tidak ditemukan, stok diubah dari ${oldStock} menjadi 0`
                }
              });
            }
          }
        }
        else {
          // Fallback: auto-detect dari physicalStock jika status tidak dikenal
          console.log(`  -> Unknown status "${status}", auto-detecting from physicalStock=${item.physicalStock}, systemStock=${existingItem.systemStock}`);
          
          if (item.physicalStock === 0) {
            totalMissing++;
            await tx.stockAuditItem.update({
              where: { id: existingItem.id },
              data: {
                itemStatus: 'MISSING',
                physicalStock: 0,
                note: item.note || null,
                updatedAt: new Date()
              }
            });
          } else if (item.physicalStock === existingItem.systemStock) {
            totalMatch++;
            await tx.stockAuditItem.update({
              where: { id: existingItem.id },
              data: {
                itemStatus: 'MATCH',
                physicalStock: item.physicalStock,
                note: item.note || null,
                updatedAt: new Date()
              }
            });
          } else if (item.physicalStock !== undefined && item.physicalStock !== null) {
            totalMismatch++;
            await tx.stockAuditItem.update({
              where: { id: existingItem.id },
              data: {
                itemStatus: 'MISMATCH',
                physicalStock: item.physicalStock,
                note: item.note || null,
                updatedAt: new Date()
              }
            });
          }
        }
      }

      // 2. Proses NEW_ENTRY (item baru) - UPDATED dengan costPrice
      for (const entry of newEntries) {
        totalNewEntry++;
        console.log(`Processing new entry: ${entry.name}`);
        console.log(`  - priceIDR: ${entry.priceIDR}, costPrice: ${entry.costPrice}`);

        // Cek apakah item sudah ada di section yang sama
        const existingItemInSection = await tx.item.findFirst({
          where: {
            name: entry.name,
            sectionId: audit.sectionId,
            deletedAt: null
          }
        });

        let newItem;

        if (existingItemInSection) {
          console.log(`  -> Item already exists, updating stock`);
          const oldStock = existingItemInSection.stock;
          const newStock = oldStock + 1; // Default tambah 1 untuk item baru dari audit

          await tx.item.update({
            where: { id: existingItemInSection.id },
            data: { 
              stock: newStock,
              updatedAt: new Date()
            }
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
              note: `Audit: stok ditambah +1 dari audit (item sudah ada)`
            }
          });
        } else {
          console.log(`  -> Creating new item`);
          
          // Buat item baru dengan data lengkap
          newItem = await tx.item.create({
            data: {
              name: entry.name,
              stock: entry.stock ?? 1, // Default stock 1 untuk item baru
              location: entry.location || audit.section?.name || 'Unknown',
              category: entry.category,
              subCategory: entry.subCategory,
              imageUrl: entry.imageUrl || null,
              sectionId: audit.sectionId,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });

          // Buat Price (harga jual) jika disediakan
          if (entry.priceIDR && entry.priceIDR > 0) {
            await tx.price.create({
              data: {
                itemId: newItem.id,
                amount: entry.priceIDR,
                priceNote: 'Harga jual dari audit',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
              }
            });
            console.log(`  -> Created price: ${entry.priceIDR}`);
          }

          // Buat CostPrice (harga modal) jika disediakan
          if (entry.costPrice && entry.costPrice > 0) {
            await tx.costPrice.create({
              data: {
                itemId: newItem.id,
                amount: entry.costPrice,
                note: entry.note || 'Harga modal dari audit',
                createdAt: new Date(),
                updatedAt: new Date()
              }
            });
            console.log(`  -> Created cost price: ${entry.costPrice}`);
          }

          await tx.itemHistory.create({
            data: {
              itemId: newItem.id,
              action: 'CREATED',
              oldStock: null,
              newStock: 1,
              triggeredBy: session.id,
              auditId: audit.id,
              note: `Item baru "${entry.name}" dibuat dari audit di section ${audit.section?.name}`
            }
          });
        }

        // Buat StockAuditItem untuk new entry
        await tx.stockAuditItem.create({
          data: {
            auditId: audit.id,
            itemId: newItem.id,
            itemStatus: 'NEW_ENTRY',
            systemStock: existingItemInSection ? existingItemInSection.stock : 0,
            physicalStock: entry.stock ?? 1,
            note: entry.note || null,
            newItemName: entry.name,
            newItemCategory: entry.category,
            newItemSubCategory: entry.subCategory,
            newItemImageUrl: entry.imageUrl || null,
            newItemLocation: entry.location || null,
            newItemPriceIDR: entry.priceIDR || null,
            newItemCostPrice: entry.costPrice || null,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      }
    });

    // Hitung ulang total items setelah transaksi
    const finalItems = await db.stockAuditItem.findMany({
      where: { auditId: auditId },
      select: { itemStatus: true }
    });

    let finalMatch = 0, finalMismatch = 0, finalMissing = 0, finalNewEntry = 0;
    for (const item of finalItems) {
      switch (item.itemStatus) {
        case 'MATCH': finalMatch++; break;
        case 'MISMATCH': finalMismatch++; break;
        case 'MISSING': finalMissing++; break;
        case 'NEW_ENTRY': finalNewEntry++; break;
      }
    }

    console.log('=== SUBMIT RESULT ===');
    console.log('Final stats:', { finalMatch, finalMismatch, finalMissing, finalNewEntry });
    console.log('All item statuses:', finalItems.map(i => i.itemStatus));

    // Update audit status dengan statistik yang benar
    await db.stockAudit.update({
      where: { id: auditId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        note: auditNote || null,
        totalItems: finalItems.length,
        totalMatch: finalMatch,
        totalMismatch: finalMismatch,
        totalMissing: finalMissing,
        totalNewEntry: finalNewEntry,
        updatedAt: new Date()
      }
    });

    // Buat atau update report
    const existingReport = await db.report.findUnique({
      where: { auditId: audit.id }
    });

    if (existingReport) {
      await db.report.update({
        where: { auditId: audit.id },
        data: {
          notes: auditNote || null,
          status: 'DRAFT',
          updatedAt: new Date()
        }
      });
    } else {
      await db.report.create({
        data: {
          auditId: audit.id,
          responsibleIds: [],
          status: 'DRAFT',
          notes: auditNote || null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }

    return json({
      success: true,
      message: 'Audit berhasil disubmit',
      auditId: audit.id,
      stats: {
        total: finalItems.length,
        match: finalMatch,
        mismatch: finalMismatch,
        missing: finalMissing,
        newEntry: finalNewEntry
      },
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