<script lang="ts">
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';

  let { data } = $props();
  let section = data?.section;
  let items = data?.items || [];
  let audits = data?.audits || [];

  let activeTab = $state<'cards' | 'history'>('cards');
  let searchQuery = $state('');

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

  function formatPrice(amount: number, currency: string = 'IDR') {
    if (currency === 'IDR') {
      return `Rp ${amount.toLocaleString('id-ID')}`;
    }
    return `${currency} ${amount.toLocaleString()}`;
  }

  function getStatusBadge(status: string) {
    if (status === 'DRAFT') {
      return { class: 'draft', text: 'Draft' };
    }
    return { class: 'completed', text: 'Selesai' };
  }

  const filteredItems = $derived(
    items.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subCategory.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );
</script>

<svelte:head>
  <title>{section?.name} - Detail Section</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
</svelte:head>

<div class="page">
  <button class="back-btn" onclick={() => goto('/stock-audit/riwayat')}>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <path d="M19 12H5M12 5l-7 7 7 7"/>
    </svg>
    <span>Kembali ke Riwayat</span>
  </button>

  <header class="header">
    <div class="header-left">
      <h1 class="title">{section?.name}</h1>
      <div class="subtitle-breadcrumbs">
        <span>{section?.cabinetName}</span>
        <span class="divider">/</span>
        <span class="type-pill">{section?.type}</span>
        <span class="divider">/</span>
        <span class="count-badge">{section?.totalCards} Items</span>
      </div>
    </div>
    <div class="header-right">
      <button class="btn-audit-action" onclick={() => goto(`/stock-audit/create?section=${section?.id}`)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        <span>Audit Section Ini</span>
      </button>
    </div>
  </header>

  <div class="stats-grid">
    <div class="stat-card total">
      <div class="card-indicator"></div>
      <span class="stat-label">Total Audit</span>
      <span class="stat-value">{section?.totalAudits || 0}</span>
    </div>
    <div class="stat-card match">
      <div class="card-indicator"></div>
      <span class="stat-label">Match</span>
      <span class="stat-value">{section?.totalMatch || 0}</span>
    </div>
    <div class="stat-card mismatch">
      <div class="card-indicator"></div>
      <span class="stat-label">Mismatch</span>
      <span class="stat-value">{section?.totalMismatch || 0}</span>
    </div>
    <div class="stat-card missing">
      <div class="card-indicator"></div>
      <span class="stat-label">Missing</span>
      <span class="stat-value">{section?.totalMissing || 0}</span>
    </div>
    <div class="stat-card newentry">
      <div class="card-indicator"></div>
      <span class="stat-label">New Entry</span>
      <span class="stat-value">{section?.totalNewEntry || 0}</span>
    </div>
  </div>

  <div class="score-banner-card">
    <div class="score-left-content">
      <div class="radial-placeholder-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21.21 15.89A10 10 0 1 1 8 2.83M22 12A10 10 0 0 0 12 2v10z"/>
        </svg>
      </div>
      <div class="score-meta-text">
        <span class="score-title-lbl">Akurasi Validasi Data</span>
        <p class="score-description">Dihitung secara akumulatif berdasarkan total frekuensi {section?.totalAudits || 0} kali audit.</p>
      </div>
    </div>
    
    <div class="score-right-metrics">
      <div class="accuracy-percentage-block">
        <span class="pct-num">{section?.accuracyRate || 0}%</span>
      </div>
      <div class="vertical-divider"></div>
      <div class="last-audit-block">
        {#if section?.lastAudit}
          <span class="lbl-top">Pemeriksaan Terakhir</span>
          <span class="val-date">{formatDate(section.lastAudit)}</span>
          <span class="val-auditor">PJ: {section.lastAuditor || 'Sistem'}</span>
        {:else}
          <span class="no-audit-placeholder">Belum Ada Rekaman Audit</span>
        {/if}
      </div>
    </div>
  </div>

  <div class="segmented-tabs-container">
    <button class="segment-btn" class:active={activeTab === 'cards'} onclick={() => activeTab = 'cards'}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
      </svg>
      <span>Daftar Item ({section?.totalCards || 0})</span>
    </button>
    <button class="segment-btn" class:active={activeTab === 'history'} onclick={() => activeTab = 'history'}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
      <span>Log Riwayat Audit ({audits.length})</span>
    </button>
  </div>

  {#if activeTab === 'cards'}
    <div class="cards-tab-view">
      <div class="search-box-wrapper">
        <svg class="search-lens-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Cari item berdasarkan nama, SKU, atau rumpun kategori..."
          class="search-transparent-input"
        />
        {#if searchQuery}
          <button class="search-clear-btn" onclick={() => searchQuery = ''}>✕</button>
        {/if}
      </div>

      <div class="inventory-grid">
        {#each filteredItems as item}
          <div class="inventory-card-item">
            <div class="item-visual-frame">
              {#if item.imageUrl}
                <img src={item.imageUrl} alt={item.name} class="item-img" />
              {:else}
                <div class="fallback-icon-box">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  </svg>
                </div>
              {/if}
            </div>
       
            <div class="item-details-metadata">
              <h3 class="item-main-title">{item.name}</h3>
              
              <div class="item-tag-row">
                <span class="tag-badge tier-primary">{item.category}</span>
                <span class="tag-badge tier-secondary">{item.subCategory}</span>
              </div>
              
              <div class="item-valuation-row">
                {#if item.price}
                  <span class="valuation-price">
                    {formatPrice(item.price.amount, 'IDR')}
                    {#if item.price.priceNote}
                      <span class="valuation-note">({item.price.priceNote})</span>
                    {/if}
                  </span>
                {:else}
                  <span class="valuation-empty">No Registered Pricing</span>
                {/if}
              </div>
              
              <div class="item-stock-footer">
                <div class="footer-meta-indicator">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                  <span>Stok: <strong>{item.stock}</strong></span>
                </div>
                <div class="footer-meta-indicator">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <span class="truncate-loc">{item.location || 'Unmapped'}</span>
                </div>
                {#if item.serialNumber}
                  <div class="footer-meta-indicator full-line-meta">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>
                    <span>SN: {item.serialNumber}</span>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        {:else}
          <div class="empty-state-card">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <p>Tidak ada entitas item yang cocok dengan pencarian Anda.</p>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  {#if activeTab === 'history'}
    <div class="history-tab-view">
      <div class="audit-linear-stack">
        {#each audits as audit}
          <div class="timeline-row-card" onclick={() => goto(`/stock-audit/laporan/${audit.id}`)}>
            <div class="card-timeline-left">
              <div class="status-marker-node {audit.status.toLowerCase()}"></div>
              <div class="timeline-v-line"></div>
            </div>

            <div class="card-timeline-body">
              <div class="timeline-body-header">
                <div class="header-timestamp-group">
                  <span class="timestamp-date">{formatDateTime(audit.createdAt)}</span>
                  <span class="timestamp-author">Auditor: {audit.auditorName || 'Sistem'}</span>
                </div>
                <span class="status-badge-pill {audit.status.toLowerCase()}">
                  {getStatusBadge(audit.status).text}
                </span>
              </div>

              <div class="timeline-metrics-summary">
                <div class="metric-block"><span class="val">{audit.totalCards || 0}</span><span class="lbl">Total Items</span></div>
                <div class="metric-block match"><span class="val">✓ {audit.totalMatch || 0}</span><span class="lbl">Match</span></div>
                <div class="metric-block mismatch"><span class="val">⚠ {audit.totalMismatch || 0}</span><span class="lbl">Mismatch</span></div>
                <div class="metric-block missing"><span class="val">✕ {audit.totalMissing || 0}</span><span class="lbl">Missing</span></div>
                <div class="metric-block new"><span class="val">+ {audit.totalNewEntry || 0}</span><span class="lbl">New Entry</span></div>
              </div>

              {#if audit.note}
                <div class="timeline-comment-box">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  <p class="comment-text">{audit.note}</p>
                </div>
              {/if}

              <div class="timeline-body-footer">
                {#if audit.status === 'COMPLETED' && audit.completedAt}
                  <span>Closed and Verified at: {formatDateTime(audit.completedAt)}</span>
                {:else}
                  <span class="draft-notice">Dokumen masih dalam bentuk draf berkala</span>
                {/if}
                <svg class="chevron-arrow-right" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </div>
          </div>
        {:else}
          <div class="empty-state-card">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <p>Belum ada aktivitas log audit terdaftar pada segmen ini.</p>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  :global(body) {
    background-color: #0d0e12;
  }

  .page {
    max-width: 1140px;
    margin: 0 auto;
    padding: 2.5rem 1.5rem;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    color: #f3f4f6;
  }

  /* Structural Back Button */
  .back-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.4);
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    margin-bottom: 2rem;
    transition: all 0.2s ease;
  }

  .back-btn:hover {
    color: #ffffff;
    transform: translateX(-4px);
  }

  /* Refined Header Component */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 2.5rem;
    gap: 1.5rem;
  }

  .title {
    font-size: 2.2rem;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: -1px;
    margin-bottom: 0.5rem;
  }

  .subtitle-breadcrumbs {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.4);
  }

  .subtitle-breadcrumbs .divider {
    color: rgba(255, 255, 255, 0.15);
  }

  .type-pill {
    background: rgba(255, 255, 255, 0.06);
    padding: 0.15rem 0.6rem;
    border-radius: 6px;
    color: rgba(255, 255, 255, 0.7);
    font-weight: 500;
  }

  .count-badge {
    color: rgba(255, 255, 255, 0.5);
  }

  /* Action Button Call-to-Action */
  .btn-audit-action {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.7rem 1.25rem;
    background: #ffffff;
    border: 1px solid #ffffff;
    border-radius: 12px;
    color: #0d0e12;
    font-weight: 700;
    font-size: 0.85rem;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(255, 255, 255, 0.1);
    transition: all 0.2s ease;
  }

  .btn-audit-action:hover {
    background: transparent;
    color: #ffffff;
    box-shadow: none;
  }

  /* Bento Layout Core Grid */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 1rem;
    margin-bottom: 1.25rem;
  }

  .stat-card {
    position: relative;
    padding: 1.25rem;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    display: flex;
    flex-direction: column-reverse;
    justify-content: space-between;
    gap: 0.5rem;
    overflow: hidden;
  }

  .card-indicator {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: rgba(255, 255, 255, 0.1);
  }

  .stat-value {
    font-size: 1.8rem;
    font-weight: 800;
    color: #ffffff;
    line-height: 1;
  }

  .stat-label {
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.4);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* Context Indicators */
  .stat-card.match .card-indicator { background: #10b981; }
  .stat-card.match .stat-value { color: #10b981; }
  
  .stat-card.mismatch .card-indicator { background: #f59e0b; }
  .stat-card.mismatch .stat-value { color: #f59e0b; }
  
  .stat-card.missing .card-indicator { background: #ef4444; }
  .stat-card.missing .stat-value { color: #ef4444; }
  
  .stat-card.newentry .card-indicator { background: #3b82f6; }
  .stat-card.newentry .stat-value { color: #3b82f6; }

  /* Premium Score Banner Header */
  .score-banner-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 1.75rem;
    background: rgba(255, 255, 255, 0.01);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 20px;
    margin-bottom: 2.5rem;
    gap: 2rem;
  }

  .score-left-content {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    flex: 1;
  }

  .radial-placeholder-icon {
    width: 44px;
    height: 44px;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.6);
  }

  .score-title-lbl {
    font-size: 0.95rem;
    font-weight: 700;
    color: #ffffff;
    display: block;
  }

  .score-description {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.4);
    margin-top: 0.15rem;
  }

  .score-right-metrics {
    display: flex;
    align-items: center;
    gap: 1.75rem;
  }

  .pct-num {
    font-size: 2.2rem;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: -1px;
  }

  .vertical-divider {
    width: 1px;
    height: 40px;
    background: rgba(255, 255, 255, 0.1);
  }

  .last-audit-block {
    display: flex;
    flex-direction: column;
    min-width: 140px;
  }

  .last-audit-block .lbl-top {
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.4);
    font-weight: 600;
    text-transform: uppercase;
  }

  .last-audit-block .val-date {
    font-size: 0.9rem;
    font-weight: 700;
    color: #ffffff;
    margin: 0.15rem 0;
  }

  .last-audit-block .val-auditor {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.35);
  }

  .no-audit-placeholder {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.3);
    font-style: italic;
  }

  /* Segmented Component View Controls */
  .segmented-tabs-container {
    display: flex;
    background: rgba(255, 255, 255, 0.03);
    padding: 0.35rem;
    border-radius: 14px;
    gap: 0.25rem;
    margin-bottom: 2rem;
    width: fit-content;
  }

  .segment-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.65rem 1.25rem;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.4);
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    border-radius: 10px;
    transition: all 0.2s ease;
  }

  .segment-btn:hover { color: #ffffff; }
  .segment-btn.active {
    background: rgba(255, 255, 255, 0.08);
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  /* Custom Professional Search Frame */
  .search-box-wrapper {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 14px;
    padding: 0.75rem 1.25rem;
    margin-bottom: 1.5rem;
  }

  .search-lens-icon { color: rgba(255, 255, 255, 0.3); }
  .search-transparent-input {
    flex: 1;
    background: none;
    border: none;
    color: #ffffff;
    font-size: 0.9rem;
    outline: none;
    font-family: inherit;
  }
  .search-transparent-input::placeholder { color: rgba(255, 255, 255, 0.25); }
  .search-clear-btn { background: none; border: none; color: rgba(255, 255, 255, 0.4); cursor: pointer; }

  /* Premium Responsive Data Grid */
  .inventory-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 1.25rem;
  }

  .inventory-card-item {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.01);
    border: 1px solid rgba(255, 255, 255, 0.04);
    border-radius: 16px;
    transition: border-color 0.2s, background-color 0.2s;
  }

  .inventory-card-item:hover {
    border-color: rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.02);
  }

  .item-visual-frame {
    width: 76px;
    height: 76px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .item-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .fallback-icon-box { color: rgba(255, 255, 255, 0.2); }
  .item-details-metadata { flex: 1; display: flex; flex-direction: column; }
  .item-main-title { font-size: 0.95rem; font-weight: 700; color: #ffffff; margin-bottom: 0.35rem; }
  .item-tag-row { display: flex; gap: 0.35rem; margin-bottom: 0.5rem; }

  .tag-badge {
    font-size: 0.65rem;
    font-weight: 600;
    padding: 0.15rem 0.45rem;
    border-radius: 6px;
  }
  .tag-badge.tier-primary { background: rgba(255, 255, 255, 0.08); color: rgba(255, 255, 255, 0.8); }
  .tag-badge.tier-secondary { background: rgba(255, 255, 255, 0.04); color: rgba(255, 255, 255, 0.5); border: 1px solid rgba(255, 255, 255, 0.05); }

  .item-valuation-row { margin-bottom: 0.65rem; }
  .valuation-price { font-size: 0.85rem; font-weight: 700; color: #ffffff; }
  .valuation-note { font-size: 0.7rem; font-weight: 400; color: rgba(255, 255, 255, 0.4); margin-left: 0.25rem; }
  .valuation-empty { font-size: 0.75rem; color: rgba(255, 255, 255, 0.25); font-style: italic; }

  .item-stock-footer {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 0.85rem;
    padding-top: 0.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.04);
  }

  .footer-meta-indicator {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.4);
  }
  .footer-meta-indicator strong { color: #ffffff; font-weight: 600; }
  .truncate-loc { max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .full-line-meta { width: 100%; border-top: 1px dashed rgba(255,255,255,0.04); padding-top: 0.25rem; margin-top: 0.15rem; }

  /* Structured Profile Timeline Row */
  .audit-linear-stack { display: flex; flex-direction: column; }
  
  .timeline-row-card {
    display: flex;
    gap: 1.25rem;
    cursor: pointer;
  }

  .card-timeline-left {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 16px;
    flex-shrink: 0;
  }

  .status-marker-node {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-top: 1.25rem;
    background: rgba(255, 255, 255, 0.2);
    z-index: 2;
  }
  .status-marker-node.completed { background: #10b981; box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.15); }
  .status-marker-node.draft { background: #f59e0b; box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.15); }

  .timeline-v-line {
    width: 1px;
    flex: 1;
    background: rgba(255, 255, 255, 0.05);
  }
  .timeline-row-card:last-child .timeline-v-line { display: none; }

  .card-timeline-body {
    flex: 1;
    padding: 1.25rem;
    background: rgba(255, 255, 255, 0.01);
    border: 1px solid rgba(255, 255, 255, 0.04);
    border-radius: 16px;
    margin-bottom: 1.25rem;
    transition: background-color 0.2s, border-color 0.2s;
  }
  .timeline-row-card:hover .card-timeline-body {
    background: rgba(255, 255, 255, 0.02);
    border-color: rgba(255, 255, 255, 0.08);
  }

  .timeline-body-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    gap: 1rem;
  }

  .header-timestamp-group { display: flex; flex-direction: column; }
  .timestamp-date { font-size: 0.9rem; font-weight: 700; color: #ffffff; }
  .timestamp-author { font-size: 0.75rem; color: rgba(255, 255, 255, 0.4); margin-top: 0.1rem; }

  .status-badge-pill {
    padding: 0.25rem 0.65rem;
    border-radius: 6px;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .status-badge-pill.completed { background: rgba(16, 185, 129, 0.1); color: #10b981; }
  .status-badge-pill.draft { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }

  .timeline-metrics-summary {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    background: rgba(0, 0, 0, 0.15);
    padding: 0.75rem 1.25rem;
    border-radius: 12px;
    margin-bottom: 1rem;
  }

  .timeline-metrics-summary .metric-block { display: flex; flex-direction: column; }
  .timeline-metrics-summary .val { font-size: 1rem; font-weight: 700; color: #ffffff; }
  .timeline-metrics-summary .lbl { font-size: 0.65rem; color: rgba(255, 255, 255, 0.4); text-transform: uppercase; margin-top: 0.1rem; }
  
  .metric-block.match .val { color: #10b981; }
  .metric-block.mismatch .val { color: #f59e0b; }
  .metric-block.missing .val { color: #ef4444; }
  .metric-block.new .val { color: #3b82f6; }

  .timeline-comment-box {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.8rem;
    margin-bottom: 1rem;
  }
  .comment-text { line-height: 1.4; }

  .timeline-body-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.3);
    border-top: 1px solid rgba(255, 255, 255, 0.04);
    padding-top: 0.75rem;
  }
  .draft-notice { color: #f59e0b; font-style: italic; }
  .chevron-arrow-right { color: rgba(255, 255, 255, 0.15); transition: transform 0.2s ease; }
  .timeline-row-card:hover .chevron-arrow-right { transform: translateX(3px); color: #ffffff; }

  /* Clean Empty States */
  .empty-state-card {
    text-align: center;
    padding: 4rem 2rem;
    color: rgba(255, 255, 255, 0.3);
    grid-column: 1 / -1;
  }
  .empty-state-card p { font-size: 0.85rem; margin-top: 0.75rem; }

  /* Optimized Breakpoints */
  @media (max-width: 960px) {
    .stats-grid { grid-template-columns: repeat(3, 1fr); }
    .score-banner-card { flex-direction: column; align-items: flex-start; gap: 1.25rem; }
    .score-right-metrics { width: 100%; justify-content: space-between; }
  }

  @media (max-width: 640px) {
    .header { flex-direction: column; align-items: flex-start; gap: 1rem; }
    .btn-audit-action { width: 100%; justify-content: center; }
    .stats-grid { grid-template-columns: repeat(2, 1fr); }
    .inventory-grid { grid-template-columns: 1fr; }
    .score-right-metrics { flex-direction: column; align-items: flex-start; gap: 1rem; }
    .vertical-divider { display: none; }
  }
</style>