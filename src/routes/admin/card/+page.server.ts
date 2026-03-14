import { deleteFile } from '$lib/helper/write-file'
import { db } from '$lib/server/db'
import type { Card } from '../../../../generated/prisma/client'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
	try {
		const cards = await db.card.findMany()

		return { cards }
	} catch {
		return { cards: [] as Card[] }
	}
}

export const actions: Actions = {
	default: async ({ request }) => {
		const id = Number((await request.formData()).get('id'))

		try {
			const deletedCard = await db.card.delete({ where: { id } })
			await deleteFile(deletedCard.videoUrl)

			return { success: true, message: 'Card is deleted successfully!' }
		} catch {
			return { success: false, message: 'Something went wrong!' }
		}
	}
}
