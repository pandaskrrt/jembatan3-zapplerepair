import type { RequestHandler } from './$types';

// Simpan semua koneksi aktif
let clients: Array<{ controller: ReadableStreamDefaultController; userId: string }> = [];

export const GET: RequestHandler = async ({ locals }) => {
    const session = locals.session;

    if (!session) {
        return new Response('Unauthorized', { status: 401 });
    }

    if (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN') {
        return new Response('Forbidden', { status: 403 });
    }

    const stream = new ReadableStream({
        start(controller) {
            // Simpan koneksi
            clients.push({ controller, userId: session.id });
            
            // Kirim pesan koneksi berhasil
            controller.enqueue(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);
            
            // Hapus koneksi saat ditutup
            const interval = setInterval(() => {
                try {
                    controller.enqueue(`: keepalive\n\n`);
                } catch {
                    clients = clients.filter(c => c.userId !== session.id);
                    clearInterval(interval);
                }
            }, 30000);
        },
        cancel() {
            clients = clients.filter(c => c.userId !== session.id);
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        }
    });
};

// Fungsi untuk broadcast ke semua admin
export function broadcastToAdmins(event: { type: string; data: any }) {
    const message = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
    
    for (const client of clients) {
        try {
            client.controller.enqueue(message);
        } catch {
            // Hapus koneksi yang error
            clients = clients.filter(c => c.userId !== client.userId);
        }
    }
}