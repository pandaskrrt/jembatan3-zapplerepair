<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';

    let { data } = $props();
    
    let cabinets = data?.cabinets || [];
    let selectedSection = data?.selectedSection;

    let searchQuery = $state('');
    let activeTab = $state<'overview' | 'history'>('overview');
    
    // Logika untuk menyimpan ID Cabinet yang sedang terbuka (dropdown accordion)
    let expandedCabinetId = $state<string | null>(null);

    function toggleCabinet(cabinetId: string) {
        if (expandedCabinetId === cabinetId) {
            expandedCabinetId = null; // Tutup jika diklik lagi
        } else {
            expandedCabinetId = cabinetId; // Buka cabinet yang dipilih
        }
    }

    function formatDate(date: string | Date) {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    }

    function formatDateTime(date: string | Date) {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
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
    <title>Riwayat Audit | Stock Audit</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
</svelte:head>

<div class="riwayat-wrapper">
    <!-- Header -->
    <header class="riwayat-header">
        <button class="btn-back" onclick={() => goto('/stock-audit')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            <span>Kembali ke Dashboard</span>
        </button>
        <div class="title-group">
            <h1 class="main-title">Riwayat <span class="text-accent">Pemeriksaan</span></h1>
            <p class="subtitle">Eksplorasi arsip data stock opname per kabinet struktur.</p>
        </div>
    </header>

    <!-- Search Bar -->
    <div class="search-container">
        <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
            type="text"
            bind:value={searchQuery}
            placeholder="Cari nama kabinet atau lokasi section..."
            class="search-input"
        />
        {#if searchQuery}
            <button class="clear-btn" onclick={() => searchQuery = ''}>✕</button>
        {/if}
    </div>

    <!-- JIKA SECTION DIPILIH (DETAIL VIEW) -->
    {#if selectedSection}
        <div class="section-detail-view">
            <!-- Hero Stats Card -->
            <div class="hero-glass-card">
                <div class="hero-main-info">
                    <span class="type-badge">{selectedSection.type}</span>
                    <h2 class="hero-title">{selectedSection.name}</h2>
                    <p class="hero-location-path">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                        {selectedSection.cabinetName}
                    </p>
                </div>
                <div class="hero-counters">
                    <div class="counter-box">
                        <span class="counter-num">{selectedSection.totalCards}</span>
                        <span class="counter-lbl">Total Items</span>
                    </div>
                    <div class="counter-box border-left">
                        <span class="counter-num">{selectedSection.audits.filter(a => a.status === 'COMPLETED').length}</span>
                        <span class="counter-lbl">Selesai</span>
                    </div>
                </div>
            </div>

            <!-- Detailed Metrics Grid -->
            <div class="metrics-grid">
                <div class="metric-card m-match">
                    <div class="metric-indicator"></div>
                    <div class="metric-body">
                        <span class="metric-val">{selectedSection.totalMatch || 0}</span>
                        <span class="metric-lbl">Match</span>
                    </div>
                </div>
                <div class="metric-card m-mismatch">
                    <div class="metric-indicator"></div>
                    <div class="metric-body">
                        <span class="metric-val">{selectedSection.totalMismatch || 0}</span>
                        <span class="metric-lbl">Mismatch</span>
                    </div>
                </div>
                <div class="metric-card m-missing">
                    <div class="metric-indicator"></div>
                    <div class="metric-body">
                        <span class="metric-val">{selectedSection.totalMissing || 0}</span>
                        <span class="metric-lbl">Missing</span>
                    </div>
                </div>
                <div class="metric-card m-new">
                    <div class="metric-indicator"></div>
                    <div class="metric-body">
                        <span class="metric-val">{selectedSection.totalNewEntry || 0}</span>
                        <span class="metric-lbl">New Entry</span>
                    </div>
                </div>
                <div class="metric-card m-accuracy">
                    <div class="metric-indicator"></div>
                    <div class="metric-body">
                        <span class="metric-val">
                            {selectedSection.audits.length > 0 
                                ? Math.round((selectedSection.audits.reduce((sum, a) => sum + (a.totalMatch || 0), 0) / 
                                    (selectedSection.audits.reduce((sum, a) => sum + (a.totalCards || 0), 0) || 1)) * 100)
                                : 0}%
                        </span>
                        <span class="metric-lbl">Akurasi Valid</span>
                    </div>
                </div>
            </div>

            <!-- Segmented Tabs Control -->
            <div class="tab-segment">
                <button class="segment-btn" class:active={activeTab === 'overview'} onclick={() => activeTab = 'overview'}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                    <span>Ringkasan Panel</span>
                </button>
                <button class="segment-btn" class:active={activeTab === 'history'} onclick={() => activeTab = 'history'}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span>Log Aktivitas</span>
                    <span class="badge-count">{selectedSection.audits.length}</span>
                </button>
            </div>

            <!-- Content Tab: Overview -->
            {#if activeTab === 'overview'}
                <div class="list-stack">
                    {#each selectedSection.audits as audit}
                        <div class="glass-row-item" onclick={() => goToAuditDetail(audit.id)}>
                            <div class="row-left">
                                <div class="pulse-icon-box">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                </div>
                                <div class="meta-block">
                                    <div class="meta-primary">{formatDate(audit.createdAt)}</div>
                                    <div class="meta-secondary">PJ: {audit.auditorName || 'Sistem'}</div>
                                </div>
                            </div>
                            <div class="row-mid-metrics">
                                <span class="tag-num match">✓ {audit.totalMatch || 0}</span>
                                <span class="tag-num mismatch">⚠ {audit.totalMismatch || 0}</span>
                                <span class="tag-num missing">✕ {audit.totalMissing || 0}</span>
                                <span class="tag-num new">+ {audit.totalNewEntry || 0}</span>
                            </div>
                            <div class="row-right-status">
                                <span class="status-pill-v2 {audit.status.toLowerCase()}">{audit.status}</span>
                                <svg class="chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                            </div>
                        </div>
                    {:else}
                        <div class="empty-placeholder-box">
                            <p>Belum ada rekaman audit terdaftar pada segmen ini.</p>
                        </div>
                    {/each}
                </div>
            {/if}

            <!-- Content Tab: History Logs -->
            {#if activeTab === 'history'}
                <div class="list-stack-detailed">
                    {#each selectedSection.audits as audit}
                        <div class="expanded-log-card" onclick={() => goToAuditDetail(audit.id)}>
                            <div class="log-top">
                                <div>
                                    <span class="log-time">{formatDateTime(audit.createdAt)}</span>
                                    <span class="log-author">Auditor: {audit.auditorName || 'Staff'}</span>
                                </div>
                                <span class="status-pill-v2 {audit.status.toLowerCase()}">{audit.status}</span>
                            </div>

                            <div class="log-grid-summary">
                                <div class="block-sum"><span class="v">{audit.totalCards || 0}</span><span class="l">Total</span></div>
                                <div class="block-sum c-match"><span class="v">{audit.totalMatch || 0}</span><span class="l">Match</span></div>
                                <div class="block-sum c-mismatch"><span class="v">{audit.totalMismatch || 0}</span><span class="l">Mismatch</span></div>
                                <div class="block-sum c-missing"><span class="v">{audit.totalMissing || 0}</span><span class="l">Missing</span></div>
                            </div>

                            {#if audit.note}
                                <div class="log-note-area">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                    <p>{audit.note}</p>
                                </div>
                            {/if}

                            <div class="log-footer">
                                <span>{audit.completedAt ? `Closed at: ${formatDateTime(audit.completedAt)}` : 'Proses Masih Berjalan (Draft)'}</span>
                                <svg class="chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                            </div>
                        </div>
                    {:else}
                        <div class="empty-placeholder-box">
                            <p>Belum ada log aktivitas riwayat terdeteksi.</p>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    {:else}
        <!-- TAMPILAN UTAMA: ACCORDION CABINET & SECTION -->
        <div class="accordion-stack">
            {#each filteredCabinets as cabinet}
                <div class="cabinet-accordion-card" class:is-expanded={expandedCabinetId === cabinet.id}>
                    <!-- Trigger Header Kabinet -->
                    <button class="cabinet-trigger-head" onclick={() => toggleCabinet(cabinet.id)}>
                        <div class="cabinet-meta-left">
                            <div class="cabinet-icon-wrapper">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                                    <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
                                </svg>
                            </div>
                            <div class="cabinet-text-info">
                                <h3 class="cabinet-title-name">{cabinet.name}</h3>
                                <p class="cabinet-subtitle-count">{cabinet.sections.length} Section Terintegrasi</p>
                            </div>
                        </div>
                        <div class="cabinet-meta-right">
                            <svg class="accordion-chevron-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                <polyline points="6 9 12 15 18 9"/>
                            </svg>
                        </div>
                    </button>
                    
                    <!-- Section Wrapper (Hanya Tampil Jika Cabinet Dipilih/Terbuka) -->
                    {#if expandedCabinetId === cabinet.id}
                        <div class="collapsible-section-body">
                            <div class="sections-inner-list">
                                {#each cabinet.sections as section}
                                    <div class="section-row-interactive" onclick={() => goto(`/stock-audit/riwayat/${section.id}`)}>
                                        <div class="sec-details">
                                            <div class="sec-folder-visual">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                                            </div>
                                            <div>
                                                <div class="sec-name">{section.name}</div>
                                                <div class="sec-type">{section.type}</div>
                                            </div>
                                        </div>
                                        <div class="sec-stats-capsules">
                                            <span class="mini-capsule c-match">✓ {section.totalMatch}</span>
                                            <span class="mini-capsule c-mismatch">⚠ {section.totalMismatch}</span>
                                            <span class="mini-capsule-count">{section.auditCount}x Checked</span>
                                        </div>
                                        <svg class="sec-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/if}
                </div>
            {:else}
                <div class="empty-query-box">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                    <h3>Pencarian Tidak Ditemukan</h3>
                    <p>Gunakan kata kunci pencarian kabinet atau sub-section lain.</p>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .riwayat-wrapper {
        max-width: 1100px;
        margin: 0 auto;
        padding: 1.5rem;
        font-family: 'Plus Jakarta Sans', sans-serif;
    }

    /* Refined Header */
    .riwayat-header {
        margin-bottom: 2.5rem;
    }

    .btn-back {
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.4);
        font-size: 0.85rem;
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
        transition: all 0.2s;
    }

    .btn-back:hover {
        color: #ffffff;
        transform: translateX(-4px);
    }

    .main-title {
        font-size: 2.2rem;
        font-weight: 800;
        color: #ffffff;
        letter-spacing: -1px;
    }

    .text-accent { color: rgba(255, 255, 255, 0.3); }
    .subtitle { font-size: 0.95rem; color: rgba(255, 255, 255, 0.4); margin-top: 0.25rem; }

    /* Modern Search */
    .search-container {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 14px;
        padding: 0.8rem 1.2rem;
        margin-bottom: 2.5rem;
    }

    .search-icon { color: rgba(255, 255, 255, 0.3); }
    .search-input { flex: 1; background: none; border: none; color: #ffffff; font-size: 0.9rem; outline: none; font-family: inherit;}
    .search-input::placeholder { color: rgba(255, 255, 255, 0.25); }
    .clear-btn { background: none; border: none; color: rgba(255, 255, 255, 0.4); cursor: pointer; }

    /* Collapsible Accordion Core */
    .accordion-stack {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .cabinet-accordion-card {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 16px;
        overflow: hidden;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .cabinet-accordion-card:hover {
        border-color: rgba(255, 255, 255, 0.1);
        background: rgba(255, 255, 255, 0.03);
    }

    .cabinet-accordion-card.is-expanded {
        border-color: rgba(255, 255, 255, 0.15);
        background: rgba(255, 255, 255, 0.03);
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }

    .cabinet-trigger-head {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.25rem 1.5rem;
        background: transparent;
        border: none;
        cursor: pointer;
        text-align: left;
    }

    .cabinet-meta-left { display: flex; align-items: center; gap: 1rem; }
    .cabinet-icon-wrapper { color: rgba(255, 255, 255, 0.6); }
    .cabinet-title-name { font-size: 1.05rem; font-weight: 700; color: #ffffff; }
    .cabinet-subtitle-count { font-size: 0.8rem; color: rgba(255, 255, 255, 0.4); margin-top: 0.1rem; }
    .cabinet-meta-right { color: rgba(255, 255, 255, 0.3); transition: transform 0.3s; }

    /* Perputaran icon panah saat dropdown terbuka */
    .cabinet-accordion-card.is-expanded .accordion-chevron-icon {
        transform: rotate(180deg);
        color: #ffffff;
    }

    /* Container Daftar Section Di Dalamnya */
    .collapsible-section-body {
        border-top: 1px solid rgba(255, 255, 255, 0.05);
        background: rgba(0, 0, 0, 0.2);
        animation: slideDown 0.25s ease-out;
    }

    @keyframes slideDown {
        from { opacity: 0; transform: translateY(-5px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .sections-inner-list { padding: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem; }

    .section-row-interactive {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.9rem 1.25rem;
        background: rgba(255, 255, 255, 0.01);
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s;
    }

    .section-row-interactive:hover {
        background: rgba(255, 255, 255, 0.05);
        transform: translateX(4px);
    }

    .sec-details { display: flex; align-items: center; gap: 0.75rem; }
    .sec-folder-visual { color: rgba(255, 255, 255, 0.3); }
    .sec-name { font-size: 0.9rem; font-weight: 600; color: #ffffff; }
    .sec-type { font-size: 0.75rem; color: rgba(255, 255, 255, 0.4); }
    .sec-stats-capsules { display: flex; align-items: center; gap: 0.75rem; }

    .mini-capsule { font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 6px; }
    .mini-capsule.c-match { background: rgba(16, 185, 129, 0.1); color: #10b981; }
    .mini-capsule.c-mismatch { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
    .mini-capsule-count { font-size: 0.75rem; color: rgba(255, 255, 255, 0.35); }
    .sec-arrow { color: rgba(255, 255, 255, 0.15); transition: all 0.2s; }
    .section-row-interactive:hover .sec-arrow { color: #ffffff; transform: translateX(2px); }

    /* DETAIL VIEW STYLING */
    .hero-glass-card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 24px;
        padding: 2rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        flex-wrap: wrap;
        gap: 1.5rem;
    }

    .type-badge {
        background: rgba(255, 255, 255, 0.08);
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        letter-spacing: 0.5px;
    }

    .hero-title { font-size: 1.6rem; font-weight: 800; color: #ffffff; margin: 0.5rem 0 0.25rem 0; }
    .hero-location-path { font-size: 0.85rem; color: rgba(255, 255, 255, 0.4); display: flex; align-items: center; gap: 0.4rem; }
    .hero-counters { display: flex; gap: 2rem; }
    .counter-box { text-align: center; }
    .counter-box.border-left { border-left: 1px solid rgba(255, 255, 255, 0.1); padding-left: 2rem; }
    .counter-num { display: block; font-size: 1.8rem; font-weight: 800; color: #ffffff; }
    .counter-lbl { font-size: 0.75rem; color: rgba(255, 255, 255, 0.4); font-weight: 500; }

    /* Metrics Bento Row */
    .metrics-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 1rem;
        margin-bottom: 2.5rem;
    }

    .metric-card {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 16px;
        padding: 1rem 1.2rem;
        position: relative;
        overflow: hidden;
    }

    .metric-indicator { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; }
    .metric-val { display: block; font-size: 1.4rem; font-weight: 800; color: #ffffff; }
    .metric-lbl { font-size: 0.75rem; color: rgba(255, 255, 255, 0.4); font-weight: 600; }

    .m-match .metric-indicator { background: #10b981; }
    .m-match .metric-val { color: #10b981; }
    .m-mismatch .metric-indicator { background: #f59e0b; }
    .m-mismatch .metric-val { color: #f59e0b; }
    .m-missing .metric-indicator { background: #ef4444; }
    .m-missing .metric-val { color: #ef4444; }
    .m-new .metric-indicator { background: #3b82f6; }
    .m-new .metric-val { color: #3b82f6; }
    .m-accuracy .metric-indicator { background: #ffffff; }

    /* Segmented Tab Bar */
    .tab-segment {
        display: flex;
        background: rgba(255, 255, 255, 0.03);
        padding: 0.35rem;
        border-radius: 12px;
        gap: 0.25rem;
        margin-bottom: 1.5rem;
        max-width: fit-content;
    }

    .segment-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.6rem 1.2rem;
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.4);
        font-weight: 600;
        font-size: 0.85rem;
        cursor: pointer;
        border-radius: 8px;
        transition: all 0.2s;
    }

    .segment-btn:hover { color: #ffffff; }
    .segment-btn.active { background: rgba(255, 255, 255, 0.07); color: #ffffff; }
    .badge-count { background: rgba(255, 255, 255, 0.1); padding: 0.1rem 0.4rem; border-radius: 6px; font-size: 0.7rem; }

    /* Lists Stacking */
    .list-stack { display: flex; flex-direction: column; gap: 0.75rem; }

    .glass-row-item {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        padding: 1rem 1.5rem;
        border-radius: 14px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        transition: all 0.2s;
    }

    .glass-row-item:hover { background: rgba(255, 255, 255, 0.04); transform: scale(1.002); }
    .row-left { display: flex; align-items: center; gap: 1rem; }
    .pulse-icon-box { color: rgba(255, 255, 255, 0.4); }
    .meta-primary { font-size: 0.9rem; font-weight: 600; color: #ffffff; }
    .meta-secondary { font-size: 0.75rem; color: rgba(255, 255, 255, 0.35); }
    .row-mid-metrics { display: flex; gap: 1rem; }
    
    .tag-num { font-size: 0.8rem; font-weight: 600; }
    .tag-num.match { color: #10b981; }
    .tag-num.mismatch { color: #f59e0b; }
    .tag-num.missing { color: #ef4444; }
    .tag-num.new { color: #3b82f6; }

    .row-right-status { display: flex; align-items: center; gap: 1rem; }
    .status-pill-v2 { padding: 0.3rem 0.7rem; border-radius: 6px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
    .status-pill-v2.draft { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
    .status-pill-v2.completed { background: rgba(16, 185, 129, 0.1); color: #10b981; }

    .chevron { color: rgba(255, 255, 255, 0.1); transition: transform 0.2s; }
    .glass-row-item:hover .chevron { transform: translateX(3px); color: #ffffff; }

    /* Detailed Log Card */
    .list-stack-detailed { display: flex; flex-direction: column; gap: 1rem; }
    
    .expanded-log-card {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 16px;
        padding: 1.25rem 1.5rem;
        cursor: pointer;
        transition: border 0.2s;
    }

    .expanded-log-card:hover { border-color: rgba(255, 255, 255, 0.12); }
    .log-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .log-time { font-size: 0.9rem; font-weight: 700; color: #ffffff; }
    .log-author { font-size: 0.8rem; color: rgba(255, 255, 255, 0.4); margin-left: 0.75rem; }
    
    .log-grid-summary { display: flex; gap: 1.5rem; margin-bottom: 1rem; background: rgba(0,0,0,0.15); padding: 0.75rem 1.25rem; border-radius: 10px; }
    .block-sum { display: flex; flex-direction: column; }
    .block-sum .v { font-size: 1.05rem; font-weight: 700; color: #ffffff; }
    .block-sum .l { font-size: 0.65rem; color: rgba(255, 255, 255, 0.4); text-transform: uppercase; }
    .block-sum.c-match .v { color: #10b981; }
    .block-sum.c-mismatch .v { color: #f59e0b; }
    .block-sum.c-missing .v { color: #ef4444; }

    .log-note-area { display: flex; align-items: flex-start; gap: 0.5rem; background: rgba(255,255,255,0.02); padding: 0.75rem; border-radius: 8px; font-size: 0.8rem; color: rgba(255,255,255,0.5); margin-bottom: 1rem; }
    .log-footer { display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: rgba(255, 255, 255, 0.3); border-top: 1px solid rgba(255,255,255,0.04); padding-top: 0.75rem; }

    /* Placeholder */
    .empty-query-box, .empty-placeholder-box { text-align: center; padding: 4rem 2rem; color: rgba(255, 255, 255, 0.25); }
    .empty-query-box h3 { color: #ffffff; margin: 1rem 0 0.25rem 0; font-size: 1.1rem; }
    .empty-query-box p { font-size: 0.85rem; }

    /* Reponsive Optimization */
    @media (max-width: 900px) {
        .metrics-grid { grid-template-columns: repeat(3, 1fr); }
        .glass-row-item { flex-direction: column; align-items: flex-start; gap: 1rem; }
        .row-mid-metrics { width: 100%; justify-content: space-between; }
        .row-right-status { width: 100%; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 0.5rem; }
    }

    @media (max-width: 600px) {
        .metrics-grid { grid-template-columns: repeat(2, 1fr); }
        .hero-glass-card { flex-direction: column; align-items: flex-start; }
        .hero-counters { width: 100%; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1rem; }
        .counter-box.border-left { border-left: none; padding-left: 0; }
    }
</style>