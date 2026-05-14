// Store semua koneksi aktif
type Client = {
    id: string;
    userId: string;
    controller: ReadableStreamDefaultController;
};

let clients: Client[] = [];

// Broadcast ke semua admin
export function broadcastToAdmins(event: { type: string; data: any }) {
    const message = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
    
    for (const client of clients) {
        try {
            client.controller.enqueue(message);
        } catch (error) {
            console.error('Broadcast error:', error);
            clients = clients.filter(c => c.id !== client.id);
        }
    }
}

// Tambah client
export function addClient(client: Client) {
    clients.push(client);
    console.log(`Client added, total: ${clients.length}`);
}

// Hapus client
export function removeClient(clientId: string) {
    clients = clients.filter(c => c.id !== clientId);
    console.log(`Client removed, total: ${clients.length}`);
}

// Dapatkan semua client
export function getClients() {
    return clients;
}