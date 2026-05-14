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

    function getStatusBadge(status: string) {
        if (status === 'DRAFT') {
            return { class: 'draft', icon: '📝', text: 'Draft' }
        }
        return { class: 'completed', icon: '✅', text: 'Selesai' }
    }
</script>

<svelte:head>
    <title>Stock Audit Dashboard</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
</svelte:head>

<div class="dashboard">
    <!-- Header -->
    <div class="header">
        <div class="header-left">
            <h1 class="title">Stock Audit</h1>
            <p class="subtitle">Kelola dan pantau proses stock opname</p>
        </div>
        <button class="btn-primary" onclick={() => goto('/stock-audit/new')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 5v14M5 12h14"/>
            </svg>
            <span>Mulai Audit Baru</span>
        </button>
    </div>

    <!-- User Greeting -->
    {#if user}
        <div class="greeting">
            <div class="greeting-avatar">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                </svg>
            </div>
            <div class="greeting-text">
                <span class="greeting-name">Halo, {user.name.split(' ')[0]}</span>
                <span class="greeting-role">Stock Auditor</span>
            </div>
        </div>
    {/if}

    <!-- Stats Cards - Hanya 4 Card -->
    <div class="stats-grid">
        <div class="stat-card total">
            <div class="stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="4" width="18" height="16" rx="2"/>
                    <line x1="8" y1="10" x2="16" y2="10"/>
                </svg>
            </div>
            <div class="stat-info">
                <span class="stat-value">{stats.total}</span>
                <span class="stat-label">Total Audit</span>
            </div>
        </div>
        <div class="stat-card draft">
            <div class="stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
            </div>
            <div class="stat-info">
                <span class="stat-value draft">{stats.draft}</span>
                <span class="stat-label">Draft</span>
            </div>
        </div>
        <div class="stat-card completed">
            <div class="stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
            </div>
            <div class="stat-info">
                <span class="stat-value completed">{stats.completed}</span>
                <span class="stat-label">Selesai</span>
            </div>
        </div>
        <div class="stat-card rate">
            <div class="stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                </svg>
            </div>
            <div class="stat-info">
                <span class="stat-value">{stats.completionRate}%</span>
                <span class="stat-label">Completion Rate</span>
            </div>
        </div>
    </div>

    <!-- Recent Audits Section -->
    <div class="recent-section">
        <div class="recent-header">
            <h2 class="recent-title">Audit Terbaru</h2>
            <button class="view-all" onclick={() => goto('/stock-audit/riwayat')}>
                Lihat semua →
            </button>
        </div>

        {#if recentAudits.length === 0}
            <div class="empty-state">
                <div class="empty-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                        <rect x="3" y="4" width="18" height="16" rx="2"/>
                        <line x1="8" y1="10" x2="16" y2="10"/>
                        <line x1="8" y1="14" x2="12" y2="14"/>
                    </svg>
                </div>
                <h3 class="empty-title">Belum ada audit</h3>
                <p class="empty-sub">Mulai audit baru untuk melakukan stock opname</p>
                <button class="btn-outline" onclick={() => goto('/stock-audit/new')}>
                    + Mulai Audit Baru
                </button>
            </div>
        {:else}
            <div class="audit-list">
                {#each recentAudits as audit}
                    <div class="audit-item" onclick={() => goto(`/stock-audit/${audit.id}`)}>
                        <div class="audit-info">
                            <div class="audit-header">
                                <span class="audit-location">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                        <circle cx="12" cy="7" r="4"/>
                                    </svg>
                                    <span class="cabinet">{audit.cabinetName}</span>
                                    <span class="separator">/</span>
                                    <span class="section">{audit.sectionName}</span>
                                </span>
                                <span class="audit-date">{formatDate(audit.createdAt)}</span>
                            </div>
                            <div class="audit-stats">
                                <span class="stat match">✓ {audit.totalMatch || 0}</span>
                                <span class="stat mismatch">⚠ {audit.totalMismatch || 0}</span>
                                <span class="stat missing">✕ {audit.totalMissing || 0}</span>
                                <span class="stat new">+ {audit.totalNewEntry || 0}</span>
                                <span class="stat total-card">{audit.totalCards || 0} card</span>
                            </div>
                        </div>
                        <div class="audit-status">
                            <span class="status-badge {audit.status === 'DRAFT' ? 'draft' : 'completed'}">
                                {#if audit.status === 'DRAFT'}
                                    <span class="status-dot draft"></span>
                                    Draft
                                {:else}
                                    <span class="status-dot completed"></span>
                                    Selesai
                                {/if}
                            </span>
                            <svg class="arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="9 18 15 12 9 6"/>
                            </svg>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>

<style>
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

    .dashboard {
        max-width: 1000px;
        margin: 0 auto;
        padding: 2rem;
        font-family: 'Poppins', sans-serif;
        background: #000000;
        min-height: 100vh;
    }

    /* Header */
    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        flex-wrap: wrap;
        gap: 1rem;
    }

    .title {
        font-size: 1.8rem;
        font-weight: 700;
        background: linear-gradient(135deg, #ffffff, #00ff9d);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin-bottom: 0.25rem;
    }

    .subtitle {
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.5);
    }

    .btn-primary {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.7rem 1.5rem;
        background: linear-gradient(135deg, #00ff9d, #00ccff);
        border: none;
        border-radius: 40px;
        color: #000000;
        font-weight: 600;
        font-size: 0.85rem;
        font-family: 'Poppins', sans-serif;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 20px rgba(0, 255, 157, 0.3);
    }

    .btn-outline {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.6rem 1.2rem;
        background: transparent;
        border: 1px solid rgba(0, 255, 157, 0.3);
        border-radius: 40px;
        color: #00ff9d;
        font-weight: 500;
        font-size: 0.85rem;
        font-family: 'Poppins', sans-serif;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-outline:hover {
        background: rgba(0, 255, 157, 0.1);
    }

    /* Greeting */
    .greeting {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 16px;
        margin-bottom: 2rem;
    }

    .greeting-avatar {
        width: 48px;
        height: 48px;
        background: linear-gradient(135deg, rgba(0, 255, 157, 0.1), rgba(0, 204, 255, 0.05));
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #00ff9d;
    }

    .greeting-text {
        display: flex;
        flex-direction: column;
    }

    .greeting-name {
        font-size: 1rem;
        font-weight: 600;
        color: #ffffff;
    }

    .greeting-role {
        font-size: 0.7rem;
        color: rgba(255, 255, 255, 0.4);
    }

    /* Stats Cards - 4 cards grid */
    .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1rem;
        margin-bottom: 2rem;
    }

    .stat-card {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem 1.25rem;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 16px;
        transition: all 0.2s;
    }

    .stat-card:hover {
        transform: translateY(-2px);
        background: rgba(255, 255, 255, 0.03);
    }

    .stat-icon {
        width: 44px;
        height: 44px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(255, 255, 255, 0.6);
    }

    .stat-card.total .stat-icon { color: #ffffff; }
    .stat-card.draft .stat-icon { color: #ffaa00; }
    .stat-card.completed .stat-icon { color: #00ff9d; }
    .stat-card.rate .stat-icon { color: #00ccff; }

    .stat-info {
        display: flex;
        flex-direction: column;
    }

    .stat-value {
        font-size: 1.6rem;
        font-weight: 700;
        color: #ffffff;
        line-height: 1.2;
    }

    .stat-value.draft { color: #ffaa00; }
    .stat-value.completed { color: #00ff9d; }

    .stat-label {
        font-size: 0.65rem;
        color: rgba(255, 255, 255, 0.5);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    /* Recent Section */
    .recent-section {
        margin-top: 0.5rem;
    }

    .recent-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    .recent-title {
        font-size: 1rem;
        font-weight: 600;
        color: #ffffff;
    }

    .view-all {
        background: none;
        border: none;
        color: #00ff9d;
        font-size: 0.75rem;
        cursor: pointer;
    }

    /* Audit List */
    .audit-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .audit-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 1rem;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s;
    }

    .audit-item:hover {
        background: rgba(255, 255, 255, 0.04);
        transform: translateX(4px);
    }

    .audit-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.35rem;
        flex-wrap: wrap;
    }

    .audit-location {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.7rem;
    }

    .audit-location .cabinet {
        color: rgba(255, 255, 255, 0.5);
    }

    .audit-location .separator {
        color: rgba(255, 255, 255, 0.3);
    }

    .audit-location .section {
        color: #00ff9d;
    }

    .audit-date {
        font-size: 0.65rem;
        color: rgba(255, 255, 255, 0.35);
    }

    .audit-stats {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .stat {
        font-size: 0.65rem;
        font-weight: 500;
    }

    .stat.match { color: #00ff9d; }
    .stat.mismatch { color: #ffaa00; }
    .stat.missing { color: #ff6b6b; }
    .stat.new { color: #00ccff; }
    .stat.total-card { color: rgba(255, 255, 255, 0.4); }

    .audit-status {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-shrink: 0;
    }

    .status-badge {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.65rem;
        font-weight: 500;
        padding: 0.2rem 0.6rem;
        border-radius: 20px;
    }

    .status-badge.draft {
        background: rgba(255, 170, 0, 0.1);
        color: #ffaa00;
        border: 1px solid rgba(255, 170, 0, 0.2);
    }

    .status-badge.completed {
        background: rgba(0, 255, 157, 0.1);
        color: #00ff9d;
        border: 1px solid rgba(0, 255, 157, 0.2);
    }

    .status-dot {
        width: 5px;
        height: 5px;
        border-radius: 50%;
    }

    .status-dot.draft { background: #ffaa00; }
    .status-dot.completed { background: #00ff9d; }

    .arrow {
        color: rgba(255, 255, 255, 0.2);
        transition: transform 0.2s;
    }

    .audit-item:hover .arrow {
        transform: translateX(3px);
        color: #00ff9d;
    }

    /* Empty State */
    .empty-state {
        text-align: center;
        padding: 3rem 2rem;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 20px;
    }

    .empty-icon {
        opacity: 0.4;
        margin-bottom: 0.75rem;
    }

    .empty-title {
        font-size: 1rem;
        font-weight: 600;
        color: #ffffff;
        margin-bottom: 0.25rem;
    }

    .empty-sub {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.4);
        margin-bottom: 1rem;
    }

    /* Responsive */
    @media (max-width: 800px) {
        .dashboard {
            padding: 1rem;
        }

        .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 0.75rem;
        }

        .stat-value {
            font-size: 1.3rem;
        }

        .stat-icon {
            width: 38px;
            height: 38px;
        }
    }

    @media (max-width: 600px) {
        .title {
            font-size: 1.3rem;
        }

        .header {
            flex-direction: column;
            align-items: flex-start;
        }

        .audit-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
        }

        .audit-status {
            align-self: flex-end;
        }
    }

    @media (max-width: 480px) {
        .stats-grid {
            grid-template-columns: 1fr;
        }
    }
</style>