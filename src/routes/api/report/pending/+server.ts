import { db } from '$lib/server/db';
import { json } from '@sveltejs/kit';

export async function GET({ locals }) {
    const session = locals.session;
    if (!session) {
        return json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Cari laporan di mana user ini adalah penanda tangan dan belum ditandatangani
    const pendingSignatures = await db.reportSignature.findMany({
        where: {
            signerId: session.id,
            signedAt: null,  // Ganti isSigned: false → signedAt: null (karena field isSigned tidak ada)
            report: {
                status: 'PENDING_SIGN'
            }
        },
        include: {
            report: {
                include: {
                    audit: {
                        include: {
                            section: {
                                include: { cabinet: true }
                            },
                            auditor: { select: { name: true } }
                        }
                    }
                    // responsible: { select: { name: true, username: true } } -> Dihapus, karena schema pakai responsibleIds (JSON)
                }
            }
        },
        orderBy: { createdAt: 'asc' }
    });

    return json({ success: true, data: pendingSignatures });
}