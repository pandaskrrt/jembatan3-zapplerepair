<script lang="ts">
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';

  let { data } = $props();
  let audit = data?.audit;
  let items = data?.items || [];

  function formatDate(date: string | Date) {
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
    return { class: 'completed', icon: '✅', text: 'Completed' };
  }

  function getItemStatusBadge(status: string) {
    const badges: Record<string, { class: string; icon: string; label: string }> = {
      MATCH: { class: 'match', icon: '✓', label: 'Match' },
      MISMATCH: { class: 'mismatch', icon: '⚠️', label: 'Mismatch' },
      MISSING: { class: 'missing', icon: '❌', label: 'Missing' },
      NEW_ENTRY: { class: 'new-entry', icon: '➕', label: 'New Entry' }
    };
    return badges[status] || { class: 'match', icon: '✓', label: status };
  }

  function getDifferenceDisplay(difference: number | null) {
    if (difference === null) return null;
    if (difference === 0) return { text: 'Sesuai', class: 'match' };
    if (difference > 0) return { text: `+${difference}`, class: 'positive' };
    return { text: `${difference}`, class: 'negative' };
  }
</script>

<svelte:head>
  <title>Detail Audit - {audit?.sectionName}</title>
</svelte:head>

<div class="page">
  <!-- Back Button -->
  <button class="back-btn" onclick={() => goto('/stock-audit')}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M19 12H5M12 5l-7 7 7 7"/>
    </svg>
    Kembali ke Dashboard
  </button>

  <!-- Header -->
  <div class="header">
    <div class="header-left">
      <div class="status-badge {getStatusBadge(audit?.status).class}">
        <span>{getStatusBadge(audit?.status).icon}</span>
        <span>{getStatusBadge(audit?.status).text}</span>
      </div>
      <h1 class="title">{audit?.cabinetName} / {audit?.sectionName}</h1>
      <p class="subtitle">
        Diaudit oleh {audit?.auditorName} • 
        {#if audit?.status === 'COMPLETED' && audit?.completedAt}
          Selesai {formatDate(audit.completedAt)}
        {:else}
          Dibuat {formatDate(audit.createdAt)}
        {/if}
      </p>
    </div>
  </div>

  <!-- Stats Summary -->
  <div class="stats-grid">
    <div class="stat-card total">
      <div class="stat-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="4" width="18" height="16" rx="2"/>
          <line x1="8" y1="10" x2="16" y2="10"/>
        </svg>
      </div>
      <div class="stat-info">
        <span class="stat-value">{audit?.totalCards || items.length}</span>
        <span class="stat-label">Total Card</span>
      </div>
    </div>
    <div class="stat-card match">
      <div class="stat-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <div class="stat-info">
        <span class="stat-value">{audit?.totalMatch || 0}</span>
        <span class="stat-label">Match</span>
      </div>
    </div>
    <div class="stat-card mismatch">
      <div class="stat-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <div class="stat-info">
        <span class="stat-value">{audit?.totalMismatch || 0}</span>
        <span class="stat-label">Mismatch</span>
      </div>
    </div>
    <div class="stat-card missing">
      <div class="stat-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      </div>
      <div class="stat-info">
        <span class="stat-value">{audit?.totalMissing || 0}</span>
        <span class="stat-label">Missing</span>
      </div>
    </div>
    <div class="stat-card newentry">
      <div class="stat-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </div>
      <div class="stat-info">
        <span class="stat-value">{audit?.totalNewEntry || 0}</span>
        <span class="stat-label">New Entry</span>
      </div>
    </div>
  </div>

  <!-- Catatan Audit -->
  {#if audit?.note}
    <div class="note-section">
      <div class="note-label">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
        Catatan Audit
      </div>
      <div class="note-content">{audit.note}</div>
    </div>
  {/if}

  <!-- Items List -->
  <div class="items-section">
    <h2 class="section-title">Detail Card</h2>
    
    <div class="items-grid">
      {#each items as item}
        {@const badge = getItemStatusBadge(item.itemStatus)}
        {@const diff = getDifferenceDisplay(item.difference)}
        <div class="item-card {badge.class}">
          <div class="item-status">
            <span class="status-icon">{badge.icon}</span>
            <span class="status-label">{badge.label}</span>
          </div>
          
          <div class="item-image">
            {#if item.card?.imageUrl}
              <img src={item.card.imageUrl} alt={item.card?.name} />
            {:else if item.newCardName}
              <div class="placeholder new">✨</div>
            {:else}
              <div class="placeholder">🃏</div>
            {/if}
          </div>
          
          <div class="item-info">
            <div class="item-name">
              {#if item.card?.name}
                {item.card.name}
              {:else if item.newCardName}
                <span class="new-badge">BARU</span> {item.newCardName}
              {:else}
                —
              {/if}
            </div>
            
            {#if item.card?.category || item.newCardCategory}
              <div class="item-meta">
                {item.card?.category || item.newCardCategory} · {item.card?.subCategory || item.newCardSubCategory}
              </div>
            {/if}
            
            {#if item.card?.prices?.length}
              <div class="item-prices">
                {#each item.card.prices as p}
                  <span class="price {p.currency.toLowerCase()}">
                    {p.currency === 'IDR' ? 'Rp ' + p.amount.toLocaleString('id-ID') : 'SGD ' + p.amount}
                  </span>
                {/each}
              </div>
            {:else if item.newCardPriceIDR || item.newCardPriceSGD}
              <div class="item-prices">
                {#if item.newCardPriceIDR}
                  <span class="price idr">Rp {item.newCardPriceIDR.toLocaleString('id-ID')}</span>
                {/if}
                {#if item.newCardPriceSGD}
                  <span class="price sgd">SGD {item.newCardPriceSGD}</span>
                {/if}
              </div>
            {/if}
            
            <div class="item-stock">
              {#if item.systemStock !== null && item.physicalStock !== null}
                <span class="stock-label">Sistem:</span>
                <span class="stock-value">{item.systemStock}</span>
                <span class="stock-arrow">→</span>
                <span class="stock-label">Fisik:</span>
                <span class="stock-value {diff?.class}">{item.physicalStock}</span>
                {#if diff && diff.text !== 'Sesuai'}
                  <span class="stock-diff {diff?.class}">({diff.text})</span>
                {/if}
              {:else if item.itemStatus === 'MISSING'}
                <span class="stock-label">Sistem:</span>
                <span class="stock-value">{item.systemStock}</span>
                <span class="stock-arrow">→</span>
                <span class="stock-label">Fisik:</span>
                <span class="stock-value missing">0 (Hilang)</span>
              {:else if item.itemStatus === 'NEW_ENTRY'}
                <span class="stock-label new">Card baru akan ditambahkan</span>
              {/if}
            </div>
            
            {#if item.note}
              <div class="item-note">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <span>{item.note}</span>
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Action Buttons untuk Draft -->
  {#if audit?.status === 'DRAFT'}
    <div class="action-buttons">
      <button class="btn-secondary" onclick={() => goto(`/stock-audit/new/process/${audit.id}`)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Lanjutkan Audit
      </button>
      <button class="btn-danger" onclick={() => {
        if (confirm('Yakin ingin menghapus draft audit ini? Tindakan ini tidak dapat dibatalkan.')) {
          fetch(`/api/stock-audit/${audit.id}`, { method: 'DELETE' })
            .then(() => goto('/stock-audit'))
            .catch(err => alert('Gagal menghapus audit: ' + err.message));
        }
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6 6 18M6 6l12 12"/>
        </svg>
        Hapus Draft
      </button>
    </div>
  {/if}
</div>

<style>
  .page {
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem 1.5rem;
    font-family: 'Inter', system-ui, sans-serif;
    color: #e8e8f0;
    min-height: 100vh;
  }

  /* Back Button */
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
    transition: all 0.2s;
  }

  .back-btn:hover {
    color: #00ff9d;
    transform: translateX(-4px);
  }

  /* Header */
  .header {
    margin-bottom: 2rem;
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 500;
    margin-bottom: 0.75rem;
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

  .title {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 0.5rem;
    background: linear-gradient(135deg, #ffffff, #00ff9d);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .subtitle {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.4);
    margin: 0;
  }

  /* Stats Grid */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 0.75rem;
    margin-bottom: 2rem;
  }

  .stat-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
  }

  .stat-icon {
    width: 36px;
    height: 36px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.5);
  }

  .stat-card.match .stat-icon { color: #00ff9d; }
  .stat-card.mismatch .stat-icon { color: #ffaa00; }
  .stat-card.missing .stat-icon { color: #ff6b6b; }
  .stat-card.newentry .stat-icon { color: #00ccff; }
  .stat-card.total .stat-icon { color: #ffffff; }

  .stat-info {
    display: flex;
    flex-direction: column;
  }

  .stat-value {
    font-size: 1.2rem;
    font-weight: 700;
    color: #ffffff;
  }

  .stat-card.match .stat-value { color: #00ff9d; }
  .stat-card.mismatch .stat-value { color: #ffaa00; }
  .stat-card.missing .stat-value { color: #ff6b6b; }
  .stat-card.newentry .stat-value { color: #00ccff; }

  .stat-label {
    font-size: 9px;
    color: rgba(255, 255, 255, 0.4);
    text-transform: uppercase;
  }

  /* Note Section */
  .note-section {
    margin-bottom: 2rem;
    padding: 1rem;
    background: rgba(0, 255, 157, 0.05);
    border: 1px solid rgba(0, 255, 157, 0.15);
    border-radius: 12px;
  }

  .note-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 600;
    color: #00ff9d;
    margin-bottom: 0.5rem;
  }

  .note-content {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.8);
    line-height: 1.5;
    white-space: pre-wrap;
  }

  /* Items Section */
  .section-title {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: rgba(255, 255, 255, 0.7);
  }

  .items-grid {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .item-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 1rem;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    transition: all 0.2s;
  }

  .item-card.match { border-left: 3px solid #00ff9d; }
  .item-card.mismatch { border-left: 3px solid #ffaa00; }
  .item-card.missing { border-left: 3px solid #ff6b6b; }
  .item-card.new-entry { border-left: 3px solid #00ccff; }

  .item-status {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 60px;
  }

  .status-icon {
    font-size: 1.2rem;
  }

  .status-label {
    font-size: 9px;
    font-weight: 500;
    margin-top: 2px;
  }

  .item-card.match .status-label { color: #00ff9d; }
  .item-card.mismatch .status-label { color: #ffaa00; }
  .item-card.missing .status-label { color: #ff6b6b; }
  .item-card.new-entry .status-label { color: #00ccff; }

  .item-image {
    width: 48px;
    height: 48px;
    background: #1a1a2a;
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .item-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .placeholder {
    font-size: 1.5rem;
    color: rgba(255, 255, 255, 0.2);
  }

  .placeholder.new {
    color: #00ccff;
  }

  .item-info {
    flex: 1;
  }

  .item-name {
    font-size: 0.9rem;
    font-weight: 600;
    margin-bottom: 2px;
  }

  .new-badge {
    display: inline-block;
    background: rgba(0, 204, 255, 0.15);
    color: #00ccff;
    font-size: 9px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 4px;
    margin-right: 6px;
  }

  .item-meta {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.4);
    margin-bottom: 4px;
  }

  .item-prices {
    display: flex;
    gap: 8px;
    margin-bottom: 4px;
  }

  .price {
    font-size: 10px;
    font-weight: 600;
  }

  .price.idr { color: #00ff9d; }
  .price.sgd { color: #ffaa00; }

  .item-stock {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    flex-wrap: wrap;
  }

  .stock-label {
    color: rgba(255, 255, 255, 0.4);
  }

  .stock-value {
    font-weight: 600;
    color: #ffffff;
  }

  .stock-value.match { color: #00ff9d; }
  .stock-value.negative { color: #ff6b6b; }
  .stock-value.positive { color: #ffaa00; }
  .stock-value.missing { color: #ff6b6b; }

  .stock-arrow {
    color: rgba(255, 255, 255, 0.3);
  }

  .stock-diff {
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 10px;
  }

  .stock-diff.positive {
    background: rgba(255, 170, 0, 0.15);
    color: #ffaa00;
  }

  .stock-diff.negative {
    background: rgba(255, 107, 107, 0.15);
    color: #ff6b6b;
  }

  .stock-label.new {
    color: #00ccff;
  }

  .item-note {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    font-size: 10px;
    color: rgba(255, 255, 255, 0.4);
  }

  /* Action Buttons */
  .action-buttons {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
    justify-content: flex-end;
  }

  .btn-secondary {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0.6rem 1.2rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 40px;
    color: rgba(255, 255, 255, 0.7);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-secondary:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
  }

  .btn-danger {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0.6rem 1.2rem;
    background: rgba(255, 107, 107, 0.1);
    border: 1px solid rgba(255, 107, 107, 0.3);
    border-radius: 40px;
    color: #ff6b6b;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-danger:hover {
    background: rgba(255, 107, 107, 0.2);
  }

  /* Responsive */
  @media (max-width: 800px) {
    .stats-grid {
      grid-template-columns: repeat(3, 1fr);
    }
    
    .item-card {
      flex-wrap: wrap;
    }
    
    .item-status {
      flex-direction: row;
      gap: 6px;
    }
  }

  @media (max-width: 600px) {
    .page {
      padding: 1rem;
    }
    
    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .action-buttons {
      flex-direction: column;
    }
    
    .btn-secondary, .btn-danger {
      justify-content: center;
    }
  }
</style>