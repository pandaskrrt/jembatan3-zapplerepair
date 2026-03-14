import { createId } from '@paralleldrive/cuid2'
import path from 'path'
import sharp from 'sharp'

export async function writeVideoFile(file: File) {
	try {
		const dirname = process.cwd()
		const imageDir = path.join(dirname, 'upload', 'images')
		const formattedName = file.name
			.split('.')[0]
			.replace(/[^a-zA-Z0-9]/g, '')
			.toLowerCase()
			.slice(0, 50)
		const fileName = `${createId()}-${formattedName}.webp`
		const filePath = path.join(imageDir, fileName)
		const buffer = Buffer.from(await file.arrayBuffer())

		await sharp(buffer).webp({ quality: 80 }).toFile(filePath)

		return fileName
	} catch {
		return null
	}
}
