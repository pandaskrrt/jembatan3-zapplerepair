import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { redirect, error } from '@sveltejs/kit';
import PDFDocument from 'pdfkit';

export const GET: RequestHandler = async ({ params, locals }) => {
    const session = locals.session;
    if (!session) throw redirect(302, '/login');

    const report = await db.report.findUnique({
        where: { id: params.id },
        include: {
            audit: {
                include: {
                    section: { include: { cabinet: true } },
                    auditor: { select: { id: true, name: true, username: true } },
                    items: {
                        include: { card: true },
                        orderBy: { id: 'asc' }
                    }
                }
            },
            signatures: {
                include: {
                    signer: { select: { id: true, name: true, username: true } }
                },
                orderBy: { order: 'asc' }
            }
        }
    });

    if (!report) throw error(404, 'Report tidak ditemukan');

    const audit = report.audit;
    if (
        audit.auditorId !== session.id &&
        session.role !== 'ADMIN' &&
        session.role !== 'SUPER_ADMIN'
    ) throw error(403, 'Akses ditolak');

    const responsibleIds = (report.responsibleIds as string[]) || [];
    const responsiblePersons = responsibleIds.length > 0
        ? await db.user.findMany({
            where: { id: { in: responsibleIds } },
            select: { id: true, name: true, username: true }
          })
        : [];

    // ── PDF ──────────────────────────────────────────────────────────────────
    const chunks: Buffer[] = [];

    await new Promise<void>((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true });
        doc.on('data', (c: Buffer) => chunks.push(c));
        doc.on('end', resolve);
        doc.on('error', reject);

        const PW = doc.page.width;   // 595
        const PH = doc.page.height;  // 841
        const ML = 40, MR = 40;
        const CW = PW - ML - MR;     // 515

        // ── Warna ──
        const C = {
            dark:    '#0d0d1a',
            green:   '#00c97d',
            blue:    '#00aaff',
            amber:   '#f59e0b',
            red:     '#ef4444',
            white:   '#ffffff',
            gray:    '#888888',
            light:   '#f4f4f4',
            light2:  '#eaeaea',
            border:  '#dddddd',
            text:    '#1a1a1a',
            subtext: '#555555',
        };

        const fmt = (d: Date | string | null | undefined) => {
            if (!d) return '—';
            return new Date(d).toLocaleDateString('id-ID', {
                day: '2-digit', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        };

        const fmtShort = (d: Date | string | null | undefined) => {
            if (!d) return '—';
            return new Date(d).toLocaleDateString('id-ID', {
                day: '2-digit', month: 'short', year: 'numeric'
            });
        };

        // ════════════════════════════════════════════════════════════════════
        // HALAMAN 1 — KOP + RINGKASAN
        // ════════════════════════════════════════════════════════════════════

        // Header background
        doc.rect(0, 0, PW, 110).fill(C.dark);

        // Nama perusahaan / brand
        doc.fillColor(C.green).fontSize(20).font('Helvetica-Bold')
           .text('ROXY ZAPPLEREPAIR', ML, 22);
        doc.fillColor('#aaaaaa').fontSize(8).font('Helvetica')
           .text('Stock Audit Management System', ML, 46);

        // Info kanan atas
        const docNo = `SAR/${audit.section?.cabinet?.name ?? 'XX'}/${audit.id.slice(-6).toUpperCase()}/${new Date().getFullYear()}`;
        doc.fillColor('#aaaaaa').fontSize(7.5).font('Helvetica')
           .text(`No. Dokumen : ${docNo}`, PW - MR - 200, 22, { width: 200, align: 'right' })
           .text(`Tanggal Cetak : ${fmtShort(new Date())}`, PW - MR - 200, 34, { width: 200, align: 'right' });

        // Status chip
        const statusCfg: Record<string, { label: string; color: string }> = {
            DRAFT:            { label: 'DRAFT',                   color: C.amber  },
            PENDING_SIGN:     { label: 'MENUNGGU TANDA TANGAN',   color: C.blue   },
            PARTIALLY_SIGNED: { label: 'SEBAGIAN DITANDATANGANI', color: '#9b59b6'},
            COMPLETED:        { label: 'SELESAI',                  color: C.green  },
            REJECTED:         { label: 'DITOLAK',                  color: C.red    },
        };
        const sc = statusCfg[report.status] ?? { label: report.status, color: C.gray };
        const chipW = doc.widthOfString(sc.label, { fontSize: 7 }) + 16;
        doc.roundedRect(PW - MR - chipW, 46, chipW, 14, 4).fill(sc.color);
        doc.fillColor(C.dark).fontSize(7).font('Helvetica-Bold')
           .text(sc.label, PW - MR - chipW, 50, { width: chipW, align: 'center' });

        // Judul laporan
        doc.fillColor(C.white).fontSize(13).font('Helvetica-Bold')
           .text('LAPORAN HASIL STOCK AUDIT', ML, 70);
        doc.fillColor(C.green).fontSize(9).font('Helvetica')
           .text(`${audit.section?.cabinet?.name ?? '—'}  ›  ${audit.section?.name ?? '—'}`, ML, 88);

        // ── Info Audit (2 kolom) ──────────────────────────────────────────
        let y = 128;
        const infoBox = (label: string, val: string, x: number, w: number, iy: number) => {
            doc.fillColor(C.subtext).fontSize(7).font('Helvetica').text(label, x, iy);
            doc.fillColor(C.text).fontSize(8.5).font('Helvetica-Bold').text(val, x, iy + 11, { width: w });
        };

        const col1x = ML, col2x = ML + CW / 2 + 10;
        const colW2 = CW / 2 - 10;

        infoBox('Auditor',        audit.auditor?.name ?? '—',   col1x, colW2, y);
        infoBox('Tanggal Mulai',  fmt(audit.createdAt),          col2x, colW2, y);
        y += 38;
        infoBox('Kabinet',        audit.section?.cabinet?.name ?? '—', col1x, colW2, y);
        infoBox('Selesai Audit',  fmt(audit.completedAt),              col2x, colW2, y);
        y += 38;
        if (audit.note) {
            infoBox('Catatan', audit.note, col1x, CW, y);
            y += 38;
        }

        // Divider
        doc.rect(ML, y, CW, 1).fill(C.border);
        y += 14;

        // ── Stat cards ──────────────────────────────────────────────────────
        doc.fillColor(C.text).fontSize(9).font('Helvetica-Bold').text('RINGKASAN STATISTIK', ML, y);
        y += 16;

        const stats = [
            { label: 'Total Card', val: audit.totalCards   ?? 0, color: C.dark,  text: C.white },
            { label: 'Match',      val: audit.totalMatch    ?? 0, color: '#e8faf3', text: C.green },
            { label: 'Mismatch',   val: audit.totalMismatch ?? 0, color: '#fff8ec', text: C.amber },
            { label: 'Missing',    val: audit.totalMissing  ?? 0, color: '#fef2f2', text: C.red   },
            { label: 'New Entry',  val: audit.totalNewEntry ?? 0, color: '#eff8ff', text: C.blue  },
        ];

        const sW = (CW - 16) / 5;
        let sx = ML;
        stats.forEach(s => {
            doc.roundedRect(sx, y, sW, 52, 5).fill(s.color);
            doc.fillColor(s.text).fontSize(22).font('Helvetica-Bold')
               .text(String(s.val), sx, y + 8, { width: sW, align: 'center' });
            doc.fillColor(s.text).fontSize(7).font('Helvetica')
               .text(s.label, sx, y + 36, { width: sW, align: 'center' });
            sx += sW + 4;
        });
        y += 64;

        // Divider
        doc.rect(ML, y, CW, 1).fill(C.border);
        y += 14;

        // ── Tanda Tangan Auditor ─────────────────────────────────────────────
        doc.fillColor(C.text).fontSize(9).font('Helvetica-Bold').text('TANDA TANGAN AUDITOR', ML, y);
        y += 14;

        if (report.auditorSignature) {
            // Box tanda tangan
            doc.roundedRect(ML, y, 220, 72, 4).strokeColor(C.border).lineWidth(1).stroke();
            try {
                const b64 = report.auditorSignature.replace(/^data:image\/\w+;base64,/, '');
                const buf = Buffer.from(b64, 'base64');
                doc.image(buf, ML + 6, y + 6, { width: 208, height: 50 });
            } catch { /* skip */ }
            doc.fillColor(C.subtext).fontSize(7).font('Helvetica')
               .text(`${audit.auditor?.name ?? '—'} · ${fmt(report.auditorSignedAt)}`, ML + 4, y + 60);
            y += 82;
        } else {
            doc.roundedRect(ML, y, 220, 40, 4).fill('#fff8ec');
            doc.fillColor(C.amber).fontSize(8.5).font('Helvetica-Bold')
               .text('Belum ditandatangani', ML, y + 14, { width: 220, align: 'center' });
            y += 50;
        }

        // ── Penanggung Jawab ─────────────────────────────────────────────────
        y += 8;
        doc.rect(ML, y, CW, 1).fill(C.border);
        y += 14;
        doc.fillColor(C.text).fontSize(9).font('Helvetica-Bold').text('PENANGGUNG JAWAB', ML, y);
        y += 14;

        if (responsiblePersons.length === 0) {
            doc.fillColor(C.amber).fontSize(8).font('Helvetica').text('Belum dipilih', ML, y);
            y += 20;
        } else {
            const colPW = (CW - 10) / 2;
            responsiblePersons.forEach((p, i) => {
                const px = i % 2 === 0 ? ML : ML + colPW + 10;
                const py = i % 2 === 0 ? y : y;
                const sig = report.signatures.find(s => s.signerId === p.id);

                doc.roundedRect(px, py, colPW, 70, 4).strokeColor(C.border).lineWidth(1).stroke();

                doc.fillColor(C.text).fontSize(8.5).font('Helvetica-Bold')
                   .text(p.name, px + 8, py + 8);
                doc.fillColor(C.subtext).fontSize(7).font('Helvetica')
                   .text(`@${p.username}`, px + 8, py + 22);

                if (sig?.signature) {
                    try {
                        const b64 = sig.signature.replace(/^data:image\/\w+;base64,/, '');
                        const buf = Buffer.from(b64, 'base64');
                        doc.image(buf, px + colPW - 108, py + 4, { width: 100, height: 38 });
                    } catch { /* skip */ }
                    doc.fillColor(C.green).fontSize(6.5).font('Helvetica')
                       .text(`✓ ${fmt(sig.signedAt)}`, px + 8, py + 56);
                } else {
                    doc.fillColor(C.amber).fontSize(7.5).font('Helvetica-Bold')
                       .text('⏳ Menunggu tanda tangan', px + 8, py + 48);
                }

                if (i % 2 === 1 || i === responsiblePersons.length - 1) y += 80;
            });
        }

        // ════════════════════════════════════════════════════════════════════
        // HALAMAN 2 — DETAIL ITEM AUDIT
        // ════════════════════════════════════════════════════════════════════
        doc.addPage({ size: 'A4', margin: 0 });
        y = 0;

        // Mini header
        doc.rect(0, 0, PW, 44).fill(C.dark);
        doc.fillColor(C.green).fontSize(11).font('Helvetica-Bold')
           .text('ROXY ZAPPLEREPAIR', ML, 10);
        doc.fillColor('#aaaaaa').fontSize(8).font('Helvetica')
           .text('Detail Item Audit', ML, 26);
        doc.fillColor('#aaaaaa').fontSize(8)
           .text(`${audit.section?.cabinet?.name ?? ''} › ${audit.section?.name ?? ''}  |  ${fmtShort(audit.createdAt)}`,
               PW - MR - 240, 18, { width: 240, align: 'right' });
        y = 56;

        // Tabel header
        const COLS = [
            { label: '#',           x: ML,       w: 22,  align: 'center' as const },
            { label: 'Nama Card',   x: ML+22,    w: 148, align: 'left'   as const },
            { label: 'Kategori',    x: ML+170,   w: 80,  align: 'left'   as const },
            { label: 'Lokasi',      x: ML+250,   w: 60,  align: 'left'   as const },
            { label: 'Status',      x: ML+310,   w: 60,  align: 'center' as const },
            { label: 'Stok Sistem', x: ML+370,   w: 50,  align: 'center' as const },
            { label: 'Stok Fisik',  x: ML+420,   w: 50,  align: 'center' as const },
            { label: 'Catatan',     x: ML+470,   w: 45,  align: 'left'   as const },
        ];

        const ROW_H = 20;

        const drawTableHeader = (ty: number) => {
            doc.rect(ML, ty, CW, ROW_H).fill(C.dark);
            COLS.forEach(c => {
                doc.fillColor(C.green).fontSize(6.5).font('Helvetica-Bold')
                   .text(c.label, c.x + 2, ty + 6, { width: c.w - 4, align: c.align });
            });
            return ty + ROW_H;
        };

        y = drawTableHeader(y);

        const statusItemCfg: Record<string, { label: string; color: string; bg: string }> = {
            MATCH:     { label: 'Match',     color: C.green, bg: '#e8faf3' },
            MISMATCH:  { label: 'Mismatch',  color: C.amber, bg: '#fff8ec' },
            MISSING:   { label: 'Missing',   color: C.red,   bg: '#fef2f2' },
            NEW_ENTRY: { label: 'New Entry', color: C.blue,  bg: '#eff8ff' },
        };

        const items = audit.items ?? [];

        items.forEach((item: any, idx: number) => {
            // New page jika hampir penuh
            if (y > PH - 60) {
                doc.addPage({ size: 'A4', margin: 0 });
                doc.rect(0, 0, PW, 44).fill(C.dark);
                doc.fillColor(C.green).fontSize(11).font('Helvetica-Bold').text('ROXY ZAPPLEREPAIR', ML, 10);
                doc.fillColor('#aaaaaa').fontSize(8).font('Helvetica').text('Detail Item Audit (lanjutan)', ML, 26);
                y = 56;
                y = drawTableHeader(y);
            }

            const rowBg = idx % 2 === 0 ? C.light : C.light2;
            doc.rect(ML, y, CW, ROW_H).fill(rowBg);

            const sc2 = statusItemCfg[item.itemStatus];
            const name = item.card?.name ?? item.newCardName ?? '—';
            const cat  = item.card?.category
                ? `${item.card.category}${item.card.subCategory ? ' / ' + item.card.subCategory : ''}`
                : (item.newCardCategory ?? '—');
            const loc  = item.card?.location ?? item.newCardLocation ?? '—';
            const note = item.note ?? '—';

            doc.fillColor(C.subtext).fontSize(6.5).font('Helvetica')
               .text(String(idx + 1), COLS[0].x + 2, y + 6, { width: COLS[0].w - 4, align: 'center' });
            doc.fillColor(C.text).fontSize(7).font('Helvetica-Bold')
               .text(name, COLS[1].x + 2, y + 6, { width: COLS[1].w - 4, ellipsis: true });
            doc.fillColor(C.subtext).fontSize(6.5).font('Helvetica')
               .text(cat,  COLS[2].x + 2, y + 6, { width: COLS[2].w - 4, ellipsis: true })
               .text(loc,  COLS[3].x + 2, y + 6, { width: COLS[3].w - 4, ellipsis: true });

            // Status badge
            if (sc2) {
                const badgeW = COLS[4].w - 6;
                doc.roundedRect(COLS[4].x + 3, y + 4, badgeW, 12, 3).fill(sc2.bg);
                doc.fillColor(sc2.color).fontSize(6.5).font('Helvetica-Bold')
                   .text(sc2.label, COLS[4].x + 3, y + 7, { width: badgeW, align: 'center' });
            }

            const sys = item.systemStock  != null ? String(item.systemStock)  : '—';
            const fiz = item.physicalStock != null ? String(item.physicalStock) : '—';

            // Tandai selisih
            const mismatch = item.itemStatus === 'MISMATCH';
            doc.fillColor(mismatch ? C.amber : C.subtext).fontSize(7).font(mismatch ? 'Helvetica-Bold' : 'Helvetica')
               .text(sys, COLS[5].x + 2, y + 6, { width: COLS[5].w - 4, align: 'center' })
               .text(fiz, COLS[6].x + 2, y + 6, { width: COLS[6].w - 4, align: 'center' });

            doc.fillColor(C.subtext).fontSize(6).font('Helvetica')
               .text(note, COLS[7].x + 2, y + 6, { width: COLS[7].w - 4, ellipsis: true });

            y += ROW_H;
        });

        if (items.length === 0) {
            doc.rect(ML, y, CW, 30).fill(C.light);
            doc.fillColor(C.gray).fontSize(8).font('Helvetica')
               .text('Tidak ada item audit.', ML, y + 10, { width: CW, align: 'center' });
            y += 32;
        }

        // ── Footer setiap halaman ─────────────────────────────────────────────
        const totalPages = (doc as any).bufferedPageRange().count;
        for (let i = 0; i < totalPages; i++) {
            doc.switchToPage(i);
            doc.rect(0, PH - 28, PW, 28).fill('#f9f9f9');
            doc.rect(0, PH - 28, PW, 1).fill(C.border);
            doc.fillColor(C.gray).fontSize(7).font('Helvetica')
               .text(
                   `Halaman ${i + 1} dari ${totalPages}  ·  ID: ${report.id}  ·  Dicetak: ${fmt(new Date())}`,
                   ML, PH - 18, { width: CW, align: 'center' }
               );
        }

        doc.end();
    });

    const buf = Buffer.concat(chunks);
    const sectionName = audit?.section?.name ?? 'audit';
    const filename = `laporan-roxy-zapplerepair-${sectionName}-${new Date().toISOString().slice(0, 10)}.pdf`
        .replace(/\s+/g, '-').toLowerCase();

    return new Response(buf, {
        headers: {
            'Content-Type':        'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length':      String(buf.length)
        }
    });
};