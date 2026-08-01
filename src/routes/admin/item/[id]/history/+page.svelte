<script lang="ts">
    import { goto } from '$app/navigation';

    let { data } = $props();
    let { item, histories } = data;

    function formatDate(d: Date | string) {
        return new Date(d).toLocaleString('id-ID', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    function actionLabel(action: string) {
        const labels: Record<string, string> = {
            CREATED: 'Dibuat',
            STOCK_UPDATED: 'Stok Berubah',
            MARKED_MISSING: 'Ditandai Hilang',
            RESTORED: 'Dikembalikan',
            SOFT_DELETED: 'Dihapus',
            SECTION_DELETED: 'Section Dihapus',
            CABINET_DELETED: 'Cabinet Dihapus',
        };
        return labels[action] || action;
    }

    function actionColor(action: string) {
        const colors: Record<string, string> = {
            CREATED: '#10b981',
            STOCK_UPDATED: '#3b82f6',
            SOFT_DELETED: '#ef4444',
            RESTORED: '#f59e0b',
            MARKED_MISSING: '#8b5cf6',
        };
        return colors[action] || '#6b7280';
    }

    function renderChanges(changes: any): string {
        if (!changes) return '-';
        try {
            const obj = typeof changes === 'string' ? JSON.parse(changes) : changes;
            return Object.entries(obj)
                .map(([field, val]: [string, any]) => {
                    const oldVal = val?.old ?? '-';
                    const newVal = val?.new ?? '-';
                    const labels: Record<string, string> = {
                        name: 'Nama', stock: 'Stok', category: 'Kategori',
                        subCategory: 'Sub Kategori', location: 'Lokasi',
                        price: 'Harga Jual', costPrice: 'Harga Modal',
                        serialNumber: 'Serial Number', sectionId: 'Section',
                        imageUrl: 'Gambar', videoUrl: 'Video'
                    };
                    return `<div class="change-item"><span class="change-field">${labels[field] || field}</span>: <span class="change-old">${oldVal}</span> → <span class="change-new">${newVal}</span></div>`;
                })
                .join('');
        } catch { return '-'; }
    }
</script>

<svelte:head>
    <title>Riwayat — {item.name}</title>
</svelte:head>

<div class="history-page">
    <div class="header">
        <button class="back-btn" onclick={() => goto('/admin/item')}>← Kembali</button>
        <div class="header-text">
            <h1>Riwayat Aktivitas</h1>
            <p class="subtitle">{item.name} <span class="id-badge">#{item.id}</span></p>
        </div>
    </div>

    <div class="item-info">
        <span class="info-item"><span class="lbl">Stok:</span> <strong>{item.stock}</strong></span>
        <span class="info-item"><span class="lbl">Kategori:</span> {item.category} / {item.subCategory}</span>
        {#if item.price}
            <span class="info-item"><span class="lbl">Harga:</span> Rp {item.price.amount.toLocaleString('id-ID')}</span>
        {/if}
    </div>

    <div class="history-list">
        {#if histories.length === 0}
            <div class="empty">Belum ada riwayat aktivitas.</div>
        {:else}
            {#each histories as h}
                <div class="history-card" style="border-left-color: {actionColor(h.action)}">
                    <div class="history-header">
                        <span class="badge" style="background: {actionColor(h.action)}">
                            {actionLabel(h.action)}
                        </span>
                        <span class="time">{formatDate(h.createdAt)}</span>
                    </div>
                    <div class="history-body">
                        {#if h.note}
                            <div class="note">{h.note}</div>
                        {/if}
                        {#if h.action === 'STOCK_UPDATED' && h.oldStock !== null && h.newStock !== null}
                            <div class="stock-change">
                                Stok: {h.oldStock} → {h.newStock}
                            </div>
                        {/if}
                        {#if h.oldValue}
                            <div class="changes">
                                {@html renderChanges(h.oldValue)}
                            </div>
                        {/if}
                    </div>
                    <div class="history-footer">
                        <span class="actor">Oleh: {h.user?.name || h.triggeredBy}</span>
                    </div>
                </div>
            {/each}
        {/if}
    </div>
</div>

<style>
    .history-page { max-width: 900px; margin: 0 auto; padding: 24px; min-height: 100vh; color: #e3e4e6; }
    .header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
    .header-text { flex: 1; }
    .header h1 { margin: 0; font-size: 1.5rem; color: #ffffff; }
    .subtitle { margin: 0.2rem 0 0; font-size: 0.85rem; color: #a1a1a5; }
    .id-badge { background: rgba(16,185,129,0.12); color: #10b981; padding: 0.15rem 0.5rem; border-radius: 999px; font-size: 0.72rem; font-weight: 700; }
    .back-btn {
        padding: 8px 16px; border: 1px solid rgba(255,255,255,0.12); border-radius: 6px;
        background: #161618; color: #a1a1a5; cursor: pointer; font-weight: 500;
    }
    .back-btn:hover { background: #1f1f22; color: #ffffff; }
    .item-info {
        display: flex; gap: 24px; flex-wrap: wrap; padding: 16px;
        background: #161618; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px;
        margin-bottom: 24px; font-size: 0.9rem;
    }
    .info-item .lbl { color: #71717a; }
    .info-item strong { color: #10b981; }
    .history-list { display: flex; flex-direction: column; gap: 12px; }
    .empty { text-align: center; padding: 48px; color: #52525b; }
    .history-card {
        border: 1px solid rgba(255,255,255,0.08); border-left: 4px solid;
        border-radius: 8px; padding: 16px; background: #161618;
    }
    .history-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .badge { padding: 2px 10px; border-radius: 12px; color: white; font-size: 0.75rem; font-weight: 600; }
    .time { font-size: 0.8rem; color: #71717a; }
    .history-body { margin: 8px 0; }
    .note { font-size: 0.85rem; color: #d1d5db; margin-bottom: 4px; }
    .stock-change { font-size: 0.85rem; color: #3b82f6; margin-bottom: 4px; }
    .changes { margin-top: 4px; }
    :global(.change-item) { font-size: 0.8rem; padding: 2px 0; }
    :global(.change-field) { font-weight: 600; color: #e3e4e6; }
    :global(.change-old) { color: #f87171; text-decoration: line-through; }
    :global(.change-new) { color: #34d399; font-weight: 600; }
    .history-footer { margin-top: 8px; font-size: 0.75rem; color: #71717a; }
    .actor { font-style: italic; }
</style>
