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

  // TAMBAHKAN STATE INI: Menyimpan ID section yang sedang terbuka dropdown-nya
  let activeSectionId = $state<number | null>(null); 

  // Fungsi untuk membuka/tutup dropdown (Accordion logic)
  function toggleSection(sectionId: number) {
    if (activeSectionId === sectionId) {
      activeSectionId = null; // Jika yang di-klik sudah terbuka, maka tutup
    } else {
      activeSectionId = sectionId; // Buka yang di-klik, otomatis menutup yang lain
    }
  }

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
      if (selected.section.isMyDraft && selected.section.myDraftId) {
        await goto(`/stock-audit/new/process/${selected.section.myDraftId}`);
        return;
      }

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

<div class="page" class:has-selected={selected !== null}>
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

    {#if filtered.length === 0}
      <div class="empty">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <p>Tidak ada hasil untuk "<strong>{query}</strong>"</p>
      </div>
    {:else}
      {#each filtered as cabinet (cabinet.id)}
        <div class="cabinet-card" class:is-open={activeSectionId === cabinet.id}>
          
          <button class="cabinet-header" onclick={() => toggleSection(cabinet.id)}>
            <div class="cabinet-header-left">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="2" y="3" width="20" height="14" rx="2"/>
                <path d="M8 21h8M12 17v4"/>
              </svg>
              <span class="cabinet-name">{cabinet.name}</span>
            </div>
            <div class="cabinet-header-right">
              <span class="cabinet-meta">{cabinet.sections.length} section</span>
              <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </div>
          </button>

          {#if activeSectionId === cabinet.id}
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
          {/if}
        </div>
      {/each}
    {/if}
  </div>

  {#if selected}
    <div class="confirm-wrapper">
      <div class="confirm-box">
        <div class="confirm-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
          Ringkasan sesi audit
        </div>

        <div class="confirm-rows">
          <div class="confirm-row">
            <span class="confirm-label">Cabinet / Section</span>
            <span class="confirm-value">{selected.cabinetName} — {selected.section.name} ({selected.section.type})</span>
          </div>
          <div class="confirm-row">
            <span class="confirm-label">Total / Auditor</span>
            <span class="confirm-value">{selected.section.totalCards} Card · {data.user.name}</span>
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
            <p>Stok sistem akan di-snapshot saat audit dimulai. Perubahan stok setelah ini tidak mempengaruhi sesi.</p>
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
    </div>
  {/if}
</div>

<style>
  .page {
    max-width: 680px;
    margin: 0 auto;
    padding: 2rem 1rem;
    font-family: 'Inter', system-ui, sans-serif;
    transition: padding-bottom 0.2s ease;
    position: relative;
  }

  /* Memberikan ruang bawah agar list card terakhir tidak tertutup */
  .page.has-selected {
    padding-bottom: 260px; 
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
    transition: border-color 0.15s, background 0.15s;
  }

  /* Berikan border sedikit menyala hijau jika sedang terbuka */
  .cabinet-card.is-open {
    border-color: rgba(0, 255, 157, 0.15);
    background: rgba(255, 255, 255, 0.03);
  }

  /* Mengubah header menjadi komponen tombol yang bersih */
  .cabinet-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 14px 16px;
    background: rgba(0, 0, 0, 0.2);
    border: none;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    text-align: left;
    transition: background 0.12s;
  }

  .cabinet-header:hover {
    background: rgba(255, 255, 255, 0.04);
    color: #ffffff;
  }

  .cabinet-header-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .cabinet-header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .cabinet-name {
    font-weight: 500;
    font-size: 14px;
    color: inherit; /* Mengikuti warna hover induk */
  }

  .cabinet-meta {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.4);
  }

  /* Efek Rotasi Panah Dropdown */
  .chevron-icon {
    color: rgba(255, 255, 255, 0.3);
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .cabinet-header:hover .chevron-icon {
    color: #ffffff;
  }

  /* Jika kontainer memiliki class .is-open, putar panah ke atas */
  .cabinet-card.is-open .chevron-icon {
    transform: rotate(-180deg);
    color: #00ff9d;
  }

  /* Section list */
  .section-list {
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    background: rgba(0, 0, 0, 0.1);
    border-top: 0.5px solid rgba(255, 255, 255, 0.03);
    /* Animasi fade in tipis saat dropdown terbuka */
    animation: fadeInDropdown 0.15s ease-out;
  }

  @keyframes fadeInDropdown {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
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

  /* --- FIX POSISI CONFIRM BOX --- */
  .confirm-wrapper {
    position: fixed;
    bottom: 0;
    
    /* 1. Titik awal dihitung dari 50% sisa ruang setelah dikurangi lebar sidebar (260px) */
    left: calc(50% + 130px); /* 130px didapat dari setengahnya lebar sidebar 260px */
    transform: translateX(-50%);
    
    z-index: 100;
    
    /* 2. Lebar wrapper dikunci hanya sebatas lebar halaman utama (.page) */
    width: 100%;
    max-width: 680px; 
    
    /* 3. Padding kiri-kanan disamakan agar box tidak menempel di tepi */
    padding: 0 1rem 1.5rem 1rem;
    box-sizing: border-box;
    
    /* 4. Gradien hitam SEKARANG HANYA berada di dalam batas max-width 680px ini saja */
    background: linear-gradient(to top, #0a0a0f 75%, rgba(10, 10, 15, 0.9) 90%, transparent);
    
    pointer-events: none;
    animation: slideUpCenter 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes slideUpCenter {
    /* Animasi disesuaikan dengan gabungan translateX tengah */
    from { transform: translate(-50%, 100%); }
    to { transform: translate(-50%, 0); }
  }

  .confirm-box {
    width: 100%;
    border: 1px solid rgba(0, 255, 157, 0.2);
    border-radius: 12px;
    padding: 1.25rem;
    background: #111118;
    box-shadow: 0 -15px 30px -5px rgba(0, 0, 0, 0.6), 0 10px 20px -5px rgba(0, 0, 0, 0.4);
    pointer-events: auto;
  }
  .confirm-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    color: #00ff9d;
    margin-bottom: 0.85rem;
  }

  .confirm-rows {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 0.85rem;
    background: rgba(255, 255, 255, 0.02);
    padding: 10px 14px;
    border-radius: 8px;
    border: 0.5px solid rgba(255, 255, 255, 0.03);
  }

  .confirm-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12.5px;
    gap: 12px;
  }

  .confirm-label {
    color: rgba(255, 255, 255, 0.4);
    white-space: nowrap;
  }
  
  .confirm-value {
    font-weight: 500;
    color: #ffffff;
    text-align: right;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .confirm-note {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    padding: 10px 12px;
    border-radius: 8px;
    margin-bottom: 1.25rem;
    font-size: 12px;
  }

  .confirm-note p {
    margin: 0;
    line-height: 1.4;
  }

  .note-warning {
    background: rgba(212, 176, 96, 0.08);
    color: #d4b060;
    border: 0.5px solid rgba(212, 176, 96, 0.15);
  }

  .note-info {
    background: rgba(0, 255, 157, 0.06);
    color: #00ff9d;
    border: 0.5px solid rgba(0, 255, 157, 0.15);
  }

  .note-danger {
    background: rgba(255, 107, 107, 0.08);
    color: #ff6b6b;
    border: 0.5px solid rgba(255, 107, 107, 0.15);
  }

  .confirm-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
  }

  /* Buttons */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 9px 18px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
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

  /* --- RESPONSIVE UNTUK LAYAR HP (TAMPILAN MOBILE) --- */
  @media (max-width: 768px) {
    .confirm-wrapper {
      left: 50%;
      transform: translateX(-50%);
      max-width: 100%;
    }
    @keyframes slideUpCenter {
      from { transform: translate(-50%, 100%); }
      to { transform: translate(-50%, 0); }
    }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>