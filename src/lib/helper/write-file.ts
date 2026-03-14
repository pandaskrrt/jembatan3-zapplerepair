import { createId } from '@paralleldrive/cuid2'
import fs from 'fs'
import path from 'path'

export async function writeVideoFile(file: File) {
	try {
		const dirname = process.cwd()
		const videoDir = path.join(dirname, 'upload', 'video')
		const formattedName = file.name
			.split('.')[0]
			.replace(/[^a-zA-Z0-9]/g, '')
			.toLowerCase()
			.slice(0, 50)
		const fileName = `${createId()}-${formattedName}.${file.type.split('/')[1]}`
		const filePath = path.join(videoDir, fileName)
		const buffer = Buffer.from(await file.arrayBuffer())

		fs.writeFileSync(filePath, new Uint8Array(buffer))

		return fileName
	} catch {
		return null
	}
}

export async function deleteFile(relativePath: string | null | undefined): Promise<boolean> {
	if (!relativePath) return true

	try {
		const dirname = process.cwd()

		const absolutePath = path.join(
			dirname,
			relativePath.startsWith('/') ? relativePath.slice(1) : relativePath
		)

		if (fs.existsSync(absolutePath)) {
			fs.unlinkSync(absolutePath)
		}

		return true
	} catch {
		return false
	}
}
