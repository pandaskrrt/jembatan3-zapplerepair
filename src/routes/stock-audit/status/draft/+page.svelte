<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';

    let { data } = $props();
    let audits = data?.audits || [];
    let count = data?.count || 0;

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

    function goToAudit(auditId: string) {
        goto(`/stock-audit/${auditId}`);
    }

    function continueAudit(auditId: string) {
        goto(`/stock-audit/new/process/${auditId}`);
    }
</script>

<svelte:head>
    <title>Draft Audit</title>
</svelte:head>

<div class="draft-page">
    <div class="header">
        <h1 class="title">Draft Audit</h1>
        <p class="subtitle">Audit yang belum selesai dan perlu dilanjutkan</p>
    </div>

    {#if audits.length === 0}
        <div class="empty-state">
            <div class="empty-icon">📝</div>
            <h3>Tidak ada draft audit</h3>
            <p>Belum ada audit yang disimpan sebagai draft</p>
            <button class="btn-primary" onclick={() => goto('/stock-audit/new')}>
                Mulai Audit Baru
            </button>
        </div>
    {:else}
        <div class="draft-stats">
            <div class="stat-card">
                <span class="stat-value">{count}</span>
                <span class="stat-label">Draft Audit</span>
            </div>
        </div>

        <div class="audit-list">
            {#each audits as audit}
                <div class="audit-card">
                    <div class="audit-info">
                        <div class="audit-location">
                            <span class="cabinet">📦 {audit.cabinetName}</span>
                            <span class="separator">/</span>
                            <span class="section">📁 {audit.sectionName}</span>
                            <span class="type">({audit.sectionType})</span>
                        </div>
                        <div class="audit-meta">
                            <span class="date">🕐 Dibuat: {formatDate(audit.createdAt)}</span>
                            <span class="cards">🃏 {audit.totalCards} card</span>
                        </div>
                    </div>
                    <div class="audit-actions">
                        <button class="btn-continue" onclick={() => continueAudit(audit.id)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M5 12h14M12 5l7 7-7 7"/>
                            </svg>
                            Lanjutkan
                        </button>
                        <button class="btn-detail" onclick={() => goToAudit(audit.id)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="12" y1="8" x2="12" y2="12"/>
                                <line x1="12" y1="16" x2="12.01" y2="16"/>
                            </svg>
                            Detail
                        </button>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .draft-page {
        max-width: 800px;
        margin: 0 auto;
    }

    .header {
        margin-bottom: 1.5rem;
    }

    .title {
        font-size: 1.5rem;
        font-weight: 600;
        color: #fff;
        margin-bottom: 0.25rem;
    }

    .subtitle {
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.5);
    }

    .draft-stats {
        margin-bottom: 1.5rem;
    }

    .stat-card {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.75rem 1rem;
        background: rgba(0, 255, 157, 0.1);
        border: 1px solid rgba(0, 255, 157, 0.2);
        border-radius: 12px;
        width: fit-content;
    }

    .stat-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: #00ff9d;
    }

    .stat-label {
        font-size: 0.7rem;
        color: rgba(255, 255, 255, 0.5);
    }

    .empty-state {
        text-align: center;
        padding: 3rem;
        background: rgba(255, 255, 255, 0.02);
        border-radius: 16px;
    }

    .empty-icon {
        font-size: 3rem;
        margin-bottom: 0.5rem;
        opacity: 0.5;
    }

    .empty-state h3 {
        font-size: 1rem;
        font-weight: 500;
        margin-bottom: 0.25rem;
    }

    .empty-state p {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.4);
        margin-bottom: 1rem;
    }

    .btn-primary {
        padding: 0.6rem 1.2rem;
        background: linear-gradient(135deg, #00ff9d, #00ccff);
        border: none;
        border-radius: 40px;
        color: #000;
        font-weight: 600;
        font-size: 0.8rem;
        cursor: pointer;
    }

    .audit-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .audit-card {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        transition: all 0.2s;
        flex-wrap: wrap;
        gap: 0.75rem;
    }

    .audit-card:hover {
        background: rgba(255, 255, 255, 0.04);
    }

    .audit-location {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.85rem;
        flex-wrap: wrap;
        margin-bottom: 0.35rem;
    }

    .cabinet {
        color: rgba(255, 255, 255, 0.5);
    }

    .separator {
        color: rgba(255, 255, 255, 0.2);
    }

    .section {
        color: #00ff9d;
        font-weight: 500;
    }

    .type {
        font-size: 0.65rem;
        color: rgba(255, 255, 255, 0.4);
    }

    .audit-meta {
        display: flex;
        gap: 1rem;
        font-size: 0.65rem;
        color: rgba(255, 255, 255, 0.4);
    }

    .audit-actions {
        display: flex;
        gap: 0.5rem;
    }

    .btn-continue, .btn-detail {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.4rem 0.8rem;
        border-radius: 8px;
        font-size: 0.7rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-continue {
        background: rgba(0, 255, 157, 0.1);
        border: 1px solid rgba(0, 255, 157, 0.3);
        color: #00ff9d;
    }

    .btn-continue:hover {
        background: rgba(0, 255, 157, 0.2);
    }

    .btn-detail {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.7);
    }

    .btn-detail:hover {
        background: rgba(255, 255, 255, 0.1);
    }

    @media (max-width: 600px) {
        .audit-card {
            flex-direction: column;
            align-items: flex-start;
        }

        .audit-actions {
            align-self: flex-end;
        }
    }
</style>