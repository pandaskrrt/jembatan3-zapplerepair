import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

const UPLOAD_DIR = 'static/uploads/cards'

export async function uploadImage(file: File): Promise<string> {
  // Buat folder jika belum ada
  await mkdir(UPLOAD_DIR, { recursive: true })
  
  // Generate unique filename
  const extension = file.name.split('.').pop()
  const filename = `${randomUUID()}.${extension}`
  const filepath = path.join(UPLOAD_DIR, filename)
  
  // Convert file to buffer and save
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  await writeFile(filepath, buffer)
  
  // Return relative path for database
  return `/uploads/cards/${filename}`
}

export async function deleteImage(imageUrl: string) {
  if (!imageUrl || !imageUrl.startsWith('/uploads/')) return
  
  const filepath = path.join('static', imageUrl)
  try {
    await unlink(filepath)
  } catch (error) {
    console.error('Failed to delete image:', error)
  }
}