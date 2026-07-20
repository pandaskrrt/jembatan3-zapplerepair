import { db } from '$lib/server/db';
import { error, fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
    const session = locals.session;
    if (!session) throw error(401, 'Unauthorized');

    const serviceForm = await db.serviceForm.findUnique({
        where: { id: params.id },
        include: {
            items: {
                include: { item: { include: { section: true, price: true } } }
            },
            invoice: {
                include: { items: true }
            },
            createdBy: { select: { name: true } }
        }
    });

    if (!serviceForm) throw error(404, 'Service form not found');

    const items = await db.item.findMany({
        where: { deletedAt: null, stock: { gt: 0 } },
        include: { section: true, price: true },
        orderBy: { name: 'asc' }
    });

    const cabinets = await db.cabinet.findMany({
        where: { deletedAt: null },
        include: {
            sections: { where: { deletedAt: null } }
        },
        orderBy: { name: 'asc' }
    });

    return { serviceForm, items, cabinets };
};

export const actions: Actions = {
    addItem: async ({ request, params, locals }) => {
        const session = locals.session;
        if (!session) return fail(401, { error: 'Unauthorized' });

        const formData = await request.formData();
        const itemId = Number(formData.get('itemId'));
        const quantity = Number(formData.get('quantity')) || 1;
        const note = formData.get('note') as string || null;

        if (!itemId) return fail(400, { error: 'Pilih item' });

        const item = await db.item.findUnique({ where: { id: itemId } });
        if (!item) return fail(404, { error: 'Item tidak ditemukan' });
        if (item.stock < quantity) return fail(400, { error: `Stok tidak cukup (tersisa ${item.stock})` });

        await db.serviceFormItem.create({
            data: {
                serviceFormId: params.id,
                itemId,
                quantity,
                note
            }
        });

        await db.item.update({
            where: { id: itemId },
            data: { stock: { decrement: quantity } }
        });

        await db.itemHistory.create({
            data: {
                itemId,
                action: 'STOCK_UPDATED',
                oldStock: item.stock,
                newStock: item.stock - quantity,
                triggeredBy: session.id,
                note: `Digunakan untuk service ${params.id}`
            }
        });

        return { success: true };
    },

    removeItem: async ({ request, params, locals }) => {
        const session = locals.session;
        if (!session) return fail(401, { error: 'Unauthorized' });

        const formData = await request.formData();
        const serviceFormItemId = Number(formData.get('serviceFormItemId'));

        const sfi = await db.serviceFormItem.findUnique({
            where: { id: serviceFormItemId },
            include: { item: true }
        });

        if (!sfi) return fail(404, { error: 'Item tidak ditemukan' });

        await db.item.update({
            where: { id: sfi.itemId },
            data: { stock: { increment: sfi.quantity } }
        });

        await db.serviceFormItem.delete({ where: { id: serviceFormItemId } });

        return { success: true };
    },

    updateStatus: async ({ request, params }) => {
        const formData = await request.formData();
        const status = formData.get('status') as string;

        await db.serviceForm.update({
            where: { id: params.id },
            data: { status: status as any }
        });

        return { success: true };
    },

    addInvoiceItem: async ({ request, params, locals }) => {
        const session = locals.session;
        if (!session) return fail(401, { error: 'Unauthorized' });

        const formData = await request.formData();
        const category = formData.get('category') as string;
        const description = formData.get('description') as string;
        const quantity = Number(formData.get('quantity')) || 1;
        const unitPrice = Number(formData.get('unitPrice')) || 0;

        if (!category || !description) return fail(400, { error: 'Kategori dan deskripsi harus diisi' });

        // Get or create invoice
        let invoice = await db.serviceFormInvoice.findUnique({
            where: { serviceFormId: params.id },
            include: { items: true }
        });

        if (!invoice) {
            const now = new Date();
            const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
            const invCount = await db.serviceFormInvoice.count();
            const invoiceNumber = `INV-${dateStr}-${String(invCount + 1).padStart(3, '0')}`;

            invoice = await db.serviceFormInvoice.create({
                data: {
                    serviceFormId: params.id,
                    invoiceNumber,
                    grandTotal: 0
                },
                include: { items: true }
            });
        }

        const totalPrice = quantity * unitPrice;

        const item = await db.serviceFormInvoiceItem.create({
            data: {
                invoiceId: invoice.id,
                category: category as any,
                description,
                quantity,
                unitPrice,
                totalPrice
            }
        });

        // Recalculate grand total (STOK_CUSTOMER dikurangi, lainnya ditambah)
        const allItems = await db.serviceFormInvoiceItem.findMany({
            where: { invoiceId: invoice.id }
        });
        const grandTotal = allItems.reduce((sum, i) => {
            if (i.category === 'STOK_CUSTOMER') return sum - i.totalPrice;
            return sum + i.totalPrice;
        }, 0);

        await db.serviceFormInvoice.update({
            where: { id: invoice.id },
            data: { grandTotal }
        });

        // If category is STOK_CUSTOMER, auto-create item in stock
        if (category === 'STOK_CUSTOMER') {
            const serviceForm = await db.serviceForm.findUnique({ where: { id: params.id } });

            // Get first available section
            const firstSection = await db.section.findFirst({
                where: { deletedAt: null },
                orderBy: { id: 'asc' }
            });

            if (firstSection) {
                const newItem = await db.item.create({
                    data: {
                        name: description,
                        stock: quantity,
                        location: 'Service Purchase',
                        category: 'Customer Purchase',
                        subCategory: 'Sparepart',
                        sectionId: firstSection.id,
                        price: unitPrice > 0 ? {
                            create: { amount: unitPrice, priceNote: `Beli dari customer - ${serviceForm?.customerName || ''}`, isActive: true }
                        } : undefined
                    }
                });

                await db.itemHistory.create({
                    data: {
                        itemId: newItem.id,
                        action: 'CREATED',
                        newStock: quantity,
                        triggeredBy: session.id,
                        note: `Barang beli dari customer ${serviceForm?.customerName || ''} - Service ${serviceForm?.serviceNumber || ''}`
                    }
                });
            }
        }

        return { success: true };
    },

    removeInvoiceItem: async ({ request, locals }) => {
        const session = locals.session;
        if (!session) return fail(401, { error: 'Unauthorized' });

        const formData = await request.formData();
        const invoiceItemId = Number(formData.get('invoiceItemId'));
        const invoiceId = formData.get('invoiceId') as string;

        await db.serviceFormInvoiceItem.delete({ where: { id: invoiceItemId } });

        // Recalculate grand total (STOK_CUSTOMER dikurangi)
        const allItems = await db.serviceFormInvoiceItem.findMany({
            where: { invoiceId }
        });
        const grandTotal = allItems.reduce((sum, i) => {
            if (i.category === 'STOK_CUSTOMER') return sum - i.totalPrice;
            return sum + i.totalPrice;
        }, 0);

        await db.serviceFormInvoice.update({
            where: { id: invoiceId },
            data: { grandTotal }
        });

        return { success: true };
    },

    createCabinet: async ({ request }) => {
        const formData = await request.formData();
        const name = formData.get('name') as string;
        const maxSlots = Number(formData.get('maxSlots')) || 10;

        if (!name) return fail(400, { error: 'Nama cabinet harus diisi' });

        const cabinet = await db.cabinet.create({
            data: { name, maxSlots }
        });

        return { success: true, cabinet };
    },

    createSection: async ({ request }) => {
        const formData = await request.formData();
        const name = formData.get('name') as string;
        const type = formData.get('type') as string;
        const cabinetId = Number(formData.get('cabinetId'));

        if (!name || !type || !cabinetId) return fail(400, { error: 'Semua field harus diisi' });

        const section = await db.section.create({
            data: { name, type, cabinetId }
        });

        return { success: true, section };
    }
};
