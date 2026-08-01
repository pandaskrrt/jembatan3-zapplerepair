import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';

/**
 * GET /api/stock/usage?serviceNumber=xxx
 * Mendapatkan riwayat pemakaian stok untuk service tertentu
 */
export async function GET({ url }) {
  try {
    const serviceNumber = url.searchParams.get('serviceNumber');

    if (!serviceNumber || serviceNumber.trim() === '') {
      return json({
        success: false,
        message: 'serviceNumber wajib diisi sebagai query parameter'
      }, { status: 400 });
    }

    const usageRecords = await db.serviceStockUsage.findMany({
      where: {
        serviceNumber: serviceNumber.trim()
      },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            category: true,
            subCategory: true,
            section: {
              select: {
                name: true,
                cabinet: {
                  select: {
                    name: true
                  }
                }
              }
            },
            price: {
              select: {
                amount: true
              }
            }
          }
        },
        serial: {
          select: {
            serialNumber: true,
            grade: true
          }
        }
      },
      orderBy: {
        usedAt: 'desc'
      }
    });

    // Format response
        const formattedRecords = usageRecords.map((record) => ({
          id: record.id,
          itemId: record.itemId,
          itemName: record.item.name,
          category: record.item.category,
          subCategory: record.item.subCategory,
          quantity: record.quantity,
          price: record.item.price?.amount || 0,
          totalPrice: (record.item.price?.amount || 0) * record.quantity,
          note: record.note,
          usedAt: record.usedAt,
          createdAt: record.createdAt,
          serialId: record.serialId,
          serialNumber: record.serial?.serialNumber || null,
          grade: record.serial?.grade || null,
          cabinet: record.item.section?.cabinet?.name || '-',
          section: record.item.section?.name || '-'
        }));

    return json({
      success: true,
      data: formattedRecords,
      total: formattedRecords.length,
      serviceNumber: serviceNumber
    });
  } catch (error) {
    console.error('Error fetching stock usage:', error);
    return json({
      success: false,
      message: 'Gagal mengambil riwayat pemakaian stok',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}