import { db } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
    const serialNumber = url.searchParams.get('serial');

    if (!serialNumber || serialNumber.trim() === '') {
        return new Response(JSON.stringify({ exists: false }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const trimmedSerial = serialNumber.trim();

    const existingItem = await db.item.findFirst({
        where: {
            serialNumber: trimmedSerial,
            deletedAt: null
        },
        select: { id: true, name: true }
    });

    return new Response(JSON.stringify({
        exists: !!existingItem,
        itemName: existingItem?.name || null
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
};
