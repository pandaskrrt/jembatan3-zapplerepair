import { db } from '$lib/server/db'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params }) => {
	const sectionId = parseInt(params.sectionId)
	
	if (isNaN(sectionId)) {
		throw error(404, 'Section not found')
	}
	
	try {
		const section = await db.section.findUnique({
			where: { id: sectionId },
			include: {
				cabinet: true,
				items: {  // ganti cards → items
					include: {
						price: true  // ganti prices (array) → price (one-to-one)
					},
					orderBy: {
						name: 'asc'
					}
				}
			}
		})
		
		if (!section) {
			throw error(404, 'Section not found')
		}
		
		const items = section.items.map(item => ({
			id: item.id,
			name: item.name,
			imageUrl: item.imageUrl,
			stock: item.stock,
			location: item.location,
			category: item.category,
			subCategory: item.subCategory,
			serialNumber: item.serialNumber, // tambahkan serial number jika perlu
			priceIdr: item.price?.amount || 0,
			priceNote: item.price?.priceNote || ''
		}))
		
		return {
			section: {
				id: section.id,
				name: section.name,
				type: section.type
			},
			cabinet: {  // ganti showcase → cabinet
				id: section.cabinet?.id,
				name: section.cabinet?.name
			},
			items  // ganti cards → items
		}
	} catch (err) {
		console.error('Load section items error:', err)
		throw error(500, 'Failed to load items')
	}
}