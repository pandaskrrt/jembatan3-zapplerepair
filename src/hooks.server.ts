import { SECRET_JWT_TOKEN } from '$env/static/private';
import { redirect, type Handle } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';

export const handle: Handle = async ({ event, resolve }) => {
    const ALLOWED_ORIGINS = [
        'http://localhost:3000', 'http://localhost:3001',
        'http://127.0.0.1:3000', 'http://127.0.0.1:3001',
        'https://serviceform-jakut.zapplerepair.com'
    ];

    function getCorsOrigin(origin: string | null): string {
        return origin && ALLOWED_ORIGINS.includes(origin) ? origin : 'http://localhost:3001';
    }

    // ================================================
    // 1. HANDLE CORS PREFLIGHT (OPTIONS) DI AWAL
    // ================================================
    if (event.request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': getCorsOrigin(event.request.headers.get('origin')),
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept',
                'Access-Control-Allow-Credentials': 'true',
                'Access-Control-Max-Age': '86400'
            }
        });
    }

    // ================================================
    // 2. AUTH LOGIC
    // ================================================
    const authToken = event.cookies.get('authToken');

    const isAdminRoute = event.url.pathname.startsWith('/admin');
    const isStockAuditRoute = event.url.pathname.startsWith('/stock-audit');
    const isSuperAdminRoute = event.url.pathname.startsWith('/superadmin');
    const isProtectedRoute = isAdminRoute || isStockAuditRoute || isSuperAdminRoute;

    // API routes - skip auth
    const isApiRoute = event.url.pathname.startsWith('/api');

    if (!authToken) {
        event.locals.session = null;
        if (isProtectedRoute && !isApiRoute) {
            throw redirect(303, `/login?callback=${event.url.pathname}`);
        }
        // Jika API route, langsung resolve tanpa auth
        if (isApiRoute) {
            const response = await resolve(event);
            response.headers.set('Access-Control-Allow-Origin', getCorsOrigin(event.request.headers.get('origin')));
            response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
            response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
            response.headers.set('Access-Control-Allow-Credentials', 'true');
            return response;
        }
        return resolve(event);
    }

    // 2. JIKA SUDAH LOGIN (PROSES VERIFIKASI TOKEN & ROLE)
    try {
        const verified = jwt.verify(authToken, SECRET_JWT_TOKEN) as {
            id: number;
            username: string;
            role: 'ADMIN' | 'USER' | 'STOCK_AUDIT' | 'SUPER_ADMIN';
        };
        event.locals.session = verified;

        // Fungsi pembantu untuk menentukan "rumah" atau dashboard utama setiap role
        const getHomeDashboard = (role: string) => {
            if (role === 'SUPER_ADMIN') return '/superadmin';
            if (role === 'ADMIN') return '/admin';
            if (role === 'STOCK_AUDIT') return '/stock-audit';
            return '/';
        };

        // --- VALIDASI AKSES ROLE YANG KETAT ---

        // Proteksi /admin -> Hanya boleh ADMIN & SUPER_ADMIN
        if (isAdminRoute && verified.role !== 'ADMIN' && verified.role !== 'SUPER_ADMIN') {
            const fallback = getHomeDashboard(verified.role);
            throw redirect(303, `${fallback}?error=unauthorized`);
        }

        // Proteksi /stock-audit -> Hanya boleh STOCK_AUDIT & SUPER_ADMIN
        if (isStockAuditRoute && verified.role !== 'STOCK_AUDIT' && verified.role !== 'SUPER_ADMIN') {
            const fallback = getHomeDashboard(verified.role);
            throw redirect(303, `${fallback}?error=unauthorized`);
        }

        // Proteksi /superadmin -> Mutlak hanya boleh SUPER_ADMIN
        if (isSuperAdminRoute && verified.role !== 'SUPER_ADMIN') {
            const fallback = getHomeDashboard(verified.role);
            throw redirect(303, `${fallback}?error=unauthorized`);
        }

    } catch (err) {
        // Jika token kedaluwarsa, corrupt, atau dimanipulasi
        event.cookies.delete('authToken', { path: '/' });
        event.locals.session = null;

        if (isProtectedRoute && !isApiRoute) {
            throw redirect(303, `/login?callback=${event.url.pathname}`);
        }
    }

    // 3. JIKA USER SUDAH LOGIN TAPI MENCOBA AKSES MANUAL HALAMAN /LOGIN
    if (event.locals.session && event.url.pathname.startsWith('/login')) {
        const session = event.locals.session;

        // Langsung amankan dan bypass ke dashboard masing-masing tanpa lewat Form Action
        if (session.role === 'SUPER_ADMIN') {
            throw redirect(303, '/superadmin');
        } else if (session.role === 'ADMIN') {
            throw redirect(303, '/admin');
        } else if (session.role === 'STOCK_AUDIT') {
            throw redirect(303, '/stock-audit');
        } else {
            throw redirect(303, '/');
        }
    }

    // ================================================
    // 4. RESPONSE DENGAN CORS HEADERS
    // ================================================
    const response = await resolve(event);

    response.headers.set('Access-Control-Allow-Origin', getCorsOrigin(event.request.headers.get('origin')));

    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    response.headers.set('Access-Control-Allow-Credentials', 'true');

    return response;
};
