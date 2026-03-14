import CabinetSchema from '$lib/schemas/cabinet'
import { db } from '$lib/server/db'
import type { PageServerLoad } from './$types'

import { fail, redirect, type Actions } from '@sveltejs/kit'
import { superValidate } from 'sveltekit-superforms'
import { zod4 as zod } from 'sveltekit-superforms/adapters'

export const load: PageServerLoad = async () => {
	return { form: await superValidate(zod(CabinetSchema)) }
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

		const { name, maxSlots } = form.data

		try {
			await db.cabinet.create({ data: { name, maxSlots } })

			return redirect(303, '/admin/cabinet')
		} catch {
			return fail(500, {
				form,
				message: 'Something went wrong!'
			})
		}
	}
}
