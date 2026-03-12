import { db } from '$lib/server/db'
import type { Section } from '../../../../generated/prisma/client'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
	try {
		const sections = await db.section.findMany()

		return { sections }
	} catch {
		return { sections: [] as Section[] }
	}
}

export const actions: Actions = {
	default: async ({ request }) => {
		const id = Number((await request.formData()).get('id'))

		try {
			await db.section.delete({ where: { id } })

			return { success: true, message: 'Section is deleted successfully!' }
		} catch {
			return { success: false, message: 'Something went wrong!' }
		}
	}
}
