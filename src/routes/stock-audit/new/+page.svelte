<script lang="ts">
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';

  const { data }: { data: PageData } = $props();

  type Section = {
    id: number;
    name: string;
    type: string;
    totalCards: number;
    isLockedByOther: boolean;
    lockedBy: string | null;
    isMyDraft: boolean;
    myDraftId: string | null;
  };

  type Cabinet = {
    id: number;
    name: string;
    maxSlots: number;
    sections: Section[];
  };

  type Selected = {
    cabinetId: number;
    cabinetName: string;
    section: Section;
  };

  let query = $state('');
  let selected = $state<Selected | null>(null);
  let loading = $state(false);
  let error = $state('');

  const filtered = $derived(
    data.cabinets
      .map((cab: Cabinet) => ({
        ...cab,
        sections: cab.sections.filter(
          (s: Section) =>
            s.name.toLowerCase().includes(query.toLowerCase()) ||
            s.type.toLowerCase().includes(query.toLowerCase()) ||
            cab.name.toLowerCase().includes(query.toLowerCase())
        )
      }))
      .filter((cab: Cabinet) => cab.sections.length > 0)
  );

  function selectSection(cabinet: Cabinet, section: Section) {
    if (section.isLockedByOther) return;
    selected = {
      cabinetId: cabinet.id,
      cabinetName: cabinet.name,
      section
    };
  }

  function cancelConfirm() {
    selected = null;
    error = '';
  }

  async function startAudit() {
    if (!selected) return;
    loading = true;
    error = '';

    try {
      // Kalau auditor ini punya draft aktif di section ini, lanjutkan draft
      if (selected.section.isMyDraft && selected.section.myDraftId) {
        await goto(`/stock-audit/new/process/${selected.section.myDraftId}`);
        return;
      }

      // Buat sesi audit baru
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionId: selected.section.id })
      });

      const json = await res.json();

      if (!res.ok) {
        error = json.message ?? 'Gagal membuat sesi audit.';
        return;
      }

      await goto(`/stock-audit/new/process/${json.auditId}`);
    } catch (e) {
      error = 'Terjadi kesalahan. Coba lagi.';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Mulai Audit Baru</title>
</svelte:head>

<div class="page">
  <!-- Header -->
  <div class="page-header">
    <div class="header-left">
      <button class="back-btn" onclick={() => goto('/stock-audit')}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        Kembali
      </button>
      <div>
        <h1>Mulai audit baru</h1>
        <p class="subtitle">Pilih section yang ingin diaudit</p>
      </div>
    </div>
    <div class="auditor-badge">
      <span class="auditor-dot"></span>
      {data.user.name}
    </div>
  </div>

  <!-- Step bar -->
  <div class="step-bar">
    <div class="step active">
      <div class="step-dot">1</div>
      <span>Pilih section</span>
    </div>
    <div class="step-line"></div>
    <div class="step" class:active={selected !== null}>
      <div class="step-dot">2</div>
      <span>Konfirmasi</span>
    </div>
    <div class="step-line"></div>
    <div class="step">
      <div class="step-dot">3</div>
      <span>Cek card</span>
    </div>
  </div>

  <div class="content">
    <!-- Search -->
    <div class="search-wrap">
      <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input
        bind:value={query}
        type="text"
        placeholder="Cari cabinet atau section..."
        class="search-input"
      />
      {#if query}
        <button class="clear-btn" onclick={() => (query = '')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      {/if}
    </div>

    <!-- Cabinet list -->
    {#if filtered.length === 0}
      <div class="empty">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <p>Tidak ada hasil untuk "<strong>{query}</strong>"</p>
      </div>
    {:else}
      {#each filtered as cabinet (cabinet.id)}
        <div class="cabinet-card">
          <div class="cabinet-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="2" y="3" width="20" height="14" rx="2"/>
              <path d="M8 21h8M12 17v4"/>
            </svg>
            <span class="cabinet-name">{cabinet.name}</span>
            <span class="cabinet-meta">{cabinet.sections.length} section</span>
          </div>

          <div class="section-list">
            {#each cabinet.sections as section (section.id)}
              {@const isSelected = selected?.section.id === section.id}
              <button
                class="section-item"
                class:selected={isSelected}
                class:locked={section.isLockedByOther}
                onclick={() => selectSection(cabinet, section)}
                disabled={section.isLockedByOther}
              >
                <div class="section-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <path d="M3 9h18M3 15h18"/>
                  </svg>
                </div>

                <div class="section-info">
                  <div class="section-name">{section.name}</div>
                  <div class="section-sub">
                    {section.type} · {section.totalCards} card
                    {#if section.isLockedByOther}
                      · Sedang diaudit oleh <strong>{section.lockedBy}</strong>
                    {/if}
                  </div>
                </div>

                <div class="section-right">
                  {#if section.isLockedByOther}
                    <span class="badge badge-warning">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                      Terkunci
                    </span>
                  {:else if section.isMyDraft}
                    <span class="badge badge-purple">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                      </svg>
                      Draft saya
                    </span>
                  {:else if isSelected}
                    <span class="badge badge-selected">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M20 6 9 17l-5-5"/>
                      </svg>
                      Dipilih
                    </span>
                  {:else}
                    <span class="badge badge-gray">{section.totalCards} card</span>
                  {/if}
                </div>
              </button>
            {/each}
          </div>
        </div>
      {/each}
    {/if}

    <!-- Confirm box -->
    {#if selected}
      <div class="confirm-box">
        <div class="confirm-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
          Ringkasan sesi audit
        </div>

        <div class="confirm-rows">
          <div class="confirm-row">
            <span class="confirm-label">Cabinet</span>
            <span class="confirm-value">{selected.cabinetName}</span>
          </div>
          <div class="confirm-row">
            <span class="confirm-label">Section</span>
            <span class="confirm-value">{selected.section.name}</span>
          </div>
          <div class="confirm-row">
            <span class="confirm-label">Tipe</span>
            <span class="confirm-value">{selected.section.type}</span>
          </div>
          <div class="confirm-row">
            <span class="confirm-label">Total card</span>
            <span class="confirm-value">{selected.section.totalCards} card</span>
          </div>
          <div class="confirm-row">
            <span class="confirm-label">Auditor</span>
            <span class="confirm-value">{data.user.name}</span>
          </div>
        </div>

        {#if selected.section.isMyDraft}
          <div class="confirm-note note-info">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
            </svg>
            <p>Kamu punya draft aktif di section ini. Klik lanjutkan untuk melanjutkan audit.</p>
          </div>
        {:else}
          <div class="confirm-note note-warning">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <path d="M12 9v4M12 17h.01"/>
            </svg>
            <p>Stok sistem akan di-snapshot saat audit dimulai. Perubahan stok setelah ini tidak mempengaruhi sesi yang berjalan.</p>
          </div>
        {/if}

        {#if error}
          <div class="confirm-note note-danger">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>
            </svg>
            <p>{error}</p>
          </div>
        {/if}

        <div class="confirm-actions">
          <button class="btn btn-ghost" onclick={cancelConfirm} disabled={loading}>
            Batal
          </button>
          <button class="btn btn-primary" onclick={startAudit} disabled={loading}>
            {#if loading}
              <span class="spinner"></span>
              Memproses...
            {:else if selected.section.isMyDraft}
              Lanjutkan draft
            {:else}
              Mulai audit
            {/if}
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .page {
    max-width: 680px;
    margin: 0 auto;
    padding: 2rem 1rem;
    font-family: 'Inter', system-ui, sans-serif;
  }

  .page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .header-left {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .back-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.5);
    background: none;
    border: none;
    cursor: pointer;
    padding: 6px 0;
    margin-top: 2px;
    white-space: nowrap;
  }

  .back-btn:hover {
    color: #00ff9d;
  }

  h1 {
    font-size: 20px;
    font-weight: 600;
    margin: 0 0 2px;
    color: #ffffff;
  }

  .subtitle {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.5);
    margin: 0;
  }

  .auditor-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
    background: rgba(255, 255, 255, 0.05);
    border: 0.5px solid rgba(255, 255, 255, 0.1);
    border-radius: 99px;
    padding: 5px 12px;
    white-space: nowrap;
  }

  .auditor-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #00ff9d;
    flex-shrink: 0;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  /* Step bar */
  .step-bar {
    display: flex;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .step {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.4);
  }

  .step.active {
    color: #00ff9d;
    font-weight: 500;
  }

  .step-dot {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 0.5px solid rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    background: #0a0a0f;
    flex-shrink: 0;
  }

  .step.active .step-dot {
    background: #00ff9d;
    border-color: #00ff9d;
    color: #000000;
  }

  .step-line {
    flex: 1;
    height: 0.5px;
    background: rgba(255, 255, 255, 0.1);
    margin: 0 8px;
    min-width: 24px;
  }

  /* Search */
  .search-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    border: 0.5px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 0 12px;
    background: rgba(255, 255, 255, 0.02);
    margin-bottom: 1rem;
  }

  .search-icon {
    color: rgba(255, 255, 255, 0.4);
    flex-shrink: 0;
  }

  .search-input {
    border: none;
    background: transparent;
    outline: none;
    flex: 1;
    padding: 9px 0;
    font-size: 13px;
    color: #ffffff;
  }

  .search-input::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }

  .clear-btn {
    border: none;
    background: none;
    cursor: pointer;
    color: rgba(255, 255, 255, 0.4);
    padding: 4px;
    display: flex;
    align-items: center;
  }

  .clear-btn:hover {
    color: #ffffff;
  }

  /* Empty */
  .empty {
    text-align: center;
    padding: 3rem 1rem;
    color: rgba(255, 255, 255, 0.5);
    font-size: 13px;
  }

  .empty svg {
    display: block;
    margin: 0 auto 12px;
    color: rgba(255, 255, 255, 0.2);
  }

  /* Cabinet card */
  .cabinet-card {
    border: 0.5px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    margin-bottom: 12px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.02);
  }

  .cabinet-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    background: rgba(0, 0, 0, 0.2);
    border-bottom: 0.5px solid rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.6);
  }

  .cabinet-name {
    font-weight: 500;
    font-size: 14px;
    color: #ffffff;
    flex: 1;
  }

  .cabinet-meta {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.4);
  }

  /* Section list */
  .section-list {
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .section-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 8px;
    cursor: pointer;
    border: 0.5px solid transparent;
    background: transparent;
    text-align: left;
    width: 100%;
    transition: background 0.12s, border-color 0.12s;
  }

  .section-item:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.03);
    border-color: rgba(255, 255, 255, 0.08);
  }

  .section-item.selected {
    background: rgba(0, 255, 157, 0.1);
    border-color: rgba(0, 255, 157, 0.3);
  }

  .section-item.locked {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .section-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.03);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.5);
    flex-shrink: 0;
  }

  .section-item.selected .section-icon {
    background: rgba(0, 255, 157, 0.1);
    color: #00ff9d;
  }

  .section-info {
    flex: 1;
    min-width: 0;
  }

  .section-name {
    font-size: 13px;
    font-weight: 500;
    color: #ffffff;
  }

  .section-item.selected .section-name {
    color: #00ff9d;
  }

  .section-sub {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
    margin-top: 2px;
  }

  .section-right {
    flex-shrink: 0;
  }

  /* Badges */
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    padding: 3px 8px;
    border-radius: 99px;
    font-weight: 500;
    white-space: nowrap;
  }

  .badge-gray {
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.5);
  }

  .badge-purple {
    background: rgba(83, 74, 183, 0.15);
    color: #AFA9EC;
  }
  .badge-selected {
    background: rgba(0, 255, 157, 0.15);
    color: #00ff9d;
  }
  .badge-warning {
    background: rgba(250, 238, 218, 0.1);
    color: #d4b060;
  }

  /* Confirm box */
  .confirm-box {
    margin-top: 1.5rem;
    border: 0.5px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 1.25rem;
    background: rgba(255, 255, 255, 0.02);
  }

  .confirm-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 500;
    color: #00ff9d;
    margin-bottom: 1rem;
  }

  .confirm-rows {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 1rem;
  }

  .confirm-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
  }

  .confirm-label {
    color: rgba(255, 255, 255, 0.5);
  }
  .confirm-value {
    font-weight: 500;
    color: #ffffff;
  }

  .confirm-note {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    padding: 10px 12px;
    border-radius: 8px;
    margin-bottom: 1rem;
    font-size: 12px;
  }

  .confirm-note svg {
    flex-shrink: 0;
    margin-top: 1px;
  }
  .confirm-note p {
    margin: 0;
  }

  .note-warning {
    background: rgba(212, 176, 96, 0.1);
    color: #d4b060;
  }
  .note-warning svg {
    color: #d4b060;
  }

  .note-info {
    background: rgba(0, 255, 157, 0.08);
    color: #00ff9d;
  }
  .note-info svg {
    color: #00ff9d;
  }

  .note-danger {
    background: rgba(255, 107, 107, 0.1);
    color: #ff6b6b;
  }
  .note-danger svg {
    color: #ff6b6b;
  }

  .confirm-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }

  /* Buttons */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    border: 0.5px solid rgba(255, 255, 255, 0.1);
    transition: all 0.12s;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-ghost {
    background: transparent;
    color: rgba(255, 255, 255, 0.7);
  }

  .btn-ghost:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.05);
    color: #ffffff;
  }

  .btn-primary {
    background: #00ff9d;
    border-color: #00ff9d;
    color: #000000;
  }

  .btn-primary:hover:not(:disabled) {
    background: #00cc7a;
    border-color: #00cc7a;
  }

  /* Spinner */
  .spinner {
    width: 13px;
    height: 13px;
    border: 2px solid rgba(0, 0, 0, 0.2);
    border-top-color: #000000;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>