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
	// Hash password untuk admin
	const adminPassword = await hash('admin', {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1
	})

	// Hash password untuk audit
	const auditPassword = await hash('audit', {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1
	})

	// Buat user ADMIN
	const admin = await db.user.upsert({
		where: { username: 'admin' },
		update: {},
		create: {
			name: 'Arshee Vincent',
			username: 'admin',
			password: adminPassword,
			role: 'ADMIN'
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
			role: 'STOCK_AUDIT'
		}
	})
	console.log('Stock Audit user created:', audit.username)

	console.log('Database seeding successfully!')
	console.log('Admin login: username="admin", password="admin"')
	console.log('Audit login: username="audit", password="audit"')
}

main()
	.then(async () => {
		await db.$disconnect()
		process.exit(0)
	})
	.catch(async (e) => {
		console.error(e)
		await db.$disconnect()
		process.exit(1)
	})