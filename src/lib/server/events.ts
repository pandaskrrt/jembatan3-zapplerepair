import type { ReadableStreamDefaultController } from '@sveltejs/kit';

let clients: Array<{ controller: ReadableStreamDefaultController; userId: string }> = [];

export function addClient(controller: ReadableStreamDefaultController, userId: string) {
    clients.push({ controller, userId });
}

export function removeClient(userId: string) {
    clients = clients.filter(c => c.userId !== userId);
}

export function getClients() {
    return clients;
}

export function broadcastToAdmins(event: { type: string; data: any }) {
    const message = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
    
    for (const client of clients) {
        try {
            client.controller.enqueue(message);
        } catch {
            clients = clients.filter(c => c.userId !== client.userId);
        }
    }
}
