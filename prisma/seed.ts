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
	const adminPassword = await hash('admin', {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1
	})

	await db.user.create({
		data: {
			name: 'Arshee Vincent',
			username: 'admin',
			password: adminPassword,
			role: 'ADMIN'
		}
	})
}

main()
	.then(async () => {
		await db.$disconnect()
		console.log('Database seeding successfully!')
		process.exit(0)
	})
	.catch(async (e) => {
		console.error(e)
		await db.$disconnect()
		process.exit(1)
	})
