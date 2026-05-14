// /src/routes/api/preview-pdf/[id]/+server.ts
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

    const chunks: Buffer[] = [];

    await new Promise<void>((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true });
        doc.on('data', (c: Buffer) => chunks.push(c));
        doc.on('end', resolve);
        doc.on('error', reject);

        const PW = doc.page.width;   // 595.28
        const PH = doc.page.height;  // 841.89
        const ML = 55, MR = 55;
        const CW = PW - ML - MR;     // 485.28

        // ── Tinggi footer TTD (fixed di bottom halaman terakhir) ─────────────
        const SIG_BOX_H   = 95;
        const FOOTER_H    = 1 + 6 + 14 + 4 + 10 + 10 + SIG_BOX_H + 6 + 8 + 12;
        const FOOTER_Y    = PH - FOOTER_H - 14;
        const SAFE_BOTTOM = FOOTER_Y - 8;

        const C = {
            black:  '#000000',
            dark:   '#1a1a1a',
            mid:    '#444444',
            sub:    '#666666',
            light:  '#f8f8f8',
            light2: '#efefef',
            border: '#cccccc',
            white:  '#ffffff',
        };

        const fmt = (d: Date | string | null | undefined) => {
            if (!d) return '—';
            return new Date(d).toLocaleDateString('id-ID', {
                day: '2-digit', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        };
        const fmtDate = (d: Date | string | null | undefined) => {
            if (!d) return '—';
            return new Date(d).toLocaleDateString('id-ID', {
                day: '2-digit', month: 'long', year: 'numeric'
            });
        };

        const docNo = `SAR/${audit.section?.cabinet?.name ?? 'XX'}/${audit.id.slice(-6).toUpperCase()}/${new Date().getFullYear()}`;

        // ── Kop halaman pertama ──────────────────────────────────────────────
        const drawKop = () => {
            doc.rect(ML, 40, CW, 2).fill(C.black);
            doc.fillColor(C.black).fontSize(16).font('Helvetica-Bold')
               .text('ROXY ZAPPLEREPAIR', ML, 50, { width: CW, align: 'center' });
            doc.fillColor(C.mid).fontSize(8).font('Helvetica')
               .text('Jasa Perbaikan & Aksesoris Apple — Jakarta', ML, 70, { width: CW, align: 'center' });
            doc.fillColor(C.mid).fontSize(7.5).font('Helvetica')
               .text('Telp: (021) 1234-5678  |  email@roxyzapplerepair.com', ML, 81, { width: CW, align: 'center' });
            doc.rect(ML, 96, CW, 1).fill(C.black);
            doc.rect(ML, 99, CW, 0.4).fill(C.border);
        };

        // ── Mini kop halaman lanjutan ────────────────────────────────────────
        const drawMiniKop = (subtitle: string) => {
            doc.fillColor(C.black).fontSize(9).font('Helvetica-Bold')
               .text('ROXY ZAPPLEREPAIR', ML, 14);
            doc.fillColor(C.mid).fontSize(7.5).font('Helvetica')
               .text(`— ${subtitle}`, ML + 122, 14);
            doc.fillColor(C.mid).fontSize(7).font('Helvetica')
               .text(docNo, ML, 14, { width: CW, align: 'right' });
            doc.rect(ML, 28, CW, 1).fill(C.black);
            doc.rect(ML, 30, CW, 0.4).fill(C.border);
        };

        // ════════════════════════════════════════════════════════════════════
        // HALAMAN 1 — KOP + INFO + STATISTIK
        // ════════════════════════════════════════════════════════════════════
        drawKop();
        let y = 114;

        // Judul
        doc.fillColor(C.black).fontSize(13).font('Helvetica-Bold')
           .text('LAPORAN HASIL STOCK AUDIT', ML, y, { width: CW, align: 'center' });
        y += 18;
        doc.fillColor(C.mid).fontSize(9).font('Helvetica')
           .text(`${audit.section?.cabinet?.name ?? '—'}  /  ${audit.section?.name ?? '—'}`, ML, y, { width: CW, align: 'center' });
        y += 18;
        doc.rect(ML, y, CW, 1).fill(C.black);
        y += 10;

        // No dokumen
        doc.fillColor(C.mid).fontSize(7.5).font('Helvetica')
           .text(docNo, ML, y)
           .text(`Dicetak: ${fmtDate(new Date())}`, ML, y, { width: CW, align: 'right' });
        y += 20;

        // Info audit
        const infoData: [string, string][] = [
            ['Auditor',         audit.auditor?.name ?? '—'],
            ['Kabinet / Seksi', `${audit.section?.cabinet?.name ?? '—'} / ${audit.section?.name ?? '—'}`],
            ['Tanggal Audit',   fmt(audit.createdAt)],
            ['Selesai Audit',   fmt(audit.completedAt)],
            ...(audit.note ? [['Catatan', audit.note] as [string, string]] : []),
        ];
        const IR = 15;
        const infoStartY = y;
        infoData.forEach((row, i) => {
            const ry = y + i * IR;
            doc.rect(ML, ry, CW, IR).fill(i % 2 === 0 ? C.light : C.white);
            doc.fillColor(C.sub).fontSize(7).font('Helvetica-Bold').text(row[0], ML + 4, ry + 4, { width: 120 });
            doc.fillColor(C.dark).fontSize(7).font('Helvetica').text(row[1], ML + 128, ry + 4, { width: CW - 132 });
        });
        y += infoData.length * IR;
        doc.rect(ML, infoStartY, CW, infoData.length * IR).strokeColor(C.border).lineWidth(0.5).stroke();
        y += 12;

        // Statistik
        doc.fillColor(C.black).fontSize(8.5).font('Helvetica-Bold').text('RINGKASAN STATISTIK', ML, y);
        y += 10;
        const stats = [
            { label: 'Total Card', val: audit.totalCards   ?? 0 },
            { label: 'Match',      val: audit.totalMatch    ?? 0 },
            { label: 'Mismatch',   val: audit.totalMismatch ?? 0 },
            { label: 'Missing',    val: audit.totalMissing  ?? 0 },
            { label: 'New Entry',  val: audit.totalNewEntry ?? 0 },
        ];
        const sW = (CW - 4 * 6) / 5;
        let sx = ML;
        stats.forEach(s => {
            doc.rect(sx, y, sW, 34).strokeColor(C.border).lineWidth(0.5).stroke();
            doc.fillColor(C.black).fontSize(16).font('Helvetica-Bold')
               .text(String(s.val), sx, y + 4, { width: sW, align: 'center' });
            doc.fillColor(C.sub).fontSize(6).font('Helvetica')
               .text(s.label, sx, y + 24, { width: sW, align: 'center' });
            sx += sW + 6;
        });
        y += 44;

        // ── Tabel Detail Item ─────────────────────────────────────────────────
        doc.fillColor(C.black).fontSize(8.5).font('Helvetica-Bold').text('DETAIL ITEM AUDIT', ML, y);
        y += 10;

        const COLS = [
            { label: 'No',         x: ML,      w: 20,  align: 'center' as const },
            { label: 'Nama Card',  x: ML+20,   w: 135, align: 'left'   as const },
            { label: 'Kategori',   x: ML+155,  w: 75,  align: 'left'   as const },
            { label: 'Lokasi',     x: ML+230,  w: 55,  align: 'left'   as const },
            { label: 'Status',     x: ML+285,  w: 52,  align: 'center' as const },
            { label: 'Stok Sis.', x: ML+337,  w: 38,  align: 'center' as const },
            { label: 'Stok Fis.', x: ML+375,  w: 38,  align: 'center' as const },
            { label: 'Selisih',    x: ML+413,  w: 32,  align: 'center' as const },
            { label: 'Catatan',    x: ML+445,  w: 40,  align: 'left'   as const },
        ];
        const ROW_H = 15;

        const drawTblHeader = (ty: number) => {
            doc.rect(ML, ty, CW, ROW_H).fill(C.dark);
            COLS.forEach(c => {
                doc.fillColor(C.white).fontSize(5.5).font('Helvetica-Bold')
                   .text(c.label, c.x + 2, ty + 5, { width: c.w - 4, align: c.align });
            });
            return ty + ROW_H;
        };

        const statusLabel: Record<string, string> = {
            MATCH: 'Match', MISMATCH: 'Mismatch', MISSING: 'Missing', NEW_ENTRY: 'New Entry'
        };

        const items = audit.items ?? [];
        y = drawTblHeader(y);

        items.forEach((item: any, idx: number) => {
            if (y + ROW_H > SAFE_BOTTOM) {
                doc.addPage({ size: 'A4', margin: 0 });
                drawMiniKop('Detail Item Audit (lanjutan)');
                y = 42;
                y = drawTblHeader(y);
            }

            const bg = idx % 2 === 0 ? C.light : C.white;
            doc.rect(ML, y, CW, ROW_H).fill(bg);

            const name = item.card?.name ?? item.newCardName ?? '—';
            const cat  = item.card?.category
                ? `${item.card.category}${item.card.subCategory ? '/' + item.card.subCategory : ''}`
                : (item.newCardCategory ?? '—');
            const loc  = item.card?.location ?? item.newCardLocation ?? '—';
            const note = item.note ?? '—';
            const sys  = item.systemStock  != null ? String(item.systemStock)  : '—';
            const fiz  = item.physicalStock != null ? String(item.physicalStock) : '—';
            const diff = (item.systemStock != null && item.physicalStock != null)
                ? Math.abs(item.systemStock - item.physicalStock) : null;
            const isMismatch = item.itemStatus === 'MISMATCH';

            doc.fillColor(C.sub).fontSize(5.5).font('Helvetica')
               .text(String(idx + 1), COLS[0].x + 2, y + 5, { width: COLS[0].w - 4, align: 'center' });
            doc.fillColor(C.dark).fontSize(6).font('Helvetica-Bold')
               .text(name, COLS[1].x + 2, y + 5, { width: COLS[1].w - 4, ellipsis: true });
            doc.fillColor(C.sub).fontSize(5.5).font('Helvetica')
               .text(cat,  COLS[2].x + 2, y + 5, { width: COLS[2].w - 4, ellipsis: true })
               .text(loc,  COLS[3].x + 2, y + 5, { width: COLS[3].w - 4, ellipsis: true });
            doc.fillColor(C.dark).fontSize(5.5).font('Helvetica-Bold')
               .text(statusLabel[item.itemStatus] ?? item.itemStatus, COLS[4].x + 2, y + 5, { width: COLS[4].w - 4, align: 'center' });
            doc.fillColor(isMismatch ? C.dark : C.sub).fontSize(5.5).font(isMismatch ? 'Helvetica-Bold' : 'Helvetica')
               .text(sys, COLS[5].x + 2, y + 5, { width: COLS[5].w - 4, align: 'center' })
               .text(fiz, COLS[6].x + 2, y + 5, { width: COLS[6].w - 4, align: 'center' });
            doc.fillColor(diff && diff > 0 ? C.dark : C.sub).fontSize(5.5).font(diff && diff > 0 ? 'Helvetica-Bold' : 'Helvetica')
               .text(diff !== null ? String(diff) : '—', COLS[7].x + 2, y + 5, { width: COLS[7].w - 4, align: 'center' });
            doc.fillColor(C.sub).fontSize(5.5).font('Helvetica')
               .text(note, COLS[8].x + 2, y + 5, { width: COLS[8].w - 4, ellipsis: true });

            doc.rect(ML, y + ROW_H - 0.5, CW, 0.5).fill(C.border);
            y += ROW_H;
        });

        if (items.length === 0) {
            doc.rect(ML, y, CW, 22).fill(C.light);
            doc.fillColor(C.sub).fontSize(8).font('Helvetica')
               .text('Tidak ada item audit.', ML, y + 7, { width: CW, align: 'center' });
        }

        // ════════════════════════════════════════════════════════════════════
        // FOOTER TTD — selalu di posisi FIXED paling bawah halaman TERAKHIR
        // ════════════════════════════════════════════════════════════════════

        const range = (doc as any).bufferedPageRange();
        const lastPageIdx = range.start + range.count - 1;
        doc.switchToPage(lastPageIdx);

        let fy = FOOTER_Y;

        doc.rect(ML, fy, CW, 1).fill(C.black);
        fy += 6;

        doc.fillColor(C.black).fontSize(10).font('Helvetica-Bold')
           .text('LEMBAR PENGESAHAN', ML, fy, { width: CW, align: 'center' });
        fy += 14;

        doc.fillColor(C.mid).fontSize(7).font('Helvetica')
           .text('Laporan ini telah diperiksa dan disahkan oleh pihak yang bertanggung jawab.', ML, fy, { width: CW, align: 'center' });
        fy += 10;

        const signers: {
            title: string;
            name: string;
            username?: string;
            signature?: string | null;
            signedAt?: Date | string | null;
        }[] = [
            {
                title:     'Auditor',
                name:      audit.auditor?.name ?? '—',
                username:  audit.auditor?.username ?? undefined,
                signature: report.auditorSignature,
                signedAt:  report.auditorSignedAt,
            },
            ...responsiblePersons.map((p, i) => {
                const sig = report.signatures.find(s => s.signerId === p.id);
                return {
                    title:    `Penanggung Jawab${responsiblePersons.length > 1 ? ' ' + (i + 1) : ''}`,
                    name:     p.name,
                    username: p.username,
                    signature: sig?.signature ?? null,
                    signedAt:  sig?.signedAt ?? null,
                };
            })
        ];

        const sigGap = 16;
        const sigW = (CW - sigGap * (signers.length - 1)) / signers.length;
        fy += 4;

        signers.forEach((signer, i) => {
            const bx = ML + i * (sigW + sigGap);
            const by = fy;

            doc.rect(bx, by, sigW, SIG_BOX_H)
               .strokeColor(C.border).lineWidth(0.5)
               .fill(C.white).stroke();

            doc.fillColor(C.black).fontSize(7).font('Helvetica-Bold')
               .text(signer.title.toUpperCase(), bx, by + 8, { width: sigW, align: 'center' });
            doc.fillColor(C.sub).fontSize(6.5).font('Helvetica')
               .text(signer.name, bx, by + 19, { width: sigW, align: 'center' });

            const areaY = by + 30;
            const areaH = 42;
            const areaX = bx + 8;
            const areaW = sigW - 16;

            doc.rect(areaX, areaY + areaH, areaW, 0.5).fill(C.border);

            if (signer.signature) {
                try {
                    const b64 = signer.signature.includes(',')
                        ? signer.signature.split(',')[1]
                        : signer.signature;
                    const buf = Buffer.from(b64, 'base64');
                    doc.image(buf, areaX, areaY, {
                        fit:    [areaW, areaH],
                        align:  'center',
                        valign: 'center'
                    });
                } catch { /* skip */ }

                doc.fillColor(C.sub).fontSize(6).font('Helvetica')
                   .text(fmtDate(signer.signedAt), bx, areaY + areaH + 5, { width: sigW, align: 'center' });
            } else {
                doc.fillColor(C.sub).fontSize(6.5).font('Helvetica-Oblique')
                   .text('Belum ditandatangani', bx, areaY + areaH / 2 - 3, { width: sigW, align: 'center' });
                doc.fillColor(C.sub).fontSize(6).font('Helvetica')
                   .text('—', bx, areaY + areaH + 5, { width: sigW, align: 'center' });
            }
        });

        fy += SIG_BOX_H + 6;
        doc.rect(ML, fy, CW, 0.4).fill(C.border);
        fy += 6;
        doc.fillColor(C.sub).fontSize(6).font('Helvetica-Oblique')
           .text(
               `Dokumen ini sah secara elektronik. Jakarta, ${fmtDate(new Date())}  ·  No. Dok: ${docNo}`,
               ML, fy, { width: CW, align: 'center' }
           );

        // ── Nomor halaman di pojok kanan bawah tiap halaman ──────────────────
        const totalPages = (doc as any).bufferedPageRange().count;
        for (let i = 0; i < totalPages; i++) {
            doc.switchToPage(i);
            doc.fillColor(C.sub).fontSize(6).font('Helvetica')
               .text(`${i + 1} / ${totalPages}`, PW - MR - 30, PH - 14, { width: 30, align: 'right' });
        }

        doc.end();
    });

    const buf = Buffer.concat(chunks);

    // PREVIEW: inline (bukan attachment/download)
    return new Response(buf, {
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="preview-laporan-${audit.section?.name ?? 'audit'}.pdf"`,
            'Content-Length': String(buf.length),
        }
    });
};