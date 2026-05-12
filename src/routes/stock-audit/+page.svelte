<script lang="ts">
    import { goto } from '$app/navigation'
    
    let { data } = $props()
    let audits = data?.audits || []
    let stats = data?.stats || { draft: 0, pending: 0, approved: 0, rejected: 0 }
    let user = data?.user
    
    let activeTab = $state('dashboard')
    
    function formatDate(date: string | Date) {
        if (!date) return '-'
        return new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }
    
    function getStatusBadge(status: string) {
        const badges: Record<string, { class: string; icon: string; text: string }> = {
            DRAFT: { class: 'draft', icon: '📝', text: 'Draft' },
            PENDING: { class: 'pending', icon: '⏳', text: 'Menunggu Review' },
            APPROVED: { class: 'approved', icon: '✓', text: 'Disetujui' },
            REJECTED: { class: 'rejected', icon: '✗', text: 'Ditolak' }
        }
        return badges[status] || { class: 'draft', icon: '📝', text: status }
    }
    
    function goToCreateAudit() {
        goto('/stock-audit/create')
    }
    
    function viewAuditDetail(id: string) {
        goto(`/stock-audit/${id}`)
    }
</script>

<svelte:head>
    <title>Stock Audit - Dashboard</title>
</svelte:head>

<div class="stock-audit-page">
    <!-- Header -->
    <div class="header">
        <div>
            <h1 class="title">
                Stock Audit Dashboard
                {#if user}
                    <span class="greeting">👋 Selamat datang, {user.name.split(' ')[0]}</span>
                {/if}
            </h1>
            <p class="subtitle">Kelola dan pantau proses stock opname</p>
        </div>
        <button class="btn-primary" onclick={goToCreateAudit}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Mulai Audit Baru</span>
        </button>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
        <div class="stat-card draft">
            <div class="stat-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
            </div>
            <div class="stat-info">
                <span class="stat-value">{stats.draft}</span>
                <span class="stat-label">Draft</span>
            </div>
        </div>
        <div class="stat-card pending">
            <div class="stat-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
            </div>
            <div class="stat-info">
                <span class="stat-value">{stats.pending}</span>
                <span class="stat-label">Menunggu Review</span>
            </div>
        </div>
        <div class="stat-card approved">
            <div class="stat-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </div>
            <div class="stat-info">
                <span class="stat-value">{stats.approved}</span>
                <span class="stat-label">Disetujui</span>
            </div>
        </div>
        <div class="stat-card rejected">
            <div class="stat-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
            </div>
            <div class="stat-info">
                <span class="stat-value">{stats.rejected}</span>
                <span class="stat-label">Ditolak</span>
            </div>
        </div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
        <button 
            class="tab {activeTab === 'dashboard' ? 'active' : ''}"
            onclick={() => activeTab = 'dashboard'}
        >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span>Dashboard</span>
        </button>
        <button 
            class="tab {activeTab === 'history' ? 'active' : ''}"
            onclick={() => activeTab = 'history'}
        >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>Riwayat Audit</span>
        </button>
    </div>

    <!-- Dashboard View -->
    {#if activeTab === 'dashboard'}
        <div class="recent-section">
            <div class="section-header">
                <h2 class="section-title">Audit Terbaru</h2>
                {#if audits.length > 0}
                    <button class="view-all" onclick={() => activeTab = 'history'}>Lihat semua →</button>
                {/if}
            </div>

            {#if audits.length === 0}
                <div class="empty-state">
                    <div class="empty-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                            <rect x="3" y="4" width="18" height="16" rx="2"></rect>
                            <line x1="8" y1="10" x2="16" y2="10"></line>
                            <line x1="8" y1="14" x2="12" y2="14"></line>
                        </svg>
                    </div>
                    <h3>Belum Ada Audit</h3>
                    <p>Mulai audit pertama Anda untuk melakukan stock opname</p>
                    <button class="btn-outline" onclick={goToCreateAudit}>Mulai Audit Pertama</button>
                </div>
            {:else}
                <div class="audit-list">
                    {#each audits.slice(0, 5) as audit}
                        {@const badge = getStatusBadge(audit.status)}
                        <div class="audit-item" onclick={() => viewAuditDetail(audit.id)}>
                            <div class="audit-info">
                                <div class="audit-header">
                                    <span class="audit-location">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="12" cy="7" r="4"></circle>
                                        </svg>
                                        <span>{audit.cabinetName} / {audit.sectionName}</span>
                                    </span>
                                    <span class="audit-date">{formatDate(audit.createdAt)}</span>
                                </div>
                                <div class="audit-stats">
                                    <span class="stat-badge">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <rect x="3" y="4" width="18" height="16" rx="2"></rect>
                                        </svg>
                                        {audit.totalCards} kartu
                                    </span>
                                    <span class="stat-badge match">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                        {audit.matchCount} match
                                    </span>
                                    {#if audit.differenceCount > 0}
                                        <span class="stat-badge mismatch">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                            {audit.differenceCount} berbeda
                                        </span>
                                    {/if}
                                </div>
                            </div>
                            <div class="audit-right">
                                <span class="status-badge {badge.class}">
                                    <span class="status-icon">{badge.icon}</span>
                                    <span>{badge.text}</span>
                                </span>
                                <svg class="arrow-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    {/if}

    <!-- History View -->
    {#if activeTab === 'history'}
        <div class="history-section">
            <div class="section-header">
                <h2 class="section-title">Semua Riwayat Audit</h2>
                <span class="total-badge">Total {audits.length} audit</span>
            </div>

            {#if audits.length === 0}
                <div class="empty-state">
                    <div class="empty-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                    </div>
                    <h3>Belum Ada Riwayat</h3>
                    <p>Belum ada audit yang pernah dilakukan</p>
                    <button class="btn-outline" onclick={goToCreateAudit}>Mulai Audit Sekarang</button>
                </div>
            {:else}
                <div class="audit-list history">
                    {#each audits as audit}
                        {@const badge = getStatusBadge(audit.status)}
                        <div class="audit-item" onclick={() => viewAuditDetail(audit.id)}>
                            <div class="audit-info">
                                <div class="audit-header">
                                    <span class="audit-location">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="12" cy="7" r="4"></circle>
                                        </svg>
                                        <span>{audit.cabinetName} / {audit.sectionName}</span>
                                    </span>
                                    <span class="audit-date">{formatDate(audit.createdAt)}</span>
                                </div>
                                <div class="audit-stats">
                                    <span class="stat-badge">{audit.totalCards} kartu</span>
                                    <span class="stat-badge match">{audit.matchCount} match</span>
                                    {#if audit.differenceCount > 0}
                                        <span class="stat-badge mismatch">{audit.differenceCount} berbeda</span>
                                    {/if}
                                </div>
                                {#if audit.status !== 'DRAFT' && audit.reviewedAt}
                                    <div class="audit-review-info">
                                        <span class="review-badge">
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <circle cx="12" cy="12" r="10"></circle>
                                                <polyline points="12 6 12 12 16 14"></polyline>
                                            </svg>
                                            Direview: {formatDate(audit.reviewedAt)}
                                        </span>
                                        {#if audit.reviewNote}
                                            <span class="review-note">{audit.reviewNote}</span>
                                        {/if}
                                    </div>
                                {/if}
                            </div>
                            <div class="audit-right">
                                <span class="status-badge {badge.class}">
                                    <span class="status-icon">{badge.icon}</span>
                                    <span>{badge.text}</span>
                                </span>
                                <svg class="arrow-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    {/if}
</div>

<style>
    .stock-audit-page {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
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
        font-weight: 600;
        background: linear-gradient(135deg, #ffffff, #00ff9d);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin-bottom: 0.25rem;
    }

    .greeting {
        font-size: 0.9rem;
        background: none;
        -webkit-text-fill-color: rgba(255, 255, 255, 0.6);
        font-weight: normal;
        margin-left: 0.5rem;
    }

    .subtitle {
        color: rgba(255, 255, 255, 0.5);
        font-size: 0.85rem;
    }

    /* Buttons */
    .btn-primary {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        background: linear-gradient(135deg, #00ff9d, #00ccff);
        border: none;
        border-radius: 40px;
        color: #000000;
        font-weight: 600;
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 20px rgba(0, 255, 157, 0.3);
    }

    .btn-outline {
        padding: 0.6rem 1.2rem;
        background: transparent;
        border: 1px solid rgba(0, 255, 157, 0.3);
        border-radius: 40px;
        color: #00ff9d;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-outline:hover {
        background: rgba(0, 255, 157, 0.1);
    }

    /* Stats Grid */
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
        padding: 1.25rem;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 16px;
        transition: all 0.2s;
    }

    .stat-card:hover {
        background: rgba(255, 255, 255, 0.03);
        transform: translateY(-2px);
    }

    .stat-card.draft { border-left: 3px solid #ffaa00; }
    .stat-card.pending { border-left: 3px solid #00ccff; }
    .stat-card.approved { border-left: 3px solid #00ff9d; }
    .stat-card.rejected { border-left: 3px solid #ff6b6b; }

    .stat-icon {
        color: rgba(255, 255, 255, 0.6);
    }

    .stat-info {
        display: flex;
        flex-direction: column;
    }

    .stat-value {
        font-size: 1.8rem;
        font-weight: 700;
        color: #ffffff;
    }

    .stat-label {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.5);
    }

    /* Tabs */
    .tabs {
        display: flex;
        gap: 1rem;
        margin-bottom: 2rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        padding-bottom: 0.5rem;
    }

    .tab {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: transparent;
        border: none;
        border-radius: 8px;
        color: rgba(255, 255, 255, 0.5);
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .tab:hover {
        color: rgba(255, 255, 255, 0.8);
    }

    .tab.active {
        color: #00ff9d;
        border-bottom: 2px solid #00ff9d;
        border-radius: 0;
    }

    /* Section Header */
    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }

    .section-title {
        font-size: 1.2rem;
        font-weight: 600;
    }

    .view-all {
        background: none;
        border: none;
        color: #00ff9d;
        font-size: 0.8rem;
        cursor: pointer;
    }

    .total-badge {
        background: rgba(255, 255, 255, 0.05);
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.6);
    }

    /* Audit List */
    .audit-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .audit-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s;
    }

    .audit-item:hover {
        background: rgba(255, 255, 255, 0.03);
        transform: translateX(4px);
    }

    .audit-header {
        display: flex;
        gap: 1rem;
        align-items: baseline;
        flex-wrap: wrap;
        margin-bottom: 0.5rem;
    }

    .audit-location {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.85rem;
        font-weight: 500;
        color: #00ff9d;
    }

    .audit-date {
        font-size: 0.7rem;
        color: rgba(255, 255, 255, 0.4);
    }

    .audit-stats {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .stat-badge {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.7rem;
        color: rgba(255, 255, 255, 0.5);
    }

    .stat-badge.match {
        color: #00ff9d;
    }

    .stat-badge.mismatch {
        color: #ffaa00;
    }

    .audit-review-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-top: 0.5rem;
        flex-wrap: wrap;
    }

    .review-badge {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.65rem;
        color: rgba(255, 255, 255, 0.4);
    }

    .review-note {
        font-size: 0.65rem;
        color: rgba(255, 255, 255, 0.3);
        font-style: italic;
    }

    .audit-right {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .status-badge {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.7rem;
        font-weight: 500;
    }

    .status-badge.draft {
        background: rgba(255, 170, 0, 0.1);
        color: #ffaa00;
        border: 1px solid rgba(255, 170, 0, 0.2);
    }

    .status-badge.pending {
        background: rgba(0, 204, 255, 0.1);
        color: #00ccff;
        border: 1px solid rgba(0, 204, 255, 0.2);
    }

    .status-badge.approved {
        background: rgba(0, 255, 157, 0.1);
        color: #00ff9d;
        border: 1px solid rgba(0, 255, 157, 0.2);
    }

    .status-badge.rejected {
        background: rgba(255, 107, 107, 0.1);
        color: #ff6b6b;
        border: 1px solid rgba(255, 107, 107, 0.2);
    }

    .arrow-icon {
        color: rgba(255, 255, 255, 0.2);
    }

    /* Empty State */
    .empty-state {
        text-align: center;
        padding: 3rem 2rem;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 16px;
    }

    .empty-icon {
        opacity: 0.5;
        margin-bottom: 1rem;
    }

    .empty-state h3 {
        font-size: 1.1rem;
        margin-bottom: 0.5rem;
    }

    .empty-state p {
        color: rgba(255, 255, 255, 0.4);
        margin-bottom: 1.5rem;
        font-size: 0.85rem;
    }

    /* Responsive */
    @media (max-width: 900px) {
        .stats-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }

    @media (max-width: 768px) {
        .stock-audit-page {
            padding: 1rem;
        }

        .header {
            flex-direction: column;
            align-items: flex-start;
        }

        .audit-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
        }

        .audit-right {
            width: 100%;
            justify-content: space-between;
        }
    }

    @media (max-width: 500px) {
        .stats-grid {
            grid-template-columns: 1fr;
        }

        .tabs {
            width: 100%;
            justify-content: center;
        }
    }
</style>