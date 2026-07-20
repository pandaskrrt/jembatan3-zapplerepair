import { db } from '$lib/server/db'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params }) => {
	const id = parseInt(params.id)
	
	if (isNaN(id)) {
		throw error(404, 'Cabinet not found')
	}
	
	try {
		const cabinet = await db.cabinet.findUnique({
			where: { 
				id,
				deletedAt: null
			},
			include: {
				sections: {
					where: {
						deletedAt: null
					},
					include: {
						_count: {
							select: {
								items: {
									where: { deletedAt: null }
								}
							}
						},
						items: {
							where: { deletedAt: null },
							take: 3,
							include: {
								price: true
							}
						}
					}
				}
			}
		})
		
		if (!cabinet) {
			throw error(404, 'Cabinet not found')
		}
		
		const totalItems = cabinet.sections.reduce((sum, s) => sum + s._count.items, 0) // ganti cards → items
		
		const sections = cabinet.sections.map(section => ({
			id: section.id,
			name: section.name,
			type: section.type,
			itemCount: section._count.items, // ganti cardCount → itemCount
			previewItems: section.items.map(item => ({ // ganti previewCards → previewItems, cards → items
				id: item.id,
				name: item.name,
				imageUrl: item.imageUrl,
				stock: item.stock, // tambahkan stock
				price: item.price?.amount || 0 // ganti prices.find → price.amount
			}))
		}))
		
		return {
			showcase: {
				id: cabinet.id,
				name: cabinet.name,
				maxSlots: cabinet.maxSlots,
				totalItems, // ganti totalCards → totalItems
				sections
			}
		}
	} catch (err) {
		console.error('Load cabinet error:', err)
		throw error(500, 'Failed to load cabinet')
	}
}