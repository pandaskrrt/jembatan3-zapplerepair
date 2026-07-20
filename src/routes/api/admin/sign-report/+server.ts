import { db } from '$lib/server/db';
import { json, type RequestHandler } from '@sveltejs/kit';
import { broadcastToAdmins } from '$lib/server/events';

export const POST: RequestHandler = async ({ locals, request }) => {
    // ... (kode lainnya tetap sama)
    // Saya hanya memastikan import di atas sudah benar
    const session = locals.session;
    if (!session) return json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { reportId, signature, note } = body;
    
    // ... (proses sign report)
    
    // Contoh penggunaan broadcastToAdmins yang benar:
    broadcastToAdmins({ type: 'report_signed', data: { reportId } });
    
    return json({ success: true });
};
