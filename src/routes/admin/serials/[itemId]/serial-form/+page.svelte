<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let { data } = $props();
  let item = $derived(data?.item);
  let editSerial = $derived(data?.serial);
  let isEdit = $derived(data?.isEdit);

  let loading = $state(false);
  let error = $state<string | null>(null);

  let form = $state({
    serialNumber: editSerial?.serialNumber || '',
    grade: editSerial?.grade || 'A',
    status: editSerial?.status || 'AVAILABLE',
    price: editSerial?.price ?? 0,
    costPrice: editSerial?.costPrice ?? 0,
    spec: editSerial?.spec || '',
    videoUrl: editSerial?.videoUrl || '',
    qrCustomUrl: editSerial?.qrCustomUrl || ''
  });

  function fmtPrice(val: number): string {
    if (!val || val === 0) return '';
    return val.toLocaleString('id-ID');
  }

  function parsePrice(raw: string): number {
    return parseInt(raw.replace(/[^0-9]/g, '')) || 0;
  }

  let quillEl: HTMLDivElement;
  let quill: any;

  onMount(() => {
    try {
      const Quill = (window as any).Quill;
      if (!quillEl || !Quill) return;
      quill = new Quill(quillEl, {
        theme: 'snow',
        modules: {
          toolbar: [
            [{ header: [1,2,3,false] }],
            ['bold','italic','underline','strike'],
            [{ list: 'ordered' },{ list: 'bullet' }],
            ['link','image'],
            ['clean']
          ]
        },
        placeholder: 'Tulis spesifikasi...'
      });
      if (form.spec) quill.root.innerHTML = form.spec;
      quill.on('text-change', () => { form.spec = quill.root.innerHTML; });
    } catch (e) {
      console.error('Quill failed to load:', e);
    }
  });

  async function submit() {
    if (!form.serialNumber.trim()) { error = 'Serial number tidak boleh kosong'; return; }
    loading = true; error = null;
    try {
      if (quill) form.spec = quill.root.innerHTML;

      const url = isEdit ? `/api/admin/serials/${editSerial.id}` : `/api/admin/items/${item?.id}/serials`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const r = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!r.ok) {
        let msg = 'Gagal menyimpan';
        try { const d = await r.json(); msg = d.error || msg; } catch {}
        error = msg;
        loading = false;
        return;
      }

      const d = await r.json();
      loading = false;
      if (!isEdit) {
        await goto(`/admin/serials/${item?.id}/serial-form?serialId=${d.data.id}`);
      } else {
        await goto(`/admin/serials/${item?.id}`);
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        error = 'Server tidak merespon, coba lagi';
      } else {
        error = e.message || 'Terjadi kesalahan';
      }
      loading = false;
    }
  }

  async function uploadImages(serialId: number, files: FileList) {
    const fd = new FormData();
    Array.from(files).forEach(f => fd.append('images', f));
    await fetch(`/api/admin/serials/${serialId}/images`, { method: 'POST', body: fd });
    window.location.reload();
  }

  async function setMain(serialId: number, imageId: number, url: string) {
    await fetch(`/api/admin/serials/${serialId}/images/${imageId}`, { method: 'PATCH' });
    await fetch(`/api/admin/serials/${serialId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ spec: `<img src="${url}" style="max-width:100%"/>` }) });
    window.location.reload();
  }

  async function delImage(serialId: number, imageId: number) {
    if (!confirm('Delete this image?')) return;
    await fetch(`/api/admin/serials/${serialId}/images/${imageId}`, { method: 'DELETE' });
    window.location.reload();
  }
</script>

<svelte:head>
  <title>{isEdit ? 'Edit' : 'Add'} Serial — {item?.name}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <link href="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css" rel="stylesheet" />
  <script src="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.js"></script>
  <style>
    :global(body) { margin: 0; overflow: hidden; font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: #0b0b0c; }
    :global(.ql-toolbar) { border-bottom: 1px solid rgba(255,255,255,0.08) !important; background: #eff6ff !important; padding: 6px 10px !important; }
    :global(.ql-container) { border: none !important; font-size: 0.9rem !important; font-family: 'Inter', sans-serif !important; }
    :global(.ql-editor) { min-height: 140px; max-height: 250px; overflow-y: auto; padding: 8px 10px !important; }
    :global(.ql-toolbar button) { width: 28px; height: 28px; border-radius: 6px; }
    :global(.ql-toolbar button:hover) { background: rgba(255,255,255,0.08); }
    :global(.ql-toolbar button.ql-active) { color: #3b82f6 !important; }
  </style>
</svelte:head>

<div class="screen">
  <div class="screen-inner">
  <!-- Header -->
  <div class="header">
    <a href="/admin/serials/{item?.id}" class="back-btn">← Kembali</a>
    <div class="header-info">
      <h1>{isEdit ? 'Edit' : 'Tambah'} Serial</h1>
      <span class="item-name">{item?.name} <span class="id">#{item?.id}</span></span>
    </div>
    <div class="header-actions">
      <button type="button" class="btn-outline" onclick={() => goto(`/admin/serials/${item?.id}`)}>Batal</button>
      <button type="submit" class="btn-primary" onclick={submit} disabled={loading}>
        {loading ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan' : 'Buat Serial')}
      </button>
    </div>
  </div>

  <!-- Error -->
  {#if error}<div class="error-bar">{error}</div>{/if}

  <!-- Main Content -->
  <div class="main">
    <!-- Sidebar: Form Fields -->
    <div class="sidebar">
      <div class="section">
        <div class="section-title">Identitas Serial</div>
        <div class="field">
          <label>Serial Number</label>
          <input bind:value={form.serialNumber} placeholder="IP14PM-001" required />
        </div>
        <div class="row-2">
          <div class="field">
            <label>Grade</label>
            <select bind:value={form.grade} class="grade-select">
              <option value="A">Grade A — Premium</option>
              <option value="B">Grade B — Baik</option>
              <option value="C">Grade C — Cukup</option>
              <option value="Refurbished">Refurbished — Rekondisi</option>
            </select>
          </div>
          <div class="field">
            <label>Stok</label>
            <div class="toggle-group">
              <select bind:value={form.status} style="width:100%;padding:0.65rem;border:1.5px solid #e5e3f0;border-radius:9px;font-size:0.875rem;">
                <option value="AVAILABLE">Tersedia</option>
                <option value="SOLD">Terjual</option>
                <option value="USED">Terpakai</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Harga</div>
        <div class="field">
          <label>Harga Jual (Rp)</label>
          <input type="text" value={fmtPrice(form.price)} oninput={(e: any) => form.price = parsePrice(e.target.value)} placeholder="Rp 0" inputmode="numeric" />
        </div>
        <div class="field">
          <label>Harga Modal (Rp)</label>
          <input type="text" value={fmtPrice(form.costPrice)} oninput={(e: any) => form.costPrice = parsePrice(e.target.value)} placeholder="Rp 0" inputmode="numeric" />
        </div>
      </div>

      <div class="section">
        <div class="section-title">Tautan</div>
        <div class="field">
          <label>Video URL</label>
          <input bind:value={form.videoUrl} placeholder="https://youtube.com/..." />
        </div>
        <div class="field">
          <label>QR Custom URL</label>
          <input bind:value={form.qrCustomUrl} placeholder="https://..." />
        </div>
      </div>
    </div>

    <!-- Center: Specifications -->
    <div class="center">
      <div class="section-title">Spesifikasi</div>
      <div class="editor-wrap" bind:this={quillEl}></div>
    </div>

    <!-- Right: Images -->
    <div class="right">
      <div class="section-title">Gambar</div>
      {#if isEdit}
        <div class="img-grid">
          {#each editSerial.images as img}
            <div class="img-card" class:main={img.isMain}>
              <img src={img.url} alt="" />
              <div class="img-overlay">
                {#if !img.isMain}
                  <button type="button" class="i-btn" onclick={() => setMain(editSerial.id, img.id, img.url)} title="Jadikan utama">★</button>
                {/if}
                <button type="button" class="i-btn del" onclick={() => delImage(editSerial.id, img.id)} title="Hapus">✕</button>
              </div>
              {#if img.isMain}<span class="main-badge">Utama</span>{/if}
            </div>
          {/each}
          <label class="img-upload">
            <input type="file" accept="image/*" multiple hidden onchange={(e: any) => uploadImages(editSerial.id, e.target.files)} />
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <span>Tambah Gambar</span>
          </label>
        </div>
      {:else}
        <div class="empty-img">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          <p>Simpan serial terlebih dahulu,<br/>kemudian upload gambar.</p>
        </div>
      {/if}
    </div>
  </div>
  </div>
</div>

<style>
  .screen { min-height: 100vh; display: flex; flex-direction: column; align-items: center; background: #f8fafc; }
  .screen-inner { width: 100%; max-width: 1200px; display: flex; flex-direction: column; padding-bottom: 1rem; }

  /* Header */
  .header { display: flex; align-items: center; gap: 1rem; padding: 0.6rem 1.25rem; background: white; border-bottom: 1px solid #e2e8f0; flex-shrink: 0; }
  .back-btn { color: #3b82f6; text-decoration: none; font-size: 0.9rem; font-weight: 500; white-space: nowrap; }
  .header-info { flex: 1; }
  .header-info h1 { margin: 0; font-size: 1.05rem; font-weight: 600; color: #0f172a; }
  .item-name { font-size: 0.8rem; color: #64748b; }
  .id { background: #f1f5f9; padding: 0.1rem 0.4rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
  .header-actions { display: flex; gap: 0.5rem; flex-shrink: 0; }

  .btn-primary { background: #3b82f6; color: white; padding: 0.5rem 1.25rem; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; white-space: nowrap; }
  .btn-primary:hover { background: #6d28d9; }
  .btn-primary:disabled { opacity: 0.6; }
  .btn-outline { background: white; color: #3b82f6; padding: 0.5rem 1rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.85rem; cursor: pointer; }
  .btn-outline:hover { background: #f1f5f9; }

  .error-bar { padding: 0.5rem 1.25rem; background: #fef2f2; color: #dc2626; font-size: 0.85rem; flex-shrink: 0; }

  /* 3-Column Layout */
  .main { display: grid; grid-template-columns: 300px 1.2fr 340px; gap: 0.75rem; padding: 0.75rem; }

  /* Sidebar */
  .sidebar { display: flex; flex-direction: column; gap: 0.75rem; }
  .grade-select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237c3aed' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; padding-right: 30px; cursor: pointer; font-weight: 500; }
  .sidebar > .section { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 0.875rem; }
  .section-title { font-size: 0.65rem; font-weight: 700; color: #3b82f6; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 0.6rem; }

  .field { margin-bottom: 0.5rem; }
  .field:last-child { margin-bottom: 0; }
  .field label { display: block; font-size: 0.65rem; font-weight: 600; color: #3b82f6; margin-bottom: 0.25rem; }
  .field input, .field select { width: 100%; padding: 0.45rem 0.6rem; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.85rem; background: white; }

  .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
  .toggle-group { display: flex; gap: 0.25rem; }
  .toggle-btn { flex: 1; padding: 0.4rem; border: 2px solid #e2e8f0; border-radius: 8px; background: white; cursor: pointer; font-size: 0.75rem; font-weight: 600; color: #64748b; transition: all 0.15s; }
  .toggle-btn.active:first-child { border-color: #3b82f6; background: #eff6ff; color: #3b82f6; }
  .toggle-btn.active:last-child { border-color: #dc2626; background: #fef2f2; color: #dc2626; }

  /* Center */
  .center { display: flex; flex-direction: column; background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 0.75rem; }
  .center .section-title { margin-bottom: 0.4rem; }
  .editor-wrap { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; }
  .editor-wrap :global(.ql-toolbar) { flex-shrink: 0; }
  .editor-wrap :global(.ql-container) { flex: 1; }
  .editor-wrap :global(.ql-editor) { min-height: 0; max-height: none; }

  /* Right */
  .right { display: flex; flex-direction: column; background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 0.75rem; }
  .right .section-title { margin-bottom: 0.4rem; }

  .img-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; align-content: flex-start; }
  .img-card { position: relative; width: 100px; height: 100px; border-radius: 8px; overflow: hidden; border: 2px solid #e2e8f0; }
  .img-card.main { border-color: #3b82f6; }
  .img-card img { width: 100%; height: 100%; object-fit: cover; }
  .img-overlay { position: absolute; top: 4px; right: 4px; display: flex; gap: 2px; }
  .i-btn { width: 22px; height: 22px; border: none; border-radius: 4px; background: rgba(0,0,0,0.55); color: white; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .i-btn.del:hover { background: rgba(220,38,38,0.9); }
  .main-badge { position: absolute; bottom: 4px; left: 4px; background: #3b82f6; color: white; font-size: 0.6rem; padding: 0.1rem 0.4rem; border-radius: 4px; font-weight: 600; }

  .img-upload { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.3rem; width: 100px; height: 100px; border: 2px dashed #e2e8f0; border-radius: 8px; cursor: pointer; color: #94a3b8; font-size: 0.7rem; }
  .img-upload:hover { border-color: #3b82f6; color: #3b82f6; background: #eff6ff; }

  .empty-img { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem; flex: 1; color: #94a3b8; text-align: center; }
  .empty-img p { margin: 0; font-size: 0.8rem; }
</style>