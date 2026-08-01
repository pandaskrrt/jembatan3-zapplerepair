<script lang="ts">
    import { goto } from '$app/navigation';
    let { data } = $props();
    let serial = data?.serial;
    let histories = data?.histories || [];
    let assemblies = data?.assemblies || [];

    const actionMeta: Record<string, { label: string; color: string; bg: string; icon: string }> = {
        CREATED: { label: 'Dibuat', color: '#059669', bg: '#ecfdf5', icon: '+#' },
        ASSEMBLED: { label: 'Assembly', color: '#4338ca', bg: '#ece9fc', icon: '+part' },
        BROKEN_DOWN: { label: 'Dipecah', color: '#d97706', bg: '#fffbeb', icon: '⇄' },
        STOCK_UPDATED: { label: 'Stok Diubah', color: '#2563eb', bg: '#eff6ff', icon: '≡' },
        SOFT_DELETED: { label: 'Dihapus', color: '#dc2626', bg: '#fef2f2', icon: '×' },
        MOVED_TO_PERMANENT: { label: 'Pindah Paten', color: '#7c3aed', bg: '#faf5ff', icon: '→' },
        RETURNED_TO_ORIGIN: { label: 'Kembali ke Asal', color: '#d97706', bg: '#fffbeb', icon: '←' },
        TRANSFERRED: { label: 'Dikirim', color: '#0891b2', bg: '#ecfeff', icon: '➤' },
        MOVED_IN: { label: 'Masuk Gudang', color: '#059669', bg: '#ecfdf5', icon: '↓' },
        MARKED_MISSING: { label: 'Hilang', color: '#dc2626', bg: '#fef2f2', icon: '?' },
        RESTORED: { label: 'Dipulihkan', color: '#059669', bg: '#ecfdf5', icon: '↺' },
        SECTION_DELETED: { label: 'Section Dihapus', color: '#dc2626', bg: '#fef2f2', icon: '×' },
        CABINET_DELETED: { label: 'Cabinet Dihapus', color: '#dc2626', bg: '#fef2f2', icon: '×' }
    };

    function meta(action: string) {
        return actionMeta[action] || { label: action, color: '#64748b', bg: '#f1f5f9', icon: '•' };
    }

    function formatRp(n: number | null | undefined) {
        if (!n) return 'Rp 0';
        return 'Rp ' + n.toLocaleString('id-ID');
    }

    function parseJSON(v: any): any {
        if (!v) return null;
        if (typeof v === 'object') return v;
        try { return JSON.parse(v); } catch { return null; }
    }
</script>

<svelte:head><title>History Serial #{serial?.serialNumber || serial?.id}</title></svelte:head>

