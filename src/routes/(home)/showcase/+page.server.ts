import { db } from '$lib/server/db'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
	try {
		const showcases = await db.cabinet.findMany({
			include: {
				sections: {
					include: {
						_count: {
							select: { items: true } // ganti cards → items
						}
					}
				}
			},
			orderBy: {
				id: 'asc'
			}
		})

		// Format data untuk frontend
		const formattedShowcases = showcases.map(showcase => ({
			id: showcase.id,
			name: showcase.name,
			number: showcase.id,
			slots: showcase.maxSlots,
			filled: showcase.sections.reduce((total, section) => total + section._count.items, 0), // ganti cards → items
			sections: showcase.sections.map(section => ({
				id: section.id,
				name: section.name,
				type: section.type,
				itemCount: section._count.items // ganti cardCount → itemCount
			}))
		}))

		return { showcases: formattedShowcases }
	} catch (error) {
		console.error('Load showcases error:', error)
		return { showcases: [] }
	}
}