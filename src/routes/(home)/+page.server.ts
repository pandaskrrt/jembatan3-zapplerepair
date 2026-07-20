import { db } from '$lib/server/db'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
	try {
		const showcases = await db.cabinet.findMany({
			where: {
				deletedAt: null
			},
			include: {
				sections: {
					where: {
						deletedAt: null
					},
					include: {
						items: {
							where: {
								deletedAt: null
							},
							orderBy: {
								id: 'asc'
							}
						}
					}
				}
			},
			orderBy: {
				id: 'asc'
			}
		})

		const formattedShowcases = showcases.map(showcase => ({
			id: showcase.id,
			name: showcase.name,
			number: showcase.id,
			slots: showcase.maxSlots,
			filled: showcase.sections.reduce((total, section) => total + section.items.length, 0),
			sections: showcase.sections.map(section => ({
				id: section.id,
				name: section.name,
				type: section.type,
				itemCount: section.items.length,
				items: section.items.map(item => ({
					id: item.id,
					name: item.name,
					stock: item.stock,
					location: item.location || 'N/A',
					category: item.category || 'Uncategorized',
					subCategory: item.subCategory || 'Uncategorized',
					serialNumber: item.serialNumber || '',
					videoUrl: item.videoUrl,
					imageUrl: item.imageUrl,
					qrCustomUrl: item.qrCustomUrl,
					createdAt: item.createdAt,
					updatedAt: item.updatedAt
				}))
			}))
		}))

		return { showcases: formattedShowcases }
	} catch (error) {
		console.error('Load showcases error:', error)
		return { showcases: [] }
	}
}
