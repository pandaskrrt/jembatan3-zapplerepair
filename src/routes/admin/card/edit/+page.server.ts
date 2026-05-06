import { deleteFile, writeVideoFile } from '$lib/helper/write-file'
import CardSchema from '$lib/schemas/card'
import { db } from '$lib/server/db'
import { error, fail, redirect, type Actions } from '@sveltejs/kit'
import { superValidate } from 'sveltekit-superforms'
import { zod4 as zod } from 'sveltekit-superforms/adapters'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ url }) => {
    const id = Number(url.searchParams.get('id'))

    if (!id || isNaN(id)) {
        throw error(400, 'Card ID is required')
    }

    const card = await db.card.findUnique({
        where: { id },
        include: {
            section: {
                include: { cabinet: true }
            },
            prices: true
        }
    })

    if (!card) {
        throw error(404, 'Card not found')
    }

    const sections = await db.section.findMany({
        include: { cabinet: true }
    })

    // Pre-populate form dengan data card yang ada
    const form = await superValidate(
        {
            name: card.name,
            stock: card.stock,
            location: card.location,
            category: card.category,
            subCategory: card.subCategory,
            videoUrl: card.videoUrl ?? undefined,
            sectionId: card.sectionId,
            priceIdr: card.prices.find(p => p.currency === 'IDR')?.amount ?? 0,
            priceNoteIdr: card.prices.find(p => p.currency === 'IDR')?.priceNote ?? '',
            priceSgd: card.prices.find(p => p.currency === 'SGD')?.amount ?? 0,
            priceNoteSgd: card.prices.find(p => p.currency === 'SGD')?.priceNote ?? '',
        },
        zod(CardSchema)
    )

    return { form, card, sections }
}

export const actions: Actions = {
    default: async (event) => {
        const form = await superValidate(event, zod(CardSchema))

        if (!form.valid) {
            return fail(400, { form, message: 'Invalid input!' })
        }

        const id = Number(event.url.searchParams.get('id'))

        if (!id || isNaN(id)) {
            return fail(400, { form, message: 'Invalid card ID!' })
        }

        const existingCard = await db.card.findUnique({
            where: { id },
            include: {
                section: true,
                prices: true
            }
        })

        if (!existingCard) {
            return fail(404, { form, message: 'Card not found!' })
        }

        const { 
            name, 
            stock, 
            location, 
            category, 
            subCategory, 
            sectionId,
            priceIdr,
            priceNoteIdr,
            priceSgd,
            priceNoteSgd
        } = form.data

        // Cek apakah section berpindah, validasi kapasitas cabinet tujuan
        if (sectionId !== existingCard.sectionId) {
            const targetSection = await db.section.findUnique({
                where: { id: sectionId },
                include: {
                    cabinet: {
                        include: {
                            sections: {
                                include: { _count: { select: { cards: true } } }
                            }
                        }
                    }
                }
            })

            if (!targetSection?.cabinet) {
                return fail(404, { form, message: 'Target section or cabinet not found!' })
            }

            const cabinet = targetSection.cabinet
            const currentTotalCards = cabinet.sections.reduce(
                (sum, s) => sum + s._count.cards, 
                0
            )

            if (currentTotalCards >= cabinet.maxSlots) {
                return fail(400, { 
                    form, 
                    message: `Cabinet "${cabinet.name}" is full! Max ${cabinet.maxSlots} slots.` 
                })
            }
        }

        // Handle video upload (opsional)
        const file = form.data.file as File | undefined
        let newVideoUrl: string | null = null

        if (file && file instanceof File && file.size > 0) {
            if (!['video/mp4', 'video/webm'].includes(file.type)) {
                return fail(400, { form, message: 'Invalid video format! Use MP4 or WEBM.' })
            }

            try {
                const fileName = await writeVideoFile(file)
                if (fileName) {
                    newVideoUrl = `/upload/videos/${fileName}`
                    // Hapus video lama setelah upload berhasil
                    if (existingCard.videoUrl) {
                        await deleteFile(existingCard.videoUrl)
                    }
                }
            } catch {
                return fail(500, { form, message: 'Error when uploading the video!' })
            }
        }

        // Handle image upload (opsional)
        const imageFile = event.request instanceof Request 
            ? null 
            : null
        // Image dihandle terpisah lewat FormData di server action
        // Ambil dari formData langsung
        const formData = await event.request.formData().catch(() => null)
        let newImageUrl: string | null = null

        if (formData) {
            const uploadedImage = formData.get('file') as File | null
            if (uploadedImage && uploadedImage instanceof File && uploadedImage.size > 0) {
                const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
                if (!allowedTypes.includes(uploadedImage.type)) {
                    return fail(400, { form, message: 'Invalid image format! Use JPG, PNG, or WEBP.' })
                }

                try {
                    const { writeImageFile } = await import('$lib/helper/write-file')
                    newImageUrl = await writeImageFile(uploadedImage)
                    if (newImageUrl && existingCard.imageUrl) {
                        await deleteFile(existingCard.imageUrl)
                    }
                } catch {
                    return fail(500, { form, message: 'Error when uploading the image!' })
                }
            }
        }

        // Update card dan prices dalam satu transaksi
        try {
            await db.$transaction(async (tx) => {
                // Update card
                await tx.card.update({
                    where: { id: existingCard.id },
                    data: {
                        name,
                        stock,
                        location,
                        category,
                        subCategory,
                        sectionId,
                        ...(newImageUrl && { imageUrl: newImageUrl }),
                        ...(newVideoUrl && { videoUrl: newVideoUrl }),
                    }
                })

                // Update harga IDR
                const priceIdrRecord = existingCard.prices.find(p => p.currency === 'IDR')
                if (priceIdrRecord) {
                    await tx.price.update({
                        where: { id: priceIdrRecord.id },
                        data: { amount: priceIdr, priceNote: priceNoteIdr }
                    })
                } else {
                    await tx.price.create({
                        data: {
                            cardId: existingCard.id,
                            currency: 'IDR',
                            amount: priceIdr,
                            priceNote: priceNoteIdr,
                            isActive: true
                        }
                    })
                }

                // Update harga SGD
                const priceSgdRecord = existingCard.prices.find(p => p.currency === 'SGD')
                if (priceSgdRecord) {
                    await tx.price.update({
                        where: { id: priceSgdRecord.id },
                        data: { amount: priceSgd, priceNote: priceNoteSgd }
                    })
                } else {
                    await tx.price.create({
                        data: {
                            cardId: existingCard.id,
                            currency: 'SGD',
                            amount: priceSgd,
                            priceNote: priceNoteSgd,
                            isActive: true
                        }
                    })
                }
            })
        } catch (err) {
            console.error('Update error:', err)
            return fail(500, { form, message: 'Failed to update card: ' + (err as Error).message })
        }

        throw redirect(303, '/admin/card')
    }
}