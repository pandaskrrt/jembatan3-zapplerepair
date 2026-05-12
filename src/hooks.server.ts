import { SECRET_JWT_TOKEN } from '$env/static/private'
import { redirect, type Handle } from '@sveltejs/kit'
import jwt from 'jsonwebtoken'

export const handle: Handle = async ({ event, resolve }) => {
	const authToken = event.cookies.get('authToken')
	
	// Route yang perlu proteksi
	const isAdminRoute = event.url.pathname.startsWith('/admin')
	const isStockAuditRoute = event.url.pathname.startsWith('/stock-audit')
	const isProtectedRoute = isAdminRoute || isStockAuditRoute

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
			role: 'ADMIN' | 'USER' | 'STOCK_AUDIT'
		}
		event.locals.session = verified
		
		// Validasi role untuk route yang diakses
		// Route /admin hanya bisa diakses oleh ADMIN
		if (isAdminRoute && verified.role !== 'ADMIN') {
			throw redirect(302, `/login?callback=${event.url.pathname}&error=unauthorized`)
		}
		
		// Route /stock-audit hanya bisa diakses oleh STOCK_AUDIT atau ADMIN
		// ADMIN bisa akses stock-audit juga (untuk review)
		if (isStockAuditRoute && verified.role !== 'STOCK_AUDIT' && verified.role !== 'ADMIN') {
			throw redirect(302, `/login?callback=${event.url.pathname}&error=unauthorized`)
		}
		
	} catch (err) {
		event.cookies.delete('authToken', { path: '/' })
		event.locals.session = null

		if (isProtectedRoute) {
			throw redirect(302, `/login?callback=${event.url.pathname}`)
		}
	}

	// Redirect dari login jika sudah login
	if (event.locals.session && event.url.pathname.startsWith('/login')) {
		const session = event.locals.session
		// Redirect berdasarkan role
		if (session.role === 'ADMIN') {
			throw redirect(302, '/admin')
		} else if (session.role === 'STOCK_AUDIT') {
			throw redirect(302, '/stock-audit')
		} else {
			throw redirect(302, '/')
		}
	}

	return resolve(event)
}