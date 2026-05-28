<script lang="ts">
    import { goto } from '$app/navigation';
    import type { PageData } from './$types';

    let { data } = $props();
    let audits = data?.audits || [];
    let count = data?.count || 0;
    let totalItemsToAudit = data?.totalItemsToAudit || 0;

    function formatDate(date: string | Date) {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function goToAudit(auditId: string | number) {
        goto(`/stock-audit/${auditId}`);
    }

    function continueAudit(auditId: string | number) {
        goto(`/stock-audit/new/process/${auditId}`);
    }
</script>

<svelte:head>
    <title>Draft Audit - Stock Management System</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
</svelte:head>

<div class="page-container">
    <header class="page-header">
        <div class="header-content">
            <h1 class="title">Draft Berkas Audit</h1>
            <p class="subtitle">Daftar inspeksi stok berkala yang belum selesai dan memerlukan tindakan konfirmasi lanjutan</p>
        </div>
        {#if audits.length > 0}
            <button class="btn-new-audit" onclick={() => goto('/stock-audit/new')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M12 5v14M5 12h14"/>
                </svg>
                <span>Mulai Audit Baru</span>
            </button>
        {/if}
    </header>

    {#if audits.length === 0}
        <div class="empty-state-frame">
            <div class="empty-icon-box">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                </svg>
            </div>
            <h3>Tidak Ada Draf Tersimpan</h3>
            <p>Seluruh antrean pemeriksaan berkala Anda telah diselesaikan atau belum diinisiasi.</p>
            <button class="btn-primary" onclick={() => goto('/stock-audit/new')}>
                Inisiasi Inspeksi Baru
            </button>
        </div>
    {:else}
        <div class="stats-summary-grid">
            <div class="summary-card gold-accent">
                <div class="card-indicator"></div>
                <div class="card-meta">
                    <span class="lbl">Total Draf Aktif</span>
                    <span class="val">{count}</span>
                </div>
            </div>
            <div class="summary-card cyan-accent">
                <div class="card-indicator"></div>
                <div class="card-meta">
                    <span class="lbl">Item Tertunda Validasi</span>
                    <span class="val">{totalItemsToAudit}</span>
                </div>
            </div>
        </div>

        <div class="queue-stack">
            {#each audits as audit}
                <div class="queue-row-card">
                    <div class="queue-body-left">
                        <div class="location-breadcrumbs">
                            <div class="breadcrumb-item text-muted">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2" ry="2"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></svg>
                                <span>{audit.cabinetName}</span>
                            </div>
                            <span class="crumb-separator">/</span>
                            <div class="breadcrumb-item text-highlight">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                                <span>{audit.sectionName}</span>
                            </div>
                            <span class="section-type-pill">{audit.sectionType}</span>
                        </div>

                        <div class="metadata-row">
                            <div class="meta-unit">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                <span>Diperbarui: {formatDate(audit.updatedAt || audit.createdAt)}</span>
                            </div>
                            <div class="meta-unit">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                                <span>{audit.totalCards} Registered Items</span>
                            </div>
                        </div>
                    </div>

                    <div class="queue-actions-wrapper">
                        <button class="btn-secondary-action" onclick={() => goToAudit(audit.id)}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                            </svg>
                            <span>Detail</span>
                        </button>
                        <button class="btn-primary-action" onclick={() => continueAudit(audit.id)}>
                            <span>Lanjutkan</span>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                <path d="M5 12h14M12 5l7 7-7 7"/>
                            </svg>
                        </button>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    /* Global Core Page Reset Integration */
    :global(body) {
        background-color: #0d0e12;
    }

    .page-container {
        max-width: 900px;
        margin: 0 auto;
        padding: 3rem 1.5rem;
        font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        color: #f3f4f6;
    }

    /* Professional Executive Header Frame */
    .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 2.5rem;
        gap: 1.5rem;
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
        max-width: 560px;
    }

    .btn-new-audit {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.65rem 1.15rem;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        color: #ffffff;
        font-weight: 600;
        font-size: 0.8rem;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .btn-new-audit:hover {
        background: #ffffff;
        color: #0d0e12;
        border-color: #ffffff;
    }

    /* Bento Analytics Summary Cards Layout */
    .stats-summary-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
        margin-bottom: 2rem;
    }

    .summary-card {
        position: relative;
        background: rgba(255, 255, 255, 0.01);
        border: 1px solid rgba(255, 255, 255, 0.04);
        border-radius: 16px;
        padding: 1.25rem 1.5rem;
        overflow: hidden;
    }

    .card-indicator {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
    }

    .gold-accent .card-indicator { background: #f59e0b; }
    .cyan-accent .card-indicator { background: #06b6d4; }

    .card-meta {
        display: flex;
        flex-direction: column-reverse;
        gap: 0.35rem;
    }

    .lbl {
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        color: rgba(255, 255, 255, 0.35);
        letter-spacing: 0.5px;
    }

    .val {
        font-size: 1.75rem;
        font-weight: 800;
        color: #ffffff;
        line-height: 1;
    }

    /* Structural Data Queue List */
    .queue-stack {
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
    }

    .queue-row-card {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.25rem;
        background: rgba(255, 255, 255, 0.01);
        border: 1px solid rgba(255, 255, 255, 0.04);
        border-radius: 16px;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        gap: 1.5rem;
    }

    .queue-row-card:hover {
        background: rgba(255, 255, 255, 0.02);
        border-color: rgba(255, 255, 255, 0.08);
        transform: translateY(-1px);
    }

    .queue-body-left {
        display: flex;
        flex-direction: column;
        gap: 0.65rem;
        flex: 1;
    }

    /* Core Location Breadcrumbs Styling */
    .location-breadcrumbs {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .breadcrumb-item {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.85rem;
        font-weight: 500;
    }

    .text-muted { color: rgba(255, 255, 255, 0.4); }
    .text-highlight { color: #ffffff; font-weight: 600; }
    .crumb-separator { color: rgba(255, 255, 255, 0.15); font-size: 0.75rem; }

    .section-type-pill {
        font-size: 0.65rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.4);
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.05);
        padding: 0.15rem 0.5rem;
        border-radius: 6px;
        margin-left: 0.25rem;
    }

    /* Horizontal Metadata Unit */
    .metadata-row {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 1.25rem;
    }

    .meta-unit {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.35);
    }

    /* Professional UI Control Button Triggers */
    .queue-actions-wrapper {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .btn-primary-action, .btn-secondary-action {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.55rem 1rem;
        font-size: 0.75rem;
        font-weight: 600;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.15s ease;
    }

    .btn-primary-action {
        background: #ffffff;
        border: 1px solid #ffffff;
        color: #0d0e12;
        box-shadow: 0 4px 12px rgba(255, 255, 255, 0.05);
    }

    .btn-primary-action:hover {
        background: transparent;
        color: #ffffff;
    }

    .btn-secondary-action {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.06);
        color: rgba(255, 255, 255, 0.7);
    }

    .btn-secondary-action:hover {
        background: rgba(255, 255, 255, 0.06);
        color: #ffffff;
        border-color: rgba(255, 255, 255, 0.15);
    }

    /* System Clean Empty States Design */
    .empty-state-frame {
        text-align: center;
        padding: 5rem 2rem;
        background: rgba(255, 255, 255, 0.01);
        border: 1px dashed rgba(255, 255, 255, 0.08);
        border-radius: 24px;
        margin-top: 1rem;
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
        color: rgba(255, 255, 255, 0.2);
    }

    .empty-state-frame h3 {
        font-size: 1.1rem;
        font-weight: 700;
        color: #ffffff;
        margin-bottom: 0.35rem;
    }

    .empty-state-frame p {
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.35);
        margin-bottom: 1.5rem;
    }

    .btn-primary {
        padding: 0.65rem 1.5rem;
        background: #ffffff;
        border: 1px solid #ffffff;
        color: #0d0e12;
        font-weight: 700;
        font-size: 0.8rem;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-primary:hover {
        background: transparent;
        color: #ffffff;
    }

    /* Screen Adaptive Media Controls */
    @media (max-width: 768px) {
        .page-header { flex-direction: column; align-items: flex-start; gap: 1.25rem; }
        .btn-new-audit { width: 100%; justify-content: center; }
        .queue-row-card { flex-direction: column; align-items: flex-start; gap: 1.25rem; }
        .queue-actions-wrapper { width: 100%; justify-content: flex-end; border-top: 1px solid rgba(255, 255, 255, 0.04); padding-top: 1rem; }
    }

    @media (max-width: 480px) {
        .stats-summary-grid { grid-template-columns: 1fr; }
        .queue-actions-wrapper { flex-direction: column-reverse; }
        .queue-actions-wrapper button { width: 100%; justify-content: center; }
    }
</style>