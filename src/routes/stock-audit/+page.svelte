<script lang="ts">
    import { goto } from '$app/navigation'

    let { data } = $props()
    let stats = $derived(data?.stats ?? { total: 0, draft: 0, completed: 0, completionRate: 0 })
    let user = $derived(data?.user)
    let recentAudits = $derived(data?.recentAudits ?? [])

    function formatDate(date: string | Date) {
        if (!date) return '—'
        return new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric'
        })
    }
</script>

<svelte:head>
    <title>Dashboard | Stock Audit</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
</svelte:head>

<div class="dashboard-wrapper">
    <!-- Top Header Section -->
    <header class="dashboard-header">
        <div class="title-group">
            <h1 class="main-title">Monitor <span class="text-accent">Audit</span></h1>
            <p class="subtitle">Ringkasan aktivitas pemeriksaan stok inventaris Anda.</p>
        </div>
        
        <button class="btn-action-primary" onclick={() => goto('/stock-audit/new')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Audit Baru</span>
        </button>
    </header>

    <!-- Stats Section -->
    <section class="stats-container">
        <div class="stat-glass-card">
            <div class="stat-icon-box blue">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v10l4.5 4.5"/><circle cx="12" cy="12" r="10"/></svg>
            </div>
            <div class="stat-content">
                <span class="stat-label">Total Aktivitas</span>
                <span class="stat-number">{stats.total}</span>
            </div>
        </div>

        <div class="stat-glass-card">
            <div class="stat-icon-box amber">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </div>
            <div class="stat-content">
                <span class="stat-label">Proses Draft</span>
                <span class="stat-number color-amber">{stats.draft}</span>
            </div>
        </div>

        <div class="stat-glass-card">
            <div class="stat-icon-box emerald">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <div class="stat-content">
                <span class="stat-label">Audit Selesai</span>
                <span class="stat-number color-emerald">{stats.completed}</span>
            </div>
        </div>

        <div class="stat-glass-card">
            <div class="stat-icon-box purple">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
            </div>
            <div class="stat-content">
                <span class="stat-label">Rasio Selesai</span>
                <span class="stat-number">{stats.completionRate}%</span>
            </div>
        </div>
    </section>

    <!-- Recent Activities Section -->
    <section class="table-section">
        <div class="section-header">
            <h2 class="section-title">Riwayat Pemeriksaan Terakhir</h2>
            <button class="link-btn" onclick={() => goto('/stock-audit/riwayat')}>
                Semua Riwayat <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
        </div>

        {#if recentAudits.length === 0}
            <div class="empty-placeholder">
                <div class="empty-visual">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
                <p>Belum ada data audit yang tercatat.</p>
                <button class="btn-ghost" onclick={() => goto('/stock-audit/new')}>Mulai Audit Pertama</button>
            </div>
        {:else}
            <div class="audit-grid">
                {#each recentAudits as audit}
                    <div class="audit-row-card" onclick={() => goto(`/stock-audit/${audit.id}`)}>
                        <div class="row-main">
                            <div class="location-badge">
                                <span class="cabinet-tag">{audit.cabinetName}</span>
                                <span class="arrow-sep">›</span>
                                <span class="section-tag">{audit.sectionName}</span>
                            </div>
                            <span class="row-date">{formatDate(audit.createdAt)}</span>
                        </div>
                        
                        <div class="row-stats">
                            <div class="mini-stat match" title="Match">
                                <span class="dot"></span> {audit.totalMatch || 0}
                            </div>
                            <div class="mini-stat mismatch" title="Mismatch">
                                <span class="dot"></span> {audit.totalMismatch || 0}
                            </div>
                            <div class="mini-stat missing" title="Missing">
                                <span class="dot"></span> {audit.totalMissing || 0}
                            </div>
                            <div class="total-capsule">
                                {audit.totalCards || 0} <small>Items</small>
                            </div>
                        </div>

                        <div class="row-status">
                            <span class="status-pill {audit.status.toLowerCase()}">
                                {audit.status}
                            </span>
                            <svg class="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </section>
</div>

<style>
    .dashboard-wrapper {
        max-width: 1200px;
        margin: 0 auto;
        padding: 1rem;
        font-family: 'Plus Jakarta Sans', sans-serif;
    }

    /* Header Styling */
    .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-bottom: 2.5rem;
        padding-bottom: 1.5rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .main-title {
        font-size: 2.2rem;
        font-weight: 800;
        letter-spacing: -1px;
        color: #ffffff;
    }

    .text-accent {
        color: rgba(255, 255, 255, 0.4);
    }

    .subtitle {
        color: rgba(255, 255, 255, 0.4);
        font-size: 0.95rem;
        margin-top: 0.25rem;
    }

    .btn-action-primary {
        background: #ffffff;
        color: #000000;
        border: none;
        padding: 0.8rem 1.6rem;
        border-radius: 12px;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        font-family: inherit;
    }

    .btn-action-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(255, 255, 255, 0.15);
    }

    /* Stats Grid Styling */
    .stats-container {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 1.25rem;
        margin-bottom: 3rem;
    }

    .stat-glass-card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.06);
        padding: 1.5rem;
        border-radius: 20px;
        display: flex;
        align-items: center;
        gap: 1.25rem;
        transition: border 0.3s ease;
    }

    .stat-glass-card:hover {
        border-color: rgba(255, 255, 255, 0.15);
    }

    .stat-icon-box {
        width: 52px;
        height: 52px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.05);
    }

    .stat-icon-box.blue { color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
    .stat-icon-box.amber { color: #f59e0b; background: rgba(245, 158, 11, 0.1); }
    .stat-icon-box.emerald { color: #10b981; background: rgba(16, 185, 129, 0.1); }
    .stat-icon-box.purple { color: #a855f7; background: rgba(168, 85, 247, 0.1); }

    .stat-label {
        display: block;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: rgba(255, 255, 255, 0.4);
        margin-bottom: 0.25rem;
    }

    .stat-number {
        font-size: 1.75rem;
        font-weight: 800;
        color: #ffffff;
    }

    .color-amber { color: #f59e0b; }
    .color-emerald { color: #10b981; }

    /* Table/List Section */
    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }

    .section-title {
        font-size: 1.25rem;
        font-weight: 700;
        color: #ffffff;
    }

    .link-btn {
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.5);
        font-weight: 600;
        font-size: 0.85rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        transition: color 0.2s;
    }

    .link-btn:hover { color: #ffffff; }

    .audit-grid {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .audit-row-card {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        padding: 1rem 1.5rem;
        border-radius: 16px;
        display: grid;
        grid-template-columns: 1.5fr 1.5fr 1fr;
        align-items: center;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .audit-row-card:hover {
        background: rgba(255, 255, 255, 0.05);
        transform: scale(1.005);
        border-color: rgba(255, 255, 255, 0.1);
    }

    .location-badge {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9rem;
        font-weight: 600;
        margin-bottom: 0.2rem;
    }

    .cabinet-tag { color: rgba(255, 255, 255, 0.5); }
    .section-tag { color: #ffffff; }
    .arrow-sep { color: rgba(255, 255, 255, 0.2); }

    .row-date {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.3);
    }

    .row-stats {
        display: flex;
        align-items: center;
        gap: 1.25rem;
    }

    .mini-stat {
        font-size: 0.8rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.4rem;
    }

    .mini-stat .dot { width: 6px; height: 6px; border-radius: 50%; }
    .mini-stat.match { color: #10b981; }
    .mini-stat.match .dot { background: #10b981; }
    .mini-stat.mismatch { color: #f59e0b; }
    .mini-stat.mismatch .dot { background: #f59e0b; }
    .mini-stat.missing { color: #ef4444; }
    .mini-stat.missing .dot { background: #ef4444; }

    .total-capsule {
        background: rgba(255, 255, 255, 0.05);
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.7);
    }

    .row-status {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 1rem;
    }

    .status-pill {
        padding: 0.35rem 0.8rem;
        border-radius: 8px;
        font-size: 0.7rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .status-pill.draft { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
    .status-pill.completed { background: rgba(16, 185, 129, 0.1); color: #10b981; }

    .chevron { color: rgba(255, 255, 255, 0.1); transition: transform 0.2s; }
    .audit-row-card:hover .chevron { transform: translateX(3px); color: #ffffff; }

    /* Empty State */
    .empty-placeholder {
        padding: 4rem;
        text-align: center;
        background: rgba(255, 255, 255, 0.01);
        border: 1px dashed rgba(255, 255, 255, 0.1);
        border-radius: 24px;
    }

    .empty-visual { color: rgba(255, 255, 255, 0.1); margin-bottom: 1rem; }
    .btn-ghost {
        margin-top: 1.5rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #ffffff;
        padding: 0.6rem 1.2rem;
        border-radius: 10px;
        cursor: pointer;
    }

    /* Responsive */
    @media (max-width: 900px) {
        .audit-row-card {
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
        }
        .row-status { grid-column: span 2; justify-content: space-between; border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 0.75rem; }
    }

    @media (max-width: 600px) {
        .main-title { font-size: 1.75rem; }
        .stats-container { grid-template-columns: 1fr; }
        .audit-row-card { grid-template-columns: 1fr; }
        .row-stats { flex-wrap: wrap; }
    }
</style>