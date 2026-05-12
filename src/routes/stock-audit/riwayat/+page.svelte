<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { onMount } from 'svelte';

    let { data } = $props();
    
    let cabinets = data?.cabinets || [];
    let selectedSectionId = data?.selectedSectionId;
    let selectedSection = data?.selectedSection;

    let searchQuery = $state('');
    let activeTab = $state<'overview' | 'history'>('overview');

    function formatDate(date: string | Date) {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    function formatDateTime(date: string | Date) {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function getStatusBadge(status: string) {
        if (status === 'DRAFT') {
            return { class: 'draft', icon: '📝', text: 'Draft' };
        }
        return { class: 'completed', icon: '✅', text: 'Selesai' };
    }

    function goToAuditDetail(auditId: string) {
        goto(`/stock-audit/${auditId}`);
    }

    const filteredCabinets = $derived(
        cabinets.filter(cab => 
            cab.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            cab.sections.some(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
        )
    );
</script>

<svelte:head>
    <title>Riwayat Audit</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
</svelte:head>

<div class="riwayat-page">
    <!-- Header -->
    <div class="header">
        <button class="back-btn" onclick={() => goto('/stock-audit')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Kembali
        </button>
        <div>
            <h1 class="title">Riwayat Audit</h1>
            <p class="subtitle">Lihat semua riwayat stock opname per cabinet dan section</p>
        </div>
    </div>

    <!-- Search -->
    <div class="search-wrap">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
        </svg>
        <input
            type="text"
            bind:value={searchQuery}
            placeholder="Cari cabinet atau section..."
            class="search-input"
        />
        {#if searchQuery}
            <button class="clear-btn" onclick={() => searchQuery = ''}>✕</button>
        {/if}
    </div>

    <!-- Jika section dipilih, tampilkan detail section -->
    {#if selectedSection}
        <div class="section-detail">
            <!-- Section Header -->
            <div class="section-hero">
                <div class="section-hero-left">
                    <span class="section-badge">{selectedSection.type}</span>
                    <h2 class="section-title">{selectedSection.name}</h2>
                    <p class="section-location">{selectedSection.cabinetName}</p>
                </div>
                <div class="section-hero-right">
                    <div class="hero-stat">
                        <span class="hero-stat-value">{selectedSection.totalCards}</span>
                        <span class="hero-stat-label">Total Card</span>
                    </div>
                    <div class="hero-stat">
                        <span class="hero-stat-value">{selectedSection.audits.filter(a => a.status === 'COMPLETED').length}</span>
                        <span class="hero-stat-label">Total Audit</span>
                    </div>
                </div>
            </div>

            <!-- Stats Grid -->
            <div class="stats-row">
                <div class="stat-item match">
                    <span class="stat-icon">✓</span>
                    <div>
                        <span class="stat-value">{selectedSection.totalMatch || 0}</span>
                        <span class="stat-label">Match</span>
                    </div>
                </div>
                <div class="stat-item mismatch">
                    <span class="stat-icon">⚠</span>
                    <div>
                        <span class="stat-value">{selectedSection.totalMismatch || 0}</span>
                        <span class="stat-label">Mismatch</span>
                    </div>
                </div>
                <div class="stat-item missing">
                    <span class="stat-icon">✕</span>
                    <div>
                        <span class="stat-value">{selectedSection.totalMissing || 0}</span>
                        <span class="stat-label">Missing</span>
                    </div>
                </div>
                <div class="stat-item new">
                    <span class="stat-icon">+</span>
                    <div>
                        <span class="stat-value">{selectedSection.totalNewEntry || 0}</span>
                        <span class="stat-label">New Entry</span>
                    </div>
                </div>
                <div class="stat-item accuracy">
                    <span class="stat-icon">📊</span>
                    <div>
                        <span class="stat-value">
                            {selectedSection.audits.length > 0 
                                ? Math.round((selectedSection.audits.reduce((sum, a) => sum + (a.totalMatch || 0), 0) / 
                                    (selectedSection.audits.reduce((sum, a) => sum + (a.totalCards || 0), 0) || 1)) * 100)
                                : 0}%
                        </span>
                        <span class="stat-label">Akurasi</span>
                    </div>
                </div>
            </div>

            <!-- Tabs -->
            <div class="tabs">
                <button class="tab {activeTab === 'overview' ? 'active' : ''}" onclick={() => activeTab = 'overview'}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="7" height="7"/>
                        <rect x="14" y="3" width="7" height="7"/>
                        <rect x="3" y="14" width="7" height="7"/>
                        <rect x="14" y="14" width="7" height="7"/>
                    </svg>
                    Ringkasan
                </button>
                <button class="tab {activeTab === 'history' ? 'active' : ''}" onclick={() => activeTab = 'history'}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    Riwayat Audit
                    <span class="tab-count">{selectedSection.audits.length}</span>
                </button>
            </div>

            <!-- Tab: Overview - Ringkasan per audit -->
            {#if activeTab === 'overview'}
                <div class="audit-list">
                    {#each selectedSection.audits as audit}
                        <div class="audit-card" onclick={() => goToAuditDetail(audit.id)}>
                            <div class="audit-card-left">
                                <div class="audit-date-icon">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <circle cx="12" cy="12" r="10"/>
                                        <polyline points="12 6 12 12 16 14"/>
                                    </svg>
                                </div>
                                <div>
                                    <div class="audit-date">{formatDate(audit.createdAt)}</div>
                                    <div class="audit-auditor">oleh {audit.auditorName || 'Unknown'}</div>
                                </div>
                            </div>
                            <div class="audit-card-stats">
                                <span class="stat-match">✓ {audit.totalMatch || 0}</span>
                                <span class="stat-mismatch">⚠ {audit.totalMismatch || 0}</span>
                                <span class="stat-missing">✕ {audit.totalMissing || 0}</span>
                                <span class="stat-new">+ {audit.totalNewEntry || 0}</span>
                            </div>
                            <div class="audit-card-right">
                                <span class="status-badge {audit.status === 'DRAFT' ? 'draft' : 'completed'}">
                                    {#if audit.status === 'DRAFT'}📝 Draft{:else}✅ Selesai{/if}
                                </span>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="9 18 15 12 9 6"/>
                                </svg>
                            </div>
                        </div>
                    {:else}
                        <div class="empty-state">
                            <div class="empty-icon">📭</div>
                            <p>Belum ada riwayat audit untuk section ini</p>
                        </div>
                    {/each}
                </div>
            {/if}

            <!-- Tab: History - Detail per audit -->
            {#if activeTab === 'history'}
                <div class="history-list">
                    {#each selectedSection.audits as audit}
                        <div class="history-card" onclick={() => goToAuditDetail(audit.id)}>
                            <div class="history-card-header">
                                <div>
                                    <span class="history-date">{formatDateTime(audit.createdAt)}</span>
                                    <span class="history-auditor">Auditor: {audit.auditorName || 'Unknown'}</span>
                                </div>
                                <span class="status-badge {audit.status === 'DRAFT' ? 'draft' : 'completed'}">
                                    {#if audit.status === 'DRAFT'}📝 Draft{:else}✅ Selesai{/if}
                                </span>
                            </div>

                            <div class="history-stats">
                                <div class="hstat">
                                    <span class="hstat-value">{audit.totalCards || 0}</span>
                                    <span class="hstat-label">Total</span>
                                </div>
                                <div class="hstat match">
                                    <span class="hstat-value">{audit.totalMatch || 0}</span>
                                    <span class="hstat-label">Match</span>
                                </div>
                                <div class="hstat mismatch">
                                    <span class="hstat-value">{audit.totalMismatch || 0}</span>
                                    <span class="hstat-label">Mismatch</span>
                                </div>
                                <div class="hstat missing">
                                    <span class="hstat-value">{audit.totalMissing || 0}</span>
                                    <span class="hstat-label">Missing</span>
                                </div>
                                <div class="hstat new">
                                    <span class="hstat-value">{audit.totalNewEntry || 0}</span>
                                    <span class="hstat-label">New</span>
                                </div>
                            </div>

                            {#if audit.note}
                                <div class="history-note">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                        <polyline points="14 2 14 8 20 8"/>
                                    </svg>
                                    <span>{audit.note}</span>
                                </div>
                            {/if}

                            <div class="history-footer">
                                <span>
                                    {#if audit.completedAt}
                                        Selesai: {formatDateTime(audit.completedAt)}
                                    {:else}
                                        <span class="draft-text">Belum selesai</span>
                                    {/if}
                                </span>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="9 18 15 12 9 6"/>
                                </svg>
                            </div>
                        </div>
                    {:else}
                        <div class="empty-state">
                            <div class="empty-icon">📭</div>
                            <p>Belum ada riwayat audit untuk section ini</p>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    {:else}
        <!-- Tampilkan semua cabinet dan section -->
        <div class="cabinets-container">
            {#each filteredCabinets as cabinet}
                <div class="cabinet">
                    <div class="cabinet-head">
                        <div class="cabinet-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <rect x="2" y="3" width="20" height="14" rx="2"/>
                                <path d="M8 21h8M12 17v4"/>
                            </svg>
                        </div>
                        <div>
                            <h3 class="cabinet-name">{cabinet.name}</h3>
                            <p class="cabinet-meta">{cabinet.sections.length} section</p>
                        </div>
                    </div>
                    
                    <div class="sections">
                        {#each cabinet.sections as section}
                            <div class="section" onclick={() => goto(`/stock-audit/riwayat/${section.id}`)}>
                                <div class="section-left">
                                    <div class="section-icon">📁</div>
                                    <div>
                                        <div class="section-name">{section.name}</div>
                                        <div class="section-type">{section.type}</div>
                                    </div>
                                </div>
                                <div class="section-stats-mini">
                                    <span class="mini-stat match">✓ {section.totalMatch}</span>
                                    <span class="mini-stat mismatch">⚠ {section.totalMismatch}</span>
                                    <span class="mini-stat audit">{section.auditCount}x audit</span>
                                </div>
                                <svg class="section-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="9 18 15 12 9 6"/>
                                </svg>
                            </div>
                        {/each}
                    </div>
                </div>
            {:else}
                <div class="empty">
                    <div class="empty-icon">📭</div>
                    <h3>Tidak ada data</h3>
                    <p>Tidak ada cabinet atau section yang ditemukan</p>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

    .riwayat-page {
        max-width: 1000px;
        margin: 0 auto;
        padding: 2rem;
        font-family: 'Poppins', sans-serif;
        background: #000000;
        min-height: 100vh;
    }

    /* Header */
    .header {
        margin-bottom: 2rem;
    }

    .back-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.5);
        font-size: 0.8rem;
        cursor: pointer;
        margin-bottom: 1rem;
        transition: all 0.2s;
    }

    .back-btn:hover {
        color: #00ff9d;
        transform: translateX(-4px);
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
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.5);
    }

    /* Search */
    .search-wrap {
        display: flex;
        align-items: center;
        gap: 10px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        padding: 0.7rem 1rem;
        margin-bottom: 2rem;
    }

    .search-icon {
        color: rgba(255, 255, 255, 0.4);
        flex-shrink: 0;
    }

    .search-input {
        flex: 1;
        background: none;
        border: none;
        color: #fff;
        font-size: 0.85rem;
        outline: none;
    }

    .search-input::placeholder {
        color: rgba(255, 255, 255, 0.3);
    }

    .clear-btn {
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.4);
        cursor: pointer;
        font-size: 0.9rem;
    }

    /* Section Detail */
    .section-detail {
        animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .section-hero {
        background: linear-gradient(135deg, rgba(0, 255, 157, 0.05), rgba(0, 204, 255, 0.02));
        border: 1px solid rgba(0, 255, 157, 0.15);
        border-radius: 20px;
        padding: 1.5rem;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
        gap: 1rem;
    }

    .section-badge {
        display: inline-block;
        background: rgba(0, 255, 157, 0.1);
        color: #00ff9d;
        font-size: 0.65rem;
        padding: 0.2rem 0.6rem;
        border-radius: 20px;
        margin-bottom: 0.5rem;
    }

    .section-title {
        font-size: 1.4rem;
        font-weight: 600;
        color: #fff;
        margin-bottom: 0.25rem;
    }

    .section-location {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.5);
    }

    .hero-stat {
        text-align: center;
        padding: 0.5rem 1rem;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 12px;
        min-width: 90px;
    }

    .hero-stat-value {
        display: block;
        font-size: 1.5rem;
        font-weight: 700;
        color: #00ff9d;
    }

    .hero-stat-label {
        font-size: 0.65rem;
        color: rgba(255, 255, 255, 0.5);
    }

    /* Stats Row */
    .stats-row {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 0.75rem;
        margin-bottom: 1.5rem;
    }

    .stat-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 12px;
    }

    .stat-icon {
        font-size: 1.2rem;
    }

    .stat-value {
        display: block;
        font-size: 1rem;
        font-weight: 700;
    }

    .stat-label {
        font-size: 0.6rem;
        color: rgba(255, 255, 255, 0.5);
    }

    .stat-item.match .stat-value { color: #00ff9d; }
    .stat-item.mismatch .stat-value { color: #ffaa00; }
    .stat-item.missing .stat-value { color: #ff6b6b; }
    .stat-item.new .stat-value { color: #00ccff; }
    .stat-item.accuracy .stat-value { color: #ffffff; }

    /* Tabs */
    .tabs {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        padding-bottom: 0.5rem;
    }

    .tab {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 0.5rem 1rem;
        background: none;
        border: none;
        border-radius: 8px;
        color: rgba(255, 255, 255, 0.5);
        font-size: 0.8rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .tab:hover {
        color: rgba(255, 255, 255, 0.8);
    }

    .tab.active {
        background: rgba(0, 255, 157, 0.1);
        color: #00ff9d;
    }

    .tab-count {
        background: rgba(255, 255, 255, 0.1);
        padding: 0.1rem 0.4rem;
        border-radius: 20px;
        font-size: 0.65rem;
    }

    /* Audit List (Overview) */
    .audit-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .audit-card {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 1rem;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s;
        flex-wrap: wrap;
        gap: 0.75rem;
    }

    .audit-card:hover {
        background: rgba(255, 255, 255, 0.04);
        transform: translateX(4px);
    }

    .audit-card-left {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .audit-date-icon {
        color: #00ff9d;
    }

    .audit-date {
        font-size: 0.75rem;
        font-weight: 500;
        color: #fff;
    }

    .audit-auditor {
        font-size: 0.65rem;
        color: rgba(255, 255, 255, 0.4);
    }

    .audit-card-stats {
        display: flex;
        gap: 0.75rem;
    }

    .stat-match { color: #00ff9d; font-size: 0.7rem; }
    .stat-mismatch { color: #ffaa00; font-size: 0.7rem; }
    .stat-missing { color: #ff6b6b; font-size: 0.7rem; }
    .stat-new { color: #00ccff; font-size: 0.7rem; }

    .audit-card-right {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .status-badge {
        font-size: 0.65rem;
        padding: 0.2rem 0.6rem;
        border-radius: 20px;
    }

    .status-badge.draft {
        background: rgba(255, 170, 0, 0.1);
        color: #ffaa00;
    }

    .status-badge.completed {
        background: rgba(0, 255, 157, 0.1);
        color: #00ff9d;
    }

    /* History List */
    .history-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .history-card {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 14px;
        padding: 1rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .history-card:hover {
        background: rgba(255, 255, 255, 0.04);
        transform: translateX(4px);
    }

    .history-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .history-date {
        font-size: 0.75rem;
        font-weight: 600;
        color: #00ff9d;
    }

    .history-auditor {
        font-size: 0.65rem;
        color: rgba(255, 255, 255, 0.4);
        margin-left: 0.5rem;
    }

    .history-stats {
        display: flex;
        gap: 0.75rem;
        margin-bottom: 0.75rem;
        flex-wrap: wrap;
    }

    .hstat {
        text-align: center;
        min-width: 50px;
    }

    .hstat-value {
        display: block;
        font-size: 0.9rem;
        font-weight: 600;
    }

    .hstat-label {
        font-size: 0.55rem;
        color: rgba(255, 255, 255, 0.4);
    }

    .hstat.match .hstat-value { color: #00ff9d; }
    .hstat.mismatch .hstat-value { color: #ffaa00; }
    .hstat.missing .hstat-value { color: #ff6b6b; }
    .hstat.new .hstat-value { color: #00ccff; }

    .history-note {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 0.5rem 0;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
        font-size: 0.7rem;
        color: rgba(255, 255, 255, 0.5);
    }

    .history-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 0.5rem;
        font-size: 0.6rem;
        color: rgba(255, 255, 255, 0.35);
    }

    .draft-text {
        color: #ffaa00;
    }

    /* Cabinets Container */
    .cabinets-container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .cabinet {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 16px;
        overflow: hidden;
    }

    .cabinet-head {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem 1.25rem;
        background: rgba(0, 0, 0, 0.2);
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .cabinet-icon {
        color: #00ff9d;
    }

    .cabinet-name {
        font-size: 1rem;
        font-weight: 600;
        margin: 0;
        color: #fff;
    }

    .cabinet-meta {
        font-size: 0.65rem;
        color: rgba(255, 255, 255, 0.4);
    }

    .sections {
        padding: 0.75rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .section {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem;
        background: rgba(255, 255, 255, 0.01);
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.2s;
    }

    .section:hover {
        background: rgba(255, 255, 255, 0.04);
        transform: translateX(4px);
    }

    .section-left {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .section-icon {
        font-size: 1.2rem;
    }

    .section-name {
        font-size: 0.85rem;
        font-weight: 500;
        color: #fff;
    }

    .section-type {
        font-size: 0.6rem;
        color: rgba(255, 255, 255, 0.4);
    }

    .section-stats-mini {
        display: flex;
        gap: 0.75rem;
    }

    .mini-stat {
        font-size: 0.6rem;
        font-weight: 500;
    }

    .mini-stat.match { color: #00ff9d; }
    .mini-stat.mismatch { color: #ffaa00; }
    .mini-stat.audit { color: rgba(255, 255, 255, 0.4); }

    .section-arrow {
        color: rgba(255, 255, 255, 0.2);
        transition: transform 0.2s;
    }

    .section:hover .section-arrow {
        transform: translateX(3px);
        color: #00ff9d;
    }

    /* Empty State */
    .empty, .empty-state {
        text-align: center;
        padding: 3rem 2rem;
        background: rgba(255, 255, 255, 0.02);
        border-radius: 16px;
    }

    .empty-icon {
        font-size: 3rem;
        margin-bottom: 0.5rem;
        opacity: 0.5;
    }

    .empty h3, .empty-state h3 {
        font-size: 1rem;
        font-weight: 500;
        margin-bottom: 0.25rem;
        color: #fff;
    }

    .empty p, .empty-state p {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.4);
    }

    /* Responsive */
    @media (max-width: 800px) {
        .riwayat-page {
            padding: 1rem;
        }

        .stats-row {
            grid-template-columns: repeat(3, 1fr);
        }

        .section-hero {
            flex-direction: column;
        }

        .hero-stat {
            width: 100%;
        }
    }

    @media (max-width: 600px) {
        .title {
            font-size: 1.4rem;
        }

        .stats-row {
            grid-template-columns: repeat(2, 1fr);
        }

        .audit-card {
            flex-direction: column;
            align-items: flex-start;
        }

        .audit-card-right {
            align-self: flex-end;
        }

        .section-stats-mini {
            display: none;
        }
    }
</style>