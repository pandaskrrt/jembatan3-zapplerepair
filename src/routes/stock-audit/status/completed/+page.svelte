<script lang="ts">
    import { goto } from '$app/navigation';
    import type { PageData } from './$types';

    let { data } = $props();
    let audits = data?.audits || [];
    let count = data?.count || 0;
    let summary = data?.summary || {
        totalMatch: 0,
        totalMismatch: 0,
        totalMissing: 0,
        totalNewEntry: 0,
        totalItemsAudited: 0,
        averageAccuracy: 0
    };

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

    function goToDetail(auditId: string | number) {
        goto(`/stock-audit/laporan/${auditId}`);
    }
</script>

<svelte:head>
    <title>Riwayat Audit Selesai - Stock Management System</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
</svelte:head>

<div class="page-container">
    <header class="page-header">
        <div class="header-content">
            <h1 class="title">Riwayat Berkas Audit</h1>
            <p class="subtitle">Daftar seluruh inspeksi stock opname sekat ruang (*section*) yang telah diselesaikan dan diverifikasi</p>
        </div>
    </header>

    {#if audits.length === 0}
        <div class="empty-state-frame">
            <div class="empty-icon-box">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
            </div>
            <h3>Belum Ada Arsip Audit</h3>
            <p>Sistem belum mendeteksi adanya rekam jejak berkas audit berkategori selesai (*COMPLETED*).</p>
        </div>
    {:else}
        <div class="summary-metric-banner">
            <div class="accuracy-radial-block">
                <span class="accuracy-pct">{summary.averageAccuracy}%</span>
                <span class="accuracy-lbl">Rata-Rata Akurasi</span>
            </div>
            
            <div class="vertical-divider"></div>
            
            <div class="metrics-grid-stats">
                <div class="metric-mini-card">
                    <span class="mini-lbl">Total Diperiksa</span>
                    <span class="mini-val">{summary.totalItemsAudited} <span class="unit">Items</span></span>
                </div>
                <div class="metric-mini-card match">
                    <span class="mini-lbl">✓ Match</span>
                    <span class="mini-val">{summary.totalMatch}</span>
                </div>
                <div class="metric-mini-card mismatch">
                    <span class="mini-lbl">⚠ Mismatch</span>
                    <span class="mini-val">{summary.totalMismatch}</span>
                </div>
                <div class="metric-mini-card missing">
                    <span class="mini-lbl">✕ Missing</span>
                    <span class="mini-val">{summary.totalMissing}</span>
                </div>
            </div>
        </div>

        <div class="queue-stack">
            <div class="stack-meta-title">Arsip Laporan Selesai ({count})</div>
            
            {#each audits as audit}
                <div class="history-card" onclick={() => goToDetail(audit.id)}>
                    <div class="card-timeline-node">
                        <div class="node-indicator"></div>
                        <div class="node-line"></div>
                    </div>

                    <div class="card-main-body">
                        <div class="body-header-row">
                            <div class="location-breadcrumbs">
                                <span class="cab-name">{audit.cabinetName}</span>
                                <span class="crumb-separator">/</span>
                                <span class="sec-name">{audit.sectionName}</span>
                                <span class="type-pill">{audit.sectionType}</span>
                            </div>
                            <span class="status-badge">Selesai</span>
                        </div>

                        <div class="timestamp-meta-row">
                            <div class="meta-unit">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                <span>Diperiksa pada: <strong>{formatDateTime(audit.completedAt || audit.createdAt)}</strong></span>
                            </div>
                        </div>

                        <div class="inline-result-counters">
                            <div class="cnt-box"><span class="v">{audit.totalCards}</span><span class="l">Total Items</span></div>
                            <div class="cnt-box match"><span class="v">✓ {audit.totalMatch}</span><span class="l">Match</span></div>
                            <div class="cnt-box mismatch"><span class="v">⚠ {audit.totalMismatch}</span><span class="l">Mismatch</span></div>
                            <div class="cnt-box missing"><span class="v">✕ {audit.totalMissing}</span><span class="l">Missing</span></div>
                            <div class="cnt-box new-entry"><span class="v">+ {audit.totalNewEntry}</span><span class="l">New Entry</span></div>
                        </div>

                        {#if audit.note}
                            <div class="comment-block-box">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                <p class="note-text">{audit.note}</p>
                            </div>
                        {/if}

                        <div class="card-action-footer">
                            <span class="action-trigger">Lihat Dokumen Hasil Lengkap</span>
                            <svg class="arrow-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    :global(body) {
        background-color: #0d0e12;
    }

    .page-container {
        max-width: 850px;
        margin: 0 auto;
        padding: 3rem 1.5rem;
        font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        color: #f3f4f6;
    }

    /* Executive Header Section Design */
    .page-header {
        margin-bottom: 2.5rem;
    }

    .title {
        font-size: 2rem;
        font-weight: 800;
        color: #ffffff;
        letter-spacing: -0.75px;
        margin-bottom: 0.5rem;
    }

    .subtitle {
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.4);
        line-height: 1.5;
        max-width: 600px;
    }

    /* Analytics Glass Summary Banner */
    .summary-metric-banner {
        display: flex;
        align-items: center;
        background: rgba(255, 255, 255, 0.01);
        border: 1px solid rgba(255, 255, 255, 0.04);
        border-radius: 20px;
        padding: 1.5rem;
        margin-bottom: 3rem;
        gap: 2rem;
    }

    .accuracy-radial-block {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-width: 140px;
    }

    .accuracy-pct {
        font-size: 2.5rem;
        font-weight: 800;
        color: #ffffff;
        letter-spacing: -1.5px;
        line-height: 1;
    }

    .accuracy-lbl {
        font-size: 0.65rem;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.35);
        text-transform: uppercase;
        margin-top: 0.5rem;
        letter-spacing: 0.5px;
    }

    .vertical-divider {
        width: 1px;
        height: 60px;
        background: rgba(255, 255, 255, 0.08);
    }

    .metrics-grid-stats {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1.5rem;
        flex: 1;
    }

    .metric-mini-card {
        display: flex;
        flex-direction: column-reverse;
        gap: 0.25rem;
    }

    .mini-lbl {
        font-size: 0.65rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.35);
        text-transform: uppercase;
    }

    .mini-val {
        font-size: 1.25rem;
        font-weight: 700;
        color: #ffffff;
    }

    .mini-val .unit { font-size: 0.75rem; font-weight: 400; color: rgba(255,255,255,0.4); }
    .metric-mini-card.match .mini-val { color: #10b981; }
    .metric-mini-card.mismatch .mini-val { color: #f59e0b; }
    .metric-mini-card.missing .mini-val { color: #ef4444; }

    /* Linear History Flow Cards Layout */
    .queue-stack {
        display: flex;
        flex-direction: column;
    }

    .stack-meta-title {
        font-size: 0.8rem;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.3);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 1.25rem;
    }

    .history-card {
        display: flex;
        gap: 1.25rem;
        cursor: pointer;
    }

    .card-timeline-node {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 16px;
        flex-shrink: 0;
    }

    .node-indicator {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #10b981;
        box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.15);
        margin-top: 1.5rem;
        z-index: 2;
    }

    .node-line {
        width: 1px;
        flex: 1;
        background: rgba(255, 255, 255, 0.04);
    }
    .history-card:last-child .node-line { display: none; }

    .card-main-body {
        flex: 1;
        padding: 1.25rem 1.5rem;
        background: rgba(255, 255, 255, 0.01);
        border: 1px solid rgba(255, 255, 255, 0.04);
        border-radius: 16px;
        margin-bottom: 1.25rem;
        transition: all 0.2s ease;
    }

    .history-card:hover .card-main-body {
        background: rgba(255, 255, 255, 0.02);
        border-color: rgba(255, 255, 255, 0.08);
    }

    .body-header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
        gap: 1rem;
    }

    .location-breadcrumbs {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.4rem;
        font-size: 0.9rem;
    }

    .cab-name { color: rgba(255, 255, 255, 0.4); }
    .sec-name { color: #ffffff; font-weight: 600; }
    .crumb-separator { color: rgba(255, 255, 255, 0.1); font-size: 0.75rem; }

    .type-pill {
        font-size: 0.65rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.4);
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.05);
        padding: 0.15rem 0.45rem;
        border-radius: 5px;
        margin-left: 0.2rem;
    }

    .status-badge {
        font-size: 0.65rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        background: rgba(16, 185, 129, 0.1);
        color: #10b981;
        padding: 0.25rem 0.6rem;
        border-radius: 6px;
    }

    .timestamp-meta-row {
        margin-bottom: 1.25rem;
    }

    .meta-unit {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.35);
    }
    .meta-unit strong { color: rgba(255, 255, 255, 0.6); font-weight: 500; }

    /* Inline Audit Results Badges Grid */
    .inline-result-counters {
        display: flex;
        flex-wrap: wrap;
        gap: 1.25rem;
        background: rgba(0, 0, 0, 0.12);
        padding: 0.75rem 1.25rem;
        border-radius: 12px;
        margin-bottom: 1.25rem;
    }

    .cnt-box { display: flex; flex-direction: column; }
    .cnt-box .v { font-size: 0.95rem; font-weight: 700; color: #ffffff; }
    .cnt-box .l { font-size: 0.65rem; color: rgba(255, 255, 255, 0.35); text-transform: uppercase; margin-top: 0.1rem; }
    
    .cnt-box.match .v { color: #10b981; }
    .cnt-box.mismatch .v { color: #f59e0b; }
    .cnt-box.missing .v { color: #ef4444; }
    .cnt-box.new-entry .v { color: #3b82f6; }

    /* Professional Comment Block Style */
    .comment-block-box {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        background: rgba(255, 255, 255, 0.02);
        border-radius: 8px;
        color: rgba(255, 255, 255, 0.45);
        font-size: 0.8rem;
        margin-bottom: 1.25rem;
        line-height: 1.4;
    }

    /* Card Interactive Trigger Footer Elements */
    .card-action-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-top: 1px solid rgba(255, 255, 255, 0.04);
        padding-top: 0.75rem;
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.3);
        transition: color 0.15s ease;
    }

    .arrow-icon { color: rgba(255, 255, 255, 0.15); transition: transform 0.2s ease, color 0.2s; }
    .history-card:hover .card-action-footer { color: #ffffff; }
    .history-card:hover .arrow-icon { transform: translateX(3px); color: #ffffff; }

    /* Clean Empty State Display Blueprint */
    .empty-state-frame {
        text-align: center;
        padding: 5rem 2rem;
        background: rgba(255, 255, 255, 0.01);
        border: 1px dashed rgba(255, 255, 255, 0.06);
        border-radius: 24px;
    }

    .empty-icon-box {
        width: 56px;
        height: 56px;
        background: rgba(255, 255, 255, 0.02);
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1.25rem;
        color: rgba(255, 255, 255, 0.15);
    }

    .empty-state-frame h3 { font-size: 1.05rem; font-weight: 700; margin-bottom: 0.35rem; }
    .empty-state-frame p { font-size: 0.8rem; color: rgba(255, 255, 255, 0.35); }

    /* Screen Breakpoint Adaptivity Control Rules */
    @media (max-width: 768px) {
        .summary-metric-banner { flex-direction: column; align-items: flex-start; gap: 1.25rem; }
        .vertical-divider { display: none; }
        .metrics-grid-stats { grid-template-columns: repeat(2, 1fr); width: 100%; gap: 1rem; }
    }

    @media (max-width: 480px) {
        .metrics-grid-stats { grid-template-columns: 1fr; }
        .body-header-row { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
        .status-badge { align-self: flex-start; }
    }
</style>