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
    const { id, sectionId, ...updateData } = body;

    if (!id) {
        return json({ error: 'Item ID required' }, { status: 400 });
    }

    // Ambil item untuk mendapatkan sectionId
    const existingItem = await db.item.findUnique({
        where: { id },
        select: { sectionId: true }
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
        const updatedItem = await db.item.update({
            where: { id },
            data: {
                ...updateData,
                updatedAt: new Date()
            }
        });

        return json({ 
            success: true, 
            data: updatedItem 
        });

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