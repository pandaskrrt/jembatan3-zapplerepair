import { db } from '$lib/server/db'
import { hash } from '@node-rs/argon2'
import { fail, redirect, type Actions, type PageServerLoad } from '@sveltejs/kit'

export const load: PageServerLoad = async () => {
    // Ambil semua user (tanpa order by createdAt karena tidak ada field createdAt)
    const users = await db.user.findMany({
        orderBy: { id: 'desc' }, // Urutkan berdasarkan id (descending)
        select: {
            id: true,
            username: true,
            name: true,
            role: true,
            isActive: true,
            // createdAt tidak ada di schema, jadi dihapus
            // Gunakan id sebagai pengganti urutan
            _count: {
                select: {
                    audits: true,
                    reportSignatures: true
                }
            }
        }
    })

    // Statistik user
    const stats = {
        total: users.length,
        superAdmin: users.filter(u => u.role === 'SUPER_ADMIN').length,
        admin: users.filter(u => u.role === 'ADMIN').length,
        stockAudit: users.filter(u => u.role === 'STOCK_AUDIT').length,
        user: users.filter(u => u.role === 'USER').length,
        active: users.filter(u => u.isActive).length,
        inactive: users.filter(u => !u.isActive).length
    }

    return { users, stats }
}

export const actions: Actions = {
    // Create user
    create: async ({ request }) => {
        const formData = await request.formData()
        const username = formData.get('username') as string
        const name = formData.get('name') as string
        const password = formData.get('password') as string
        const role = formData.get('role') as string

        if (!username || !name || !password || !role) {
            return fail(400, { success: false, message: 'Semua field wajib diisi!' })
        }

        // Cek username sudah ada
        const existingUser = await db.user.findUnique({ where: { username } })
        if (existingUser) {
            return fail(400, { success: false, message: 'Username sudah digunakan!' })
        }

        const hashedPassword = await hash(password, {
            memoryCost: 19456,
            timeCost: 2,
            outputLen: 32,
            parallelism: 1
        })

        await db.user.create({
            data: {
                username,
                name,
                password: hashedPassword,
                role: role as any,
                isActive: true
            }
        })

        return { success: true, message: 'User berhasil ditambahkan!' }
    },

    // Update user
    update: async ({ request }) => {
        const formData = await request.formData()
        const userId = formData.get('userId') as string
        const name = formData.get('name') as string
        const role = formData.get('role') as string
        const isActive = formData.get('isActive') === 'true'
        const newPassword = formData.get('newPassword') as string

        if (!userId || !name || !role) {
            return fail(400, { success: false, message: 'Data tidak lengkap!' })
        }

        const updateData: any = {
            name,
            role: role as any,
            isActive
        }

        if (newPassword && newPassword.length > 0) {
            updateData.password = await hash(newPassword, {
                memoryCost: 19456,
                timeCost: 2,
                outputLen: 32,
                parallelism: 1
            })
        }

        await db.user.update({
            where: { id: userId },
            data: updateData
        })

        return { success: true, message: 'User berhasil diupdate!' }
    },

    // Delete user
    delete: async ({ request }) => {
        const formData = await request.formData()
        const userId = formData.get('userId') as string

        if (!userId) {
            return fail(400, { success: false, message: 'User ID tidak ditemukan!' })
        }

        // Cek jangan sampai menghapus SUPER_ADMIN terakhir
        const superAdminCount = await db.user.count({ where: { role: 'SUPER_ADMIN' } })
        const userToDelete = await db.user.findUnique({ where: { id: userId } })

        if (userToDelete?.role === 'SUPER_ADMIN' && superAdminCount <= 1) {
            return fail(400, { success: false, message: 'Tidak dapat menghapus SUPER_ADMIN terakhir!' })
        }

        await db.user.delete({ where: { id: userId } })

        return { success: true, message: 'User berhasil dihapus!' }
    },

    // Toggle status (aktif/nonaktif)
    toggleStatus: async ({ request }) => {
        const formData = await request.formData()
        const userId = formData.get('userId') as string
        const isActive = formData.get('isActive') === 'true'

        // Cek jangan sampai menonaktifkan SUPER_ADMIN terakhir
        const superAdminCount = await db.user.count({ where: { role: 'SUPER_ADMIN', isActive: true } })
        const userToToggle = await db.user.findUnique({ where: { id: userId } })

        if (userToToggle?.role === 'SUPER_ADMIN' && superAdminCount <= 1 && !isActive) {
            return fail(400, { success: false, message: 'Tidak dapat menonaktifkan SUPER_ADMIN terakhir!' })
        }

        await db.user.update({
            where: { id: userId },
            data: { isActive }
        })

        return { success: true, message: `User ${isActive ? 'diaktifkan' : 'dinonaktifkan'}!` }
    }
}