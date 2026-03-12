import {
	SECRET_DATABASE_HOSTNAME,
	SECRET_DATABASE_NAME,
	SECRET_DATABASE_PASSWORD,
	SECRET_DATABASE_PORT,
	SECRET_DATABASE_USERNAME
} from '$env/static/private'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '../../../generated/prisma/client'

const adapter = new PrismaMariaDb({
	host: SECRET_DATABASE_HOSTNAME || 'localhost',
	port: Number(SECRET_DATABASE_PORT) || 3360,
	database: SECRET_DATABASE_NAME || 'my-app',
	user: SECRET_DATABASE_USERNAME || 'root',
	password: SECRET_DATABASE_PASSWORD || '',
	connectionLimit: 5
})

const db = new PrismaClient({ adapter: adapter })

export { db }
