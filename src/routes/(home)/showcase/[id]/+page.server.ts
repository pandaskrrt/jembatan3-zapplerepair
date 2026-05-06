import { db } from '$lib/server/db'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params }) => {
	const id = parseInt(params.id)
	
	if (isNaN(id)) {
		throw error(404, 'Showcase not found')
	}
	
	try {
		const cabinet = await db.cabinet.findUnique({
			where: { id },
			include: {
				sections: {
					include: {
						_count: {
							select: { cards: true }
						},
						cards: {
							take: 3,
							include: {
								prices: true
							}
						}
					}
				}
			}
		})
		
		if (!cabinet) {
			throw error(404, 'Showcase not found')
		}
		
		const totalCards = cabinet.sections.reduce((sum, s) => sum + s._count.cards, 0)
		
		const sections = cabinet.sections.map(section => ({
			id: section.id,
			name: section.name,
			type: section.type,
			cardCount: section._count.cards,
			previewCards: section.cards.map(card => ({
				id: card.id,
				name: card.name,
				imageUrl: card.imageUrl,
				price: card.prices.find(p => p.currency === 'IDR')?.amount || 0
			}))
		}))
		
		return {
			showcase: {
				id: cabinet.id,
				name: cabinet.name,
				maxSlots: cabinet.maxSlots,
				totalCards,
				sections
			}
		}
	} catch (err) {
		console.error('Load showcase error:', err)
		throw error(500, 'Failed to load showcase')
	}
}