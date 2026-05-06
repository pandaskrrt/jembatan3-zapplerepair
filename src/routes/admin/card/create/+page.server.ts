import { writeImageFile } from '$lib/helper/write-file'
import CardSchema from '$lib/schemas/card'
import { db } from '$lib/server/db'
import { fail, redirect, type Actions } from '@sveltejs/kit'
import { superValidate } from 'sveltekit-superforms'
import { zod4 as zod } from 'sveltekit-superforms/adapters'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
	const sections = await db.section.findMany({
		include: {
			cabinet: true
		}
	})

	return { 
		form: await superValidate(zod(CardSchema)), 
		sections 
	}
}

export const actions: Actions = {
	default: async (event) => {
		const form = await superValidate(event, zod(CardSchema))

		console.log('Form validation:', form.valid)
		console.log('Form errors:', form.errors)

		if (!form.valid) {
			return fail(400, { form, message: 'Invalid input!' })
		}

		const { 
			name, 
			stock, 
			location, 
			category, 
			subCategory, 
			videoUrl,
			qrCustomUrl,  // Tambahkan ini
			sectionId,
			priceIdr,
			priceNoteIdr,
			priceSgd,
			priceNoteSgd
		} = form.data
		
		const file = form.data.file as File | undefined
		let imageUrl: string | null = null

		console.log('Form data received:', { name, sectionId, priceIdr, priceSgd, qrCustomUrl })

		// Validasi file gambar
		if (!file || !(file instanceof File) || file.size === 0) {
			console.log('No image file')
			return fail(400, { form, message: 'Image is required!' })
		}

		// Validasi format gambar
		const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
		if (!allowedTypes.includes(file.type)) {
			console.log('Invalid image type:', file.type)
			return fail(400, { form, message: 'Invalid image format! Use JPG, PNG, or WEBP' })
		}

		// Cek section dan cabinet
		const targetSection = await db.section.findUnique({
			where: { id: sectionId },
			include: {
				cabinet: {
					include: {
						sections: {
							include: { 
								cards: true 
							}
						}
					}
				}
			}
		})

		if (!targetSection?.cabinet) {
			console.log('Section or cabinet not found')
			return fail(404, { form, message: 'Section or Cabinet not found!' })
		}

		const cabinet = targetSection.cabinet
		
		// Hitung total cards di semua section dalam cabinet
		const currentTotalCards = cabinet.sections.reduce((sum, section) => {
			return sum + section.cards.length
		}, 0)

		// Cek apakah cabinet penuh
		if (currentTotalCards >= cabinet.maxSlots) {
			console.log('Cabinet full:', cabinet.name, currentTotalCards, cabinet.maxSlots)
			return fail(400, { 
				form, 
				message: `Cabinet "${cabinet.name}" is full! Max ${cabinet.maxSlots} slots.` 
			})
		}

		// Upload gambar
		try {
			imageUrl = await writeImageFile(file)
			console.log('Image uploaded:', imageUrl)
			if (!imageUrl) {
				return fail(500, { form, message: 'Failed to upload image!' })
			}
		} catch (error) {
			console.error('Upload error:', error)
			return fail(500, { form, message: 'Error when uploading the image!' })
		}

		// Create card with prices
		try {
			const newCard = await db.card.create({
				data: {
					name,
					stock,
					location,
					category,
					subCategory,
					videoUrl: videoUrl || null,
					qrCustomUrl: qrCustomUrl || null,  // Tambahkan ini
					imageUrl: imageUrl,
					sectionId,
					prices: {
						create: [
							{
								currency: "IDR",
								amount: priceIdr,
								priceNote: priceNoteIdr,
								isActive: true
							},
							{
								currency: "SGD",
								amount: priceSgd,
								priceNote: priceNoteSgd,
								isActive: true
							}
						]
					}
				}
			})
			console.log('Card created successfully:', newCard.id)
		} catch (error) {
			console.error('Create card error:', error)
			// Hapus gambar yang sudah upload jika gagal create card
			await deleteFile(imageUrl)
			return fail(500, { form, message: 'Failed to create card: ' + error.message })
		}

		console.log('Redirecting to /admin/card')
		throw redirect(303, '/admin/card')
	}
}

// Import deleteFile
import { deleteFile } from '$lib/helper/write-file'