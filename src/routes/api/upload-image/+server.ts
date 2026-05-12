import { writeImageFile } from '$lib/helper/write-file';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file || file.size === 0) {
      return json({ success: false, message: 'File tidak ditemukan' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return json({ success: false, message: 'File terlalu besar (max 5MB)' }, { status: 400 });
    }

    const url = await writeImageFile(file);

    if (!url) {
      return json({ success: false, message: 'Gagal upload gambar. Pastikan format JPG, PNG, atau WEBP.' }, { status: 500 });
    }

    return json({ success: true, url });

  } catch (error) {
    console.error('Upload error:', error);
    return json({ success: false, message: (error as Error).message }, { status: 500 });
  }
};