<div class="page">
    <button class="back-btn" onclick={() => goto('/admin/serials/' + serial?.item?.id)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Kembali ke Serials
    </button>

    <div class="header-card">
        <div>
            <h1>History Serial</h1>
            <p class="serial-info">
                <span class="sn-badge">{serial?.serialNumber || '#' + serial?.id}</span>
                <span class="sep">•</span>
                <span>{serial?.item?.name}</span>
            </p>
        </div>
        <div class="price-summary">
            <div class="pstat"><span>Modal</span><strong>{formatRp(serial?.costPrice)}</strong></div>
            <div class="pstat"><span>Jual</span><strong>{formatRp(serial?.price)}</strong></div>
        </div>
    </div>

    <div class="timeline">
        <div class="timeline-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Riwayat Aktivitas
            <span class="count">{histories.length + assemblies.length}</span>
        </div>

        {#if histories.length === 0 && assemblies.length === 0}
            <div class="empty-state">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <p>Belum ada aktivitas untuk serial ini</p>
            </div>
        {:else}
            <div class="tl-list">
                {#each assemblies as a}
                    {@const m = meta('ASSEMBLED')}
                    <div class="tl-item">
                        <div class="tl-dot" style="background:{m.bg};color:{m.color};">
                            <span class="tl-icon">+</span>
                        </div>
                        <div class="tl-content">
                            <div class="tl-head">
                                <span class="tl-badge" style="background:{m.bg};color:{m.color};">{m.label}</span>
                                <span class="tl-time">{new Date(a.createdAt).toLocaleString('id-ID')}</span>
                            </div>
                            <div class="tl-body">
                                <span>Part <strong>{a.partName || '#' + a.partSerialId}</strong> dipasang ({a.partCategory})</span>
                                <div class="tl-prices">
                                    <span>Modal <strong>+{formatRp(a.partCostPrice)}</strong></span>
                                    <span>Jual <strong>+{formatRp(a.partSellPrice)}</strong></span>
                                </div>
                            </div>
                        </div>
                    </div>
                {/each}

                {#each histories as h}
                    {@const m = meta(h.action)}
                    {@const oldV = parseJSON(h.oldValue)}
                    {@const newV = parseJSON(h.newValue)}
                    <div class="tl-item">
                        <div class="tl-dot" style="background:{m.bg};color:{m.color};">
                            <span class="tl-icon">{m.icon}</span>
                        </div>
                        <div class="tl-content">
                            <div class="tl-head">
                                <span class="tl-badge" style="background:{m.bg};color:{m.color};">{m.label}</span>
                                <span class="tl-time">{new Date(h.createdAt).toLocaleString('id-ID')}</span>
                            </div>
                            <div class="tl-body">
                                <p class="tl-note">{h.note || '-'}</p>
                                {#if (h.action === 'ASSEMBLED' || h.action === 'BROKEN_DOWN') && (oldV?.modal !== undefined || newV?.modal !== undefined)}
                                    <div class="tl-prices">
                                        {#if oldV?.modal !== undefined}
                                            <span>Modal <strong>{formatRp(oldV.modal)}</strong> → <strong>{formatRp(newV?.modal)}</strong></span>
                                        {/if}
                                        {#if oldV?.jual !== undefined}
                                            <span>Jual <strong>{formatRp(oldV.jual)}</strong> → <strong>{formatRp(newV?.jual)}</strong></span>
                                        {/if}
                                    </div>
                                {:else if h.action === 'STOCK_UPDATED' && (h.oldStock !== null || h.newStock !== null)}
                                    <div class="tl-prices">
                                        <span>Stok <strong>{h.oldStock ?? 0}</strong> → <strong>{h.newStock ?? 0}</strong></span>
                                    </div>
                                {/if}
                                {#if h.user?.name || h.user?.username}
                                    <div class="tl-actor">oleh {h.user.name || h.user.username}</div>
                                {/if}
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>

<style>
    * { box-sizing: border-box; }
    :global(body) { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; background: #161618; color: #e3e4e6; margin: 0; }

    .page { min-height: 100vh; padding: 2rem 1.25rem 4rem; }
    .page { max-width: 780px; margin: 0 auto; }

    .back-btn {
        display: inline-flex; align-items: center; gap: 0.4rem;
        background: #161618; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 0.55rem 1rem;
        cursor: pointer; font-size: 0.85rem; font-weight: 600; color: #a1a1a5; margin-bottom: 1.25rem;
        transition: all 0.15s ease;
    }
    .back-btn:hover { background: rgba(255,255,255,0.08); border-color: #d3d1e8; }

    .header-card {
        background: #161618; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 1.5rem;
        display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1.5rem;
        box-shadow: 0 1px 2px rgba(30,27,58,0.03);
    }
    .header-card h1 { margin: 0 0 0.5rem; font-size: 1.4rem; font-weight: 700; color: #e3e4e6; }
    .serial-info { margin: 0; color: #a1a1a5; font-size: 0.9rem; display: flex; align-items: center; gap: 0.4rem; }
    .sn-badge { font-family: monospace; background: rgba(16,185,129,0.12); color: #10b981; padding: 0.15rem 0.5rem; border-radius: 6px; font-weight: 700; font-size: 0.85rem; }
    .sep { color: #d3d1e8; }

    .price-summary { display: flex; gap: 0.75rem; flex-shrink: 0; }
    .pstat { display: flex; flex-direction: column; align-items: flex-end; background: #141416; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 0.5rem 0.85rem; }
    .pstat span { font-size: 0.65rem; font-weight: 600; color: #71717a; text-transform: uppercase; }
    .pstat strong { font-size: 0.9rem; color: #10b981; margin-top: 0.1rem; }

    .timeline { background: #161618; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 1.5rem; box-shadow: 0 1px 2px rgba(30,27,58,0.03); }
    .timeline-title { display: flex; align-items: center; gap: 0.5rem; font-size: 1rem; font-weight: 700; color: #e3e4e6; margin-bottom: 1.25rem; }
    .timeline-title svg { color: #10b981; }
    .count { background: rgba(16,185,129,0.12); color: #10b981; font-size: 0.7rem; padding: 0.1rem 0.5rem; border-radius: 999px; font-weight: 700; }

    .empty-state { text-align: center; padding: 3rem 1rem; color: #71717a; }
    .empty-state svg { color: #d3d1e8; }
    .empty-state p { margin: 0.75rem 0 0; font-size: 0.9rem; }

    .tl-list { position: relative; }
    .tl-list::before { content: ''; position: absolute; left: 15px; top: 8px; bottom: 8px; width: 2px; background: rgba(16,185,129,0.12); }

    .tl-item { position: relative; display: flex; gap: 1rem; margin-bottom: 1rem; }
    .tl-item:last-child { margin-bottom: 0; }

    .tl-dot {
        width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0; z-index: 1;
        display: flex; align-items: center; justify-content: center;
        font-size: 0.7rem; font-weight: 700; box-shadow: 0 0 0 4px white;
    }
    .tl-icon { line-height: 1; }

    .tl-content { flex: 1; min-width: 0; background: #141416; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 0.75rem 1rem; }
    .tl-head { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem; flex-wrap: wrap; }
    .tl-badge { font-size: 0.68rem; font-weight: 700; padding: 0.15rem 0.55rem; border-radius: 999px; }
    .tl-time { font-size: 0.72rem; color: #71717a; }
    .tl-body { font-size: 0.85rem; color: #d4d4d8; }
    .tl-note { margin: 0 0 0.35rem; }
    .tl-prices { display: flex; gap: 0.75rem; flex-wrap: wrap; font-size: 0.78rem; }
    .tl-prices span { color: #8f8f96; }
    .tl-prices strong { color: #10b981; }
    .tl-actor { margin-top: 0.35rem; font-size: 0.72rem; color: #71717a; }
</style>
