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
				cards: {
					include: {
						prices: true
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
		
		const cards = section.cards.map(card => ({
			id: card.id,
			name: card.name,
			imageUrl: card.imageUrl,
			stock: card.stock,
			location: card.location,
			category: card.category,
			subCategory: card.subCategory,
			prices: {
				idr: card.prices.find(p => p.currency === 'IDR'),
				sgd: card.prices.find(p => p.currency === 'SGD')
			}
		}))
		
		return {
			section: {
				id: section.id,
				name: section.name,
				type: section.type
			},
			showcase: {
				id: section.cabinet?.id,
				name: section.cabinet?.name
			},
			cards
		}
	} catch (err) {
		console.error('Load section cards error:', err)
		throw error(500, 'Failed to load cards')
	}
}