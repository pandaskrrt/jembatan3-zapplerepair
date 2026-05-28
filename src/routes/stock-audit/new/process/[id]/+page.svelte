<script lang="ts">
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';

  const { data }: { data: PageData } = $props();

  type Price = { currency: 'IDR'; amount: number; priceNote: string };

  type AuditItem = {
    id: string;
    cardId: number;
    itemStatus: 'MATCH' | 'MISMATCH' | 'MISSING';
    systemStock: number;
    physicalStock: number | null;
    note: string | null;
    card: {
      id: number;
      name: string;
      imageUrl: string;
      category: string;
      subCategory: string;
      prices: Price[];
    } | null;
  };

  type NewEntry = {
    tempId: string;
    name: string;
    category: string;
    subCategory: string;
    imageUrl: string;
    location: string;
    priceIDR: number | null;
    note: string;
  };

  let audit = data?.audit;

  // ── State utama ───────────────────────────────────────────
  let localItems   = $state<AuditItem[]>(data?.items ?? []);
  let newEntries   = $state<NewEntry[]>([]);
  let viewMode     = $state<'list' | 'single'>('list');
  let currentIndex = $state(0);
  let showSummary  = $state(false);
  let isSubmitting = $state(false);
  let errorMessage = $state<string | null>(null);
  let auditNote    = $state(audit?.note ?? '');

  // List mode select
  let selectedIds = $state<Set<string>>(new Set());
  let bulkStatus  = $state<'MATCH' | 'MISMATCH' | 'MISSING' | ''>('');

  // New entry form
  let showNewEntryForm = $state(false);
  let newEntryDraft = $state<Omit<NewEntry, 'tempId'>>({
    name: '', category: '', subCategory: '',
    imageUrl: '', location: '',
    priceIDR: null, note: ''
  });

  let newEntryImagePreview = $state<string | null>(null);
  let newEntryImageFile   = $state<File | null>(null);

  // ── Derived ───────────────────────────────────────────────
  const currentItem = $derived(localItems[currentIndex]);

  const stats = $derived((() => {
    const s = { match: 0, mismatch: 0, missing: 0, unchecked: 0 };
    for (const item of localItems) {
      if (item.physicalStock === null && item.itemStatus !== 'MISSING') s.unchecked++;
      else if (item.itemStatus === 'MATCH')    s.match++;
      else if (item.itemStatus === 'MISMATCH') s.mismatch++;
      else if (item.itemStatus === 'MISSING')  s.missing++;
    }
    return s;
  })());

  const checkedCount = $derived(
    localItems.filter(i => i.physicalStock !== null || i.itemStatus === 'MISSING').length
  );
  const allSelected  = $derived(selectedIds.size === localItems.length && localItems.length > 0);
  const someSelected = $derived(selectedIds.size > 0 && !allSelected);

  // ── Helpers ───────────────────────────────────────────────
  function setStatus(index: number, status: AuditItem['itemStatus']) {
    const item = localItems[index];
    if (status === 'MATCH') {
      localItems[index] = { ...item, itemStatus: 'MATCH', physicalStock: item.systemStock };
    } else if (status === 'MISMATCH') {
      localItems[index] = {
        ...item, itemStatus: 'MISMATCH',
        physicalStock: item.physicalStock ?? item.systemStock
      };
    } else if (status === 'MISSING') {
      localItems[index] = { ...item, itemStatus: 'MISSING', physicalStock: 0 };
    }
  }

  function setPhysicalStock(index: number, val: number) {
    const item = localItems[index];
    localItems[index] = {
      ...item,
      physicalStock: val,
      itemStatus: val === item.systemStock ? 'MATCH' : 'MISMATCH'
    };
  }

  function setNote(index: number, note: string) {
    localItems[index] = { ...localItems[index], note: note || null };
  }

  // ── List mode ─────────────────────────────────────────────
  function toggleSelectAll() {
    selectedIds = allSelected ? new Set() : new Set(localItems.map(i => i.id));
  }

  function toggleSelect(id: string) {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    selectedIds = next;
  }

  function applyBulk() {
    if (!bulkStatus) return;
    localItems.forEach((_, i) => {
      if (selectedIds.has(localItems[i].id)) setStatus(i, bulkStatus as AuditItem['itemStatus']);
    });
    selectedIds = new Set();
    bulkStatus = '';
  }

  // ── Single mode ───────────────────────────────────────────
  function nextCard() {
    if (currentIndex < localItems.length - 1) { currentIndex++; errorMessage = null; }
  }
  function prevCard() {
    if (currentIndex > 0) { currentIndex--; errorMessage = null; }
  }

  // ── New entry ─────────────────────────────────────────────
  function resetDraft() {
    newEntryDraft = {
      name: '', category: '', subCategory: '',
      imageUrl: '', location: '',
      priceIDR: null, note: ''
    };
    newEntryImagePreview = null;
    newEntryImageFile    = null;
  }

  function handleNewEntryImageChange(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      newEntryImageFile    = input.files[0];
      newEntryImagePreview = URL.createObjectURL(newEntryImageFile);
      errorMessage         = null;
    }
  }

  async function addNewEntry() {
    if (!newEntryDraft.name || !newEntryDraft.category || !newEntryDraft.subCategory) {
      errorMessage = 'Nama, kategori, dan sub kategori wajib diisi.';
      return;
    }

    let uploadedImageUrl = newEntryDraft.imageUrl;
    if (newEntryImageFile) {
      try {
        const formData = new FormData();
        formData.append('file', newEntryImageFile);
        const uploadRes  = await fetch('/api/upload-image', { method: 'POST', body: formData });
        const uploadResult = await uploadRes.json();
        if (uploadResult.success) uploadedImageUrl = uploadResult.url;
      } catch (err) {
        console.error('Upload failed:', err);
      }
    }

    newEntries = [...newEntries, {
      ...newEntryDraft,
      imageUrl: uploadedImageUrl || '',
      tempId: crypto.randomUUID()
    }];
    resetDraft();
    showNewEntryForm = false;
    errorMessage     = null;
  }

  function removeNewEntry(tempId: string) {
    newEntries = newEntries.filter(e => e.tempId !== tempId);
  }

  // ── Modal sukses ──────────────────────────────────────────
  let showSuccessModal  = $state(false);
  let submittedAuditId  = $state<string | null>(null);

  // ── Summary & submit ──────────────────────────────────────
  function goToSummary() {
    const invalidNewEntries = newEntries.filter(e => !e.name || !e.category || !e.subCategory);
    if (invalidNewEntries.length > 0) {
      errorMessage = 'Ada card baru yang belum lengkap datanya';
      return;
    }
    showSummary  = true;
    errorMessage = null;
  }

  async function submitAudit() {
    isSubmitting = true;
    errorMessage = null;

    const itemsData = localItems.map(i => ({
      id:            i.id,
      itemStatus:    i.itemStatus,
      physicalStock: i.physicalStock,
      note:          i.note
    }));

    const payload = {
      items:      itemsData,
      newEntries: newEntries,
      auditNote:  auditNote
    };

    try {
      const res    = await fetch(`/api/stock-audit/${audit.id}/submit`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload)
      });
      const result = await res.json();

      if (result.success) {
        submittedAuditId = audit.id;
        showSuccessModal = true;
      } else {
        errorMessage = result.message || 'Gagal submit audit.';
      }
    } catch (err) {
      errorMessage = 'Terjadi kesalahan jaringan: ' + (err as Error).message;
    } finally {
      isSubmitting = false;
    }
  }

  function goToLaporan() {
    if (submittedAuditId) goto(`/stock-audit/laporan/${submittedAuditId}`);
  }

  function goToDashboard() {
    goto('/stock-audit');
  }

  // ── Config status ─────────────────────────────────────────
  const statusCfg = {
    MATCH:     { label: 'Match',    icon: '✓', color: '#00ff9d', bg: 'rgba(0,255,157,0.12)',   border: 'rgba(0,255,157,0.3)'   },
    MISMATCH:  { label: 'Mismatch', icon: '⚠', color: '#ffaa00', bg: 'rgba(255,170,0,0.12)',   border: 'rgba(255,170,0,0.3)'   },
    MISSING:   { label: 'Missing',  icon: '✕', color: '#ff6b6b', bg: 'rgba(255,107,107,0.12)', border: 'rgba(255,107,107,0.3)' },
    UNCHECKED: { label: 'Belum',    icon: '○', color: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)' }
  } as const;

  function getCfg(item: AuditItem) {
    if (item.physicalStock === null && item.itemStatus !== 'MISSING') return statusCfg.UNCHECKED;
    return statusCfg[item.itemStatus];
  }

  // Helper format harga IDR
  function fmtIDR(amount: number) {
    return 'Rp ' + amount.toLocaleString('id-ID');
  }
