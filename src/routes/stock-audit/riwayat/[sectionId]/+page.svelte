<script lang="ts">
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';

  let { data } = $props();
  let section = data?.section;
  let cards = data?.cards || [];
  let audits = data?.audits || [];

  let activeTab = $state<'cards' | 'history'>('cards');
  let searchQuery = $state('');

  function formatDate(date: string | Date) {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
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

  const filteredCards = $derived(
    cards.filter(card =>
      card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.subCategory.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );
</script>

<svelte:head>
  <title>{section?.name} - Detail Section</title>
</svelte:head>

<div class="page">
  <!-- Back Button -->
  <button class="back-btn" onclick={() => goto('/stock-audit/riwayat')}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M19 12H5M12 5l-7 7 7 7"/>
    </svg>
    Kembali ke Riwayat
  </button>

  <!-- Header -->
  <div class="header">
    <div class="header-left">
      <h1 class="title">{section?.name}</h1>
      <p class="subtitle">
        {section?.cabinetName} • {section?.type} • {section?.totalCards} card
      </p>
    </div>
    <div class="header-right">
      <button class="btn-outline" onclick={() => goto(`/stock-audit/create?section=${section?.id}`)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        Audit Section Ini
      </button>
    </div>
  </div>

  <!-- Stats Cards -->
  <div class="stats-grid">
    <div class="stat-card total">
      <span class="stat-value">{section?.totalAudits || 0}</span>
      <span class="stat-label">Total Audit</span>
    </div>
    <div class="stat-card match">
      <span class="stat-value">{section?.totalMatch || 0}</span>
      <span class="stat-label">Match</span>
    </div>
    <div class="stat-card mismatch">
      <span class="stat-value">{section?.totalMismatch || 0}</span>
      <span class="stat-label">Mismatch</span>
    </div>
    <div class="stat-card missing">
      <span class="stat-value">{section?.totalMissing || 0}</span>
      <span class="stat-label">Missing</span>
    </div>
    <div class="stat-card newentry">
      <span class="stat-value">{section?.totalNewEntry || 0}</span>
      <span class="stat-label">New Entry</span>
    </div>
  </div>

  <!-- Score Card -->
  <div class="score-card">
    <div class="score-value">📊</div>
    <div class="score-info">
      <span class="score-label">Akurasi Data Section</span>
      <span class="score-number">{section?.accuracyRate || 0}%</span>
      <span class="score-desc">Berdasarkan {section?.totalAudits || 0} kali audit</span>
    </div>
    <div class="score-date">
      {#if section?.lastAudit}
        <span class="last-audit-label">Audit terakhir</span>
        <span class="last-audit-date">{formatDate(section.lastAudit)}</span>
        <span class="last-auditor">oleh {section.lastAuditor || 'Unknown'}</span>
      {:else}
        <span class="no-audit">Belum pernah diaudit</span>
      {/if}
    </div>
  </div>

  <!-- Tabs -->
  <div class="tabs">
    <button class="tab-btn {activeTab === 'cards' ? 'active' : ''}" onclick={() => activeTab = 'cards'}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="4" width="18" height="16" rx="2"/>
        <line x1="8" y1="10" x2="16" y2="10"/>
      </svg>
      Daftar Card ({section?.totalCards || 0})
    </button>
    <button class="tab-btn {activeTab === 'history' ? 'active' : ''}" onclick={() => activeTab = 'history'}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
      Riwayat Audit ({audits.length})
    </button>
  </div>

  <!-- Tab: Cards -->
  {#if activeTab === 'cards'}
    <div class="cards-section">
      <!-- Search -->
      <div class="search-wrap">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Cari card berdasarkan nama, kategori..."
          class="search-input"
        />
        {#if searchQuery}
          <button class="clear-btn" onclick={() => searchQuery = ''}>✕</button>
        {/if}
      </div>

      <div class="cards-grid">
        {#each filteredCards as card}
          <div class="card-item">
            <div class="card-image">
              {#if card.imageUrl}
                <img src={card.imageUrl} alt={card.name} />
              {:else}
                <div class="no-image">🃏</div>
              {/if}
            </div>
            <div class="card-info">
              <h3 class="card-name">{card.name}</h3>
              <div class="card-meta">
                <span class="category">{card.category}</span>
                <span class="sub">{card.subCategory}</span>
              </div>
              <div class="card-prices">
                {#each card.prices as p}
                  <span class="price {p.currency.toLowerCase()}">
                    {p.currency === 'IDR' ? 'Rp ' + p.amount.toLocaleString('id-ID') : 'SGD ' + p.amount}
                  </span>
                {/each}
              </div>
              <div class="card-stock">
                📦 Stok: {card.stock} • 📍 {card.location || 'No location'}
              </div>
            </div>
          </div>
        {:else}
          <div class="empty-state">Tidak ada card yang ditemukan</div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Tab: History -->
  {#if activeTab === 'history'}
      <div class="history-section">
        <div class="audit-timeline">
          {#each audits as audit}
            <!-- Ubah onclick从这里 -->
            <div class="timeline-item" onclick={() => goto(`/stock-audit/laporan/${audit.id}`)}>
              <div class="timeline-marker">
                <div class="timeline-dot {audit.status === 'COMPLETED' ? 'completed' : 'draft'}"></div>
                {#if audits.indexOf(audit) < audits.length - 1}
                  <div class="timeline-line"></div>
                {/if}
              </div>
              <div class="timeline-content">
                <div class="timeline-header">
                  <div>
                    <span class="timeline-date">{formatDateTime(audit.createdAt)}</span>
                    <span class="timeline-auditor">oleh {audit.auditorName || 'Unknown'}</span>
                  </div>
                  <span class="status-pill {getStatusBadge(audit.status).class}">
                    {getStatusBadge(audit.status).icon} {getStatusBadge(audit.status).text}
                  </span>
                </div>

                <div class="timeline-stats">
                  <div class="stat">
                    <span class="stat-value">{audit.totalCards || 0}</span>
                    <span class="stat-label">Total</span>
                  </div>
                  <div class="stat match">
                    <span class="stat-value">{audit.totalMatch || 0}</span>
                    <span class="stat-label">Match</span>
                  </div>
                  <div class="stat mismatch">
                    <span class="stat-value">{audit.totalMismatch || 0}</span>
                    <span class="stat-label">Mismatch</span>
                  </div>
                  <div class="stat missing">
                    <span class="stat-value">{audit.totalMissing || 0}</span>
                    <span class="stat-label">Missing</span>
                  </div>
                  <div class="stat new">
                    <span class="stat-value">{audit.totalNewEntry || 0}</span>
                    <span class="stat-label">New</span>
                  </div>
                </div>

                {#if audit.note}
                  <div class="timeline-note">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <span>{audit.note}</span>
                  </div>
                {/if}

                <div class="timeline-footer">
                  {#if audit.status === 'COMPLETED' && audit.completedAt}
                    <span>Selesai: {formatDateTime(audit.completedAt)}</span>
                  {:else}
                    <span class="draft-text">Belum selesai</span>
                  {/if}
                </div>
              </div>
            </div>
          {:else}
            <div class="empty-state">Belum ada riwayat audit untuk section ini</div>
          {/each}
        </div>
      </div>
  {/if}
</div>

<style>
  .page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1.5rem;
    font-family: 'Inter', system-ui, sans-serif;
    color: #e8e8f0;
    min-height: 100vh;
  }

  .back-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.5);
    font-size: 13px;
    cursor: pointer;
    margin-bottom: 1.5rem;
  }

  .back-btn:hover {
    color: #00ff9d;
    transform: translateX(-4px);
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
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

  .btn-outline {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0.5rem 1rem;
    background: rgba(0, 255, 157, 0.1);
    border: 1px solid rgba(0, 255, 157, 0.3);
    border-radius: 40px;
    color: #00ff9d;
    font-size: 0.8rem;
    cursor: pointer;
  }

  .btn-outline:hover {
    background: rgba(0, 255, 157, 0.2);
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .stat-card {
    text-align: center;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
  }

  .stat-card.total .stat-value { color: #ffffff; }
  .stat-card.match .stat-value { color: #00ff9d; }
  .stat-card.mismatch .stat-value { color: #ffaa00; }
  .stat-card.missing .stat-value { color: #ff6b6b; }
  .stat-card.newentry .stat-value { color: #00ccff; }

  .stat-value {
    display: block;
    font-size: 1.5rem;
    font-weight: 700;
  }

  .stat-label {
    font-size: 0.65rem;
    color: rgba(255, 255, 255, 0.4);
    text-transform: uppercase;
  }

  .score-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: linear-gradient(135deg, rgba(0, 255, 157, 0.08), rgba(0, 204, 255, 0.04));
    border: 1px solid rgba(0, 255, 157, 0.15);
    border-radius: 16px;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }

  .score-value {
    font-size: 2.5rem;
  }

  .score-info {
    flex: 1;
  }

  .score-label {
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.5);
    display: block;
  }

  .score-number {
    font-size: 1.5rem;
    font-weight: 700;
    color: #00ff9d;
  }

  .score-desc {
    font-size: 0.65rem;
    color: rgba(255, 255, 255, 0.4);
  }

  .score-date {
    text-align: right;
    font-size: 0.7rem;
  }

  .last-audit-label {
    display: block;
    color: rgba(255, 255, 255, 0.4);
  }

  .last-audit-date {
    display: block;
    font-weight: 600;
    color: #ffffff;
  }

  .last-auditor {
    font-size: 0.65rem;
    color: rgba(255, 255, 255, 0.4);
  }

  .no-audit {
    color: rgba(255, 255, 255, 0.3);
    font-style: italic;
  }

  .tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    padding-bottom: 0.5rem;
  }

  .tab-btn {
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
  }

  .tab-btn.active {
    background: rgba(0, 255, 157, 0.1);
    color: #00ff9d;
  }

  .search-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 40px;
    padding: 0.5rem 1rem;
    margin-bottom: 1rem;
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

  .clear-btn {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.4);
    cursor: pointer;
  }

  .cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
  }

  .card-item {
    display: flex;
    gap: 0.75rem;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
  }

  .card-image {
    width: 60px;
    height: 60px;
    background: #1a1a2a;
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .card-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .no-image {
    font-size: 1.5rem;
    color: rgba(255, 255, 255, 0.3);
  }

  .card-info {
    flex: 1;
  }

  .card-name {
    font-size: 0.9rem;
    font-weight: 600;
    margin-bottom: 2px;
  }

  .card-meta {
    display: flex;
    gap: 4px;
    margin-bottom: 4px;
  }

  .category, .sub {
    font-size: 0.6rem;
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
  }

  .category {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  .sub {
    background: rgba(0, 255, 157, 0.1);
    color: #00ff9d;
  }

  .card-prices {
    display: flex;
    gap: 6px;
    margin-bottom: 2px;
  }

  .price {
    font-size: 0.65rem;
    font-weight: 600;
  }

  .price.idr { color: #00ff9d; }
  .price.sgd { color: #ffaa00; }

  .card-stock {
    font-size: 0.6rem;
    color: rgba(255, 255, 255, 0.4);
  }

  .audit-timeline {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .timeline-item {
    display: flex;
    gap: 1rem;
    cursor: pointer;
  }

  .timeline-marker {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 24px;
  }

  .timeline-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    margin-top: 4px;
  }

  .timeline-dot.completed {
    background: #00ff9d;
    box-shadow: 0 0 8px rgba(0, 255, 157, 0.5);
  }

  .timeline-dot.draft {
    background: #ffaa00;
    box-shadow: 0 0 8px rgba(255, 170, 0, 0.5);
  }

  .timeline-line {
    width: 2px;
    flex: 1;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.2), transparent);
    margin: 4px 0;
  }

  .timeline-content {
    flex: 1;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    margin-bottom: 0.75rem;
  }

  .timeline-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .timeline-date {
    font-size: 0.75rem;
    font-weight: 600;
    color: #00ff9d;
  }

  .timeline-auditor {
    font-size: 0.65rem;
    color: rgba(255, 255, 255, 0.4);
    margin-left: 0.5rem;
  }

  .status-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 0.2rem 0.6rem;
    border-radius: 20px;
    font-size: 0.65rem;
  }

  .status-pill.draft {
    background: rgba(255, 170, 0, 0.1);
    color: #ffaa00;
  }

  .status-pill.completed {
    background: rgba(0, 255, 157, 0.1);
    color: #00ff9d;
  }

  .timeline-stats {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
    flex-wrap: wrap;
  }

  .timeline-stats .stat {
    text-align: center;
    min-width: 45px;
  }

  .timeline-stats .stat-value {
    display: block;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .timeline-stats .stat-label {
    font-size: 0.55rem;
  }

  .timeline-stats .match .stat-value { color: #00ff9d; }
  .timeline-stats .mismatch .stat-value { color: #ffaa00; }
  .timeline-stats .missing .stat-value { color: #ff6b6b; }
  .timeline-stats .new .stat-value { color: #00ccff; }

  .timeline-note {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0.5rem 0;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .timeline-footer {
    padding-top: 0.5rem;
    font-size: 0.6rem;
    color: rgba(255, 255, 255, 0.35);
  }

  .draft-text {
    color: #ffaa00;
  }

  .empty-state {
    text-align: center;
    padding: 3rem;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 16px;
    color: rgba(255, 255, 255, 0.4);
  }

  @media (max-width: 768px) {
    .page {
      padding: 1rem;
    }

    .stats-grid {
      grid-template-columns: repeat(3, 1fr);
    }

    .score-card {
      flex-direction: column;
      text-align: center;
    }

    .score-date {
      text-align: center;
    }

    .cards-grid {
      grid-template-columns: 1fr;
    }
  }
</style>