import CabinetSchema from '$lib/schemas/cabinet'
import { db } from '$lib/server/db'
import { fail, redirect, type Actions } from '@sveltejs/kit'
import { superValidate } from 'sveltekit-superforms'
import { zod4 as zod } from 'sveltekit-superforms/adapters'
import type { PageServerLoad } from './$types'
import { invalidateAll } from '$app/navigation'

export const load: PageServerLoad = async ({ url }) => {
	try {
		const id = Number(url.searchParams.get('id'))
		const cabinet = await db.cabinet.findUnique({ where: { id } })

		if (!cabinet) {
			return redirect(302, '/admin/cabinet?code=404')
		}

		const form = await superValidate(
			{
				name: cabinet.name,
				maxSlots: cabinet.maxSlots
			},
			zod(CabinetSchema)
		)

		return {
			form,
			cabinet
		}
	} catch (error) {
		console.error('Load error:', error)
		return redirect(302, '/admin/cabinet?code=500')
	}
}

export const actions: Actions = {
	default: async (event) => {
		const form = await superValidate(event, zod(CabinetSchema))

		if (!form.valid) {
			return fail(400, {
				form,
				message: 'Invalid input!'
			})
		}

		const id = Number(event.url.searchParams.get('id'))

		try {
			const dataExist = await db.cabinet.findUnique({ where: { id } })

			if (!dataExist) {
				return fail(404, {
					form,
					message: 'Cabinet data is not found!'
				})
			}
		} catch {
			return fail(500, {
				form,
				message: 'Something went wrong!'
			})
		}

		const { name, maxSlots } = form.data

		try {
			await db.cabinet.update({
				where: { id },
				data: { name, maxSlots }
			})

			return redirect(302, '/admin/cabinet')
		} catch {
			return fail(500, {
				form,
				message: 'Something went wrong!'
			})
		}
	}
}
