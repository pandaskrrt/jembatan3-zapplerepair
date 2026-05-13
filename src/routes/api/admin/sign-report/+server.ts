import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';

export const POST: RequestHandler = async ({ locals, request }) => {
    const session = locals.session;
    
    if (!session) {
        return json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    let reportId, signature;
    try {
        const body = await request.json();
        reportId = body.reportId;
        signature = body.signature;
    } catch (err) {
        return json({ success: false, message: 'Invalid request body' }, { status: 400 });
    }

    if (!reportId || !signature) {
        return json({ success: false, message: 'Missing reportId or signature' }, { status: 400 });
    }

    // Cek apakah user adalah admin
    if (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN') {
        return json({ success: false, message: 'Access denied. Hanya admin yang dapat menandatangani.' }, { status: 403 });
    }

    try {
        // Ambil report lengkap
        const report = await db.report.findUnique({
            where: { id: reportId },
            include: {
                audit: {
                    select: {
                        section: {
                            select: { name: true }
                        }
                    }
                }
            }
        });

        if (!report) {
            return json({ success: false, message: 'Report tidak ditemukan' }, { status: 404 });
        }

        // Parse responsibleIds dari JSON
        let responsibleIds: string[] = [];
        if (report.responsibleIds) {
            if (typeof report.responsibleIds === 'string') {
                try {
                    responsibleIds = JSON.parse(report.responsibleIds);
                } catch (err) {
                    responsibleIds = [];
                }
            } else if (Array.isArray(report.responsibleIds)) {
                responsibleIds = report.responsibleIds;
            }
        }
        
        // Cek apakah user adalah penanggung jawab
        if (!responsibleIds.includes(session.id)) {
            return json({ 
                success: false, 
                message: 'Anda tidak ditunjuk sebagai penanggung jawab untuk laporan ini' 
            }, { status: 403 });
        }

        // Cari order untuk tanda tangan ini (1 atau 2 berdasarkan urutan)
        let order = 1;
        if (responsibleIds.length > 1 && responsibleIds[0] === session.id) {
            order = 1;
        } else if (responsibleIds.length > 1 && responsibleIds[1] === session.id) {
            order = 2;
        }

        // Cek apakah sudah pernah tanda tangan
        const existingSignature = await db.reportSignature.findFirst({
            where: {
                reportId: reportId,
                signerId: session.id
            }
        });

        if (existingSignature) {
            // Update signature yang sudah ada
            await db.reportSignature.update({
                where: { id: existingSignature.id },
                data: {
                    signature: signature,
                    signedAt: new Date(),
                    ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
                    userAgent: request.headers.get('user-agent') || ''
                }
            });
        } else {
            // Buat signature baru
            await db.reportSignature.create({
                data: {
                    reportId: reportId,
                    signerId: session.id,
                    signature: signature,
                    signedAt: new Date(),
                    order: order,
                    ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
                    userAgent: request.headers.get('user-agent') || ''
                }
            });
        }

        // Hitung berapa banyak yang sudah tanda tangan
        const allSignatures = await db.reportSignature.findMany({
            where: { reportId: reportId }
        });

        // Update status report berdasarkan jumlah tanda tangan
        if (allSignatures.length === responsibleIds.length) {
            // Semua sudah tanda tangan
            await db.report.update({
                where: { id: reportId },
                data: { 
                    status: 'COMPLETED',
                    completedAt: new Date()
                }
            });
            
            return json({ 
                success: true, 
                message: 'Tanda tangan berhasil! Semua penanggung jawab telah menandatangani laporan.',
                allSigned: true
            });
        } else if (allSignatures.length > 0) {
            // Sebagian sudah tanda tangan
            await db.report.update({
                where: { id: reportId },
                data: { status: 'PARTIALLY_SIGNED' }
            });
            
            const remaining = responsibleIds.length - allSignatures.length;
            return json({ 
                success: true, 
                message: `Tanda tangan berhasil! Menunggu ${remaining} penanggung jawab lainnya.`,
                allSigned: false,
                remaining: remaining
            });
        } else {
            return json({ 
                success: true, 
                message: 'Tanda tangan berhasil disimpan!'
            });
        }

    } catch (error) {
        console.error('Error saving signature:', error);
        return json({ 
            success: false, 
            message: 'Terjadi kesalahan saat menyimpan tanda tangan: ' + (error as Error).message
        }, { status: 500 });
    }
};