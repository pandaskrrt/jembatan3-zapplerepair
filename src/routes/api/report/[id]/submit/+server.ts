import { db } from '$lib/server/db';
import { json } from '@sveltejs/kit';

export async function POST({ params, locals }) {
    const session = locals.session;
    if (!session) return json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await db.report.update({
        where: { id: params.id },
        data: { status: 'PENDING_SIGN' }
    });
    
    return json({ success: true });
}