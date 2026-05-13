import { db } from '$lib/server/db';
import { json } from '@sveltejs/kit';

export async function POST({ params, request, locals }) {
    try {
        const session = locals.session;
        if (!session) {
            return json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }
        
        const { signature } = await request.json();
        
        // Update report dengan auditor signature
        const updatedReport = await db.report.update({
            where: { id: params.id },
            data: {
                auditorSignature: signature,
                auditorSignedAt: new Date()
            }
        });
        
        return json({ success: true, data: updatedReport });
    } catch (error) {
        console.error('Error saving auditor signature:', error);
        return json({ success: false, message: (error as Error).message }, { status: 500 });
    }
}