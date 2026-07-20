import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { guardSectionEdit } from '$lib/server/guards';

// CREATE ITEM (POST)
export const POST: RequestHandler = async ({ request, locals }) => {
    const session = locals.session;
    if (!session) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sectionId, name, category, subCategory, location, stock, imageUrl, priceIDR, costPrice, ...rest } = body;

    // CEK LOCK SEBELUM EDIT
    try {
        await guardSectionEdit(sectionId, session.id, session.role);
    } catch (error) {
        return json({ 
            success: false, 
            error: error.message,
            code: 'SECTION_LOCKED'
        }, { status: 403 });
    }

    try {
        // Buat item baru
        const newItem = await db.item.create({
            data: {
                name,
                category,
                subCategory,
                location: location || '',
                stock: stock || 0,
                imageUrl: imageUrl || null,
                sectionId,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });

        // Buat price jika ada
        if (priceIDR && priceIDR > 0) {
            await db.price.create({
                data: {
                    itemId: newItem.id,
                    amount: priceIDR,
                    priceNote: 'Manual entry',
                    isActive: true
                }
            });
        }

        // Buat costPrice jika ada
        if (costPrice && costPrice > 0) {
            await db.costPrice.create({
                data: {
                    itemId: newItem.id,
                    amount: costPrice,
                    note: 'Manual entry'
                }
            });
        }

        // Catat history
        await db.itemHistory.create({
            data: {
                itemId: newItem.id,
                action: 'CREATED',
                newStock: stock || 0,
                triggeredBy: session.id,
                note: `Item created manually by ${session.username}`
            }
        });

        return json({ 
            success: true, 
            data: newItem 
        });

    } catch (error) {
        console.error('Error creating item:', error);
        return json({ 
            success: false, 
            error: 'Gagal membuat item baru' 
        }, { status: 500 });
    }
};

// UPDATE ITEM (PUT)
export const PUT: RequestHandler = async ({ request, locals }) => {
    const session = locals.session;
    if (!session) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, sectionId, priceIDR, costPrice, priceNote, costNote, ...updateData } = body;

    if (!id) {
        return json({ error: 'Item ID required' }, { status: 400 });
    }

    const existingItem = await db.item.findUnique({
        where: { id },
        include: { price: true, costPrice: true, section: true }
    });

    if (!existingItem) {
        return json({ error: 'Item not found' }, { status: 404 });
    }

    try {
        await guardSectionEdit(existingItem.sectionId!, session.id, session.role);
    } catch (error) {
        return json({ 
            success: false, 
            error: error.message,
            code: 'SECTION_LOCKED'
        }, { status: 403 });
    }

    try {
        const updatedItem = await db.$transaction(async (tx) => {
            const updated = await tx.item.update({
                where: { id },
                data: {
                    ...updateData,
                    updatedAt: new Date()
                }
            });

            // Update atau buat Price
            if (priceIDR !== undefined) {
                if (existingItem.price) {
                    await tx.price.update({
                        where: { id: existingItem.price.id },
                        data: { amount: priceIDR, priceNote: priceNote || '' }
                    });
                } else {
                    await tx.price.create({
                        data: { itemId: id, amount: priceIDR, priceNote: priceNote || '', isActive: true }
                    });
                }
            }

            // Update atau buat CostPrice
            if (costPrice !== undefined) {
                if (costPrice > 0) {
                    if (existingItem.costPrice) {
                        await tx.costPrice.update({
                            where: { id: existingItem.costPrice.id },
                            data: { amount: costPrice, note: costNote || null }
                        });
                    } else {
                        await tx.costPrice.create({
                            data: { itemId: id, amount: costPrice, note: costNote || null }
                        });
                    }
                } else if (existingItem.costPrice) {
                    await tx.costPrice.delete({ where: { id: existingItem.costPrice.id } });
                }
            }

            return updated;
        });

        // Catat perubahan
        const changes: Record<string, { old: any; new: any }> = {};
        for (const [key, val] of Object.entries(updateData)) {
            const oldVal = (existingItem as any)[key];
            if (val !== undefined && val !== oldVal) {
                changes[key] = { old: oldVal, new: val };
            }
        }
        if (priceIDR !== undefined && (existingItem.price?.amount ?? 0) !== priceIDR) {
            changes['price'] = { old: existingItem.price?.amount ?? 0, new: priceIDR };
        }
        if (costPrice !== undefined && (existingItem.costPrice?.amount ?? 0) !== costPrice) {
            changes['costPrice'] = { old: existingItem.costPrice?.amount ?? 0, new: costPrice };
        }

        if (Object.keys(changes).length > 0) {
            await db.itemHistory.create({
                data: {
                    itemId: id,
                    action: 'STOCK_UPDATED',
                    oldStock: existingItem.stock,
                    newStock: (updateData as any).stock ?? existingItem.stock,
                    triggeredBy: session.id,
                    oldValue: changes,
                    note: `Item diupdate oleh ${session.username}`
                }
            });
        }

        return json({ success: true, data: updatedItem });

    } catch (error) {
        console.error('Error updating item:', error);
        return json({ 
            success: false, 
            error: 'Gagal mengupdate item' 
        }, { status: 500 });
    }
};

// DELETE ITEM (DELETE)
export const DELETE: RequestHandler = async ({ request, locals }) => {
    const session = locals.session;
    if (!session) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
        return json({ error: 'Item ID required' }, { status: 400 });
    }

    // Ambil item untuk mendapatkan sectionId
    const existingItem = await db.item.findUnique({
        where: { id: parseInt(id) },
        select: { sectionId: true, name: true }
    });

    if (!existingItem) {
        return json({ error: 'Item not found' }, { status: 404 });
    }

    // CEK LOCK SEBELUM EDIT
    try {
        await guardSectionEdit(existingItem.sectionId!, session.id, session.role);
    } catch (error) {
        return json({ 
            success: false, 
            error: error.message,
            code: 'SECTION_LOCKED'
        }, { status: 403 });
    }

    try {
        // Soft delete
        await db.item.update({
            where: { id: parseInt(id) },
            data: {
                deletedAt: new Date(),
                deletedBy: session.id,
                deleteReason: 'Deleted by user',
                stock: 0
            }
        });

        await db.itemHistory.create({
            data: {
                itemId: parseInt(id),
                action: 'SOFT_DELETED',
                oldStock: existingItem.stock,
                newStock: 0,
                triggeredBy: session.id,
                note: `Item "${existingItem.name}" dihapus oleh ${session.username}`
            }
        });

        return json({ success: true });

    } catch (error) {
        console.error('Error deleting item:', error);
        return json({ 
            success: false, 
            error: 'Gagal menghapus item' 
        }, { status: 500 });
    }
};