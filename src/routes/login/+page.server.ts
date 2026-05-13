import { SECRET_JWT_TOKEN } from '$env/static/private'
import LoginSchema from '$lib/schemas/login'
import { db } from '$lib/server/db'
import { verify } from '@node-rs/argon2'
import { fail, redirect, type Actions } from '@sveltejs/kit'
import jwt from 'jsonwebtoken'
import { superValidate } from 'sveltekit-superforms'
import { zod4 as zod } from 'sveltekit-superforms/adapters'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
	return { form: await superValidate(zod(LoginSchema)) }
}

export const actions: Actions = {
	default: async (event) => {
		const form = await superValidate(event, zod(LoginSchema))

		if (!form.valid) {
			return fail(400, {
				form,
				message: ''
			})
		}

		const { username, password } = form.data
		const callback = event.url.searchParams.get('callback')

		const userExist = await db.user.findUnique({ where: { username } })

		if (!userExist) {
			return fail(400, {
				form,
				message: 'Username atau password salah!'
			})
		}

		// Cek role yang diizinkan login
		// SUPER_ADMIN, ADMIN, dan STOCK_AUDIT bisa login
		if (userExist.role !== 'SUPER_ADMIN' && userExist.role !== 'ADMIN' && userExist.role !== 'STOCK_AUDIT') {
			return fail(403, {
				form,
				message: 'Akses ditolak! Anda tidak memiliki izin.'
			})
		}

		// Cek apakah user aktif
		if (userExist.isActive === false) {
			return fail(403, {
				form,
				message: 'Akun Anda telah dinonaktifkan. Hubungi administrator.'
			})
		}

		const isPasswordRight = await verify(userExist.password, password)

		if (!isPasswordRight) {
			return fail(400, {
				form,
				message: 'Username atau password salah!'
			})
		}

		const authToken = await jwt.sign(
			{ 
				id: userExist.id, 
				username: userExist.username, 
				role: userExist.role 
			},
			SECRET_JWT_TOKEN,
			{ expiresIn: '24h' }
		)

		event.cookies.set('authToken', authToken, {
			path: '/',
			httpOnly: true,
			maxAge: 60 * 60 * 24
		})

		if (callback) {
			redirect(303, callback)
		}

		// Redirect berdasarkan role
		if (userExist.role === 'SUPER_ADMIN') {
			redirect(303, '/superadmin')
		} else if (userExist.role === 'ADMIN') {
			redirect(303, '/admin')
		} else if (userExist.role === 'STOCK_AUDIT') {
			redirect(303, '/stock-audit')
		}

		redirect(303, '/')
	}
}