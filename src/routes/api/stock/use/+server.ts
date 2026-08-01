import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';

/**
 * HUBUNGAN: POST /api/stock/use
 * FUNGSI: Mengurangi stok gudang saat barang diambil untuk invoice service
 */
export async function POST({ request }) {
  try {
    const body = await request.json();
    
    // 1. Parsing input di awal untuk memastikan tipe data benar
    const itemId = Number(body.itemId);
    const serialId = Number(body.serialId);
    const quantity = Number(body.quantity || 1);
    const serviceNumber = String(body.serviceNumber || '');
    const note = body.note || '';

    // Validasi input dasar
    if (!itemId || !serviceNumber) {
      return json({
        success: false,
        message: 'itemId dan serviceNumber wajib diisi'
      }, { status: 400 });
    }

    // 2. Cek item terlebih dahulu
    const item = await db.item.findUnique({ where: { id: itemId } });
    if (!item || item.deletedAt !== null) {
      return json({ success: false, message: 'Barang tidak ditemukan' }, { status: 404 });
    }

    // 3. Jika serialId disertakan, validasi serial
    let serial = null;
    if (serialId) {
      serial = await db.itemSerial.findUnique({ where: { id: serialId } });
      if (!serial || serial.itemId !== itemId) {
        return json({ success: false, message: 'Serial tidak ditemukan atau tidak cocok dengan item' }, { status: 400 });
      }
      if (serial.category !== 'ReadySale') {
        return json({ success: false, message: 'Hanya serial ReadySale yang bisa diambil' }, { status: 400 });
      }
      if (serial.status !== 'AVAILABLE') {
        return json({ 
          success: false, 
          message: `Stok serial tidak mencukupi. Serial sudah tidak tersedia` 
        }, { status: 400 });
      }
    } else {
      // Backward compatibility: tanpa serialId, cek stok item langsung
      if (item.stock < quantity) {
        return json({ 
          success: false, 
          message: `Stok tidak mencukupi. Tersedia: ${item.stock}` 
        }, { status: 400 });
      }
    }

    // 3. Ambil user penanggung jawab
    const firstUser = await db.user.findFirst();
    const userId = firstUser?.id || 'system';

    // 4. Jalankan Transaksi
    const result = await db.$transaction(async (tx) => {
      let newTotalStock: number;

      if (serial) {
        // A. Kurangi stok serial
        await tx.itemSerial.update({
          where: { id: serialId },
          data: { status: 'SOLD' }
        });

        // B. Hitung ulang total stok item (HANYA ReadySale)
        const totalReadySale = await tx.itemSerial.count({
          where: { itemId, status: 'AVAILABLE' }
        });

        newTotalStock = totalReadySale;

        // C. Update stok utama di tabel Item
        await tx.item.update({
          where: { id: itemId },
          data: { stock: newTotalStock }
        });
      } else {
        // Backward compatibility: kurangi stok item langsung
        newTotalStock = item.stock - quantity;
        await tx.item.update({
          where: { id: itemId },
          data: { stock: newTotalStock }
        });
      }

      // D. Catat riwayat pemakaian
      const usage = await tx.serviceStockUsage.create({
        data: {
          itemId,
          serialId: serialId || null,
          quantity,
          serviceNumber,
          note: note || null
        }
      });

      // E. Catat log sejarah barang
      const serialInfo = serial ? `${serial.serialNumber || 'Unknown'}` : 'Tanpa serial';
      await tx.itemHistory.create({
        data: {
          itemId,
          action: 'STOCK_UPDATED',
          oldStock: item.stock,
          newStock: newTotalStock,
          triggeredBy: userId,
          note: `Stok ${serialInfo} digunakan untuk service ${serviceNumber}. ${note}`
        }
      });

      return { 
        remainingStock: newTotalStock, 
        usageId: usage.id,
        itemName: item.name 
      };
    });

    return json({
      success: true,
      message: 'Stok berhasil dikurangi',
      data: {
        itemId,
        itemName: result.itemName,
        quantityUsed: quantity,
        remainingStock: result.remainingStock,
        serviceNumber,
        usageId: result.usageId
      }
    });

  } catch (error) {
    console.error('CRITICAL ERROR in /api/stock/use:', error);
    return json({
      success: false,
      message: 'Gagal mengurangi stok (Server Error)',
      error: error instanceof Error ? error.message : 'Unknown internal error'
    }, { status: 500 });
  }
}

