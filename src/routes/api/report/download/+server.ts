import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import PDFDocument from 'pdfkit';

export const GET: RequestHandler = async ({ url }) => {
    const month = parseInt(url.searchParams.get('month') || '');
    const year = parseInt(url.searchParams.get('year') || '');
    const weekOfMonth = parseInt(url.searchParams.get('week') || '');

    if (!month || !year || !weekOfMonth) {
        throw error(400, 'Parameter tidak lengkap');
    }

    // 1. Ambil data laporan periodik pendukung
    const savedReport = await db.periodicReport.findUnique({
        where: { month_year_weekOfMonth: { month, year, weekOfMonth } }
    });

    if (!savedReport) {
        throw error(404, 'Laporan untuk periode ini belum dikunci / disimpan');
    }

    // Hitung rentang tanggal untuk judul PDF
    const startDay = (weekOfMonth - 1) * 7 + 1;
    const endDay = weekOfMonth === 4 ? new Date(year, month, 0).getDate() : weekOfMonth * 7;
    const dateString = `${startDay} - ${endDay} ${getIndonesianMonth(month)} ${year}`;

    // 2. Tarik data log pelengkap untuk dicetak di dalam PDF
    const startDate = new Date(year, month - 1, startDay, 0, 0, 0, 0);
    const endDate = new Date(year, month - 1, endDay, 23, 59, 59, 999);

    const [audits, itemsLog] = await db.$transaction([
        db.stockAudit.findMany({
            where: { createdAt: { gte: startDate, lte: endDate } },
            include: { section: { include: { cabinet: true } }, auditor: { select: { name: true } } }
        }),
        db.itemHistory.findMany({
            where: { createdAt: { gte: startDate, lte: endDate } },
            include: { item: true, user: { select: { name: true } } }
        })
    ]);

    const added = itemsLog.filter(l => l.action === 'CREATED');
    const deleted = itemsLog.filter(l => ['SOFT_DELETED', 'SECTION_DELETED', 'CABINET_DELETED'].includes(l.action));
    const restored = itemsLog.filter(l => l.action === 'RESTORED');

    // 3. Inisialisasi Dokumen PDFKit
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Set header agar browser membaca ini sebagai unduhan file PDF
    const filename = `Laporan_Minggu_${weekOfMonth}_Bulan_${month}_${year}.pdf`;
    
    const stream = new ReadableStream({
        start(controller) {
            doc.on('data', (chunk) => controller.enqueue(chunk));
            doc.on('end', () => controller.close());
        }
    });

    // 4. KONTEN LAYOUT PDF
    // --- Header Judul ---
    doc.fillColor('#1e293b').fontSize(20).text('LAPORAN MINGGUAN INVENTARIS GUDANG', { align: 'center' });
    doc.fontSize(12).fillColor('#64748b').text(`Periode: Minggu Ke-${weekOfMonth} (${dateString})`, { align: 'center' });
    doc.moveDown(2);

    // --- Kotak Ringkasan (Summary) ---
    doc.fillColor('#f8fafc').rect(50, doc.y, 495, 75).fill();
    doc.fillColor('#1e293b').fontSize(11);
    doc.text('RINGKASAN AKTIVITAS PERIODE INI:', 65, doc.y - 65, { underline: true });
    doc.fontSize(10);
    doc.text(`• Total Audit Stok Dilakukan : ${audits.length} Kali`, 65);
    doc.text(`• Barang Baru Ditambahkan   : ${added.length} Item`, 65);
    doc.text(`• Barang Dihapus sementara  : ${deleted.length} Item`, 65);
    doc.text(`• Barang Berhasil Dipulihkan: ${restored.length} Item`, 65);
    doc.moveDown(2);

    // --- Catatan Khusus Laporan ---
    if (savedReport.notes) {
        doc.fillColor('#1e293b').fontSize(11).text('Catatan Pembukuan Admin:', 50, doc.y);
        doc.fontSize(10).fillColor('#475569').text(`"${savedReport.notes}"`, { italic: true });
        doc.moveDown(1.5);
    }

    // --- Tabel Log Barang Masuk ---
    doc.fillColor('#0f6e56').fontSize(12).text('1. DAFTAR BARANG MASUK BARU', 50, doc.y);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e2e8f0').stroke();
    doc.moveDown(0.5);
    doc.fontSize(9).fillColor('#1e293b');
    
    if (added.length === 0) {
        doc.text('(Tidak ada penambahan barang baru pada minggu ini)', { italic: true });
    } else {
        added.forEach((log, index) => {
            doc.text(`${index + 1}. ${log.item?.name || 'Item'} | Kategori: ${log.item?.category} | Oleh: ${log.user?.name}`);
        });
    }
    doc.moveDown(1.5);

    // --- Tabel Log Barang Keluar/Dihapus ---
    doc.fillColor('#c2410c').fontSize(12).text('2. DAFTAR BARANG DIHAPUS / PINDAH KANTOR', 50, doc.y);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e2e8f0').stroke();
    doc.moveDown(0.5);
    doc.fontSize(9).fillColor('#1e293b');

    if (deleted.length === 0) {
        doc.text('(Tidak ada pembuangan barang pada minggu ini)', { italic: true });
    } else {
        deleted.forEach((log, index) => {
            doc.text(`${index + 1}. ${log.item?.name || 'Item'} | Lokasi Asal: ${log.item?.deletedFromSectionName || '-'} | Alasan: ${log.note || 'Dihapus'}`);
        });
    }
    doc.moveDown(2);

    // --- Tanda Tangan Validasi ---
    doc.fontSize(10).fillColor('#1e293b');
    const systemY = doc.y;
    if (systemY > 700) doc.addPage(); // Tambah halaman jika ruang mepet bawah
    
    doc.text('Dibuat Otomatis Oleh Sistem,', 50, systemY + 30);
    doc.text('Status Dokumen: SIGNED / LOCKED', 50, systemY + 75, { bold: true });
    doc.text('Aplikasi Manajemen Gudang', 50, systemY + 87);

    // Akhiri penulisan PDFKit
    doc.end();

    return new Response(stream, {
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Cache-Control': 'no-cache'
        }
    });
};

function getIndonesianMonth(m: number): string {
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return months[m - 1] || '';
}