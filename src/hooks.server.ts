import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
    const origin = event.request.headers.get('origin');
    const allowedOrigins = ['https://serviceform-jakut.zapplerepair.com'];
    
    // Pastikan origin diizinkan
    const isAllowed = origin && allowedOrigins.includes(origin);

    // 1. Tangani preflight request (OPTIONS)
    if (event.request.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': isAllowed ? origin! : '',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Max-Age': '86400',
            }
        });
    }

    // 2. Jalankan request
    const response = await resolve(event);

    // 3. Tambahkan header CORS ke respon asli
    if (isAllowed) {
        response.headers.set('Access-Control-Allow-Origin', origin!);
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    return response;
};
