import { db } from '$lib/server/db';
import { json } from '@sveltejs/kit';

export async function POST({ params, request, locals }) {
    try {
        const session = locals.session;
        if (!session) {
            return json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }
        
        const { responsibleIds } = await request.json();
        
        if (!Array.isArray(responsibleIds)) {
            return json({ success: false, message: 'responsibleIds must be an array' }, { status: 400 });
        }
        
        // Update report dengan responsibleIds
        const updatedReport = await db.report.update({
            where: { id: params.id },
            data: {
                responsibleIds: responsibleIds
            }
        });
        
        return json({ success: true, data: updatedReport });
    } catch (error) {
        console.error('Error saving responsible:', error);
        return json({ success: false, message: (error as Error).message }, { status: 500 });
    }
}