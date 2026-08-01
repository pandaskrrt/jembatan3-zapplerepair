import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
    const serialId = Number(params.itemId);
    if (!serialId) throw error(400, 'Serial ID required');

    const serial = await db.itemSerial.findUnique({
        where: { id: serialId },
        include: { item: { select: { id: true, name: true } } }
    });
    if (!serial) throw error(404, 'Serial not found');

    const histories = await db.itemHistory.findMany({
        where: { itemId: serial.itemId },
        include: { user: { select: { name: true, username: true } } },
        orderBy: { createdAt: 'desc' }
    });

    const assemblies = await db.itemAssembly.findMany({
        where: { targetSerialId: serialId },
        orderBy: { createdAt: 'desc' }
    });

    return { serial, histories, assemblies };
};
