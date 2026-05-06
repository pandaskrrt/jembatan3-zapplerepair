import { createId } from '@paralleldrive/cuid2'
import fs from 'fs'
import path from 'path'

// Existing video function
export async function writeVideoFile(file: File) {
	try {
		const dirname = process.cwd()
		const videoDir = path.join(dirname, 'static', 'upload', 'video')
		
		if (!fs.existsSync(videoDir)) {
			fs.mkdirSync(videoDir, { recursive: true })
		}
		
		const formattedName = file.name
			.split('.')[0]
			.replace(/[^a-zA-Z0-9]/g, '')
			.toLowerCase()
			.slice(0, 50)
		const fileName = `${createId()}-${formattedName}.${file.type.split('/')[1]}`
		const filePath = path.join(videoDir, fileName)
		const buffer = Buffer.from(await file.arrayBuffer())

		fs.writeFileSync(filePath, new Uint8Array(buffer))

		return `/upload/video/${fileName}`
	} catch {
		return null
	}
}

// Upload image function
export async function writeImageFile(file: File) {
	try {
		const dirname = process.cwd()
		const imageDir = path.join(dirname, 'static', 'upload', 'images')
		
		if (!fs.existsSync(imageDir)) {
			fs.mkdirSync(imageDir, { recursive: true })
		}
		
		const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
		if (!allowedTypes.includes(file.type)) {
			return null
		}
		
		const extension = file.type.split('/')[1]
		const formattedName = file.name
			.split('.')[0]
			.replace(/[^a-zA-Z0-9]/g, '')
			.toLowerCase()
			.slice(0, 50)
		const fileName = `${createId()}-${formattedName}.${extension}`
		const filePath = path.join(imageDir, fileName)
		const buffer = Buffer.from(await file.arrayBuffer())

		fs.writeFileSync(filePath, new Uint8Array(buffer))

		return `/upload/images/${fileName}`
	} catch {
		return null
	}
}

// Delete file function
export async function deleteFile(relativePath: string | null | undefined): Promise<boolean> {
	if (!relativePath) return true

	try {
		const dirname = process.cwd()
		const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath
		const absolutePath = path.join(dirname, 'static', cleanPath)

		if (fs.existsSync(absolutePath)) {
			fs.unlinkSync(absolutePath)
		}

		return true
	} catch {
		return false
	}
}