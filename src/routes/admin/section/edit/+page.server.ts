import SectionSchema from '$lib/schemas/section'
import { db } from '$lib/server/db'
import { fail, redirect, type Actions } from '@sveltejs/kit'
import { superValidate } from 'sveltekit-superforms'
import { zod4 as zod } from 'sveltekit-superforms/adapters'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ url }) => {
	const id = Number(url.searchParams.get('id'))

	try {
		const section = await db.section.findUnique({ where: { id } })

		if (!section) {
			return redirect(303, '/admin/section?code=404')
		}

		return { form: await superValidate(zod(SectionSchema)), section }
	} catch {
		return redirect(303, '/admin/section?code=500')
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

		const id = Number(event.url.searchParams.get('id'))

		try {
			const dataExist = await db.section.findUnique({ where: { id } })

			if (!dataExist) {
				return fail(404, {
					form,
					message: 'Section data is not found!'
				})
			}
		} catch {
			return fail(500, {
				form,
				message: 'Something went wrong!'
			})
		}

		const { name, type, layout, cabinetId } = form.data

		try {
			await db.section.create({ data: { name, type, layout, cabinetId } })

			redirect(302, '/admin/section')
		} catch {
			return fail(500, {
				form,
				message: 'Something went wrong!'
			})
		}
	}
}
