import { db } from '$lib/server/db'
import { error } from '@sveltejs/kit'
import Stripe from 'stripe'
import type { PageServerLoad } from './$types'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export const load: PageServerLoad = async ({ url }) => {
	const sessionId = url.searchParams.get('sessionId')

	if (!sessionId) {
		throw error(400, 'Missing Session ID')
	}

	try {
		const session = await stripe.checkout.sessions.retrieve(sessionId)

		if (session.payment_status !== 'paid') {
			return {
				success: false,
				message: 'Payment pending or failed.'
			}
		}

		const cardId = parseInt(session.metadata?.cardId || '0')
		const userId = session.metadata?.userId

		if (!cardId || !userId) {
			throw error(400, 'Invalid session metadata')
		}

		// 4. Database Transaction
		const order = await db.$transaction(async (tx) => {
			// Check if we already processed this Stripe session to prevent double-counting
			const existingOrder = await tx.orderHistory.findUnique({
				where: { stripeId: sessionId }
			})

			if (existingOrder) return existingOrder

			await tx.card.update({
				where: { id: cardId },
				data: { stock: { decrement: 1 } }
			})

			return await tx.orderHistory.create({
				data: {
					stripeId: sessionId,
					userId: userId,
					cardId: cardId,
					amount: session.amount_total || 0,
					status: 'PAID'
				}
			})
		})

		return {
			success: true,
			order
		}
	} catch {
		throw error(500, 'Internal Server Error!')
	}
}
