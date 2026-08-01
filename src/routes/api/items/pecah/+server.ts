import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';

async function getUniqueSerialNumber(tx: any, base: string | null, sourceItemName: string): Promise<string> {
    // Jika user tidak isi serial, generate dari nama item
    let candidate = base || (sourceItemName || 'PART').substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '') + '-' + Date.now().toString(36).toUpperCase();

    // Jika sudah ada (termasuk SOLD/USED), tambah suffix
    let exists = await tx.itemSerial.findUnique({ where: { serialNumber: candidate } });
    let i = 1;
    while (exists) {
        candidate = `${base || 'PART'}-${i}`;
        i++;
        exists = await tx.itemSerial.findUnique({ where: { serialNumber: candidate } });
    }
    return candidate;
}

export const POST: RequestHandler = async ({ request, locals }) => {
    const session = locals.session;
    if (!session) return json({ error: 'Unauthorized' }, { status: 401 });

    const currentUserId = session.id?.toString() ?? '';
    const body = await request.json();
    const { serialId, destType, targetSectionId, parts } = body;

    if (!serialId || !parts || parts.length === 0) {
        return json({ error: 'serialId dan parts required' }, { status: 400 });
    }

    const sourceSerial = await db.itemSerial.findUnique({
        where: { id: serialId },
        include: { item: true }
    });
    if (!sourceSerial) return json({ error: 'Serial tidak ditemukan' }, { status: 404 });

    // Tentukan target section
    let targetSectionIdFinal: number;
    let targetSectionName: string;

    if (destType === 'kirim') {
        // Masuk ke Barang Luar
        const blSection = await db.section.findFirst({
            where: { deletedAt: null, cabinet: { name: 'Barang Luar', isProtected: true } }
        });
        if (!blSection) return json({ error: 'Section Barang Luar tidak ditemukan' }, { status: 500 });
        targetSectionIdFinal = blSection.id;
        targetSectionName = blSection.name;
    } else {
        // Pindah ke section biasa
        if (!targetSectionId) return json({ error: 'targetSectionId wajib untuk pindah ke section' }, { status: 400 });
        const sec = await db.section.findUnique({
            where: { id: targetSectionId },
            include: { cabinet: true }
        });
        if (!sec || sec.cabinet?.isProtected) return json({ error: 'Target section tidak valid' }, { status: 400 });
        targetSectionIdFinal = sec.id;
        targetSectionName = sec.name;
    }

    try {
        const result = await db.$transaction(async (tx) => {
            const newItems: { name: string; category: string; qty: number; modal: number; jual: number; newItemId: number; newSerialId: number; mergedToExisting: boolean }[] = [];

            for (const part of parts) {
                const partModal = part.modal || 0;
                const partJual = part.jual || 0;
                const partSn = part.serialNumber || null;
                const existingItemId = part.existingItemId || null;
                const partSubCategory = part.subCategory || sourceSerial.item.subCategory || '';

                let newItemId: number;
                let mergedToExisting = false;

                if (existingItemId) {
                    // User sudah pilih item tujuan → tambah serial ke item itu
                    newItemId = existingItemId;
                    mergedToExisting = true;
                } else {
                    // Cek item mirip di section tujuan (nama sama + kategori sama)
                    let targetItem = await tx.item.findFirst({
                        where: {
                            name: part.name.trim(),
                            category: part.category,
                            sectionId: targetSectionIdFinal,
                            deletedAt: null
                        }
                    });

                    if (targetItem) {
                        newItemId = targetItem.id;
                        mergedToExisting = true;
                    } else {
                        const newItem = await tx.item.create({
                            data: {
                                name: part.name.trim(),
                                stock: 0,
                                location: targetSectionName,
                                category: part.category,
                                subCategory: partSubCategory,
                                sectionId: targetSectionIdFinal,
                                isCustomer: false,
                                imageUrl: null
                            }
                        });
                        newItemId = newItem.id;
                    }
                }

                for (let i = 0; i < (part.qty || 1); i++) {
                    const uniqueSn = await getUniqueSerialNumber(tx, partSn, part.name);
                    const newSerial = await tx.itemSerial.create({
                        data: {
                            serialNumber: uniqueSn,
                            grade: sourceSerial.grade,
                            spec: `Part dari ${sourceSerial.item.name} (${sourceSerial.serialNumber || 'no-sn'})`,
                            status: 'AVAILABLE',
                            price: partJual,
                            costPrice: partModal,
                            category: part.category as any,
                            isDisplay: false,
                            itemId: newItemId
                        }
                    });

                    newItems.push({
                        name: part.name.trim(),
                        category: part.category,
                        qty: 1,
                        modal: partModal,
                        jual: partJual,
                        newItemId,
                        newSerialId: newSerial.id,
                        mergedToExisting
                    });
                }

                // Sync stock item (count AVAILABLE serials)
                const itemStock = await tx.itemSerial.count({
                    where: { itemId: newItemId, status: 'AVAILABLE' }
                });
                await tx.item.update({
                    where: { id: newItemId },
                    data: { stock: itemStock }
                });
            }

            // Update serial asal → NoReadySale
            await tx.itemSerial.update({
                where: { id: serialId },
                data: { category: 'NoReadySale' }
            });

            // Sync stock item asal
            const asalStock = await tx.itemSerial.count({
                where: { itemId: sourceSerial.itemId, status: 'AVAILABLE' }
            });
            await tx.item.update({
                where: { id: sourceSerial.itemId },
                data: { stock: asalStock }
            });

            // History
            await tx.itemHistory.create({
                data: {
                    itemId: sourceSerial.itemId,
                    action: 'BROKEN_DOWN',
                    triggeredBy: currentUserId,
                    oldValue: {
                        serialId: sourceSerial.id,
                        serialNumber: sourceSerial.serialNumber,
                        category: sourceSerial.category
                    },
                    newValue: {
                        serialId: sourceSerial.id,
                        serialNumber: sourceSerial.serialNumber,
                        category: 'NoReadySale',
                        destType,
                        parts: newItems.map(i => ({
                            name: i.name,
                            category: i.category,
                            modal: i.modal,
                            jual: i.jual,
                            newItemId: i.newItemId,
                            newSerialId: i.newSerialId,
                            mergedToExisting: i.mergedToExisting
                        }))
                    },
                    note: `Serial ${sourceSerial.serialNumber || ''} dipecah, ${newItems.length} part dibuat`
                }
            });

            return { newItems, destType };
        });

        return json({ success: true, data: result });
    } catch (error: any) {
        console.error('Error pecah item:', error);
        return json({ error: 'Gagal memecah item: ' + error.message }, { status: 500 });
    }
};
