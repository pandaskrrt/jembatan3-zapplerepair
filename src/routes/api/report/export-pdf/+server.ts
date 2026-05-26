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

    const savedReport = await db.periodicReport.findUnique({
        where: { month_year_weekOfMonth: { month, year, weekOfMonth } }
    });

    if (!savedReport) {
        throw error(404, 'Laporan untuk periode ini belum dikunci / disimpan');
    }

    const startDay = (weekOfMonth - 1) * 7 + 1;
    const endDay = weekOfMonth === 4 ? new Date(year, month, 0).getDate() : weekOfMonth * 7;
    const dateString = `${startDay} - ${endDay} ${getIndonesianMonth(month)} ${year}`;

    const startDate = new Date(year, month - 1, startDay, 0, 0, 0, 0);
    const endDate = new Date(year, month - 1, endDay, 23, 59, 59, 999);

    const [audits, itemsLog] = await db.$transaction([
        db.stockAudit.findMany({
            where: { createdAt: { gte: startDate, lte: endDate } },
            include: { section: { include: { cabinet: true } }, auditor: { select: { name: true } } },
            orderBy: { createdAt: 'desc' }
        }),
        db.itemHistory.findMany({
            where: { createdAt: { gte: startDate, lte: endDate } },
            include: { item: true, user: { select: { name: true } } },
            orderBy: { createdAt: 'desc' }
        })
    ]);

    const added = itemsLog.filter(l => l.action === 'CREATED');
    const deleted = itemsLog.filter(l => ['SOFT_DELETED', 'SECTION_DELETED', 'CABINET_DELETED'].includes(l.action));
    const restored = itemsLog.filter(l => l.action === 'RESTORED');

    const doc = new PDFDocument({ 
        margin: 50, 
        size: 'A4',
        bufferPages: true,
        info: {
            Title: `Laporan Inventaris Minggu Ke-${weekOfMonth} ${getIndonesianMonth(month)} ${year}`,
            Author: 'Sistem Manajemen Inventaris',
            Subject: 'Laporan Stock Audit Mingguan'
        }
    });
    
    const buffers: Buffer[] = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    
    const colors = {
        primary: '#0f172a',
        secondary: '#475569',
        accent: '#059669',
        bgLight: '#f8fafc',
        border: '#e2e8f0',
        textDark: '#1e293b',
        textMuted: '#64748b',
        alertGreen: '#2563eb',
        alertRed: '#dc2626',
        alertAmber: '#d97706'
    };

    // ==========================================
    // HEADER
    // ==========================================

    function drawHeader() {
        doc.save();
        doc.rect(50, 35, doc.page.width - 100, 4).fill(colors.accent);
        
        doc.fillColor(colors.primary)
           .font('Helvetica-Bold')
           .fontSize(20)
           .text('LAPORAN STOCK AUDIT MINGGUAN', 50, 55, { align: 'center' });
        
        doc.fontSize(11)
           .fillColor(colors.secondary)
           .font('Helvetica')
           .text(`Periode Laporan: Minggu Ke-${weekOfMonth}`, 50, 80, { align: 'center' });
        
        doc.fontSize(11)
           .fillColor(colors.accent)
           .font('Helvetica-Bold')
           .text(dateString, 50, 98, { align: 'center' });
           
        doc.restore();
        doc.y = 135;
    }

    doc.on('pageAdded', () => {
        drawHeader();
    });

    drawHeader();
    
    // ==========================================
    // RINGKASAN
    // ==========================================
    const startY = doc.y;
    const cardWidth = doc.page.width - 100;
    const cardHeight = 110;

    doc.save();
    doc.roundedRect(50, startY, cardWidth, cardHeight, 6)
       .fillAndStroke(colors.bgLight, colors.border);

    doc.fillColor(colors.primary)
       .font('Helvetica-Bold')
       .fontSize(11)
       .text('RINGKASAN AKTIVITAS PERIODE', 65, startY + 15);

    doc.moveTo(65, startY + 32)
       .lineTo(doc.page.width - 65, startY + 32)
       .lineWidth(1)
       .strokeColor(colors.border)
       .stroke();

    const stats = [
        { label: 'Total Sesi Audit', value: audits.length, color: colors.accent },
        { label: 'Item Baru (Created)', value: added.length, color: colors.alertGreen },
        { label: 'Item Dihapus (Deleted)', value: deleted.length, color: colors.alertRed },
        { label: 'Item Dipulihkan (Restored)', value: restored.length, color: colors.alertAmber }
    ];
    
    const colWidth = (cardWidth - 30) / 4;
    
    stats.forEach((stat, idx) => {
        const x = 65 + (idx * colWidth);
        const y = startY + 45;
        
        doc.fillColor(colors.textMuted)
           .fontSize(8)
           .font('Helvetica')
           .text(stat.label, x, y, { width: colWidth - 10 });
        
        doc.fillColor(stat.color)
           .fontSize(22)
           .font('Helvetica-Bold')
           .text(stat.value.toString(), x, y + 22);
    });
    
    doc.restore();
    doc.y = startY + cardHeight + 25;

    function checkPageOverflow(neededSpace: number) {
        if (doc.y + neededSpace > doc.page.height - 60) {
            doc.addPage();
        }
    }

    // ==========================================
    // TABEL SESI AUDIT
    // ==========================================
    checkPageOverflow(80);
    
    doc.fillColor(colors.primary).font('Helvetica-Bold').fontSize(12).text('DAFTAR SESI AUDIT', 50, doc.y);
    doc.moveDown(0.5);

    if (audits.length === 0) {
        doc.fillColor(colors.textMuted).font('Helvetica-Oblique').fontSize(9).text('Tidak ada rekaman sesi audit pada periode ini.');
        doc.moveDown(2);
    } else {
        // Posisi kolom tabel audit
        const xNo = 55;
        const xLokasi = 80;
        const xAuditor = 310;
        const xTanggal = 440;
        
        let tableY = doc.y;
        doc.save();
        doc.rect(50, tableY, doc.page.width - 100, 22).fill(colors.primary);
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8);
        doc.text('NO', xNo, tableY + 7);
        doc.text('LOKASI (CABINET / SECTION)', xLokasi, tableY + 7);
        doc.text('AUDITOR', xAuditor, tableY + 7);
        doc.text('TANGGAL', xTanggal, tableY + 7);
        doc.restore();
        
        tableY += 22;

        audits.slice(0, 15).forEach((audit, index) => {
            checkPageOverflow(25);
            if (doc.y === 135) tableY = 135;

            if (index % 2 === 0) {
                doc.rect(50, tableY, doc.page.width - 100, 20).fill(colors.bgLight);
            }
            
            doc.moveTo(50, tableY + 20).lineTo(doc.page.width - 50, tableY + 20).lineWidth(0.5).strokeColor(colors.border).stroke();

            const location = `${audit.section?.cabinet?.name || '-'} / ${audit.section?.name || '-'}`;
            const auditor = audit.auditor?.name || 'Unknown';
            const date = audit.createdAt ? new Date(audit.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

            doc.fillColor(colors.textDark).font('Helvetica').fontSize(8.5);
            doc.text((index + 1).toString(), xNo, tableY + 6);
            doc.font('Helvetica-Bold').text(location.substring(0, 45), xLokasi, tableY + 6);
            doc.font('Helvetica').text(auditor.substring(0, 20), xAuditor, tableY + 6);
            doc.text(date, xTanggal, tableY + 6);

            tableY += 20;
            doc.y = tableY;
        });

        if (audits.length > 15) {
            doc.y += 5;
            doc.fillColor(colors.textMuted).font('Helvetica-Oblique').fontSize(8).text(`... dan ${audits.length - 15} sesi audit lainnya.`, 50, doc.y);
        }
        doc.y += 20;
    }

    // ==========================================
    // FUNGSI TABEL LOG ITEM (RAPI & SEJAJAR)
    // ==========================================
    function renderItemsTable(title: string, items: any[], themeColor: string, emptyMessage: string) {
        checkPageOverflow(80);
        
        doc.fillColor(colors.primary).font('Helvetica-Bold').fontSize(11).text(title, 50, doc.y);
        doc.moveDown(0.5);

        if (items.length === 0) {
            doc.fillColor(colors.textMuted).font('Helvetica-Oblique').fontSize(9).text(emptyMessage);
            doc.y += 20;
            return;
        }

        // Posisi kolom yang konsisten
        const xNama = 55;
        const xKategori = 210;
        const xPetugas = 315;
        const xTanggal = 445;
        
        let tableY = doc.y;
        doc.save();
        doc.rect(50, tableY, doc.page.width - 100, 22).fill(themeColor);
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8);
        doc.text('NAMA ITEM', xNama, tableY + 7);
        doc.text('KATEGORI', xKategori, tableY + 7);
        doc.text('PETUGAS LOG', xPetugas, tableY + 7);
        doc.text('TANGGAL', xTanggal, tableY + 7);
        doc.restore();
        
        tableY += 22;

        items.slice(0, 20).forEach((item, index) => {
            checkPageOverflow(25);
            if (doc.y === 135) tableY = 135;

            if (index % 2 === 0) {
                doc.rect(50, tableY, doc.page.width - 100, 20).fill(colors.bgLight);
            }
            doc.moveTo(50, tableY + 20).lineTo(doc.page.width - 50, tableY + 20).lineWidth(0.5).strokeColor(colors.border).stroke();

            const name = item.item?.name || 'Item tidak diketahui';
            const category = item.item?.category || '-';
            const user = item.user?.name || 'Sistem';
            const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';

            doc.fillColor(colors.textDark).font('Helvetica').fontSize(8);
            
            // Nama Item
            let displayName = name;
            if (displayName.length > 28) displayName = displayName.substring(0, 25) + '...';
            doc.text(displayName, xNama, tableY + 6);
            
            // Kategori
            let displayCategory = category;
            if (displayCategory.length > 18) displayCategory = displayCategory.substring(0, 15) + '...';
            doc.text(displayCategory, xKategori, tableY + 6);
            
            // Petugas
            let displayUser = user;
            if (displayUser.length > 20) displayUser = displayUser.substring(0, 17) + '...';
            doc.text(displayUser, xPetugas, tableY + 6);
            
            // Tanggal (rata kiri agar sejajar dengan header)
            doc.text(date, xTanggal, tableY + 6);

            tableY += 20;
            doc.y = tableY;
        });

        if (items.length > 20) {
            doc.y += 5;
            doc.fillColor(colors.textMuted).font('Helvetica-Oblique').fontSize(8).text(`... dan ${items.length - 20} item lainnya.`, 50, doc.y);
        }
        doc.y += 20;
    }

    // Panggil fungsi tabel
    renderItemsTable('LOG ITEM BARU DITAMBAHKAN', added, colors.alertGreen, 'Tidak ada penambahan barang baru pada minggu ini.');
    renderItemsTable('LOG ITEM DIHAPUS (SOFT-DELETE)', deleted, colors.alertRed, 'Tidak ada penghapusan barang pada minggu ini.');
    renderItemsTable('LOG ITEM DI-RESTORE', restored, colors.alertAmber, 'Tidak ada pemulihan barang pada minggu ini.');

    // ==========================================
    // CATATAN & VALIDASI
    // ==========================================
    checkPageOverflow(120);

    const notesY = doc.y;
    doc.save();
    doc.roundedRect(50, notesY, doc.page.width - 100, 55, 4).fillAndStroke('#fffdf5', '#fef3c7');
    doc.fillColor('#b45309').font('Helvetica-Bold').fontSize(9).text('CATATAN SUPER ADMIN:', 65, notesY + 12);
    doc.fillColor('#78350f').font('Helvetica').fontSize(8.5).text(savedReport.notes || 'Tidak ada catatan tambahan untuk periode laporan ini.', 65, notesY + 26, { width: doc.page.width - 130 });
    doc.restore();

    doc.y = notesY + 75;
    checkPageOverflow(70);
    const signY = doc.y;

    doc.save();
    doc.fillColor(colors.primary).font('Helvetica-Bold').fontSize(9).text('VERIFIKASI SISTEM', 50, signY);
    doc.moveTo(50, signY + 15).lineTo(180, signY + 15).lineWidth(1).strokeColor(colors.border).stroke();
    doc.fillColor(colors.textMuted).font('Helvetica').fontSize(7.5).text('Super Admin / Manager Operational', 50, signY + 20);

    const badgeX = doc.page.width - 170;
    doc.rect(badgeX, signY - 5, 120, 42).lineWidth(1.5).strokeColor(colors.accent).stroke();
    doc.fillColor(colors.accent).font('Helvetica-Bold').fontSize(9).text('TERVALIDASI', badgeX + 28, signY + 8);
    doc.fillColor(colors.textMuted).font('Helvetica').fontSize(6.5).text(`Sistem Lock: ${new Date(savedReport.createdAt || new Date()).toLocaleDateString('id-ID')}`, badgeX + 12, signY + 24);
    doc.restore();

    // ==========================================
    // FOOTER
    // ==========================================
    doc.end();

    const pdfBuffer = await new Promise<Buffer>((resolve) => {
        doc.on('end', () => {
            const totalPages = doc.bufferedPageRange().count;
            for (let i = 0; i < totalPages; i++) {
                doc.switchToPage(i);
                
                doc.save();
                const bottom = doc.page.height - 35;
                doc.moveTo(50, bottom - 8).lineTo(doc.page.width - 50, bottom - 8).lineWidth(0.5).strokeColor(colors.border).stroke();
                
                doc.fontSize(7.5)
                   .fillColor(colors.textMuted)
                   .font('Helvetica')
                   .text(
                       `Dokumen Internal - Sistem Manajemen Inventaris  •  Dicetak: ${new Date().toLocaleDateString('id-ID')}  •  Halaman ${i + 1} dari ${totalPages}`,
                       50,
                       bottom,
                       { align: 'center', width: doc.page.width - 100 }
                   );
                doc.restore();
            }
            resolve(Buffer.concat(buffers));
        });
    });

    const filename = `Laporan_Minggu_${weekOfMonth}_${getIndonesianMonth(month)}_${year}.pdf`;
    const encodedFilename = encodeURIComponent(filename);

    return new Response(pdfBuffer, {
        status: 200,
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`,
            'Content-Length': pdfBuffer.length.toString(),
            'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
    });
};

function getIndonesianMonth(m: number): string {
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return months[m - 1] || '';
}