import { db } from '$lib/server/db'
import type { Cabinet } from '../../../../generated/prisma/client'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
	try {
		const cabinets = await db.cabinet.findMany()

		return { cabinets }
	} catch {
		return { cabinets: [] as Cabinet[] }
	}
}

export const actions: Actions = {
	default: async ({ request }) => {
		const id = Number((await request.formData()).get('id'))

		try {
			await db.cabinet.delete({ where: { id } })

			return { success: true, message: 'Cabinet is deleted successfully' }
		} catch {
			return { success: false, message: 'Something went wrong!' }
		}
	}
}
