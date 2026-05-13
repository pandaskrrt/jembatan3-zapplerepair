import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import PDFDocument from 'pdfkit';
import type { StockAuditItem, User } from '@prisma/client';

export const GET: RequestHandler = async ({ params, locals }) => {
    const session = locals.session;
    const reportId = params.id;

    if (!session) {
        return new Response('Unauthorized', { status: 401 });
    }

    // Ambil data lengkap dengan semua relasi - HAPUS orderBy yang bermasalah
    const report = await db.report.findUnique({
        where: { id: reportId },
        include: {
            audit: {
                include: {
                    section: {
                        include: { cabinet: true }
                    },
                    auditor: true,
                    items: true  // Hapus orderBy, ambil semua items
                }
            },
            signatures: {
                include: {
                    signer: true
                },
                orderBy: {
                    order: 'asc'  // Ini aman karena field order ada
                }
            }
        }
    });

    if (!report) {
        return new Response('Report not found', { status: 404 });
    }

    // Urutkan items di memory (javascript) jika perlu
    const sortedItems = report.audit.items?.sort((a: any, b: any) => {
        return (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0);
    }) || [];

    // Ambil data penanggung jawab
    const responsibleIds = report.responsibleIds as string[] || [];
    let responsiblePersons: User[] = [];
    if (responsibleIds.length > 0) {
        responsiblePersons = await db.user.findMany({
            where: { id: { in: responsibleIds } }
        });
    }

    // Buat PDF dengan data yang sudah di-sort
    const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        bufferPages: true,
        info: {
            Title: `Laporan Audit Stock - ${report.audit.section?.name || 'Stock Audit'}`,
            Author: report.audit.auditor?.name || 'System',
            Subject: 'Laporan Hasil Stock Audit',
            Keywords: 'audit, stock, inventory, report',
            Creator: 'Stock Audit System',
            Producer: 'PDFKit'
        }
    });

    // Set response headers untuk download
    doc.on('end', () => {});
    
    // Generate konten PDF dengan data yang sudah di-sort
    await generatePDFContent(doc, report, responsiblePersons, sortedItems);
    
    doc.end();

    // Return PDF stream
    return new Response(doc as unknown as ReadableStream, {
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="Laporan_Audit_${report.audit.section?.name || 'Stock'}_${new Date().toISOString().split('T')[0]}.pdf"`
        }
    });
};

async function generatePDFContent(doc: PDFKit.PDFDocument, report: any, responsiblePersons: User[], sortedItems: any[]) {
    const audit = report.audit;
    const currentDate = new Date();
    
    // ==================== HALAMAN 1 ====================
    
    // Header dengan border
    doc.rect(50, 45, 515, 100).stroke();
    
    // Logo / Kop Surat
    doc.fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#1a1a1a')
        .text('PT. GARUDA INDONESIA (Persero) Tbk', 70, 55, { align: 'left' });
    
    doc.fontSize(8)
        .font('Helvetica')
        .fillColor('#555555')
        .text('Divisi Internal Audit & Stock Opname', 70, 70);
    doc.text('Gedung Manajemen Lantai 5', 70, 80);
    doc.text('Jl. Medan Merdeka Barat No. 15, Jakarta Pusat 10110', 70, 90);
    doc.text('Telp: (021) 1234567 | Email: internal.audit@garuda-indonesia.com', 70, 100);
    
    // Nomor Dokumen
    doc.fontSize(8)
        .fillColor('#333333')
        .text(`No. Dokumen: AUD/${audit.section?.cabinet?.name || 'STK'}/${audit.id.slice(-6)}/${currentDate.getFullYear()}`, 400, 55, { align: 'right' });
    doc.text(`Tanggal Cetak: ${formatDateIndonesian(currentDate)}`, 400, 70, { align: 'right' });
    doc.text(`Waktu Cetak: ${currentDate.toLocaleTimeString('id-ID')}`, 400, 80, { align: 'right' });
    doc.text(`Status: ${getStatusText(report.status)}`, 400, 90, { align: 'right', fillColor: getStatusColor(report.status) });
    
    // Garis pemisah
    doc.moveTo(50, 150).lineTo(565, 150).stroke();
    
    // Judul Utama
    doc.fontSize(18)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text('LAPORAN HASIL STOCK AUDIT', 50, 170, { align: 'center', underline: true });
    
    doc.moveDown(0.5);
    doc.fontSize(12)
        .font('Helvetica')
        .fillColor('#555555')
        .text(audit.section?.cabinet?.name || 'CABINET', 50, 210, { align: 'center' });
    doc.fontSize(14)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text(audit.section?.name || 'SECTION NAME', 50, 230, { align: 'center' });
    
    doc.moveDown(1.5);
    
    // ==================== RINGKASAN AUDIT ====================
    doc.fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text('A. RINGKASAN HASIL AUDIT', 50, 280);
    
    doc.moveDown(0.5);
    
    // Tabel Ringkasan
    const tableTop = 310;
    const colWidths = [180, 335];
    let currentY = tableTop;
    
    // Header tabel
    doc.rect(50, currentY, colWidths[0], 22).fill('#2c3e50');
    doc.rect(50 + colWidths[0], currentY, colWidths[1], 22).fill('#2c3e50');
    doc.fillColor('#ffffff');
    doc.font('Helvetica-Bold')
        .fontSize(10)
        .text('INFORMASI', 55, currentY + 6)
        .text('DETAIL', 55 + colWidths[0], currentY + 6);
    
    currentY += 22;
    doc.fillColor('#000000');
    
    // Data rows
    const rows = [
        { label: 'Tanggal Audit', value: formatDateIndonesian(audit.createdAt) },
        { label: 'Auditor', value: audit.auditor?.name || '-' },
        { label: 'Total Item yang Diaudit', value: (audit.totalCards || 0).toString() + ' item' },
        { label: 'Status Match', value: (audit.totalMatch || 0).toString() + ' item', color: '#27ae60' },
        { label: 'Status Mismatch', value: (audit.totalMismatch || 0).toString() + ' item', color: '#e67e22' },
        { label: 'Item Missing', value: (audit.totalMissing || 0).toString() + ' item', color: '#e74c3c' },
        { label: 'Item Baru (New Entry)', value: (audit.totalNewEntry || 0).toString() + ' item', color: '#3498db' }
    ];
    
    rows.forEach((row, index) => {
        const y = currentY + (index * 20);
        const isEven = index % 2 === 0;
        
        // Background row
        if (isEven) {
            doc.rect(50, y, colWidths[0], 20).fill('#f9f9f9');
            doc.rect(50 + colWidths[0], y, colWidths[1], 20).fill('#f9f9f9');
            doc.fillColor('#000000');
        }
        
        doc.font('Helvetica')
            .fontSize(9)
            .text(row.label, 55, y + 6);
        
        if (row.color) {
            doc.fillColor(row.color);
        }
        doc.text(row.value, 55 + colWidths[0], y + 6);
        doc.fillColor('#000000');
        
        // Border
        doc.rect(50, y, colWidths[0], 20).stroke();
        doc.rect(50 + colWidths[0], y, colWidths[1], 20).stroke();
    });
    
    const lastRowY = currentY + (rows.length * 20);
    doc.moveTo(50, lastRowY).lineTo(565, lastRowY).stroke();
    
    // Catatan jika ada
    if (audit.note) {
        doc.moveDown(1);
        doc.fontSize(9)
            .font('Helvetica-Bold')
            .fillColor('#000000')
            .text('Catatan Audit:', 50, lastRowY + 20);
        doc.font('Helvetica')
            .fontSize(9)
            .fillColor('#555555')
            .text(audit.note, 50, lastRowY + 35, { width: 515, align: 'justify' });
    }
    
    // ==================== DETAIL ITEM MISMATCH ====================
    // Gunakan sortedItems yang sudah di-sort di JavaScript
    const mismatchItems = sortedItems.filter((item: StockAuditItem) => 
        item.systemQuantity !== item.physicalQuantity
    );
    
    if (mismatchItems.length > 0) {
        doc.addPage();
        
        doc.fontSize(12)
            .font('Helvetica-Bold')
            .fillColor('#000000')
            .text('B. DETAIL KETIDAKSESUAIAN ITEM', 50, 50);
        
        doc.moveDown(0.5);
        
        let itemY = 90;
        const headers = ['No', 'Kode Item', 'Nama Item', 'System', 'Fisik', 'Selisih'];
        const colWidthsDetail = [30, 80, 200, 70, 70, 60];
        
        // Header tabel detail
        let xPos = 50;
        doc.rect(50, itemY, 515, 22).fill('#34495e');
        doc.fillColor('#ffffff');
        doc.fontSize(8);
        headers.forEach((header, idx) => {
            doc.text(header, xPos + 5, itemY + 7);
            xPos += colWidthsDetail[idx];
        });
        
        itemY += 22;
        doc.fillColor('#000000');
        
        mismatchItems.forEach((item: StockAuditItem, idx: number) => {
            if (itemY > 750) {
                doc.addPage();
                itemY = 50;
                
                // Re-draw header
                xPos = 50;
                doc.rect(50, itemY, 515, 22).fill('#34495e');
                doc.fillColor('#ffffff');
                headers.forEach((header, hidx) => {
                    doc.text(header, xPos + 5, itemY + 7);
                    xPos += colWidthsDetail[hidx];
                });
                itemY += 22;
                doc.fillColor('#000000');
            }
            
            const isEven = idx % 2 === 0;
            if (isEven) {
                doc.rect(50, itemY, 515, 20).fill('#f9f9f9');
                doc.fillColor('#000000');
            }
            
            const diff = Math.abs((item.systemQuantity || 0) - (item.physicalQuantity || 0));
            xPos = 50;
            
            doc.fontSize(8);
            doc.text((idx + 1).toString(), xPos + 5, itemY + 6);
            xPos += colWidthsDetail[0];
            
            doc.text(item.code || '-', xPos + 5, itemY + 6);
            xPos += colWidthsDetail[1];
            
            doc.text((item.name || '-').substring(0, 40), xPos + 5, itemY + 6);
            xPos += colWidthsDetail[2];
            
            doc.text((item.systemQuantity || 0).toString(), xPos + 5, itemY + 6);
            xPos += colWidthsDetail[3];
            
            doc.text((item.physicalQuantity || 0).toString(), xPos + 5, itemY + 6);
            xPos += colWidthsDetail[4];
            
            doc.fillColor(diff > 0 ? '#e74c3c' : '#000000');
            doc.text(diff.toString(), xPos + 5, itemY + 6);
            doc.fillColor('#000000');
            
            itemY += 20;
            doc.rect(50, itemY - 20, 515, 20).stroke();
        });
        
        // Footer summary mismatch
        doc.moveDown(1);
        doc.fontSize(9)
            .font('Helvetica-Bold')
            .fillColor('#e74c3c')
            .text(`Total item dengan ketidaksesuaian: ${mismatchItems.length} item`, 50, itemY + 10);
    }
    
    // ==================== HALAMAN TANDA TANGAN ====================
    doc.addPage();
    
    // Tanda Tangan Auditor
    doc.fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#000000')
        .text('C. TANDA TANGAN AUDITOR', 50, 50, { underline: true });
    
    doc.moveDown(0.5);
    
    if (report.auditorSignature) {
        // Informasi Auditor
        doc.fontSize(10)
            .font('Helvetica')
            .fillColor('#000000')
            .text('Auditor:', 50, 85);
        doc.font('Helvetica-Bold')
            .text(audit.auditor?.name || '-', 120, 85);
        
        doc.font('Helvetica')
            .fontSize(9)
            .text('Jabatan:', 50, 105);
        doc.text('Internal Auditor', 120, 105);
        
        // Tampilkan gambar tanda tangan
        try {
            const signatureBuffer = Buffer.from(report.auditorSignature.split(',')[1], 'base64');
            doc.image(signatureBuffer, 50, 130, { width: 200, height: 60 });
            
            doc.fontSize(8)
                .font('Helvetica-Oblique')
                .fillColor('#555555')
                .text('(Tanda Tangan Elektronik)', 50, 195);
            
            if (report.auditorSignedAt) {
                doc.text(`Ditandatangani pada: ${formatDateIndonesian(report.auditorSignedAt)}`, 50, 210);
            }
        } catch (err) {
            doc.fontSize(9)
                .fillColor('#e74c3c')
                .text('⚠️ Gagal memuat gambar tanda tangan', 50, 140);
        }
        
        // Stempel
        doc.rect(400, 130, 150, 80).stroke();
        doc.fontSize(7)
            .fillColor('#888888')
            .text('DOKUMEN INI TELAH', 420, 140, { align: 'center' })
            .text('DITANDATANGANI SECARA', 420, 150, { align: 'center' })
            .text('ELEKTRONIK', 420, 160, { align: 'center', bold: true })
            .text('Sah tanpa tanda tangan basah', 420, 175, { align: 'center' });
    } else {
        doc.fontSize(10)
            .fillColor('#e67e22')
            .text('⚠️ Status: BELUM DITANDATANGANI', 50, 85);
        doc.fontSize(9)
            .fillColor('#888888')
            .text('Auditor belum melakukan penandatanganan laporan ini.', 50, 105);
        doc.text('Tanda tangan akan muncul setelah auditor menyelesaikan penandatanganan.', 50, 120);
        
        // Placeholder tanda tangan
        doc.rect(50, 140, 250, 70).stroke();
        doc.fontSize(8)
            .fillColor('#cccccc')
            .text('Kotak Tanda Tangan Auditor', 60, 175, { align: 'center' });
    }
    
    // Tanda Tangan Penanggung Jawab
    let yPosition = 280;
    
    if (responsiblePersons.length > 0) {
        doc.fontSize(12)
            .font('Helvetica-Bold')
            .fillColor('#000000')
            .text('D. TANDA TANGAN PENANGGUNG JAWAB', 50, yPosition, { underline: true });
        
        yPosition += 35;
        
        const signatureItems = report.signatures || [];
        
        for (let i = 0; i < responsiblePersons.length; i++) {
            const person = responsiblePersons[i];
            const signature = signatureItems.find((sig: any) => sig.signerId === person.id);
            
            // Background card
            doc.rect(50, yPosition, 515, 110).fill('#f8f9fa');
            doc.rect(50, yPosition, 515, 110).stroke();
            
            doc.fillColor('#000000');
            doc.fontSize(10)
                .font('Helvetica-Bold')
                .text(`Penanggung Jawab ${i + 1}`, 65, yPosition + 10);
            
            doc.font('Helvetica')
                .fontSize(9)
                .text('Nama:', 65, yPosition + 30);
            doc.font('Helvetica-Bold')
                .text(person.name, 120, yPosition + 30);
            
            doc.font('Helvetica')
                .text('Username:', 65, yPosition + 48);
            doc.text(`@${person.username}`, 120, yPosition + 48);
            
            // Tanda tangan
            if (signature && signature.signature) {
                try {
                    const sigBuffer = Buffer.from(signature.signature.split(',')[1], 'base64');
                    doc.image(sigBuffer, 350, yPosition + 15, { width: 180, height: 50 });
                    
                    doc.fontSize(7)
                        .font('Helvetica-Oblique')
                        .fillColor('#555555')
                        .text('(Tanda Tangan Elektronik)', 350, yPosition + 70);
                    
                    if (signature.signedAt) {
                        doc.text(`Tanggal: ${formatDateIndonesian(signature.signedAt)}`, 350, yPosition + 80);
                    }
                    
                    // Stempel sah
                    doc.rect(470, yPosition + 15, 80, 25).fill('#27ae60');
                    doc.fillColor('#ffffff')
                        .fontSize(7)
                        .text('SAH', 485, yPosition + 28, { align: 'center' });
                } catch (err) {
                    doc.fillColor('#e74c3c')
                        .text('⚠️ Gagal memuat tanda tangan', 350, yPosition + 30);
                }
            } else {
                doc.fillColor('#e67e22')
                    .fontSize(9)
                    .text('⏳ Menunggu tanda tangan', 350, yPosition + 30);
                doc.fillColor('#888888')
                    .fontSize(7)
                    .text('Belum ditandatangani', 350, yPosition + 45);
            }
            
            yPosition += 130;
            
            // Cek halaman baru
            if (yPosition > 750 && i < responsiblePersons.length - 1) {
                doc.addPage();
                yPosition = 50;
            } else if (i < responsiblePersons.length - 1) {
                doc.moveDown(0.5);
            }
        }
    } else {
        doc.fontSize(10)
            .fillColor('#e67e22')
            .text('⚠️ Status: BELUM ADA PENANGGUNG JAWAB', 50, yPosition + 35);
        doc.fontSize(9)
            .fillColor('#888888')
            .text('Penanggung jawab belum ditentukan untuk laporan ini.', 50, yPosition + 55);
    }
    
    // ==================== LEMBAR PENGESAHAN ====================
    if (report.status === 'COMPLETED') {
        doc.addPage();
        
        doc.fontSize(14)
            .font('Helvetica-Bold')
            .fillColor('#000000')
            .text('LEMBAR PENGESAHAN', 50, 50, { align: 'center', underline: true });
        
        doc.moveDown(2);
        
        doc.fontSize(10)
            .font('Helvetica')
            .fillColor('#333333')
            .text('Laporan hasil stock audit ini telah diperiksa dan disetujui oleh:', 50, 100, { align: 'center' });
        
        doc.moveDown(1);
        
        // Tanda tangan auditor
        doc.rect(80, 150, 200, 100).stroke();
        doc.fontSize(9)
            .text('Auditor', 180, 160, { align: 'center' })
            .moveDown(5)
            .font('Helvetica-Bold')
            .text(audit.auditor?.name || '-', 180, 220, { align: 'center' });
        
        // Tanda tangan penanggung jawab 1
        if (responsiblePersons[0]) {
            doc.rect(320, 150, 200, 100).stroke();
            doc.fontSize(9)
                .font('Helvetica')
                .text('Penanggung Jawab', 420, 160, { align: 'center' })
                .moveDown(5)
                .font('Helvetica-Bold')
                .text(responsiblePersons[0].name, 420, 220, { align: 'center' });
        }
        
        // Tanda tangan penanggung jawab 2
        if (responsiblePersons[1]) {
            doc.rect(200, 290, 200, 100).stroke();
            doc.fontSize(9)
                .font('Helvetica')
                .text('Penanggung Jawab 2', 300, 300, { align: 'center' })
                .moveDown(5)
                .font('Helvetica-Bold')
                .text(responsiblePersons[1].name, 300, 360, { align: 'center' });
        }
        
        doc.moveDown(8);
        doc.fontSize(8)
            .font('Helvetica-Oblique')
            .fillColor('#555555')
            .text('Laporan ini sah dan berlaku secara elektronik.', 50, 450, { align: 'center' });
        doc.text(`Ditetapkan di Jakarta, ${formatDateIndonesian(currentDate)}`, 50, 465, { align: 'center' });
    }
    
    // ==================== FOOTER SETIAP HALAMAN ====================
    const totalPages = doc.bufferedPageRange().count;
    for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        doc.fontSize(7)
            .font('Helvetica')
            .fillColor('#999999')
            .text(
                `Halaman ${i + 1} dari ${totalPages} | Dokumen ini dibuat secara elektronik dan sah tanpa tanda tangan basah | Sistem Audit Stock Online`,
                50,
                doc.page.height - 30,
                { align: 'center' }
            );
        
        // ID Dokumen
        doc.fontSize(6)
            .text(`ID Dokumen: ${report.id}`, 50, doc.page.height - 20, { align: 'center' });
    }
}

function formatDateIndonesian(date: Date | string | null): string {
    if (!date) return '-';
    const d = new Date(date);
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
        'DRAFT': 'DRAFT',
        'PENDING_SIGN': 'MENUNGGU TANDA TANGAN',
        'COMPLETED': 'SELESAI'
    };
    return statusMap[status] || status;
}

function getStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
        'DRAFT': '#f39c12',
        'PENDING_SIGN': '#3498db',
        'COMPLETED': '#27ae60'
    };
    return colorMap[status] || '#000000';
}