import { db } from '$lib/server/db';
import { error, fail, redirect, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    const session = locals.session;
    if (!session) throw error(401, 'Unauthorized');

    const sections = await db.section.findMany({
        where: { deletedAt: null },
        include: { cabinet: true },
        orderBy: { name: 'asc' }
    });

    const cabinets = await db.cabinet.findMany({
        where: { deletedAt: null },
        orderBy: { name: 'asc' }
    });

    const items = await db.item.findMany({
        where: { deletedAt: null },
        include: { section: true, price: true },
        orderBy: { name: 'asc' }
    });

    return { sections, cabinets, items };
};

export const actions: Actions = {
    createCabinet: async ({ request, locals }) => {
        const session = locals.session;
        if (!session) return fail(401, { error: 'Unauthorized' });

        const formData = await request.formData();
        const name = formData.get('name') as string;
        const maxSlots = Number(formData.get('maxSlots')) || 10;

        if (!name) return fail(400, { error: 'Nama cabinet harus diisi' });

        const cabinet = await db.cabinet.create({
            data: { name, maxSlots }
        });

        return { success: true, cabinet };
    },

    createSection: async ({ request, locals }) => {
        const session = locals.session;
        if (!session) return fail(401, { error: 'Unauthorized' });

        const formData = await request.formData();
        const name = formData.get('name') as string;
        const type = formData.get('type') as string;
        const cabinetId = Number(formData.get('cabinetId'));

        if (!name || !type || !cabinetId) return fail(400, { error: 'Semua field harus diisi' });

        const section = await db.section.create({
            data: { name, type, cabinetId }
        });

        return { success: true, section };
    },

    default: async ({ request, locals }) => {
        const session = locals.session;
        if (!session) return fail(401, { error: 'Unauthorized' });

        const formData = await request.formData();
        const customerName = formData.get('customerName') as string;
        const customerPhone = formData.get('customerPhone') as string || null;
        const deviceType = formData.get('deviceType') as string;
        const deviceBrand = formData.get('deviceBrand') as string || null;
        const deviceModel = formData.get('deviceModel') as string || null;
        const deviceIMEI = formData.get('deviceIMEI') as string || null;
        const problemDescription = formData.get('problemDescription') as string || null;

        if (!customerName || !deviceType) {
            return fail(400, { error: 'Nama customer dan jenis device harus diisi' });
        }

        // Generate service number
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const count = await db.serviceForm.count();
        const serviceNumber = `SF-${dateStr}-${String(count + 1).padStart(3, '0')}`;

        const serviceForm = await db.serviceForm.create({
            data: {
                serviceNumber,
                customerName,
                customerPhone,
                deviceType,
                deviceBrand,
                deviceModel,
                deviceIMEI,
                problemDescription,
                createdById: session.id
            }
        });

        throw redirect(303, `/admin/service-form/${serviceForm.id}`);
    }
};
