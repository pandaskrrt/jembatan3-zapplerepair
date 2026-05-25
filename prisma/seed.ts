import { hash } from '@node-rs/argon2'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/client'

const adapter = new PrismaMariaDb({
	host: process.env.SECRET_DATABASE_HOSTNAME || 'localhost',
	port: Number(process.env.SECRET_DATABASE_PORT) || 3360,
	database: process.env.SECRET_DATABASE_NAME || 'my-app',
	user: process.env.SECRET_DATABASE_USERNAME || 'root',
	password: process.env.SECRET_DATABASE_PASSWORD || '',
	connectionLimit: 5
})
const db = new PrismaClient({ adapter })

// ─────────────────────────────────────────
// CONFIG — atur tanggal data lama di sini
// ─────────────────────────────────────────
const LEGACY_DATE = new Date('2026-05-21T00:00:00.000Z')

// ─────────────────────────────────────────
// USERS
// ─────────────────────────────────────────
async function seedUsers() {
	console.log('\n👤 Seeding users...')

	const superAdminPassword = await hash('supertoy', {
		memoryCost: 19456, timeCost: 2, outputLen: 32, parallelism: 1
	})
	const adminPassword = await hash('admin', {
		memoryCost: 19456, timeCost: 2, outputLen: 32, parallelism: 1
	})
	const auditPassword = await hash('audit', {
		memoryCost: 19456, timeCost: 2, outputLen: 32, parallelism: 1
	})

	const superAdmin = await db.user.upsert({
		where: { username: 'supertoy' },
		update: {},
		create: {
			name: 'Super Administrator',
			username: 'supertoy',
			password: superAdminPassword,
			role: 'SUPER_ADMIN',
			isActive: true
		}
	})
	console.log('  ✓ Super Admin:', superAdmin.username)

	const admin = await db.user.upsert({
		where: { username: 'admin' },
		update: {},
		create: {
			name: 'Arshee Vincent',
			username: 'admin',
			password: adminPassword,
			role: 'ADMIN',
			isActive: true
		}
	})
	console.log('  ✓ Admin:', admin.username)

	const audit = await db.user.upsert({
		where: { username: 'audit' },
		update: {},
		create: {
			name: 'Stock Auditor',
			username: 'audit',
			password: auditPassword,
			role: 'STOCK_AUDIT',
			isActive: true
		}
	})
	console.log('  ✓ Stock Audit:', audit.username)

	return { superAdmin, admin, audit }
}

// ─────────────────────────────────────────
// TIMESTAMPS — isi createdAt data lama
// ─────────────────────────────────────────
async function seedLegacyTimestamps(systemUserId: string) {
	console.log('\n📅 Mengisi timestamps data lama...')
	console.log(`   Tanggal: ${LEGACY_DATE.toLocaleDateString('id-ID', {
		day: 'numeric', month: 'long', year: 'numeric'
	})}`)

	// ── Cabinet ──────────────────────────
	const cabinets = await db.cabinet.findMany({ select: { id: true, name: true, createdAt: true } })
	let cabinetFixed = 0
	for (const cabinet of cabinets) {
		// Hanya update kalau createdAt masih default/baru (sama dengan sekarang)
		await db.cabinet.update({
			where: { id: cabinet.id },
			data: { createdAt: LEGACY_DATE }
		})
		cabinetFixed++
	}
	console.log(`  ✓ Cabinet   : ${cabinetFixed} diupdate`)

	// ── Section ──────────────────────────
	const sections = await db.section.findMany({ select: { id: true, name: true } })
	let sectionFixed = 0
	for (const section of sections) {
		await db.section.update({
			where: { id: section.id },
			data: { createdAt: LEGACY_DATE }
		})
		sectionFixed++
	}
	console.log(`  ✓ Section   : ${sectionFixed} diupdate`)

	// ── Item ─────────────────────────────
	const items = await db.item.findMany({ select: { id: true, name: true } })
	let itemFixed = 0
	let historyCreated = 0
	for (const item of items) {
		await db.item.update({
			where: { id: item.id },
			data: { createdAt: LEGACY_DATE }
		})

		// Buat ItemHistory CREATED kalau belum ada
		const existing = await db.itemHistory.findFirst({
			where: { itemId: item.id, action: 'CREATED' }
		})
		if (!existing) {
			await db.itemHistory.create({
				data: {
					itemId: item.id,
					action: 'CREATED',
					triggeredBy: systemUserId,
					note: 'Data historis — item sudah ada sebelum sistem history diterapkan',
					createdAt: LEGACY_DATE
				}
			})
			historyCreated++
		}
		itemFixed++
	}
	console.log(`  ✓ Item      : ${itemFixed} diupdate`)
	console.log(`  ✓ ItemHistory CREATED : ${historyCreated} dibuat`)

	// ── User ─────────────────────────────
	const users = await db.user.findMany({ select: { id: true, name: true } })
	let userFixed = 0
	for (const user of users) {
		await db.user.update({
			where: { id: user.id },
			data: { createdAt: LEGACY_DATE }
		})
		userFixed++
	}
	console.log(`  ✓ User      : ${userFixed} diupdate`)
}

// ─────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────
async function main() {
	console.log('🚀 Mulai seeding...')
	console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

	// 1. Seed users
	const { superAdmin } = await seedUsers()

	// 2. Isi timestamps data lama (pakai superAdmin sebagai triggeredBy)
	await seedLegacyTimestamps(superAdmin.id)

	console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
	console.log('✅ Seeding selesai!')
	console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
	console.log('👑 SUPER_ADMIN : username="supertoy"  password="supertoy"')
	console.log('👑 ADMIN       : username="admin"     password="admin"')
	console.log('📋 STOCK_AUDIT : username="audit"     password="audit"')
	console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
	console.log('\n💡 Buka laporan periodik Mei 2026 untuk lihat data historis.')
}

main()
	.then(async () => {
		await db.$disconnect()
		process.exit(0)
	})
	.catch(async (e) => {
		console.error('❌ Seeding failed:', e)
		await db.$disconnect()
		process.exit(1)
	})