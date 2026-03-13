import { SECRET_JWT_TOKEN } from '$env/static/private'
import { redirect, type Handle } from '@sveltejs/kit'
import jwt from 'jsonwebtoken'

export const handle: Handle = async ({ event, resolve }) => {
	const authToken = event.cookies.get('authToken')
	const isProtectedRoute = event.url.pathname.startsWith('/admin')

	if (!authToken) {
		event.locals.session = null
		if (isProtectedRoute) {
			throw redirect(302, `/login?callback=${event.url.pathname}`)
		}
		return resolve(event)
	}

	try {
		const verified = jwt.verify(authToken, SECRET_JWT_TOKEN) as {
			id: number
			username: string
			role: 'ADMIN' | 'USER'
		}
		event.locals.session = verified
	} catch {
		event.cookies.delete('authToken', { path: '/' })
		event.locals.session = null

		if (isProtectedRoute) {
			throw redirect(302, `/login?callback=${event.url.pathname}`)
		}
	}

	if (event.locals.session && event.url.pathname.startsWith('/login')) {
		throw redirect(302, '/admin')
	}

	return resolve(event)
}
