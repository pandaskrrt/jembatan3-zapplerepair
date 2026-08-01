import { json, type RequestHandler } from '@sveltejs/kit';
export const PATCH: RequestHandler = async ({ request, locals }) => {
    const session = locals.session;
    if (!session) return json({ error: 'Unauthorized' }, { status: 401 });

    const { serialId } = await request.json();
    if (!serialId) return json({ error: 'serialId required' }, { status: 400 });

    const serial = await db.itemSerial.findUnique({ where: { id: serialId } });
    if (!serial) return json({ error: 'Serial not found' }, { status: 404 });

    await db.$transaction(async (tx) => {
        await tx.itemSerial.update({
            where: { id: serialId },
            data: {
                category: 'ReadySale'
            }
        });
        await tx.itemHistory.create({
            data: {
                itemId: serial.itemId,
                action: 'ASSEMBLED',
                triggeredBy: session.id?.toString() ?? '',
                note: `Serial ${serial.serialNumber} selesai di-assembly, dijadikan ReadySale`
            }
        });
    });

    return json({ success: true, message: 'Berhasil dijadikan ReadySale' });
};
import { db } from '$lib/server/db';

// POST: Gabung part ke NoReadySale serial
export const POST: RequestHandler = async ({ request, locals }) => {
    const session = locals.session;
    if (!session) return json({ error: 'Unauthorized' }, { status: 401 });

    const { targetSerialId, partSerialId } = await request.json();
    if (!targetSerialId || !partSerialId) return json({ error: 'targetSerialId & partSerialId required' }, { status: 400 });

    const targetSerial = await db.itemSerial.findUnique({ where: { id: targetSerialId } });
    if (!targetSerial) return json({ error: 'Target serial not found' }, { status: 404 });
    if (targetSerial.category !== 'NoReadySale') return json({ error: 'Hanya NoReadySale yang bisa di-assembly' }, { status: 400 });

    const partSerial = await db.itemSerial.findUnique({
        where: { id: partSerialId },
        include: { item: { include: { section: { include: { cabinet: true } } } } }
    });
    if (!partSerial) return json({ error: 'Part serial not found' }, { status: 404 });
    if (partSerial.status !== 'AVAILABLE') return json({ error: 'Stok part habis' }, { status: 400 });
    if (!['Accessories', 'Sparepart'].includes(partSerial.category)) return json({ error: 'Part harus Accessories atau Sparepart' }, { status: 400 });

    try {
        await db.$transaction(async (tx) => {
            await tx.itemSerial.update({
                where: { id: partSerialId },
                data: { status: 'USED' }
            });

            await tx.itemAssembly.create({
                data: {
                    targetSerialId,
                    partSerialId,
                    partName: partSerial.serialNumber,
                    partCategory: partSerial.category,
                    partCostPrice: partSerial.costPrice,
                    partSellPrice: partSerial.price,
                    status: 'COMPLETED',
                    stepOrder: 0
                }
            });

            // Update harga serial target: tambahkan harga part ke modal & jual
            await tx.itemSerial.update({
                where: { id: targetSerialId },
                data: {
                    costPrice: { increment: partSerial.costPrice || 0 },
                    price: { increment: partSerial.price || 0 }
                }
            });

            await tx.itemHistory.create({
                data: {
                    itemId: targetSerial.itemId,
                    action: 'ASSEMBLED',
                    triggeredBy: session.id?.toString() ?? '',
                    note: `Part ${partSerial.serialNumber} (${partSerial.category}) ditambahkan ke serial ${targetSerial.serialNumber}`
                }
            });

            // Sync part item stock
            const totalPartStock = await tx.itemSerial.count({
                where: { itemId: partSerial.itemId, status: 'AVAILABLE' }
            });
            await tx.item.update({
                where: { id: partSerial.itemId },
                data: { stock: totalPartStock }
            });
        });

        // Check if serial has any completed assembly parts
        const completedParts = await db.itemAssembly.count({ where: { targetSerialId, status: 'COMPLETED' } });
        const allComplete = completedParts > 0;

        return json({
            success: true,
            message: `Part ${partSerial.serialNumber} berhasil ditambahkan`,
            canComplete: allComplete
        });
    } catch (err: any) {
        return json({ error: err.message }, { status: 500 });
    }
};

// GET: List available parts (Accessories/Sparepart)
export const GET: RequestHandler = async ({ url }) => {
    const search = url.searchParams.get('q') || '';

    const parts = await db.itemSerial.findMany({
        where: {
            category: { in: ['Accessories', 'Sparepart'] },
            status: 'AVAILABLE',
            item: {
                deletedAt: null,
                section: { deletedAt: null, cabinet: { isProtected: false } }
            },
            ...(search ? { serialNumber: { contains: search } } : {})
        },
        include: { item: { include: { section: { include: { cabinet: true } } } } },
        take: 20,
        orderBy: { createdAt: 'desc' }
    });

    const formatted = parts.map(s => ({
        id: s.id,
        serialNumber: s.serialNumber || '#',
        category: s.category,
        price: s.price,
        costPrice: s.costPrice,
        grade: s.grade,
        status: s.status,
        itemName: s.item.name,
        cabinet: s.item.section?.cabinet?.name || '-',
        section: s.item.section?.name || '-'
    }));

    return json({ success: true, data: formatted });
};