/**
 * HUBUNGAN: DELETE /api/stock/use
 * FUNGSI: Membatalkan/menghapus item dari invoice service, dan otomatis mengembalikan stok ke gudang
 */
export async function DELETE({ request }) {
  try {
    const body = await request.json();
    const { itemId, quantity, serviceNumber } = body;

    // Validasi input awal sebelum konversi
    if (!itemId || !quantity || !serviceNumber) {
      return json({
        success: false,
        message: 'itemId, quantity, dan serviceNumber wajib diisi'
      }, { status: 400 });
    }

    // SAFE CONVERSION: Pastikan tipe data sesuai dengan kebutuhan database
    const parsedItemId = Number(itemId);
    const parsedQuantity = Number(quantity);
    
    // Cek apakah serviceNumber di DB kamu berupa angka atau teks. 
    // Jika di database berupa Int/Integer, gunakan: Number(serviceNumber)
    // Jika di database berupa String/Varchar, gunakan: String(serviceNumber).trim()
    // Di bawah ini kita coba ubah ke format angka (jika itu no_service berurutan) atau sesuaikan kebutuhan.
    const parsedServiceNumber = isNaN(Number(serviceNumber)) ? String(serviceNumber).trim() : Number(serviceNumber);

    if (isNaN(parsedItemId) || isNaN(parsedQuantity) || parsedQuantity < 1) {
      return json({
        success: false,
        message: 'Format itemId atau quantity tidak valid'
      }, { status: 400 });
    }

    // Ambil data info barang saat ini dari database gudang
    const item = await db.item.findUnique({
      where: { id: parsedItemId }
    });

    if (!item) {
      return json({
        success: false,
        message: 'Barang tidak ditemukan di database'
      }, { status: 404 });
    }

    // Ambil user pertama sebagai penanggung jawab riwayat log pembatalan
    const firstUser = await db.user.findFirst();
    const userId = firstUser?.id || 'system';

    // Jalankan Transaksi Database untuk Pengembalian Stok
    const result = await db.$transaction(async (tx) => {
      // 1. Tambahkan kembali angka stok barang di gudang utama
      const updatedItem = await tx.item.update({
        where: { id: parsedItemId },
        data: { stock: { increment: parsedQuantity } }
      });

      // 2. Hapus catatan log pemakaian stok yang nempel pada nomor service ini
      // Kita cast parameternya ke tipe data primitif murni agar Prisma tidak crash
      await tx.serviceStockUsage.deleteMany({
        where: {
          itemId: parsedItemId,
          // Menggunakan tipe dinamis yang sudah dikonversi
          serviceNumber: parsedServiceNumber.toString(), // Ganti ke parsedServiceNumber jika kolom DB Anda bertipe Int
          quantity: parsedQuantity
        }
      });

      // 3. Catat transaksi pengembalian barang ini ke dalam log itemHistory gudang
      await tx.itemHistory.create({
        data: {
          itemId: parsedItemId,
          action: 'STOCK_UPDATED',
          oldStock: item.stock,
          newStock: updatedItem.stock,
          triggeredBy: userId,
          note: `Pembatalan/Hapus item dari service ${serviceNumber}. Stok dikembalikan ke gudang: +${parsedQuantity}`
        }
      });

      return updatedItem;
    });

    return json({
      success: true,
      message: 'Stok barang berhasil dikembalikan ke gudang',
      data: {
        itemId: parsedItemId,
        remainingStock: result.stock
      }
    });
  } catch (error) {
    // Log ini akan muncul di terminal console terminal backend kamu (bukan di browser)
    // Sangat berguna untuk melihat detail constraint database mana yang error
    console.error('ERROR UTAMA PRISMA/DATABASE:', error);
    return json({
      success: false,
      message: 'Gagal mengembalikan stok ke gudang',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}