</script>

<svelte:head>
  <title>Audit — {audit?.sectionName ?? '...'}</title>
</svelte:head>

<div class="page">

  <!-- ── Header ──────────────────────────────────────────── -->
  <header class="page-header">
    <button class="back-btn" onclick={() => goto('/stock-audit')}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 5l-7 7 7 7"/>
      </svg>
      Kembali
    </button>

    <div class="header-mid">
      <div class="breadcrumb">
        <span class="bc-cab">{audit?.cabinetName}</span>
        <span class="bc-sep">/</span>
        <span class="bc-sec">{audit?.sectionName}</span>
      </div>
      <div class="pills">
        <span class="pill match">✓ {stats.match}</span>
        <span class="pill mismatch">⚠ {stats.mismatch}</span>
        <span class="pill missing">✕ {stats.missing}</span>
        {#if stats.unchecked > 0}
          <span class="pill unchecked">○ {stats.unchecked} belum</span>
        {/if}
        {#if newEntries.length > 0}
          <span class="pill newentry">+ {newEntries.length} baru</span>
        {/if}
      </div>
    </div>

    <div class="header-right">
      <div class="mode-toggle">
        <button class="mtbtn" class:active={viewMode === 'list'} onclick={() => viewMode = 'list'}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
            <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
          List
        </button>
        <button class="mtbtn" class:active={viewMode === 'single'} onclick={() => viewMode = 'single'}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
          </svg>
          Single
        </button>
      </div>
      <button class="btn-ring" onclick={goToSummary}>Ringkasan →</button>
    </div>
  </header>

  <!-- Progress -->
  <div class="prog-wrap">
    <div class="prog-track">
      <div class="prog-fill" style="width:{localItems.length ? (checkedCount / localItems.length) * 100 : 0}%"></div>
    </div>
    <span class="prog-txt">{checkedCount}/{localItems.length} dicek</span>
  </div>

  {#if !showSummary}

  <!-- ═══════════ MODE LIST ═══════════ -->
  {#if viewMode === 'list'}

    <div class="toolbar">
      <label class="sel-all">
        <input type="checkbox" class="chk" checked={allSelected}
          indeterminate={someSelected} onchange={toggleSelectAll} />
        {allSelected ? 'Batal semua' : `Pilih semua (${localItems.length})`}
      </label>

      {#if selectedIds.size > 0}
        <div class="bulk-row">
          <span class="bulk-ct">{selectedIds.size} dipilih</span>
          <select bind:value={bulkStatus} class="bulk-sel">
            <option value="">Tandai sebagai...</option>
            <option value="MATCH">✓ Match</option>
            <option value="MISMATCH">⚠ Mismatch</option>
            <option value="MISSING">✕ Missing</option>
          </select>
          <button class="bulk-apply" onclick={applyBulk} disabled={!bulkStatus}>Terapkan</button>
          <button class="bulk-cancel" onclick={() => { selectedIds = new Set(); bulkStatus = ''; }}>Batal</button>
        </div>
      {/if}
    </div>

    <div class="card-list">
      {#each localItems as item, index (item.id)}
        {@const cfg = getCfg(item)}
        <div class="lcard" class:lcard-sel={selectedIds.has(item.id)}
          style="--sc:{cfg.color};--sbg:{cfg.bg};--sbd:{cfg.border}">

          <label class="lchk" onclick={(e) => e.stopPropagation()}>
            <input type="checkbox" class="chk" checked={selectedIds.has(item.id)}
              onchange={() => toggleSelect(item.id)} />
          </label>

          <div class="limg">
            {#if item.card?.imageUrl}
              <img src={item.card.imageUrl} alt={item.card.name} />
            {:else}
              <div class="limg-ph">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="2.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>
            {/if}
          </div>

          <div class="linfo">
            <div class="lname">{item.card?.name ?? '(Item dihapus)'}</div>
            <div class="lmeta">{item.card?.category ?? '-'} · {item.card?.subCategory ?? '-'}</div>
            {#if item.card?.prices.length}
              <div class="lprices">
                {#each item.card.prices as p}
                  <span class="lp idr">{fmtIDR(p.amount)}</span>
                  {#if p.priceNote}
                    <span class="lp-note">({p.priceNote})</span>
                  {/if}
                {/each}
              </div>
            {/if}
          </div>

          <div class="lstocks">
            <div class="sr"><span class="sl">Sistem</span><span class="sv">{item.systemStock}</span></div>
            <div class="sr">
              <span class="sl">Fisik</span>
              {#if item.itemStatus === 'MISSING'}
                <span class="sv" style="color:#ff6b6b">0</span>
              {:else}
                <input type="number" min="0" class="sinp"
                  value={item.physicalStock ?? ''}
                  onchange={(e) => setPhysicalStock(index, Number((e.target as HTMLInputElement).value))}
                  onclick={(e) => e.stopPropagation()}
                  placeholder="—" />
              {/if}
            </div>
          </div>

          <div class="lnote">
            <input type="text" class="note-input"
              value={item.note ?? ''}
              onchange={(e) => setNote(index, (e.target as HTMLInputElement).value)}
              placeholder="Catatan (opsional)..."
              onclick={(e) => e.stopPropagation()} />
          </div>

          <div class="lright">
            <div class="spill" style="background:{cfg.bg};color:{cfg.color};border:1px solid {cfg.border}">
              {cfg.icon} {cfg.label}
            </div>
            <div class="qbtns">
              {#each (['MATCH','MISMATCH','MISSING'] as const) as s}
                {#if s !== item.itemStatus || (item.itemStatus === s && item.physicalStock === null && s !== 'MISSING')}
                  {#if s !== item.itemStatus}
                    <button class="qbtn" style="--qc:{statusCfg[s].color}"
                      onclick={() => setStatus(index, s)} title={statusCfg[s].label}>
                      {statusCfg[s].icon}
                    </button>
                  {/if}
                {/if}
              {/each}
            </div>
          </div>
        </div>
      {/each}
    </div>

    <!-- Daftar new entries yang sudah ditambahkan -->
    {#if newEntries.length > 0}
      <div class="ne-list">
        <div class="ne-list-header">+ Card baru ({newEntries.length})</div>
        {#each newEntries as entry (entry.tempId)}
          <div class="ne-row">
            <div class="ne-img">
              {#if entry.imageUrl}
                <img src={entry.imageUrl} alt={entry.name} />
              {:else}
                <div class="ne-img-ph">🃏</div>
              {/if}
            </div>
            <div class="ne-info">
              <span class="ne-name">{entry.name}</span>
              <span class="ne-meta">{entry.category} · {entry.subCategory}</span>
              {#if entry.priceIDR}
                <span class="lp idr">{fmtIDR(entry.priceIDR)}</span>
              {/if}
            </div>
            <button class="ne-del" onclick={() => removeNewEntry(entry.tempId)} title="Hapus">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        {/each}
      </div>
    {/if}

    <!-- Form tambah card baru -->
    {#if showNewEntryForm}
      <div class="ne-form">
        <div class="ne-form-title">+ Tambah Card Baru di Section Ini</div>
        {#if errorMessage}
          <div class="inline-err">{errorMessage}</div>
        {/if}

        <div class="ne-grid">
          <div class="fg full">
            <label class="fl">Nama Card <span class="req">*</span></label>
            <input class="fi" type="text" bind:value={newEntryDraft.name} placeholder="Contoh: Pikachu VMAX" />
          </div>

          <div class="fg">
            <label class="fl">Category <span class="req">*</span></label>
            <input class="fi" type="text" bind:value={newEntryDraft.category} placeholder="VMAX, GX, EX..." />
          </div>
          <div class="fg">
            <label class="fl">Sub Category <span class="req">*</span></label>
            <input class="fi" type="text" bind:value={newEntryDraft.subCategory} placeholder="Electric, Fire..." />
          </div>

          <div class="fg full">
            <label class="fl">Lokasi di Rak</label>
            <input class="fi" type="text" bind:value={newEntryDraft.location} placeholder="Rak A-1, Slot 3" />
          </div>

          <div class="fg full">
            <label class="fl">Harga IDR (Rp)</label>
            <input class="fi" type="number" bind:value={newEntryDraft.priceIDR} placeholder="50000" />
          </div>

          <div class="fg full">
            <label class="fl">Gambar Card</label>
            <div class="image-upload-area" class:has-image={!!newEntryImagePreview}>
              {#if newEntryImagePreview}
                <img src={newEntryImagePreview} alt="Preview" class="image-preview" />
                <button type="button" class="remove-image"
                  onclick={() => { newEntryImagePreview = null; newEntryImageFile = null; }}>
                  ✕
                </button>
                <div class="image-overlay"><span>Klik atau drag untuk mengganti</span></div>
              {:else}
                <div class="upload-placeholder">
                  <span class="upload-icon">🖼️</span>
                  <p>Klik atau drag gambar ke sini</p>
                  <small>PNG, JPG, WEBP maks. 5MB</small>
                </div>
              {/if}
              <input type="file" accept="image/jpeg,image/png,image/webp,image/jpg"
                onchange={handleNewEntryImageChange} class="image-input" />
            </div>
            <span class="hint">Upload gambar card (opsional, bisa diisi nanti)</span>
          </div>

          <div class="fg full">
            <label class="fl">Atau URL Gambar</label>
            <input class="fi" type="url" bind:value={newEntryDraft.imageUrl}
              placeholder="https://example.com/image.jpg" />
            <span class="hint">Isi jika tidak upload file</span>
          </div>

          <div class="fg full">
            <label class="fl">Catatan</label>
            <textarea class="fi fta" rows="2" bind:value={newEntryDraft.note}
              placeholder="Catatan tambahan untuk card baru ini..."></textarea>
          </div>
        </div>

        <div class="ne-form-actions">
          <button class="btn-ghost" onclick={() => { showNewEntryForm = false; errorMessage = null; resetDraft(); }}>
            Batal
          </button>
          <button class="btn-cyan" onclick={addNewEntry}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Tambahkan Card
          </button>
        </div>
      </div>
    {:else}
      <button class="btn-add-new" onclick={() => { showNewEntryForm = true; errorMessage = null; resetDraft(); }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        + Tambah Card Baru di Section Ini
      </button>
    {/if}

    <div class="list-foot">
      <button class="btn-grad" onclick={goToSummary}>
        Lihat ringkasan & submit
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
    </div>

  <!-- ═══════════ MODE SINGLE ═══════════ -->
  {:else}
    <div class="single-layout">

      <aside class="snav">
        <div class="snav-title">Card ({localItems.length})</div>
        {#each localItems as item, i (item.id)}
          {@const cfg = getCfg(item)}
          <button class="snav-item" class:snav-active={currentIndex === i}
            onclick={() => { currentIndex = i; errorMessage = null; }}
            style="--sc:{cfg.color}">
            <span class="sdot" style="background:{cfg.color}"></span>
            <span class="sname">{item.card?.name ?? '(dihapus)'}</span>
            <span class="sico">{cfg.icon}</span>
          </button>
        {/each}
        {#if newEntries.length > 0}
          <div class="snav-divider">Baru ({newEntries.length})</div>
          {#each newEntries as entry (entry.tempId)}
            <div class="snav-item snav-new">
              <span class="sdot" style="background:#00ccff"></span>
              <span class="sname">{entry.name}</span>
              <span class="sico" style="color:#00ccff">+</span>
            </div>
          {/each}
        {/if}
      </aside>

      <div class="smain">
        <div class="sbar">
          {#each (['MATCH','MISMATCH','MISSING'] as const) as s}
            {@const cfg = statusCfg[s]}
            <button class="sopt"
              class:sopt-on={currentItem?.itemStatus === s && (currentItem.physicalStock !== null || s === 'MISSING')}
              onclick={() => setStatus(currentIndex, s)}
              style="--sc:{cfg.color};--sbg:{cfg.bg};--sbd:{cfg.border}">
              <span class="sopt-ico">{cfg.icon}</span>
              <span>{cfg.label}</span>
              <small>{s === 'MATCH' ? 'Sistem = Fisik' : s === 'MISMATCH' ? 'Stok berbeda' : 'Tidak ada'}</small>
            </button>
          {/each}
        </div>

        {#if currentItem}
          <div class="scard">
            <div class="scard-top">
              <div class="scbadges">
                <span class="cb cat">{currentItem.card?.category ?? '-'}</span>
                <span class="cb sub">{currentItem.card?.subCategory ?? '-'}</span>
              </div>
              <div class="sys-stk">Stok sistem: <strong>{currentItem.systemStock}</strong></div>
            </div>

            <div class="scard-body">
              <div class="simg-wrap">
                {#if currentItem.card?.imageUrl}
                  <img src={currentItem.card.imageUrl} alt={currentItem.card.name} class="simg" />
                {:else}
                  <div class="simg-ph">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <circle cx="8.5" cy="8.5" r="2.5"/><polyline points="21 15 16 10 5 21"/>
                    </svg>
                  </div>
                {/if}
              </div>

              <div class="sdetail">
                <h2 class="scard-name">{currentItem.card?.name ?? '(Item dihapus)'}</h2>

                {#if currentItem.card?.prices.length}
                  <div class="price-block">
                    {#each currentItem.card.prices as p}
                      <div class="price-row idr">
                        <span>🇮🇩 IDR</span>
                        <strong>{fmtIDR(p.amount)}</strong>
                        {#if p.priceNote}
                          <span class="pnote">({p.priceNote})</span>
                        {/if}
                      </div>
                    {/each}
                  </div>
                {/if}

                {#if currentItem.itemStatus === 'MISSING'}
                  <div class="miss-alert">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    Card tidak ditemukan di fisik. Stok akan diupdate ke 0.
                  </div>
                {:else}
                  <div class="fg">
                    <label class="fl">Stok Fisik</label>
                    <input type="number" min="0" class="fi"
                      class:fi-ok={currentItem.physicalStock === currentItem.systemStock && currentItem.physicalStock !== null}
                      class:fi-warn={currentItem.physicalStock !== currentItem.systemStock && currentItem.physicalStock !== null}
                      value={currentItem.physicalStock ?? ''}
                      onchange={(e) => setPhysicalStock(currentIndex, Number((e.target as HTMLInputElement).value))}
                      placeholder="Masukkan jumlah fisik" />
                    {#if currentItem.physicalStock !== null && currentItem.physicalStock !== currentItem.systemStock}
                      <span class="diff-note">
                        {currentItem.physicalStock > currentItem.systemStock
                          ? `+${currentItem.physicalStock - currentItem.systemStock} dari sistem`
                          : `-${currentItem.systemStock - currentItem.physicalStock} dari sistem`}
                      </span>
                    {/if}
                  </div>
                {/if}

                <div class="fg">
                  <label class="fl">Catatan (opsional)</label>
                  <textarea class="fi fta" rows="2"
                    value={currentItem.note ?? ''}
                    oninput={(e) => setNote(currentIndex, (e.target as HTMLTextAreaElement).value)}
                    placeholder="Kondisi kartu, kerusakan, dll..."></textarea>
                </div>
              </div>
            </div>

            <div class="scard-nav">
              <button class="nav-btn" onclick={prevCard} disabled={currentIndex === 0}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
                Sebelumnya
              </button>
              <span class="nav-idx">{currentIndex + 1} / {localItems.length}</span>
              {#if currentIndex === localItems.length - 1}
                <button class="nav-btn nav-p" onclick={goToSummary}>
                  Ringkasan
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              {:else}
                <button class="nav-btn nav-p" onclick={nextCard}>
                  Selanjutnya
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              {/if}
            </div>
          </div>
        {/if}

        <!-- Form new entry di mode single -->
        {#if showNewEntryForm}
          <div class="ne-form" style="margin-top:1rem">
            <div class="ne-form-title">+ Tambah Card Baru di Section Ini</div>
            {#if errorMessage}
              <div class="inline-err">{errorMessage}</div>
            {/if}

            <div class="ne-grid">
              <div class="fg full">
                <label class="fl">Nama Card <span class="req">*</span></label>
                <input class="fi" type="text" bind:value={newEntryDraft.name} placeholder="Contoh: Pikachu VMAX" />
              </div>
              <div class="fg">
                <label class="fl">Category <span class="req">*</span></label>
                <input class="fi" type="text" bind:value={newEntryDraft.category} placeholder="VMAX, GX, EX..." />
              </div>
              <div class="fg">
                <label class="fl">Sub Category <span class="req">*</span></label>
                <input class="fi" type="text" bind:value={newEntryDraft.subCategory} placeholder="Electric, Fire..." />
              </div>
              <div class="fg full">
                <label class="fl">Lokasi di Rak</label>
                <input class="fi" type="text" bind:value={newEntryDraft.location} placeholder="Rak A-1, Slot 3" />
              </div>
              <div class="fg full">
                <label class="fl">Harga IDR (Rp)</label>
                <input class="fi" type="number" bind:value={newEntryDraft.priceIDR} placeholder="50000" />
              </div>
              <div class="fg full">
                <label class="fl">Gambar Card</label>
                <div class="image-upload-area" class:has-image={!!newEntryImagePreview}>
                  {#if newEntryImagePreview}
                    <img src={newEntryImagePreview} alt="Preview" class="image-preview" />
                    <button type="button" class="remove-image"
                      onclick={() => { newEntryImagePreview = null; newEntryImageFile = null; }}>✕</button>
                    <div class="image-overlay"><span>Klik atau drag untuk mengganti</span></div>
                  {:else}
                    <div class="upload-placeholder">
                      <span class="upload-icon">🖼️</span>
                      <p>Klik atau drag gambar ke sini</p>
                      <small>PNG, JPG, WEBP maks. 5MB</small>
                    </div>
                  {/if}
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/jpg"
                    onchange={handleNewEntryImageChange} class="image-input" />
                </div>
              </div>
              <div class="fg full">
                <label class="fl">Atau URL Gambar</label>
                <input class="fi" type="url" bind:value={newEntryDraft.imageUrl}
                  placeholder="https://example.com/image.jpg" />
              </div>
              <div class="fg full">
                <label class="fl">Catatan</label>
                <textarea class="fi fta" rows="2" bind:value={newEntryDraft.note}
                  placeholder="Catatan tambahan..."></textarea>
              </div>
            </div>

            <div class="ne-form-actions">
              <button class="btn-ghost"
                onclick={() => { showNewEntryForm = false; errorMessage = null; resetDraft(); }}>
                Batal
              </button>
              <button class="btn-cyan" onclick={addNewEntry}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                Tambahkan Card
              </button>
            </div>
          </div>
        {:else}
          <button class="btn-add-new" style="margin-top:1rem"
            onclick={() => { showNewEntryForm = true; errorMessage = null; resetDraft(); }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            + Tambah Card Baru di Section Ini
          </button>
        {/if}
      </div>
    </div>
  {/if}

  <!-- ═══════════ SUMMARY ═══════════ -->
  {:else}
    <div class="summary">
      <div class="sum-hd">
        <h2>Ringkasan Audit</h2>
        <p>{audit?.cabinetName} / {audit?.sectionName}</p>
      </div>

      <div class="sum-stats">
        {#each ([['match','✓','Match'],['mismatch','⚠','Mismatch'],['missing','✕','Missing']] as const) as [k,i,l]}
          <div class="sstat {k}">
            <span class="snum">{(stats as any)[k]}</span>
            <span class="slbl">{i} {l}</span>
          </div>
        {/each}
        {#if newEntries.length > 0}
          <div class="sstat ne"><span class="snum">{newEntries.length}</span><span class="slbl">+ Baru</span></div>
        {/if}
        <div class="sstat tot"><span class="snum">{localItems.length}</span><span class="slbl">Total</span></div>
      </div>

      <!-- Catatan audit keseluruhan -->
      <div class="audit-note-section">
        <label class="note-label">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          Catatan Audit (opsional)
        </label>
        <textarea
          class="audit-note-textarea"
          rows="3"
          bind:value={auditNote}
          placeholder="Tulis catatan untuk sesi audit ini, misal: kondisi fisik kartu, kendala saat audit, rekomendasi, dll..."
        ></textarea>
        <span class="note-hint">Catatan ini akan tersimpan bersama hasil audit</span>
      </div>

      <!-- Perubahan stok -->
      {#if localItems.some(i => i.itemStatus !== 'MATCH')}
        <div class="changes">
          <div class="ch-title">📋 Perubahan Stok</div>
          {#each localItems.filter(i => i.itemStatus !== 'MATCH') as item}
            {@const cfg = statusCfg[item.itemStatus]}
            <div class="ch-row" style="border-left:3px solid {cfg.color}">
              <div class="ch-left">
                <span style="color:{cfg.color};font-size:11px;font-weight:600">{cfg.icon} {cfg.label}</span>
                <span class="ch-name">{item.card?.name ?? '(Item dihapus)'}</span>
              </div>
              <div class="ch-right">
                {item.systemStock} → {item.itemStatus === 'MISSING' ? 0 : (item.physicalStock ?? '?')}
              </div>
            </div>
            {#if item.note}
              <div class="item-note-row">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <span>📝 {item.note}</span>
              </div>
            {/if}
          {/each}
        </div>
      {/if}

      <!-- Card baru -->
      {#if newEntries.length > 0}
        <div class="changes">
          <div class="ch-title">➕ Card Baru</div>
          {#each newEntries as entry (entry.tempId)}
            <div class="ch-row" style="border-left:3px solid #00ccff">
              <div class="ch-left">
                <span style="color:#00ccff;font-size:11px;font-weight:600">+ NEW</span>
                <span class="ch-name">{entry.name}</span>
              </div>
              <div class="ch-right">
                {#if entry.priceIDR}
                  {fmtIDR(entry.priceIDR)}
                {:else}
                  {entry.category} · {entry.subCategory}
                {/if}
              </div>
            </div>
            {#if entry.note}
              <div class="item-note-row new-note">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <span>📝 {entry.note}</span>
              </div>
            {/if}
          {/each}
        </div>
      {/if}

      {#if errorMessage}
        <div class="err-box">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {errorMessage}
        </div>
      {/if}

      <div class="sum-actions">
        <button class="btn-ghost" onclick={() => showSummary = false}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Kembali Edit
        </button>
        <button class="btn-grad" onclick={submitAudit} disabled={isSubmitting}>
          {#if isSubmitting}
            <span class="spinner"></span> Mengirim...
          {:else}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Submit Audit
          {/if}
        </button>
      </div>
    </div>
  {/if}

  <!-- ── Modal Sukses ──────────────────────────────────────── -->
  {#if showSuccessModal}
    <div class="modal-overlay">
      <div class="modal-success">
        <div class="modal-success-icon">✅</div>
        <h2 class="modal-success-title">Audit Berhasil Disubmit!</h2>
        <p class="modal-success-desc">
          Stock audit telah selesai. Silakan lanjutkan ke halaman laporan untuk melakukan tanda tangan.
        </p>
        <div class="modal-success-actions">
          <button class="btn-secondary" onclick={goToDashboard}>Kembali ke Dashboard</button>
          <button class="btn-primary" onclick={goToLaporan}>Lanjut ke Laporan →</button>
        </div>
      </div>
    </div>
  {/if}

</div>

<style>
/* ── Reset & Base ─────────────────────────────────────────── */
.page {
  max-width: 1080px;
  margin: 0 auto;
  padding: 1.5rem 1rem 3rem;
  font-family: 'Inter', system-ui, sans-serif;
  color: rgba(255,255,255,0.88);
  min-height: 100vh;
}

/* ── Header ───────────────────────────────────────────────── */
.page-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  background: none;
  border: none;
  color: rgba(255,255,255,0.4);
  font-size: 13px;
  cursor: pointer;
  flex-shrink: 0;
}
.back-btn:hover { color: rgba(255,255,255,0.8); }

.header-mid { flex: 1; min-width: 0; }

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 5px;
}
.bc-cab { color: rgba(255,255,255,0.4); }
.bc-sep { color: rgba(255,255,255,0.2); }
.bc-sec { color: #00ff9d; }

.pills { display: flex; gap: 5px; flex-wrap: wrap; }
.pill {
  font-size: 10px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 99px;
}
.pill.match    { background: rgba(0,255,157,0.1);  color: #00ff9d; }
.pill.mismatch { background: rgba(255,170,0,0.1);  color: #ffaa00; }
.pill.missing  { background: rgba(255,107,107,0.1);color: #ff6b6b; }
.pill.unchecked{ background: rgba(255,255,255,0.05);color: rgba(255,255,255,0.4); }
.pill.newentry { background: rgba(0,204,255,0.1);  color: #00ccff; }

.header-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

.mode-toggle {
  display: flex;
  gap: 2px;
  background: #1a1a2a;
  border-radius: 8px;
  padding: 3px;
}
.mtbtn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border-radius: 6px;
  border: none;
  background: none;
  color: rgba(255,255,255,0.35);
  font-size: 12px;
  cursor: pointer;
}
.mtbtn.active { background: #2a2a3a; color: #fff; }

.btn-ring {
  padding: 5px 13px;
  background: rgba(0,255,157,0.08);
  border: 1px solid rgba(0,255,157,0.22);
  border-radius: 8px;
  color: #00ff9d;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

/* ── Progress ─────────────────────────────────────────────── */
.prog-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 1.25rem;
}
.prog-track {
  flex: 1;
  height: 3px;
  background: rgba(255,255,255,0.07);
  border-radius: 2px;
  overflow: hidden;
}
.prog-fill {
  height: 100%;
  background: linear-gradient(90deg, #00ff9d, #00ccff);
  border-radius: 2px;
  transition: width .3s;
}
.prog-txt { font-size: 11px; color: rgba(255,255,255,0.3); white-space: nowrap; }

/* ── Toolbar ──────────────────────────────────────────────── */
.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 8px 12px;
  margin-bottom: 10px;
  background: #14141f;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 10px;
}
.sel-all {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  color: rgba(255,255,255,0.55);
  cursor: pointer;
  white-space: nowrap;
}
.chk { width: 14px; height: 14px; accent-color: #00ff9d; cursor: pointer; }
.bulk-row { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
.bulk-ct { font-size: 12px; color: #00ff9d; font-weight: 500; white-space: nowrap; }
.bulk-sel {
  padding: 4px 8px;
  background: #1a1a2a;
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 6px;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
}
.bulk-apply {
  padding: 4px 11px;
  background: rgba(0,255,157,0.1);
  border: 1px solid rgba(0,255,157,0.25);
  border-radius: 6px;
  color: #00ff9d;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}
.bulk-apply:disabled { opacity: .35; cursor: not-allowed; }
.bulk-cancel {
  padding: 4px 9px;
  background: none;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 6px;
  color: rgba(255,255,255,0.4);
  font-size: 12px;
  cursor: pointer;
}

/* ── Card List ────────────────────────────────────────────── */
.card-list { display: flex; flex-direction: column; gap: 5px; margin-bottom: 10px; }

.lcard {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #14141f;
  border: 1px solid rgba(255,255,255,0.06);
  border-left: 3px solid var(--sc);
  border-radius: 10px;
  flex-wrap: wrap;
}
.lcard-sel {
  background: rgba(0,255,157,0.03);
  border-color: rgba(0,255,157,0.18);
  border-left-color: var(--sc);
}
.lchk { display: flex; align-items: center; flex-shrink: 0; }
.limg {
  width: 42px; height: 42px;
  border-radius: 7px; overflow: hidden;
  flex-shrink: 0; background: #1a1a2a;
}
.limg img { width: 100%; height: 100%; object-fit: cover; }
.limg-ph {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  color: rgba(255,255,255,0.15);
}
.linfo { flex: 1; min-width: 120px; }
.lname { font-size: 13px; font-weight: 500; margin-bottom: 2px; }
.lmeta { font-size: 11px; color: rgba(255,255,255,0.35); margin-bottom: 3px; }
.lprices { display: flex; gap: 7px; align-items: center; flex-wrap: wrap; }
.lp { font-size: 11px; font-weight: 600; }
.lp.idr { color: #00ff9d; }
.lp-note { font-size: 10px; color: rgba(255,255,255,0.3); }

.lstocks { display: flex; flex-direction: column; gap: 3px; min-width: 88px; }
.sr { display: flex; align-items: center; gap: 6px; }
.sl { font-size: 10px; color: rgba(255,255,255,0.3); width: 34px; }
.sv { font-size: 13px; font-weight: 500; }
.sinp {
  width: 56px;
  padding: 3px 6px;
  background: #1a1a2a;
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 5px;
  color: #fff;
  font-size: 12px;
  text-align: center;
}
.sinp:focus { outline: none; border-color: rgba(0,255,157,0.4); }

.lnote { flex: 1; min-width: 140px; }
.note-input {
  width: 100%;
  padding: 6px 8px;
  background: #1a1a2a;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 6px;
  color: rgba(255,255,255,0.6);
  font-size: 11px;
  font-family: 'Inter', monospace;
  box-sizing: border-box;
}
.note-input:focus { outline: none; border-color: rgba(0,255,157,0.4); }
.note-input::placeholder { color: rgba(255,255,255,0.2); font-style: italic; }

.lright { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; flex-shrink: 0; }
.spill {
  font-size: 10px; font-weight: 600;
  padding: 3px 9px; border-radius: 99px;
  letter-spacing: .04em; white-space: nowrap;
}
.qbtns { display: flex; gap: 3px; }
.qbtn {
  width: 21px; height: 21px;
  border-radius: 5px;
  border: 1px solid rgba(255,255,255,0.07);
  background: #1a1a2a;
  color: var(--qc);
  font-size: 10px;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.qbtn:hover { background: #2a2a3a; }

/* ── New Entries List ─────────────────────────────────────── */
.ne-list {
  background: rgba(0,204,255,0.04);
  border: 1px solid rgba(0,204,255,0.12);
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 8px;
}
.ne-list-header {
  padding: 7px 13px;
  font-size: 11px; font-weight: 500;
  color: #00ccff;
  border-bottom: 1px solid rgba(0,204,255,0.1);
}
.ne-row {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 13px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.ne-img {
  width: 40px; height: 40px;
  border-radius: 6px; overflow: hidden;
  background: #1a1a2a;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.ne-img img { width: 100%; height: 100%; object-fit: cover; }
.ne-img-ph { font-size: 20px; }
.ne-info {
  flex: 1; display: flex; align-items: center;
  gap: 10px; flex-wrap: wrap;
}
.ne-name { font-size: 13px; font-weight: 500; }
.ne-meta { font-size: 11px; color: rgba(255,255,255,0.35); }
.ne-del {
  background: none; border: none;
  color: rgba(255,107,107,0.5);
  cursor: pointer; padding: 3px;
  display: flex; align-items: center; flex-shrink: 0;
}
.ne-del:hover { color: #ff6b6b; }

/* ── New Entry Form ───────────────────────────────────────── */
.ne-form {
  background: #14141f;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  padding: 1.1rem;
  margin-bottom: 8px;
}
.ne-form-title { font-size: 12px; font-weight: 500; color: #00ccff; margin-bottom: .85rem; }
.ne-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; margin-bottom: .9rem; }
.fg { display: flex; flex-direction: column; gap: 5px; }
.fg.full { grid-column: 1 / -1; }
.fl { font-size: 11px; font-weight: 500; color: rgba(255,255,255,0.5); }
.req { color: #ff6b6b; }
.fi {
  padding: 7px 10px;
  background: #1a1a2a;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 7px;
  color: #fff; font-size: 13px; font-family: inherit;
  width: 100%; box-sizing: border-box;
}
.fi:focus { outline: none; border-color: rgba(0,255,157,0.35); }
.fi.fi-ok   { border-color: rgba(0,255,157,0.4); }
.fi.fi-warn { border-color: rgba(255,170,0,0.4); }
.fta { resize: vertical; min-height: 58px; }
.hint { display: block; font-size: 10px; color: rgba(255,255,255,0.3); margin-top: 4px; }

/* Image upload */
.image-upload-area {
  position: relative; width: 100%; min-height: 120px;
  background: #1a1a2a;
  border: 2px dashed rgba(255,255,255,0.15);
  border-radius: 10px; overflow: hidden;
  cursor: pointer; transition: border-color .2s;
}
.image-upload-area:hover { border-color: #00ff9d; }
.image-upload-area.has-image { border-color: #00ff9d; }
.upload-placeholder {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 1rem; text-align: center;
  color: rgba(255,255,255,0.4);
}
.upload-icon { font-size: 2rem; margin-bottom: .25rem; }
.image-preview { width: 100%; height: 120px; object-fit: contain; }
.remove-image {
  position: absolute; top: .25rem; right: .25rem;
  width: 24px; height: 24px;
  background: rgba(0,0,0,0.7);
  border: none; border-radius: 50%;
  color: #fff; cursor: pointer; font-size: 11px;
}
.image-overlay {
  position: absolute; bottom: 0; left: 0; right: 0;
  padding: .25rem; background: rgba(0,0,0,0.5);
  text-align: center; font-size: 10px;
  color: rgba(255,255,255,0.7);
}
.image-input {
  position: absolute; top: 0; left: 0;
  width: 100%; height: 100%;
  opacity: 0; cursor: pointer;
}

/* Form actions */
.ne-form-actions {
  display: flex; justify-content: flex-end;
  gap: 7px; margin-top: .5rem;
}
.btn-add-new {
  display: flex; align-items: center; justify-content: center;
  gap: 6px; padding: 8px 16px; width: 100%;
  background: rgba(0,204,255,0.06);
  border: 1px dashed rgba(0,204,255,0.25);
  border-radius: 9px; color: #00ccff;
  font-size: 13px; cursor: pointer;
  margin-bottom: 8px; transition: background .12s;
}
.btn-add-new:hover { background: rgba(0,204,255,0.1); }
.btn-cyan {
  display: flex; align-items: center; gap: 5px;
  padding: 6px 14px;
  background: rgba(0,204,255,0.12);
  border: 1px solid rgba(0,204,255,0.28);
  border-radius: 7px; color: #00ccff;
  font-size: 12px; font-weight: 500; cursor: pointer;
}
.btn-ghost {
  display: flex; align-items: center; gap: 5px;
  padding: 6px 14px;
  background: none;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 7px; color: rgba(255,255,255,0.45);
  font-size: 12px; cursor: pointer;
}
.inline-err {
  font-size: 12px; color: #ff6b6b;
  background: rgba(255,107,107,0.07);
  border: 1px solid rgba(255,107,107,0.18);
  border-radius: 6px; padding: 7px 10px;
  margin-bottom: 9px;
}
.diff-note { font-size: 11px; color: #ffaa00; }
.miss-alert {
  display: flex; align-items: center; gap: 7px;
  padding: 9px 10px;
  background: rgba(255,107,107,0.07);
  border: 1px solid rgba(255,107,107,0.18);
  border-radius: 8px; color: #ff6b6b; font-size: 12px;
}
.list-foot { display: flex; justify-content: flex-end; padding: .5rem 0 1rem; }
.btn-grad {
  display: flex; align-items: center; gap: 6px;
  padding: 9px 20px;
  background: linear-gradient(135deg, #00ff9d, #00ccff);
  border: none; border-radius: 30px;
  color: #000; font-weight: 600; font-size: 13px;
  cursor: pointer;
}
.btn-grad:disabled { opacity: .55; cursor: not-allowed; }

/* ── Single Layout ────────────────────────────────────────── */
.single-layout { display: grid; grid-template-columns: 200px 1fr; gap: 1rem; align-items: start; }

.snav {
  background: #14141f;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px; overflow: hidden;
  position: sticky; top: 1rem;
  max-height: calc(100vh - 130px);
  overflow-y: auto;
}
.snav-title {
  font-size: 10px; font-weight: 600;
  color: rgba(255,255,255,0.28);
  text-transform: uppercase; letter-spacing: .07em;
  padding: 9px 12px 7px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.snav-divider {
  font-size: 10px; font-weight: 600;
  color: rgba(0,204,255,0.55);
  text-transform: uppercase; letter-spacing: .06em;
  padding: 7px 12px 5px;
  border-top: 1px solid rgba(255,255,255,0.05);
  background: rgba(0,204,255,0.04);
}
.snav-item {
  display: flex; align-items: center; gap: 7px;
  padding: 7px 12px;
  background: none; border: none;
  border-left: 2px solid transparent;
  width: 100%; text-align: left;
  color: rgba(255,255,255,0.45); font-size: 11px;
  cursor: pointer;
}
.snav-item:hover { background: rgba(255,255,255,0.04); }
.snav-active { background: rgba(255,255,255,0.05); border-left-color: var(--sc); color: #fff; }
.snav-new { cursor: default; }
.sdot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.sname { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sico { font-size: 10px; flex-shrink: 0; }

.sbar { display: flex; gap: 7px; margin-bottom: .9rem; }
.sopt {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; gap: 3px;
  padding: 9px 6px;
  background: #1a1a2a;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  color: rgba(255,255,255,0.32); font-size: 12px; font-weight: 500;
  cursor: pointer;
}
.sopt.sopt-on { background: var(--sbg); border-color: var(--sbd); color: var(--sc); }
.sopt small { font-size: 9px; font-weight: normal; }
.sopt-ico { font-size: 14px; }

.scard {
  background: #14141f;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px; overflow: hidden;
}
.scard-top {
  display: flex; justify-content: space-between; align-items: center;
  padding: 9px 14px;
  background: #1a1a2a;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  flex-wrap: wrap; gap: 6px;
}
.scbadges { display: flex; gap: 5px; }
.cb { font-size: 10px; font-weight: 500; padding: 2px 8px; border-radius: 99px; }
.cb.cat { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.65); }
.cb.sub { background: rgba(0,255,157,0.1); color: #00ff9d; }
.sys-stk { font-size: 12px; color: rgba(0,204,255,0.75); }
.sys-stk strong { font-weight: 600; }

.scard-body { display: grid; grid-template-columns: 150px 1fr; gap: 1.1rem; padding: 1.1rem; }
.simg-wrap {
  aspect-ratio: 1; background: #1a1a2a;
  border-radius: 10px; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
}
.simg { width: 100%; height: 100%; object-fit: cover; }
.simg-ph { color: rgba(255,255,255,0.1); }

.sdetail { display: flex; flex-direction: column; gap: .9rem; }
.scard-name { font-size: 1rem; font-weight: 600; margin: 0; }

.price-block {
  display: flex; gap: .9rem; flex-wrap: wrap;
  padding: 9px; background: #1a1a2a; border-radius: 8px;
}
.price-row { display: flex; align-items: baseline; gap: 5px; font-size: 12px; }
.price-row.idr strong { color: #00ff9d; }
.pnote { font-size: 10px; color: rgba(255,255,255,0.28); }

.scard-nav {
  display: flex; justify-content: space-between; align-items: center;
  padding: 9px 14px;
  border-top: 1px solid rgba(255,255,255,0.05);
}
.nav-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 6px 13px;
  background: #1a1a2a;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 30px;
  color: rgba(255,255,255,0.45); font-size: 12px;
  cursor: pointer;
}
.nav-btn:disabled { opacity: .3; cursor: not-allowed; }
.nav-btn:hover:not(:disabled) { background: #2a2a3a; }
.nav-p { background: rgba(0,255,157,0.07); border-color: rgba(0,255,157,0.22); color: #00ff9d; }
.nav-idx { font-size: 11px; color: rgba(255,255,255,0.28); }

/* ── Summary ──────────────────────────────────────────────── */
.summary {
  max-width: 700px; margin: 0 auto;
  background: #14141f;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 20px; padding: 1.8rem;
}
.sum-hd { text-align: center; margin-bottom: 1.5rem; }
.sum-hd h2 {
  font-size: 1.3rem; font-weight: 700; margin: 0 0 4px;
  background: linear-gradient(135deg, #fff, #00ff9d);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.sum-hd p { font-size: 13px; color: rgba(255,255,255,0.4); margin: 0; }

.sum-stats { display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; margin-bottom: 1.5rem; }
.sstat { text-align: center; padding: 12px 16px; background: #1a1a2a; border-radius: 12px; min-width: 70px; }
.snum { display: block; font-size: 1.5rem; font-weight: 700; }
.sstat.match   .snum { color: #00ff9d; }
.sstat.mismatch .snum { color: #ffaa00; }
.sstat.missing  .snum { color: #ff6b6b; }
.sstat.ne       .snum { color: #00ccff; }
.sstat.tot      .snum { color: #fff; }
.slbl { font-size: 10px; color: rgba(255,255,255,0.4); }

.audit-note-section {
  margin: 1rem 0 1.5rem;
  padding: 1rem;
  background: #1a1a2a;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.05);
}
.note-label {
  display: flex; align-items: center; gap: .5rem;
  font-size: .8rem; font-weight: 600;
  color: rgba(255,255,255,0.7); margin-bottom: .5rem;
}
.audit-note-textarea {
  width: 100%; padding: .75rem;
  background: #14141f;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px; color: #fff;
  font-size: .85rem; font-family: 'Inter', sans-serif;
  resize: vertical; box-sizing: border-box;
}
.audit-note-textarea:focus { outline: none; border-color: #00ff9d; }
.note-hint { display: block; font-size: .65rem; color: rgba(255,255,255,0.35); margin-top: .5rem; }

.changes { margin-bottom: 1.2rem; }
.ch-title {
  font-size: 11px; font-weight: 600;
  color: rgba(255,255,255,0.4);
  text-transform: uppercase; letter-spacing: 1px;
  margin-bottom: 8px;
}
.ch-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 12px; background: #1a1a2a;
  border-radius: 10px; margin-bottom: 6px;
  flex-wrap: wrap; gap: 8px;
}
.ch-left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.ch-name { font-size: 13px; font-weight: 500; }
.ch-right { font-size: 12px; color: rgba(255,255,255,0.5); font-family: monospace; }

.item-note-row {
  margin: -.25rem 0 .5rem 2rem;
  padding: .5rem .75rem;
  background: rgba(255,255,255,0.03);
  border-radius: 8px;
  display: flex; align-items: flex-start; gap: .5rem;
  font-size: .7rem; color: rgba(255,255,255,0.5);
}
.item-note-row svg { flex-shrink: 0; margin-top: .1rem; }
.item-note-row.new-note {
  background: rgba(0,204,255,0.05);
  border-left: 2px solid #00ccff;
}

.err-box {
  display: flex; align-items: center; gap: 8px;
  padding: 12px;
  background: rgba(255,107,107,0.1);
  border: 1px solid rgba(255,107,107,0.2);
  border-radius: 10px; color: #ff6b6b;
  font-size: 13px; margin-bottom: 1rem;
}
.sum-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 1rem; }

/* ── Modal Sukses ─────────────────────────────────────────── */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.85);
  backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
  animation: fadeIn .2s ease;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.modal-success {
  background: #14141f;
  border: 1px solid rgba(0,255,157,0.3);
  border-radius: 24px;
  padding: 2rem 2rem 1.5rem;
  width: 400px; max-width: 90%;
  text-align: center;
  animation: slideUp .3s ease;
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px); }
  to   { opacity: 1; transform: translateY(0); }
}
.modal-success-icon { font-size: 4rem; margin-bottom: .5rem; }
.modal-success-title { font-size: 1.3rem; font-weight: 700; color: #00ff9d; margin-bottom: .5rem; }
.modal-success-desc {
  font-size: .85rem; color: rgba(255,255,255,0.6);
  margin-bottom: 1.5rem; line-height: 1.5;
}
.modal-success-actions { display: flex; gap: 1rem; }
.modal-success-actions .btn-secondary,
.modal-success-actions .btn-primary {
  flex: 1; padding: .6rem; border-radius: 30px;
  font-size: .8rem; font-weight: 600;
  cursor: pointer; text-align: center; border: none;
}
.modal-success-actions .btn-secondary {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.7);
}
.modal-success-actions .btn-secondary:hover { background: rgba(255,255,255,0.1); }
.modal-success-actions .btn-primary {
  background: linear-gradient(135deg, #00ff9d, #00ccff);
  color: #000;
}
.modal-success-actions .btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(0,255,157,0.3);
}

.spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(0,0,0,0.2);
  border-top-color: #000;
  border-radius: 50%;
  animation: spin .6s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Responsive ───────────────────────────────────────────── */
@media (max-width: 640px) {
  .single-layout { grid-template-columns: 1fr; }
  .snav { position: static; max-height: 170px; }
  .scard-body { grid-template-columns: 1fr; }
  .ne-grid { grid-template-columns: 1fr; }
  .sum-actions { flex-direction: column; }
  .modal-success-actions { flex-direction: column; }
}
</style>