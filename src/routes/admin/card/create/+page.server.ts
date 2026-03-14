import { writeVideoFile } from '$lib/helper/write-file'
import CardSchema from '$lib/schemas/card'
import { db } from '$lib/server/db'
import { fail, redirect, type Actions } from '@sveltejs/kit'
import { superValidate } from 'sveltekit-superforms'
import { zod4 as zod } from 'sveltekit-superforms/adapters'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
	const sections = await db.section.findMany()

	return { form: await superValidate(zod(CardSchema)), sections }
}

export const actions: Actions = {
	default: async (event) => {
		const form = await superValidate(event, zod(CardSchema))

		if (!form.valid) {
			return fail(400, {
				form,
				message: 'Invalid input!'
			})
		}

		const { sectionId } = form.data
		const file = form.data.file as File | undefined
		let fileName: string | null

		if (!file || !(file instanceof File) || file.size === 0) {
			return fail(400, { form, message: 'Image is required!' })
		}

		if (!['video/mp4', 'video/webm'].includes(file.type)) {
			return fail(400, { form, message: 'Invalid video format!' })
		}

		const targetSection = await db.section.findUnique({
			where: { id: sectionId },
			include: {
				cabinet: {
					include: {
						section: {
							include: { _count: { select: { cards: true } } }
						}
					}
				}
			}
		})

		if (!targetSection?.cabinet) {
			return fail(404, { form, message: 'Section data is not found!' })
		}

		const cabinet = targetSection.cabinet
		const currentTotalCards = cabinet.section.reduce((sum, s) => sum + s._count.cards, 0)

		if (currentTotalCards >= cabinet.maxSlots) {
			return fail(400, { form, message: 'Cabinet is full!' })
		}

		try {
			fileName = await writeVideoFile(file)
		} catch {
			return fail(500, { form, message: 'Error when uploading the image!' })
		}

		await db.card.create({
			data: { ...form.data, videoUrl: `/upload/videos/${fileName}` }
		})

		return redirect(303, '/admin/card')
	}
}
