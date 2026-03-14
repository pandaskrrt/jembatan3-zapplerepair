import { deleteFile, writeVideoFile } from '$lib/helper/write-file'
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
			return fail(400, { form, message: 'Invalid input!' })
		}

		const id = Number(event.url.searchParams.get('id'))
		const existingCard = await db.card.findUnique({
			where: { id },
			include: { section: true }
		})

		if (!existingCard) {
			return fail(404, { form, message: 'Card not found!' })
		}

		const { sectionId } = form.data
		const file = form.data.file as File | undefined
		let fileName: string | null = null

		if (sectionId !== existingCard.sectionId) {
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
				return fail(404, { form, message: 'Target section data not found!' })
			}

			const cabinet = targetSection.cabinet
			const currentTotalCards = cabinet.section.reduce((sum, s) => sum + s._count.cards, 0)

			if (currentTotalCards >= cabinet.maxSlots) {
				return fail(400, { form, message: 'Target cabinet is full!' })
			}
		}

		if (file && file instanceof File && file.size > 0) {
			if (!['video/mp4', 'video/webm'].includes(file.type)) {
				return fail(400, { form, message: 'Invalid video format!' })
			}

			try {
				fileName = await writeVideoFile(file)

				if (fileName) {
					await deleteFile(existingCard.videoUrl)
				}
			} catch {
				return fail(500, { form, message: 'Error when uploading the video!' })
			}
		}

		try {
			await db.card.update({
				where: { id: existingCard.id },
				data: {
					...form.data,
					videoUrl: fileName ? `/upload/videos/${fileName}` : existingCard.videoUrl
				}
			})
		} catch {
			return fail(500, { form, message: 'Database update failed.' })
		}

		return redirect(303, '/admin/card')
	}
}
