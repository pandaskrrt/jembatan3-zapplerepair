import { db } from '$lib/server/db'
import type { PageServerLoad, Actions } from './$types'
import { fail } from '@sveltejs/kit'

export const load: PageServerLoad = async () => {
	try {
		const cards = await db.card.findMany({
			include: {
				section: {
					include: {
						cabinet: true
					}
				},
				prices: true
			},
			orderBy: {
				id: 'desc'
			}
		})

		const sections = await db.section.findMany({
			include: {
				cabinet: true
			}
		})

		return { 
			cards,
			sections
		}
	} catch (error) {
		console.error('Load cards error:', error)
		return { 
			cards: [],
			sections: []
		}
	}
}

export const actions: Actions = {
	delete: async ({ request }) => {
		try {
			const formData = await request.formData()
			const id = Number(formData.get('id'))

			if (isNaN(id)) {
				return fail(400, { success: false, message: 'Invalid card ID' })
			}

			const card = await db.card.findUnique({ 
				where: { id },
				select: { imageUrl: true }
			})
			
			if (!card) {
				return fail(404, { success: false, message: 'Card not found' })
			}
			
			// Delete image file if exists
			if (card.imageUrl) {
				const { deleteFile } = await import('$lib/helper/write-file')
				await deleteFile(card.imageUrl)
			}
			
			await db.card.delete({ where: { id } })
			
			return { success: true, message: 'Card deleted successfully!' }
			
		} catch (error) {
			console.error('Delete error:', error)
			return fail(500, { success: false, message: error.message || 'Failed to delete card' })
		}
	}
}