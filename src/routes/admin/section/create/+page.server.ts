import SectionSchema from '$lib/schemas/section'
import { db } from '$lib/server/db'
import { fail, redirect, type Actions } from '@sveltejs/kit'
import { superValidate } from 'sveltekit-superforms'
import { zod4 as zod } from 'sveltekit-superforms/adapters'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
	const cabinets = await db.cabinet.findMany({
		select: {
			id: true,
			name: true,
			maxSlots: true
		}
	})

	return {
		form: await superValidate(zod(SectionSchema)),
		cabinets
	}
}

export const actions: Actions = {
	default: async (event) => {
		const form = await superValidate(event, zod(SectionSchema))

		if (!form.valid) {
			return fail(400, {
				form,
				message: 'Invalid input!'
			})
		}

		const { name, type, cabinetId } = form.data

		try {
			await db.section.create({ data: { name, type, cabinetId } })

			redirect(303, '/admin/section')
		} catch {
			return fail(500, {
				form,
				message: 'Something went wrong!'
			})
		}
	}
}