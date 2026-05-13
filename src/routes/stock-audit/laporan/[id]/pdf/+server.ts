import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

export const GET: RequestHandler = async ({ params, locals }) => {
    const session = locals.session;
    const reportId = params.id;

    if (!session) {
        return new Response('Unauthorized', { status: 401 });
    }

    // Ambil data report lengkap
    const report = await db.report.findUnique({
        where: { id: reportId },
        include: {
            audit: {
                include: {
                    section: {
                        include: { cabinet: true }
                    },
                    auditor: true,
                    items: true
                }
            },
            signatures: {
                include: {
                    signer: true
                },
                orderBy: { order: 'asc' }
            }
        }
    });

    if (!report) {
        return new Response('Report not found', { status: 404 });
    }

    // Ambil penanggung jawab
    const responsibleIds = report.responsibleIds as string[] || [];
    let responsiblePersons = [];
    if (responsibleIds.length > 0) {
        responsiblePersons = await db.user.findMany({
            where: { id: { in: responsibleIds } }
        });
    }

    // Generate PDF
    const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
            Title: `Laporan Audit - ${report.audit.section?.name || 'Stock Audit'}`,
            Author: report.audit.auditor?.name || 'System',
            Subject: 'Stock Audit Report',
            Keywords: 'audit, stock, report'
        }
    });

    // Setup response
    const chunks: Uint8Array[] = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {});

    // Mulai generate konten PDF
    await generatePDFContent(doc, report, responsiblePersons);

    doc.end();

    // Return PDF stream
    return new Promise((resolve) => {
        doc.on('end', () => {
            const pdfBuffer = Buffer.concat(chunks);
            resolve(new Response(pdfBuffer, {
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename="laporan-audit-${report.audit.section?.name || 'report'}-${new Date().toISOString().split('T')[0]}.pdf"`
                }
            }));
        });
    });
};

async function generatePDFContent(doc: PDFKit.PDFDocument, report: any, responsiblePersons: any[]) {
    const audit = report.audit;
    
    // Header dengan border
    doc.rect(50, 45, 515, 80).stroke();
    
    // Logo / Kop Surat
    doc.fontSize(10)
        .font('Helvetica-Bold')
        .text('PT. GARUDA INDONESIA (Persero) Tbk', 70, 55, { align: 'left' });
    doc.fontSize(8)
        .font('Helvetica')
        .text('Jakarta Stock Audit System', 70, 70);
    doc.fontSize(7)
        .text('Jl. Medan Merdeka Barat No. 15, Jakarta Pusat 10110', 70, 80);
    doc.text('Telp: (021) 1234567 | Email: audit@garuda-indonesia.com', 70, 88);
    
    // Nomor Dokumen
    doc.fontSize(8)
        .text(`No. Dokumen: AUD/${audit.section?.cabinet?.name || 'STOCK'}/${audit.id.slice(-6)}/${new Date().getFullYear()}`, 400, 55, { align: 'right' });
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 400, 70, { align: 'right' });
    doc.text(`Status: ${getStatusText(report.status)}`, 400, 80, { align: 'right', color: getStatusColor(report.status) });
    
    // Garis pemisah
    doc.moveTo(50, 130).lineTo(565, 130).stroke();
    
    // Judul
    doc.fontSize(16)
        .font('Helvetica-Bold')
        .text('LAPORAN HASIL STOCK AUDIT', 50, 150, { align: 'center', underline: true });
    
    doc.moveDown(0.5);
    doc.fontSize(12)
        .font('Helvetica')
        .text(audit.section?.cabinet?.name || 'Cabinet', 50, 190, { align: 'center' });
    doc.fontSize(14)
        .font('Helvetica-Bold')
        .text(audit.section?.name || 'Section', 50, 210, { align: 'center' });
    
    doc.moveDown(1);
    
    // Table Ringkasan Audit
    doc.fontSize(11)
        .font('Helvetica-Bold')
        .text('RINGKASAN HASIL AUDIT', 50, 260);
    
    // Tabel data
    const tableTop = 280;
    const colWidths = [200, 300];
    let currentY = tableTop;
    
    // Header tabel
    doc.rect(50, currentY, colWidths[0], 25).fill('#f0f0f0');
    doc.rect(50 + colWidths[0], currentY, colWidths[1], 25).fill('#f0f0f0');
    doc.fillColor('#000000');
    doc.font('Helvetica-Bold')
        .text('Informasi', 55, currentY + 7)
        .text('Detail', 55 + colWidths[0], currentY + 7);
    
    currentY += 25;
    
    // Data rows
    const rows = [
        ['Tanggal Audit', formatDate(audit.createdAt)],
        ['Auditor', audit.auditor?.name || '-'],
        ['Total Card', audit.totalCards?.toString() || '0'],
        ['Match', audit.totalMatch?.toString() || '0'],
        ['Mismatch', audit.totalMismatch?.toString() || '0'],
        ['Missing', audit.totalMissing?.toString() || '0'],
        ['New Entry', audit.totalNewEntry?.toString() || '0']
    ];
    
    if (audit.note) {
        rows.push(['Catatan', audit.note]);
    }
    
    rows.forEach((row, i) => {
        const y = currentY + (i * 20);
        doc.font('Helvetica')
            .text(row[0], 55, y + 3)
            .text(row[1], 55 + colWidths[0], y + 3);
        
        // Garis border bawah
        if (i < rows.length - 1) {
            doc.moveTo(50, y + 20).lineTo(565, y + 20).stroke();
        }
    });
    
    const lastRowY = currentY + (rows.length * 20);
    doc.moveTo(50, lastRowY).lineTo(565, lastRowY).stroke();
    doc.moveTo(50, tableTop).lineTo(50, lastRowY).stroke();
    doc.moveTo(565, tableTop).lineTo(565, lastRowY).stroke();
    doc.moveTo(50 + colWidths[0], tableTop).lineTo(50 + colWidths[0], lastRowY).stroke();
    
    // Detail item mismatch (jika ada)
    if (audit.items && audit.items.length > 0) {
        const mismatchItems = audit.items.filter((item: any) => 
            item.systemQuantity !== item.physicalQuantity && 
            item.systemQuantity !== item.physicalQuantity
        );
        
        if (mismatchItems.length > 0) {
            doc.addPage();
            doc.fontSize(11)
                .font('Helvetica-Bold')
                .text('DETAIL KETIDAKSESUAIAN', 50, 50);
            
            let itemY = 80;
            doc.fontSize(9)
                .font('Helvetica-Bold')
                .text('No', 50, itemY)
                .text('Item Code', 80, itemY)
                .text('Item Name', 140, itemY)
                .text('System', 300, itemY)
                .text('Physical', 360, itemY)
                .text('Selisih', 420, itemY);
            
            itemY += 20;
            doc.moveTo(50, itemY - 5).lineTo(565, itemY - 5).stroke();
            
            mismatchItems.forEach((item: any, idx: number) => {
                if (itemY > 750) {
                    doc.addPage();
                    itemY = 50;
                }
                
                const diff = Math.abs((item.systemQuantity || 0) - (item.physicalQuantity || 0));
                doc.font('Helvetica')
                    .text((idx + 1).toString(), 50, itemY)
                    .text(item.code || '-', 80, itemY, { width: 55 })
                    .text(item.name || '-', 140, itemY, { width: 155 })
                    .text((item.systemQuantity || 0).toString(), 300, itemY)
                    .text((item.physicalQuantity || 0).toString(), 360, itemY)
                    .text(diff.toString(), 420, itemY);
                
                itemY += 20;
                doc.moveTo(50, itemY).lineTo(565, itemY).stroke();
            });
        }
    }
    
    // Halaman Tanda Tangan
    doc.addPage();
    
    // Tanda Tangan Auditor
    doc.fontSize(12)
        .font('Helvetica-Bold')
        .text('TANDA TANGAN AUDITOR', 50, 50, { underline: true });
    
    if (report.auditorSignature) {
        doc.fontSize(10)
            .font('Helvetica')
            .text('Auditor:', 50, 85);
        doc.text(audit.auditor?.name || '-', 150, 85);
        
        // Tampilkan gambar tanda tangan
        try {
            const signatureBuffer = Buffer.from(report.auditorSignature.split(',')[1], 'base64');
            doc.image(signatureBuffer, 50, 110, { width: 200, height: 60 });
            doc.text('(Tanda Tangan Auditor)', 50, 180, { fontSize: 8, italic: true });
            
            if (report.auditorSignedAt) {
                doc.fontSize(8)
                    .text(`Ditandatangani pada: ${formatDate(report.auditorSignedAt)}`, 50, 200);
            }
        } catch (err) {
            doc.text('Tanda tangan tidak tersedia', 50, 110);
        }
    } else {
        doc.fontSize(10)
            .text('Status: Belum Ditandatangani', 50, 85);
        doc.text('(Tanda tangan auditor masih menunggu)', 50, 110, { color: 'gray', italic: true });
    }
    
    // Tanda Tangan Penanggung Jawab
    let yPosition = 260;
    
    if (responsiblePersons.length > 0) {
        doc.fontSize(12)
            .font('Helvetica-Bold')
            .text('TANDA TANGAN PENANGGUNG JAWAB', 50, yPosition, { underline: true });
        
        yPosition += 35;
        
        const signatureItems = report.signatures || [];
        
        for (let i = 0; i < responsiblePersons.length; i++) {
            const person = responsiblePersons[i];
            const signature = signatureItems.find((sig: any) => sig.signerId === person.id);
            
            doc.fontSize(10)
                .font('Helvetica-Bold')
                .text(`Penanggung Jawab ${i + 1}:`, 50, yPosition);
            doc.font('Helvetica')
                .text(person.name, 50, yPosition + 15)
                .text(`(@${person.username})`, 50, yPosition + 30, { fontSize: 8 });
            
            if (signature && signature.signature) {
                try {
                    const sigBuffer = Buffer.from(signature.signature.split(',')[1], 'base64');
                    doc.image(sigBuffer, 300, yPosition, { width: 150, height: 45 });
                    doc.fontSize(8)
                        .text('(Tanda Tangan)', 300, yPosition + 50, { italic: true });
                    
                    if (signature.signedAt) {
                        doc.fontSize(7)
                            .text(`Tanggal: ${formatDate(signature.signedAt)}`, 300, yPosition + 60);
                    }
                } catch (err) {
                    doc.text('Tanda tangan tidak tersedia', 300, yPosition + 20);
                }
            } else {
                doc.fontSize(9)
                    .font('Helvetica-Oblique')
                    .text('⏳ Belum ditandatangani', 300, yPosition + 20, { color: 'orange' });
            }
            
            yPosition += 100;
            
            // Cek apakah perlu halaman baru
            if (yPosition > 700 && i < responsiblePersons.length - 1) {
                doc.addPage();
                yPosition = 50;
            }
        }
    } else {
        doc.fontSize(10)
            .text('Penanggung Jawab: Belum ditentukan', 50, yPosition);
    }
    
    // Footer setiap halaman
    const totalPages = doc.bufferedPageRange().count;
    for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        doc.fontSize(7)
            .font('Helvetica')
            .text(
                `Halaman ${i + 1} dari ${totalPages} | Dokumen ini dibuat secara elektronik dan sah tanpa tanda tangan basah`,
                50,
                doc.page.height - 30,
                { align: 'center', color: 'gray' }
            );
    }
}

function formatDate(date: Date | string | null): string {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
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
        'DRAFT': '#FFA500',
        'PENDING_SIGN': '#3498DB',
        'COMPLETED': '#27AE60'
    };
    return colorMap[status] || '#000000';
}