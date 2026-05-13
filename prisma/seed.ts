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

async function main() {
	// Hash password untuk SUPER_ADMIN
	const superAdminPassword = await hash('supertoy', {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1
	})

	// Hash password untuk ADMIN
	const adminPassword = await hash('admin', {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1
	})

	// Hash password untuk STOCK_AUDIT
	const auditPassword = await hash('audit', {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1
	})

	// Buat user SUPER_ADMIN
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
	console.log('Super Admin user created:', superAdmin.username)

	// Buat user ADMIN
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
	console.log('Admin user created:', admin.username)

	// Buat user STOCK_AUDIT
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
	console.log('Stock Audit user created:', audit.username)

	console.log('\n✅ Database seeding successfully!')
	console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
	console.log('👑 SUPER_ADMIN : username="supertoy", password="supertoy"')
	console.log('👑 ADMIN       : username="admin", password="admin"')
	console.log('📋 STOCK_AUDIT : username="audit", password="audit"')
	console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
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