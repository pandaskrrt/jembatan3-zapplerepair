import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';

export async function GET() {
  try {
    const items = await db.item.findMany({
      where: {
        deletedAt: null,
        serials: { some: { category: 'ReadySale' } }
      },
      select: {
        id: true,
        name: true,
        stock: true,
        category: true,
        subCategory: true,
        location: true,
        serialNumber: true,
        imageUrl: true,
        price: {
          select: {
            amount: true
          }
        },
        costPrice: {
          select: {
            amount: true
          }
        },
        // Include all serials
        serials: {
          select: {
            id: true,
            serialNumber: true,
            category: true,
            price: true,
            costPrice: true,
            grade: true,
            isDisplay: true,
            images: { take: 1, select: { url: true, isMain: true } }
          }
        },
        // TAMBAHKAN INI
        section: {
          select: {
            id: true,
            name: true,
            cabinet: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    const formattedItems = items.map((item) => ({
      id: item.id,
      name: item.name,
      stock: item.stock,
      category: item.category,
      subCategory: item.subCategory,
      location: item.location,
      serialNumber: item.serialNumber,
      imageUrl: item.imageUrl,
      price: item.price?.amount || 0,
      costPrice: item.costPrice?.amount || 0,
      // Include serials
      serials: item.serials,
      // TAMBAHKAN INI
      cabinet: item.section?.cabinet?.name || '-',
      cabinetId: item.section?.cabinet?.id || null,
      section: item.section?.name || '-',
      sectionId: item.section?.id || null
    }));

    return json({
      success: true,
      data: formattedItems,
      total: formattedItems.length
    });
  } catch (error) {
    console.error('Error fetching stock:', error);
    return json({
      success: false,
      message: 'Gagal mengambil data stok',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}