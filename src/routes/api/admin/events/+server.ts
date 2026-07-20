import type { RequestHandler } from './$types';
import { addClient, removeClient } from '$lib/server/events';

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
            addClient(controller, session.id);
            controller.enqueue(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);
        },
        cancel() {
            removeClient(session.id);
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