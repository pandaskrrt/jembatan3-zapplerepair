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

    const form = await superValidate(
        {
            name: card.name,
            stock: card.stock,
            location: card.location,
            category: card.category,
            subCategory: card.subCategory,
            videoUrl: card.videoUrl ?? undefined,
            qrCustomUrl: card.qrCustomUrl ?? undefined,
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
        // BACA FORM DATA SEKALI SAJA
        const requestFormData = await event.request.formData()
        
        // Extract text fields dari formData
        const name = requestFormData.get('name') as string
        const stock = Number(requestFormData.get('stock'))
        const location = requestFormData.get('location') as string
        const category = requestFormData.get('category') as string
        const subCategory = requestFormData.get('subCategory') as string
        const videoUrl = requestFormData.get('videoUrl') as string
        const qrCustomUrl = requestFormData.get('qrCustomUrl') as string
        const sectionId = Number(requestFormData.get('sectionId'))
        const priceIdr = Number(requestFormData.get('priceIdr'))
        const priceNoteIdr = requestFormData.get('priceNoteIdr') as string
        const priceSgd = Number(requestFormData.get('priceSgd'))
        const priceNoteSgd = requestFormData.get('priceNoteSgd') as string

        const id = Number(event.url.searchParams.get('id'))

        if (!id || isNaN(id)) {
            return fail(400, { message: 'Invalid card ID!' })
        }

        // Validasi sederhana
        if (!name || !location || !category || !subCategory || !sectionId) {
            return fail(400, { message: 'Missing required fields!' })
        }

        const existingCard = await db.card.findUnique({
            where: { id },
            include: {
                section: true,
                prices: true
            }
        })

        if (!existingCard) {
            return fail(404, { message: 'Card not found!' })
        }

        // Handle video upload
        let newVideoUrl: string | null = null
        const uploadedVideo = requestFormData.get('videoFile') as File | null
        if (uploadedVideo && uploadedVideo instanceof File && uploadedVideo.size > 0) {
            if (!['video/mp4', 'video/webm'].includes(uploadedVideo.type)) {
                return fail(400, { message: 'Invalid video format! Use MP4 or WEBM.' })
            }

            try {
                const fileName = await writeVideoFile(uploadedVideo)
                if (fileName) {
                    newVideoUrl = `/upload/videos/${fileName}`
                    if (existingCard.videoUrl) {
                        await deleteFile(existingCard.videoUrl)
                    }
                }
            } catch {
                return fail(500, { message: 'Error when uploading the video!' })
            }
        }

        // Handle image upload
        let newImageUrl: string | null = null
        const uploadedImage = requestFormData.get('file') as File | null
        if (uploadedImage && uploadedImage instanceof File && uploadedImage.size > 0) {
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
            if (!allowedTypes.includes(uploadedImage.type)) {
                return fail(400, { message: 'Invalid image format! Use JPG, PNG, or WEBP.' })
            }

            try {
                const { writeImageFile } = await import('$lib/helper/write-file')
                newImageUrl = await writeImageFile(uploadedImage)
                if (newImageUrl && existingCard.imageUrl) {
                    await deleteFile(existingCard.imageUrl)
                }
            } catch {
                return fail(500, { message: 'Error when uploading the image!' })
            }
        }

        // Cek apakah section berpindah
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
                return fail(404, { message: 'Target section or cabinet not found!' })
            }

            const cabinet = targetSection.cabinet
            const currentTotalCards = cabinet.sections.reduce(
                (sum, s) => sum + s._count.cards, 
                0
            )

            if (currentTotalCards >= cabinet.maxSlots) {
                return fail(400, { 
                    message: `Cabinet "${cabinet.name}" is full! Max ${cabinet.maxSlots} slots.` 
                })
            }
        }

        // Update card dan prices
        try {
            await db.$transaction(async (tx) => {
                await tx.card.update({
                    where: { id: existingCard.id },
                    data: {
                        name,
                        stock,
                        location,
                        category,
                        subCategory,
                        videoUrl: newVideoUrl ?? (videoUrl || null),
                        qrCustomUrl: qrCustomUrl || null,
                        ...(newImageUrl && { imageUrl: newImageUrl }),
                        // PERBAIKAN: gunakan connect untuk relasi section
                        section: {
                            connect: { id: sectionId }
                        }
                    }
                })

                // Update IDR price
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

                // Update SGD price
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
            return fail(500, { message: 'Failed to update card: ' + (err as Error).message })
        }

        throw redirect(303, '/admin/card')
    }
}