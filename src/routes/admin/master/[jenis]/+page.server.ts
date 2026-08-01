import { db } from '$lib/server/db';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
    const session = locals.session;
    if (!session) throw error(401, 'Unauthorized');

    const jenis = params.jenis;
    if (jenis !== 'barang-luar' && jenis !== 'barang-china-sg') {
        throw redirect(302, '/admin/permanent-locations');
    }

    // Tentukan nama cabinet yang mau ditampilkan
    const cabinetNames = jenis === 'barang-luar'
        ? ['Barang Luar']
        : ['Barang China', 'Barang Singapore'];

    const cabinets = await db.cabinet.findMany({
        where: { deletedAt: null, isProtected: true, name: { in: cabinetNames } },
        include: {
            sections: {
                where: { deletedAt: null },
                include: {
                    items: {
                        where: { deletedAt: null },
                        include: {
                            serials: { where: { status: 'AVAILABLE' }, select: { id: true, serialNumber: true, category: true, price: true, costPrice: true, status: true } },
                            price: true,
                            costPrice: true
                        },
                        orderBy: { updatedAt: 'desc' }
                    }
                }
            }
        },
        orderBy: { id: 'asc' }
    });

    const label = jenis === 'barang-luar' ? 'Barang Luar' : 'Barang China / Singapore';

    return { cabinets, jenis, label, user: session };
};
