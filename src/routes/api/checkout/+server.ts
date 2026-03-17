import { SECRET_STRIPE_KEY } from '$env/static/private'
import { PUBLIC_URL } from '$env/static/public'
import { db } from '$lib/server/db'
import { json } from '@sveltejs/kit'
import Stripe from 'stripe'
import type { RequestHandler } from './$types'

const stripe = new Stripe(SECRET_STRIPE_KEY)

export const POST: RequestHandler = async ({ request }) => {
	const jsonBody: { cardId: number; userId: string } = await request.json()
	const card = await db.card.findUnique({
		where: { id: jsonBody.cardId }
	})

	if (!card || card.stock <= 0) {
		return json({ error: 'Item out of stock' }, { status: 400 })
	}

	const session = await stripe.checkout.sessions.create({
		payment_method_types: ['card'],
		line_items: [
			{
				price_data: {
					currency: 'usd',
					product_data: { name: card.name },
					unit_amount: card.price * 100 // Stripe uses cents
				},
				quantity: 1
			}
		],
		mode: 'payment',
		success_url: `${PUBLIC_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
		cancel_url: `${PUBLIC_URL}/cancel`,
		metadata: {
			cardId: card.id.toString(),
			userId: String(jsonBody.userId)
		}
	})
	return json({ url: session.url })
}
