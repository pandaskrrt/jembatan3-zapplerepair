import { db } from '$lib/server/db';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    const session = locals.session;
    if (!session) throw error(401, 'Unauthorized');

    const sections = await db.section.findMany({
        where: { deletedAt: null },
        include: { cabinet: true },
        orderBy: { name: 'asc' }
    });

    const protectedSections = sections.filter(s => s.isProtected || s.cabinet?.isProtected).map(sec => ({
        id: sec.id, name: sec.cabinet?.name ?? sec.name
    }));

    const normalSections = sections.filter(s => !s.isProtected && !s.cabinet?.isProtected).map(sec => ({
        id: sec.id, name: `${sec.cabinet?.name} - ${sec.name}`, cabinet: sec.cabinet?.name ?? ''
    }));

    const dbItems = await db.item.findMany({
        where: {
            sectionId: { in: protectedSections.map(l => l.id) },
            deletedAt: null
        },
        include: { section: { include: { cabinet: true } }, price: true, costPrice: true, serials: { where: { status: 'AVAILABLE' }, select: { id: true, serialNumber: true, category: true, price: true, status: true } } },
        orderBy: { updatedAt: 'desc' }
    });

    const itemsInPermanent = dbItems.map(item => ({
        ...item,
        permanentLocation: item.section ? { id: item.section.id, name: item.section.cabinet?.name ?? item.section.name } : null
    }));

    const itemsByLocation = protectedSections.map(loc => ({
        ...loc, items: itemsInPermanent.filter(item => item.sectionId === loc.id)
    }));

    const stats = {
        totalItems: itemsInPermanent.length,
        totalLocations: protectedSections.length,
        itemsPerLocation: Object.fromEntries(protectedSections.map(loc => [loc.name, itemsInPermanent.filter(i => i.sectionId === loc.id).length]))
    };

    return { permanentLocations: protectedSections, itemsByLocation, stats, userRole: (session as any).role, userName: (session as any).name ?? session.username, normalSections };
};
