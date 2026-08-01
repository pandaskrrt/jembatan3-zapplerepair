<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  declare var Quill: any;

  let { data } = $props();
  let item = $derived(data?.item);
  let serials = $state<any[]>(item?.serials || []);
  let error = $state<string | null>(null);
  let loading = $state(false);
  let showModal = $state(false);
  let editTarget: any | null = $state(null);
  let modalAlert = $state({ show: false, msg: '' });
  let showInModal = $state(false);
  let inTargetSerial: any | null = $state(null);
  let inCabinets: any[] = $state([]);
  let inSections: any[] = $state([]);
  let inItems: any[] = $state([]);
  let inSelectedCabinet = $state<number | null>(null);
  let inSelectedSection = $state<number | null>(null);
  let inSelectedSerialId = $state<number | null>(null);
  let inSearch = $state('');
  let inParts = $state<any[]>([]);
  let inLoading = $state(false);
  let inSelectedPart = $state<number | null>(null);
  let inSerials: any[] = $state([]);
  let inSelectedSerial = $state<number | null>(null);
  let inSelectedDetail: any | null = $state(null);
  let inConfirmStep = $state(false);
  let inConfirmMessage = $state("");
  let deleteModal = $state<{ show: boolean; serial: any | null; loading: boolean }>({ show: false, serial: null, loading: false });
  let showAll = $state(false);

  let form = $state({ serialNumber: '', grade: 'A', spec: '', status: 'AVAILABLE', price: 0, costPrice: 0, videoUrl: '', qrCustomUrl: '', isPlaceholder: false });

  async function load() {
    const r = await fetch(`/api/admin/items/${item?.id}/serials`);
    if (r.ok) { const d = await r.json(); serials = d.data; }
  }

  async function syncStock() {
    const total = serials.filter((s: any) => s.status === 'AVAILABLE').length;
    await fetch(`/api/admin/items/${item?.id}/sync-stock`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stock: total }) });
  }

  onMount(load);

  function openAdd() {
    editTarget = null;
    form = { serialNumber: '', grade: 'A', spec: '', status: 'AVAILABLE', price: 0, costPrice: 0, videoUrl: '', qrCustomUrl: '', isPlaceholder: false };
    showModal = true;
  }

  function openEdit(s: any) {
    editTarget = s;
    form = {
      serialNumber: s.serialNumber || '', grade: s.grade || 'A', spec: s.spec || '',
      status: s.status, price: s.price ?? 0, costPrice: s.costPrice ?? 0,
      videoUrl: s.videoUrl || '', qrCustomUrl: s.qrCustomUrl || '',
      isPlaceholder: s.isPlaceholder
    };
    showModal = true;
  }

  function closeModal() { showModal = false; error = null; if (modalQuill) { modalQuill = null; } }

  async function save() {
    if (!form.serialNumber.trim() && !form.isPlaceholder) { error = 'Serial number required unless placeholder'; return; }
    if (modalQuill) form.spec = modalQuill.root.innerHTML;
    loading = true; error = null;
    const url = editTarget ? `/api/admin/serials/${editTarget.id}` : `/api/admin/items/${item?.id}/serials`;
    const r = await fetch(url, { method: editTarget ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (!r.ok) { const d = await r.json(); error = d.error || 'Failed'; loading = false; return; }
    await load(); closeModal(); loading = false;
  }

  function confirmDelete(serial: any) {
    deleteModal = { show: true, serial, loading: false };
  }

  async function openInModal(serial: any) {
    inTargetSerial = serial; showInModal = true;
    inSelectedCabinet = null; inSelectedSection = null; inSelectedSerialId = null; inSelectedPart = null; inSelectedDetail = null; inConfirmStep = false;
    inCabinets = []; inSections = []; inItems = []; inLoading = true;
    try {
      const res = await fetch("/api/stock/hierarchy");
      const d = await res.json();
      if (d.success) inCabinets = d.data;
    } catch {}
    finally { inLoading = false; }
  }

  async function selectCabinet(cabId: number) {
    inSelectedCabinet = cabId; inSelectedSection = null; inSelectedSerialId = null; inSelectedPart = null; inItems = [];
    const cab = inCabinets.find((c: any) => c.id === cabId);
    inSections = cab?.sections || [];
  }

  async function selectSection(secId: number) {
    inSelectedSection = secId; inSelectedSerialId = null; inSelectedPart = null;
    inLoading = true;
    try {
      const res = await fetch("/api/stock/hierarchy?sectionId=" + secId);
      const d = await res.json();
      if (d.success) {
        for (const cab of d.data) {
          for (const sec of cab.sections) {
            if (sec.id === secId) { inItems = sec.items || []; break; }
          }
        }
      }
    } catch {}
    finally { inLoading = false; }
  }

  async function handleInSubmit() {
    if (!inTargetSerial || !inSelectedSerialId) return;
    inLoading = true;
    try {
      const res = await fetch("/api/items/assembly", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetSerialId: inTargetSerial.id, partSerialId: inSelectedSerialId })
      });
      const d = await res.json();
      if (!res.ok) { alert(d.error); return; }
      if (d.canComplete) {
        inConfirmStep = true;
        inConfirmMessage = "Part " + (inSelectedDetail?.serialNumber ?? '') + " berhasil ditambahkan.";
      } else {
        showInModal = false;
        await load();
      }
      await load();
    } catch {}
    finally { inLoading = false; }
  }

  async function executeDelete() {
    if (!deleteModal.serial) return;
    deleteModal = { ...deleteModal, loading: true };
    try {
      const r = await fetch(`/api/admin/serials/${deleteModal.serial.id}`, { method: 'DELETE' });
      if (!r.ok) {
        const d = await r.json();
        modalAlert = { show: true, msg: d.error || 'Gagal menghapus serial' };
        deleteModal = { show: false, serial: null, loading: false };
        return;
      }
      await load(); await syncStock();
      deleteModal = { show: false, serial: null, loading: false };
    } catch {
      modalAlert = { show: true, msg: 'Terjadi kesalahan saat menghapus' };
      deleteModal = { show: false, serial: null, loading: false };
    }
  }

  function closeDeleteModal() {
    deleteModal = { show: false, serial: null, loading: false };
  }

  function selectSerial(ser: any) {
    inSelectedSerialId = ser.id;
    inSelectedPart = ser.id;
    inSelectedDetail = ser;
  }

  async function toggleDisplay(id: number, current: boolean) {
    const serial = serials.find(s => s.id === id);
    if (!current && serial?.category === 'NoReadySale') {
        modalAlert = { show: true, msg: "Peringatan: Serial ini statusnya NoReadySale! Harap pilih serial ReadySale lain untuk dijadikan Display." };
        return;
    }
    await fetch(`/api/admin/serials/${id}/display`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isDisplay: !current }) });
    await load();
  }

  async function patch(id: number, data: any) {
    await fetch(`/api/admin/serials/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    await load();
  }

  async function uploadImages(serialId: number, files: FileList) {
    const fd = new FormData();
    Array.from(files).forEach(f => fd.append('images', f));
    await fetch(`/api/admin/serials/${serialId}/images`, { method: 'POST', body: fd });
    await load();
  }

  async function setMain(serialId: number, imageId: number, url: string) {
    await fetch(`/api/admin/serials/${serialId}/images/${imageId}`, { method: 'PATCH' });
    await patch(serialId, { spec: `<img src="${url}" style="max-width:100%"/>` });
  }

  async function delImage(serialId: number, imageId: number) {
    if (!confirm('Delete this image?')) return;
    await fetch(`/api/admin/serials/${serialId}/images/${imageId}`, { method: 'DELETE' });
    await load();
  }

  let expanded = $state<Set<number>>(new Set());
  let lightbox = $state<{ serialId: number; idx: number } | null>(null);
  let uploading = $state<number | null>(null);
  let quillInstances = $state<Record<number, any>>({});
  let modalQuillEl = $state<HTMLDivElement | null>(null);
  let modalQuill: any = $state(null);

  $effect(() => {
    if (typeof window === 'undefined' || typeof Quill === 'undefined') return;
    const wrap = document.querySelectorAll('.quill-wrap');
    wrap.forEach((el: any) => {
      const id = parseInt(el.dataset.serialId);
      if (!id || quillInstances[id]) return;
      const toolbarOptions = [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image'],
        ['clean']
      ];
      const q = new Quill(el, {
        theme: 'snow',
        modules: { toolbar: toolbarOptions },
        placeholder: 'Specifications...'
      });
      if (el.dataset.spec) q.root.innerHTML = el.dataset.spec;
      q.on('text-change', () => { patch(id, { spec: q.root.innerHTML }); });
      quillInstances[id] = q;
    });
  });

  $effect(() => {
    if (!showModal || typeof window === 'undefined' || typeof Quill === 'undefined') return;
    setTimeout(() => {
      const el = document.querySelector('.quill-modal-wrap');
      if (!el || modalQuill) return;
      const q = new Quill(el, {
        theme: 'snow',
        modules: { toolbar: [{ header: [1,2,3,false] }, ['bold','italic','underline','strike'], [{ list:'ordered' },{ list:'bullet' }], ['link','image'], ['clean']] },
        placeholder: 'Specifications...'
      });
      if (form.spec) q.root.innerHTML = form.spec;
      modalQuill = q;
    }, 100);
  });

  async function handleConfirmReady() {
    inLoading = true;
    try {
      const res = await fetch("/api/items/assembly", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serialId: inTargetSerial.id })
      });
      if (!res.ok) { modalAlert = { show: true, msg: "Gagal mengubah status" }; return; }
      showInModal = false; inConfirmStep = false;
      modalAlert = { show: true, msg: "Serial berhasil dijadikan ReadySale!" };
      await load();
    } catch { modalAlert = { show: true, msg: "Terjadi kesalahan" }; }
    finally { inLoading = false; }
  }

  function handleNotComplete() {
    showInModal = false; inConfirmStep = false;
    load();
  }

  // Reactive: ketika section berubah
  $effect(() => {
    if (inSelectedSection) {
      selectSection(inSelectedSection);
    }
  });
</script>

<svelte:head>
  <title>Serials — {item?.name}</title>
  <link href="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css" rel="stylesheet" />
  <script src="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.js"></script>
</svelte:head>

<div class="page">
  <div class="page-inner">

    <div class="breadcrumb">
      <a href="/admin/item">Items</a>
      <svg class="crumb-sep" viewBox="0 0 20 20" fill="currentColor" width="12"><path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"/></svg>
      <a href="/admin/item/edit?id={item?.id}">{item?.name}</a>
      <svg class="crumb-sep" viewBox="0 0 20 20" fill="currentColor" width="12"><path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"/></svg>
      <span class="current">Serial Numbers</span>
    </div>

    <div class="header">
      <div>
        <h1>Serial Numbers</h1>
        <p class="subtitle">{item?.name} <span class="id-badge">#{item?.id}</span> · {serials.length} serial{serials.length === 1 ? '' : 's'}</p>
      </div>
      <a href={`/admin/serials/${item?.id}/serial-form`} class="btn-primary" data-sveltekit-reload>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Serial
      </a>
    </div>

    <div class="filter-bar">
      <div class="filter-buttons">
        <button type="button" class="filter-btn" class:active={!showAll} onclick={() => showAll = false}>
          <span class="fdot avail"></span> Tersedia ({serials.filter((s: any) => s.status === 'AVAILABLE').length})
        </button>
        <button type="button" class="filter-btn" class:active={showAll} onclick={() => showAll = true}>
          <span class="fdot all"></span> Semua ({serials.length})
        </button>
      </div>
    </div>

    {#if serials.length === 0}
      <div class="empty">
        <div class="empty-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
        </div>
        <h3>No Serial Numbers</h3>
        <p>Click "Add Serial" to create the first one.</p>
      </div>
    {:else}
    {@const sortedSerials = [...serials].filter((s: any) => showAll || s.status === 'AVAILABLE').sort((a: any, b: any) => a.category === "NoReadySale" ? 1 : b.category === "NoReadySale" ? -1 : 0)}
      <div class="serial-list">
        {#each sortedSerials as serial (serial.id)}
          <div class="serial-card" class:expanded={expanded.has(serial.id)} class:is-display={serial.isDisplay}>
            <div class="card-main" onclick={() => { const n = new Set(expanded); expanded.has(serial.id) ? n.delete(serial.id) : n.add(serial.id); expanded = n; }} role="button" tabindex="0">
              <div class="card-left">
                {#if serial.images?.length > 0}
                  <img src={serial.images.find((i: any) => i.isMain)?.url || serial.images[0].url} alt="" class="thumb" />
                {:else}
                  <div class="thumb ph">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  </div>
                {/if}
                <div class="card-info">
                  <div class="info-top">
                    <span class="sn">{serial.serialNumber || '<i>no SN</i>'}</span>
                    <span class="grade-badge">{serial.grade || '-'}</span>
                    <span class="cat-badge" class:noready={serial.category === 'NoReadySale'}>{serial.category || '-'}</span>
                    {#if serial.isDisplay}<span class="badge dp">★ Display</span>{/if}
                  </div>
                  <div class="info-bottom">
                    <span class="price-label">Rp {(serial.price ?? 0).toLocaleString('id-ID')}</span>
                    <span class="cost-badge">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="9"/><path d="M14.8 9.5a2.8 2.8 0 00-2.8-1.5c-1.66 0-3 1.12-3 2.5s1.34 2.5 3 2.5 3 1.12 3 2.5-1.34 2.5-3 2.5a2.8 2.8 0 01-2.8-1.5"/><path d="M12 6.5v1M12 16.5v1"/></svg>
                      Modal Rp {(serial.costPrice ?? 0).toLocaleString('id-ID')}
                    </span>
                    <span class="sep-dot">·</span>
                    {#if serial.status === 'AVAILABLE'}
                      <span class="status-badge st-avail">
                        <span class="status-dot"></span> Tersedia
                      </span>
                    {:else if serial.status === 'USED'}
                      <span class="status-badge st-used">
                        <span class="status-dot"></span> Terpakai
                      </span>
                    {:else}
                      <span class="status-badge st-sold">
                        <span class="status-dot"></span> Terjual
                      </span>
                    {/if}
                  </div>
                </div>
              </div>
              <div class="card-right" onclick={(e) => e.stopPropagation()}>
                <button class="btn-action" class:active={serial.isDisplay} onclick={() => toggleDisplay(serial.id, serial.isDisplay)} title={serial.isDisplay ? 'Unset display' : 'Set as display'}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={serial.isDisplay ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="2" stroke-linejoin="round"><polygon points="12 2 15.09 8.63 22 9.27 16.5 14.14 18.18 21 12 17.27 5.82 21 7.5 14.14 2 9.27 8.91 8.63 12 2"/></svg>
                </button>
              <a href={`/admin/serials/${item?.id}/serial-form?serialId=${serial.id}`} class="btn-action" data-sveltekit-reload title="Edit">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </a>
              <a href="/admin/item/pecah-serial/{serial.id}" class="btn-action pecah" data-sveltekit-reload title="Pecah">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/><path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/></svg>
              </a>
              {#if serial.category === 'NoReadySale'}
                <button class="btn-action in" onclick={() => openInModal(serial)} title="In">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
              {/if}
                <a href={`/admin/serials/${serial.id}/history`} class="btn-action" data-sveltekit-reload title="History">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </a>
                <button class="btn-action danger" onclick={() => confirmDelete(serial)} title="Delete">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
                <button
                  class="btn-action expand-btn"
                  onclick={() => { const n = new Set(expanded); expanded.has(serial.id) ? n.delete(serial.id) : n.add(serial.id); expanded = n; }}
                  title={expanded.has(serial.id) ? 'Collapse' : 'Expand'}
                >
                  <svg class="expand-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style={`transform: rotate(${expanded.has(serial.id) ? 180 : 0}deg)`}><polyline points="6 9 12 15 18 9"/></svg>
                </button>
              </div>
            </div>

            {#if expanded.has(serial.id)}
              <div class="card-details">
                <div class="details-grid">
                  <div class="detail-field">
                    <label>Serial Number</label>
                    <input value={serial.serialNumber || ''} onchange={(e: any) => patch(serial.id, { serialNumber: e.target.value })} placeholder="e.g. IP14PM-001" />
                  </div>
                  <div class="detail-field">
                    <label>Grade</label>
                    <select value={serial.grade} onchange={(e: any) => patch(serial.id, { grade: e.target.value })}>
                      <option value="">-</option>
                      <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="Refurbished">Refurbished</option>
                      <option value="Grade A+">Grade A+</option><option value="Grade A">Grade A</option><option value="Grade B+">Grade B+</option>
                      <option value="Grade B">Grade B</option><option value="Grade C">Grade C</option>
                    </select>
                  </div>
                  <div class="detail-field">
                    <label>Status</label>
                    <select value={serial.status} onchange={(e: any) => { patch(serial.id, { status: e.target.value }).then(syncStock) }}>
                      <option value="AVAILABLE">Tersedia</option>
                      <option value="SOLD">Terjual</option>
                      <option value="USED">Terpakai</option>
                    </select>
                  </div>
                  <div class="detail-field">
                    <label>Harga Jual (Rp)</label>
                    <input type="number" value={serial.price} min="0" onchange={(e: any) => patch(serial.id, { price: parseInt(e.target.value) })} />
                  </div>
                  <div class="detail-field">
                    <label>Harga Modal (Rp)</label>
                    <input type="number" value={serial.costPrice} min="0" onchange={(e: any) => patch(serial.id, { costPrice: parseInt(e.target.value) })} />
                  </div>
                  <div class="detail-field">
                    <label>Video URL</label>
                    <input value={serial.videoUrl || ''} placeholder="https://..." onchange={(e: any) => patch(serial.id, { videoUrl: e.target.value })} />
                  </div>
                  <div class="detail-field full">
                    <label>QR Custom URL</label>
                    <input value={serial.qrCustomUrl || ''} placeholder="https://..." onchange={(e: any) => patch(serial.id, { qrCustomUrl: e.target.value })} />
                  </div>
                </div>

                <div class="detail-field full">
                  <label>Spec</label>
                  <div class="quill-wrap" data-serial-id={serial.id} data-spec={serial.spec || ''}></div>
                </div>

                <div class="images-block">
                  <label>Images</label>
                  <div class="image-grid">
                    {#if serial.images?.length > 0}
{#each serial.images as img, idx}
                      <div class="image-item" class:main={img.isMain}>
                        <img src={img.url} alt="" onclick={() => lightbox = { serialId: serial.id, idx }} />
                        {#if img.isMain}<span class="main-tag">Main</span>{/if}
                        <div class="image-overlay">
                          {#if !img.isMain}
                            <button class="img-act" onclick={() => setMain(serial.id, img.id, img.url)} title="Set as main">★</button>
                          {/if}
                          <button class="img-act del" onclick={() => delImage(serial.id, img.id)} title="Delete">✕</button>
                        </div>
                      </div>
                      {/each}
                    {:else}
                      <p class="no-img">No images uploaded</p>
                    {/if}
                    <label class="image-add" class:uploading={uploading === serial.id}>
                      <input type="file" accept="image/*" multiple hidden onchange={(e: any) => { uploading = serial.id; uploadImages(serial.id, e.target.files).then(() => uploading = null) }} />
                      {#if uploading === serial.id}
                        <span class="spinner"></span>
                      {:else}
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                      {/if}
                    </label>
                  </div>
                </div>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<!-- Lightbox -->
{#if lightbox}
  {@const lSerial = serials.find((s: any) => s.id === lightbox.serialId)}
  {#if lSerial?.images?.[lightbox.idx]}
    <div class="lightbox" onclick={() => lightbox = null} onkeydown={(e) => { if (e.key === 'Escape') lightbox = null }}>
      <div class="lightbox-content" onclick={(e) => e.stopPropagation()}>
        <img src={lSerial.images[lightbox.idx].url} alt="" />
        <div class="lightbox-controls">
          <button onclick={() => lightbox = { ...lightbox, idx: Math.max(0, lightbox.idx - 1) }} disabled={lightbox.idx === 0}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span>{lightbox.idx + 1} / {lSerial.images.length}</span>
          <button onclick={() => lightbox = { ...lightbox, idx: Math.min(lSerial.images.length - 1, lightbox.idx + 1) }} disabled={lightbox.idx >= lSerial.images.length - 1}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
        <button class="lightbox-close" onclick={() => lightbox = null}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
  {/if}
{/if}

<!-- Add/Edit Modal -->
{#if showModal}
  <div class="overlay" onclick={closeModal} onkeydown={(e) => { if (e.key === 'Escape') closeModal() }}>
    <div class="modal" onclick={(e: any) => e.stopPropagation()} role="dialog">
      <div class="modal-header">
        <div>
          <h2>{editTarget ? 'Edit Serial' : 'Add Serial'}</h2>
          <p>{editTarget ? 'Update details for this serial' : 'Register a new serial for this item'}</p>
        </div>
        <button class="modal-close" onclick={closeModal}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      {#if error}
        <div class="modal-error">
          <svg viewBox="0 0 20 20" fill="currentColor" width="15"><path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 8a1 1 0 100-2 1 1 0 000 2z"/></svg>
          {error}
        </div>
      {/if}
      <div class="modal-body">
        <div class="form-row">
          <div class="form-field">
            <label>Serial Number</label>
            <input bind:value={form.serialNumber} placeholder="e.g. IP14PM-001" />
            <span class="hint">Leave empty for placeholder</span>
          </div>
          <div class="form-field">
            <label>Grade</label>
            <select bind:value={form.grade}>
              <option value="">-</option>
              <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="Refurbished">Refurbished</option>
              <option value="Grade A+">Grade A+</option><option value="Grade A">Grade A</option><option value="Grade B+">Grade B+</option>
              <option value="Grade B">Grade B</option><option value="Grade C">Grade C</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <label>Harga Jual (Rp)</label>
            <input type="number" bind:value={form.price} min="0" />
          </div>
          <div class="form-field">
            <label>Harga Modal (Rp)</label>
            <input type="number" bind:value={form.costPrice} min="0" />
          </div>
        </div>
        <div class="form-field">
          <label>Stock</label>
          <div class="stock-options">
            <button type="button" class="stock-btn" class:active={form.status === 'AVAILABLE'} onclick={() => form.status = 'AVAILABLE'}>Tersedia</button>
            <button type="button" class="stock-btn" class:active={form.status === 'SOLD'} onclick={() => form.status = 'SOLD'}>Terjual</button>
            <button type="button" class="stock-btn" class:active={form.status === 'USED'} onclick={() => form.status = 'USED'}>Terpakai</button>
          </div>
        </div>
        <div class="form-field full">
          <label>Spec</label>
          <div class="quill-modal-wrap" bind:this={modalQuillEl}></div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <label>Video URL</label>
            <input bind:value={form.videoUrl} placeholder="https://..." />
          </div>
          <div class="form-field">
            <label>QR Custom URL</label>
            <input bind:value={form.qrCustomUrl} placeholder="https://..." />
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" onclick={closeModal}>Cancel</button>
        <button class="btn-primary" onclick={save} disabled={loading}>
          {#if loading}<span class="spinner"></span>{/if}
          {loading ? 'Saving...' : (editTarget ? 'Update Serial' : 'Create Serial')}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Delete Confirmation Modal -->
{#if deleteModal.show}
  <div class="modal-overlay" onclick={closeDeleteModal} onkeydown={(e) => { if (e.key === 'Escape') closeDeleteModal() }}>
    <div class="modal-box delete-box" onclick={(e) => e.stopPropagation()}>
      <div class="delete-icon">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </div>
      <h3 class="modal-title delete-title">Hapus Serial</h3>
      <p class="modal-message">
        Yakin ingin menghapus serial <strong>{deleteModal.serial?.serialNumber || 'tanpa SN'}</strong>?
        <br/>Tindakan ini tidak bisa dibatalkan.
      </p>
      <div class="delete-detail">
        <span>Grade: {deleteModal.serial?.grade || '-'}</span>
        <span>·</span>
        <span>Status: {deleteModal.serial?.status ?? '-'}</span>
        <span>·</span>
        <span>Harga: Rp {(deleteModal.serial?.price ?? 0).toLocaleString('id-ID')}</span>
      </div>
      <div class="delete-actions">
        <button class="btn-cancel" onclick={closeDeleteModal} disabled={deleteModal.loading}>Batal</button>
        <button class="btn-delete" onclick={executeDelete} disabled={deleteModal.loading}>
          {#if deleteModal.loading}
            <span class="spinner"></span> Menghapus...
          {:else}
            Hapus Serial
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

{#if modalAlert.show}
  <div class="modal-overlay" onclick={() => modalAlert.show = false}>
    <div class="modal-box" onclick={(e) => e.stopPropagation()}>
      <div class="modal-icon">{'⚠️'}</div>
      <h3 class="modal-title">Perhatian</h3>
      <p class="modal-message">{modalAlert.msg}</p>
      <button class="modal-btn" onclick={() => modalAlert.show = false}>Mengerti</button>
    </div>
  </div>
{/if}

{#if showInModal}
<div class="modal-overlay" onclick={() => showInModal = false}>
  <div class="modal-wizard" onclick={e => e.stopPropagation()}>
    <div class="modal-head">
      <div class="modal-head-left">
        <div class="modal-head-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
        </div>
        <div>
          <div class="wiz-modal-title">In Part</div>
          <div class="wiz-modal-subtitle">Pasang part ke <strong>{inTargetSerial?.serialNumber}</strong></div>
        </div>
      </div>
      <button class="wiz-modal-close" onclick={() => showInModal = false}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>

    <div class="wiz-steps">
      <div class="wiz-step-dot" class:done={!!inSelectedCabinet} class:active={!inSelectedCabinet}>
        <span class="dot-num">{#if inSelectedCabinet}✓{:else}1{/if}</span>
        <span class="dot-label">Cabinet</span>
      </div>
      <div class="wiz-step-line" class:done={!!inSelectedCabinet}></div>
      <div class="wiz-step-dot" class:done={!!inSelectedSection} class:active={!!inSelectedCabinet && !inSelectedSection}>
        <span class="dot-num">{#if inSelectedSection}✓{:else}2{/if}</span>
        <span class="dot-label">Section</span>
      </div>
      <div class="wiz-step-line" class:done={!!inSelectedSection}></div>
      <div class="wiz-step-dot" class:done={!!inSelectedSerialId} class:active={!!inSelectedSection && !inSelectedSerialId}>
        <span class="dot-num">{#if inSelectedSerialId}✓{:else}3{/if}</span>
        <span class="dot-label">Serial</span>
      </div>
    </div>

    <div class="wiz-body">
      <div class="wizard-step">
        <select class="wiz-select" bind:value={inSelectedCabinet} onchange={(e) => selectCabinet(Number(e.target.value))}>
          <option value={null}>-- Pilih Cabinet --</option>
          {#each inCabinets as cab}
            <option value={cab.id}>{cab.name}</option>
          {/each}
        </select>
      </div>

      {#if inSelectedCabinet}
      <div class="wizard-step">
        <select class="wiz-select" bind:value={inSelectedSection} onchange={(e) => selectSection(Number(e.target.value))}>
          <option value={null}>-- Pilih Section --</option>
          {#each inSections as sec}
            <option value={sec.id}>{sec.name}</option>
          {/each}
        </select>
      </div>
      {/if}

      {#if inSelectedSection}
      <div class="wizard-step">
        {#if inLoading}
          <div class="hempty">
            <span class="spinner"></span>
            <span style="margin-left:0.5rem;">Memuat...</span>
          </div>
        {:else if inItems.length === 0}
          <div class="hempty">Tidak ada item di section ini</div>
        {:else}
          <div class="wiz-serial-list">
            {#each inItems as item}
              <div class="wiz-group">
                <div class="wiz-group-name">{item.name} <span class="wiz-cat">{item.category}</span></div>
                {#each item.serials as ser}
                  <button class="wiz-serial" class:selected={inSelectedSerialId === ser.id} onclick={() => selectSerial(ser)}>
                    <div class="wiz-sn">
                      <span class="wiz-radio" class:checked={inSelectedSerialId === ser.id}></span>
                      <span class="wiz-sn-text">{ser.serialNumber}</span>
                      <span class="wiz-grade" class:grade-c={ser.grade === 'C'} class:grade-b={ser.grade === 'B'}>{ser.grade || '-'}</span>
                    </div>
                    <div class="wiz-spec">
                      <span class="wiz-modal">Modal Rp {(ser.costPrice || 0).toLocaleString('id-ID')}</span>
                      <span class="wiz-jual">Jual Rp {(ser.price || 0).toLocaleString('id-ID')}</span>
                    </div>
                  </button>
                {/each}
              </div>
            {/each}
          </div>
        {/if}
      </div>
      {/if}

      {#if inSelectedSerialId && inSelectedDetail}
      <div class="wiz-detail">
        <div class="detail-label">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
          Part Terpilih
        </div>
        <div class="detail-grid">
          <div><span>Serial</span> <strong>{inSelectedDetail.serialNumber}</strong></div>
          <div><span>Grade</span> <strong>{inSelectedDetail.grade || '-'}</strong></div>
          <div><span>Harga Modal</span> <strong>Rp {(inSelectedDetail.costPrice || 0).toLocaleString('id-ID')}</strong></div>
          <div><span>Harga Jual</span> <strong>Rp {(inSelectedDetail.price || 0).toLocaleString('id-ID')}</strong></div>
        </div>
      </div>
      {/if}

      {#if inConfirmStep}
      <div class="wizard-step confirm-step">
        <div class="step-label" style="color:#059669;">Semua Part Terpenuhi!</div>
        <p style="font-size:0.85rem;color:#334155;margin:0.5rem 0;">{inConfirmMessage}</p>
      </div>
      {/if}
    </div>

    <div class="modal-foot">
      {#if inConfirmStep}
        <button class="btn-secondary" onclick={handleNotComplete} disabled={inLoading}>Belum Lengkap</button>
        <button class="btn-primary" onclick={handleConfirmReady} disabled={inLoading}>
          {inLoading ? "Memproses..." : "Ya, Jadikan ReadySale"}
        </button>
      {:else}
        <button class="btn-secondary" onclick={() => showInModal = false}>Batal</button>
        <button class="btn-primary" onclick={handleInSubmit} disabled={!inSelectedSerialId}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Gunakan Part
        </button>
      {/if}
    </div>
  </div>
</div>
{/if}

<style>
  * { box-sizing: border-box; }
  :global(body) { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; background: #161618; color: #211f3d; margin: 0; }

  .page { min-height: 100vh; padding: 2rem 1.25rem 4rem; }
  .page-inner { max-width: 900px; margin: 0 auto; }

  /* Breadcrumb */
  .breadcrumb { display: flex; align-items: center; gap: 0.4rem; font-size: 0.82rem; margin-bottom: 1.25rem; color: #8b8aa3; }
  .breadcrumb a { color: #10b981; text-decoration: none; font-weight: 500; }
  .breadcrumb a:hover { text-decoration: underline; }
  .crumb-sep { color: #d3d1e8; flex-shrink: 0; }
  .current { color: #8b8aa3; }

  /* Header */
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.75rem; gap: 1rem; }
  .header h1 { margin: 0; font-size: 1.4rem; font-weight: 700; color: #e3e4e6; letter-spacing: -0.01em; }
  .subtitle { margin: 0.3rem 0 0; color: #a1a1a5; font-size: 0.85rem; }
  .id-badge { background: rgba(16,185,129,0.12); padding: 0.15rem 0.5rem; border-radius: 999px; font-size: 0.72rem; color: #10b981; font-weight: 700; margin-left: 0.15rem; }

  .btn-primary {
    display: inline-flex; align-items: center; gap: 0.5rem; background: #10b981; color: white;
    padding: 0.65rem 1.25rem; border: none; border-radius: 10px; font-size: 0.875rem; font-weight: 600;
    cursor: pointer; transition: background 0.15s ease; box-shadow: 0 4px 12px -2px rgba(79, 70, 229, 0.35);
    flex-shrink: 0;
  }
  .btn-primary:hover:not(:disabled) { background: #10b981; }
  .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
  .btn-secondary {
    background: #161618; color: #a1a1a5; padding: 0.65rem 1.2rem; border: 1.5px solid rgba(255,255,255,0.08);
    border-radius: 10px; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: all 0.15s ease;
  }
  .btn-secondary:hover { background: #161618; }

  /* Empty */
  .empty { text-align: center; padding: 3.5rem 2rem; background: #161618; border: 1.5px dashed rgba(255,255,255,0.08); border-radius: 16px; }
  .empty-icon { color: #b3b0e0; margin-bottom: 0.75rem; display: flex; justify-content: center; }
  .empty h3 { font-size: 1.05rem; margin: 0 0 0.35rem; color: #e3e4e6; font-weight: 700; }
  .empty p { color: #8b8aa3; margin: 0; font-size: 0.85rem; }

  /* Cards */
  .filter-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
  .filter-buttons { display: flex; gap: 0.5rem; }
  .filter-btn {
    display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.45rem 1rem;
    border: 1.5px solid rgba(255,255,255,0.08); border-radius: 999px; background: #161618; cursor: pointer;
    font-size: 0.8rem; font-weight: 600; color: #a1a1a5; transition: all 0.15s ease;
  }
  .filter-btn:hover { border-color: #a5b4fc; color: #10b981; }
  .filter-btn.active { border-color: #10b981; background: rgba(16,185,129,0.12); color: #10b981; }
  .fdot { width: 8px; height: 8px; border-radius: 50%; }
  .fdot.avail { background: #10b981; }
  .fdot.all { background: #6366f1; }

  .serial-list { display: flex; flex-direction: column; gap: 0.65rem; }
  .serial-card {
    background: #161618; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px;
    box-shadow: 0 1px 2px rgba(30, 27, 58, 0.03);
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }
  .serial-card:hover { border-color: #d3d1e8; box-shadow: 0 8px 20px -14px rgba(79, 70, 229, 0.25); }
  .serial-card.is-display { border-color: #a5a2e0; box-shadow: 0 0 0 1px #a5a2e0; }
  .card-main { display: flex; justify-content: space-between; align-items: center; padding: 0.85rem 1.1rem; cursor: pointer; gap: 1rem; }
  .card-left { display: flex; gap: 0.75rem; align-items: center; flex: 1; min-width: 0; }
  .thumb { width: 42px; height: 42px; border-radius: 9px; object-fit: cover; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.08); }
  .thumb.ph { display: flex; align-items: center; justify-content: center; background: rgba(16,185,129,0.12); color: #a5a2e0; border: 0; }
  .card-info { min-width: 0; }
  .info-top { display: flex; flex-wrap: wrap; gap: 0.4rem; align-items: center; }
  .sn { font-family: 'SF Mono', 'Roboto Mono', monospace; font-weight: 600; color: #e3e4e6; font-size: 0.88rem; }
  .grade-badge { background: rgba(255,255,255,0.08); padding: 0.12rem 0.5rem; border-radius: 5px; font-size: 0.72rem; font-weight: 600; color: #a1a1a5; }
  .badge { font-size: 0.65rem; padding: 0.12rem 0.5rem; border-radius: 999px; font-weight: 700; }
  .badge.ph { background: #fef3c7; color: #fbbf24; }
  .badge.dp { background: rgba(16,185,129,0.12); color: #10b981; }
  .cat-badge { background: #e0f2fe; color: #0369a1; padding: 0.12rem 0.5rem; border-radius: 999px; font-size: 0.6rem; font-weight: 700; margin-left: 0.25rem; display: inline-block; }
  .cat-badge.noready { background: #fef2f2; color: #dc2626; border: 1px solid rgba(239,68,68,0.3); }
  .info-bottom { display: flex; flex-wrap: wrap; gap: 0.3rem; align-items: center; margin-top: 0.3rem; font-size: 0.8rem; }
  .price-label { color: #10b981; font-weight: 700; font-size: 0.95rem; }
  .cost-badge {
    display: inline-flex; align-items: center; gap: 0.3rem;
    background: #fffbeb; color: #b45309; border: 1px solid rgba(245,158,11,0.3);
    font-weight: 700; font-size: 0.78rem; padding: 0.2rem 0.6rem 0.2rem 0.5rem;
    border-radius: 999px; line-height: 1.2;
  }
  .stock-label { color: #a1a1a5; }
  .status-badge {
    display: inline-flex; align-items: center; gap: 0.3rem;
    font-size: 0.68rem; font-weight: 700; padding: 0.15rem 0.6rem;
    border-radius: 999px; line-height: 1.3;
  }
  .status-badge .status-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .status-badge.st-avail { background: rgba(16,185,129,0.12); color: #10b981; border: 1px solid #a7f3d0; }
  .status-badge.st-avail .status-dot { background: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.15); }
  .status-badge.st-sold { background: #fef2f2; color: #dc2626; border: 1px solid rgba(239,68,68,0.3); }
  .status-badge.st-sold .status-dot { background: #ef4444; box-shadow: 0 0 0 3px rgba(239,68,68,0.15); }
  .status-badge.st-used { background: #fffbeb; color: #d97706; border: 1px solid rgba(245,158,11,0.3); }
  .status-badge.st-used .status-dot { background: #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,0.15); }
  .sep-dot { color: #d3d1e8; }

  .card-right { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; flex-wrap: wrap; }
  .btn-action {
    width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
    background: transparent; border: 1px solid transparent; border-radius: 8px; cursor: pointer;
    color: #8b8aa3; transition: all 0.15s ease;
  }
  .btn-action:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.08); color: #211f3d; }
  .btn-action.active { color: #f59e0b; }
  .btn-action.danger:hover { background: #fef2f2; border-color: rgba(239,68,68,0.3); color: #dc2626; }
  .btn-action.pecah { color: #d97706; }
  .btn-action.pecah:hover { background: #fffbeb; border-color: rgba(245,158,11,0.3); color: #fbbf24; }
  .btn-action.in { color: #10b981; }
  .btn-action.in:hover { background: rgba(16,185,129,0.12); border-color: #a7f3d0; color: #065f46; }
  .expand-btn { margin-left: 0.2rem; }
  .expand-icon { color: #b3b0e0; transition: transform 0.2s ease; }

  /* Details */
  .card-details { padding: 1.1rem 1.25rem 1.25rem; border-top: 1px solid rgba(255,255,255,0.08); background: #141416; border-radius: 0 0 14px 14px; }
  .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; margin-bottom: 0.85rem; }
  .detail-field label { display: block; font-size: 0.75rem; font-weight: 600; color: #a1a1a5; margin-bottom: 0.3rem; }
  .detail-field input, .detail-field select {
    width: 100%; padding: 0.55rem 0.65rem; border: 1.5px solid rgba(255,255,255,0.08); border-radius: 8px;
    font-size: 0.85rem; background: #161618; color: #211f3d; transition: border-color 0.15s ease;
  }
  .detail-field input:focus, .detail-field select:focus, .detail-field textarea:focus {
    outline: none; border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
  }
  .detail-field.full { grid-column: 1 / -1; }
  .detail-field textarea {
    width: 100%; padding: 0.55rem 0.65rem; border: 1.5px solid rgba(255,255,255,0.08); border-radius: 8px;
    font-size: 0.85rem; resize: vertical; background: #161618; color: #211f3d; font-family: inherit;
  }

  /* Images */
  .images-block { margin-top: 0.85rem; }
  .images-block > label { display: block; font-size: 0.75rem; font-weight: 600; color: #a1a1a5; margin-bottom: 0.45rem; }
  .image-grid { display: flex; gap: 0.55rem; flex-wrap: wrap; align-items: flex-start; }
  .image-item { position: relative; width: 84px; height: 84px; border-radius: 10px; overflow: hidden; border: 2px solid rgba(255,255,255,0.08); }
  .image-item.main { border-color: #6366f1; }
  .image-item img { width: 100%; height: 100%; object-fit: cover; cursor: pointer; display: block; }
  .main-tag {
    position: absolute; bottom: 4px; left: 4px; background: rgba(79, 70, 229, 0.9); color: white;
    font-size: 0.6rem; font-weight: 700; padding: 0.1rem 0.4rem; border-radius: 999px;
  }
  .image-overlay { position: absolute; top: 4px; right: 4px; display: flex; flex-direction: column; gap: 3px; }
  .img-act {
    width: 21px; height: 21px; border: none; border-radius: 6px; background: rgba(30,27,58,0.6);
    color: white; font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center;
  }
  .img-act:hover { background: rgba(30,27,58,0.85); }
  .img-act.del:hover { background: rgba(220,38,38,0.9); }
  .no-img { font-size: 0.8rem; color: #71717a; margin: 0; padding: 0.5rem 0; }
  .image-add {
    width: 84px; height: 84px; border: 2px dashed rgba(255,255,255,0.08); border-radius: 10px; display: flex;
    align-items: center; justify-content: center; cursor: pointer; color: #b3b0e0; transition: all 0.15s ease;
  }
  .image-add:hover { border-color: #6366f1; color: #6366f1; background: rgba(255,255,255,0.08); }

  .spinner {
    width: 14px; height: 14px; border: 2px solid rgba(0,0,0,0.1); border-top-color: currentColor;
    border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block;
  }
  .btn-primary .spinner { border: 2px solid rgba(255,255,255,0.4); border-top-color: white; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Lightbox */
  .lightbox { position: fixed; inset: 0; background: rgba(15,13,35,0.85); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 2rem; cursor: pointer; }
  .lightbox-content { position: relative; max-width: 90vw; max-height: 90vh; cursor: default; }
  .lightbox-content img { max-width: 100%; max-height: 80vh; border-radius: 12px; display: block; }
  .lightbox-controls { position: absolute; bottom: -3rem; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 1rem; }
  .lightbox-controls button { background: rgba(255,255,255,0.15); border: none; color: white; padding: 0.5rem; border-radius: 8px; cursor: pointer; }
  .lightbox-controls button:hover { background: rgba(255,255,255,0.3); }
  .lightbox-controls button:disabled { opacity: 0.3; cursor: default; }
  .lightbox-controls span { color: white; font-size: 0.875rem; font-weight: 500; }
  .lightbox-close { position: absolute; top: 1rem; right: 1rem; background: rgba(255,255,255,0.15); border: none; color: white; padding: 0.5rem; border-radius: 8px; cursor: pointer; }
  .lightbox-close:hover { background: rgba(255,255,255,0.3); }

  /* Modal */
  .overlay { position: fixed; inset: 0; background: rgba(20,18,40,0.45); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
  .modal { background: #161618; border-radius: 18px; width: 100%; max-width: 800px; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 60px -12px rgba(30,27,58,0.25); }
  .modal-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 1.4rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.08); }
  .modal-header h2 { margin: 0; font-size: 1.1rem; font-weight: 700; color: #e3e4e6; }
  .modal-header p { margin: 0.2rem 0 0; font-size: 0.82rem; color: #8b8aa3; }
  .modal-close { background: none; border: none; color: #71717a; cursor: pointer; padding: 0.3rem; border-radius: 8px; flex-shrink: 0; }
  .modal-close:hover { background: rgba(255,255,255,0.08); color: #a1a1a5; }
  .modal-error {
    margin: 1rem 1.5rem 0; padding: 0.65rem 0.85rem; background: #fef2f2; color: #f87171;
    border-radius: 10px; font-size: 0.85rem; border: 1px solid rgba(239,68,68,0.3); display: flex; align-items: center; gap: 0.5rem;
  }
  .modal-body { padding: 1.4rem 1.5rem; }
  .form-field { margin-bottom: 1.1rem; }
  .form-field.full { grid-column: 1 / -1; }
  .stock-options { display: flex; gap: 0.5rem; }
  .stock-btn { flex: 1; padding: 0.6rem; border: 2px solid rgba(255,255,255,0.08); border-radius: 8px; background: #161618; cursor: pointer; font-weight: 500; color: #8f8f96; transition: all 0.15s; }
  .stock-btn.active { border-color: #3b82f6; background: #eff6ff; color: #3b82f6; }
  .quill-modal-wrap { min-height: 200px; }
  .form-field label { display: block; font-size: 0.82rem; font-weight: 600; color: #a1a1a5; margin-bottom: 0.4rem; }
  .form-field input, .form-field select, .form-field textarea {
    width: 100%; padding: 0.65rem 0.8rem; border: 1.5px solid rgba(255,255,255,0.08); border-radius: 9px;
    font-size: 0.875rem; color: #211f3d; transition: border-color 0.15s ease, box-shadow 0.15s ease;
    font-family: inherit;
  }
  .form-field input:focus, .form-field select:focus, .form-field textarea:focus {
    outline: none; border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
  }
  .form-field textarea { resize: vertical; }
  .form-field .hint { display: block; font-size: 0.75rem; color: #71717a; margin-top: 0.3rem; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .modal-footer { display: flex; justify-content: flex-end; gap: 0.65rem; padding: 1.1rem 1.5rem; border-top: 1px solid rgba(255,255,255,0.08); }

  /* Responsive */
  @media (max-width: 560px) {
    .details-grid { grid-template-columns: 1fr; }
    .form-row { grid-template-columns: 1fr; }
    .header { flex-wrap: wrap; }
  }

  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
  .modal-box { background: #161618; padding: 2rem; border-radius: 16px; text-align: center; max-width: 400px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
  .modal-icon { font-size: 3rem; margin-bottom: 1rem; }

  .modal-overlay { position: fixed; inset: 0; z-index: 99999; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 1rem; }
  .modal-box { background: #161618; padding: 2rem; border-radius: 16px; text-align: center; max-width: 420px; width: 90%; box-shadow: 0 20px 50px rgba(0,0,0,0.3); animation: modalIn 0.2s ease-out; }
  @keyframes modalIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  .modal-icon { font-size: 3.5rem; margin-bottom: 1rem; }
  .modal-title { font-size: 1.25rem; font-weight: 700; color: #e3e4e6; margin-bottom: 0.75rem; }
  .modal-message { color: #a1a1a5; line-height: 1.6; margin-bottom: 1.5rem; font-size: 0.95rem; }
  .modal-btn { width: 100%; padding: 1rem; background: #10b981; color: white; border: none; border-radius: 10px; font-weight: 600; font-size: 1rem; cursor: pointer; transition: background 0.2s; }
  .modal-btn:hover { background: #10b981; }

  /* Delete Modal */
  .delete-icon { color: #ef4444; margin-bottom: 0.75rem; display: flex; justify-content: center; }
  .delete-title { color: #dc2626 !important; }
  .delete-detail { display: flex; justify-content: center; gap: 0.4rem; font-size: 0.85rem; color: #8f8f96; margin-bottom: 1.5rem; background: #0b0b0c; padding: 0.6rem 1rem; border-radius: 8px; }
  .delete-actions { display: flex; gap: 0.65rem; }
  .btn-cancel { flex: 1; padding: 0.85rem; background: #161618; color: #a1a1a5; border: 1.5px solid rgba(255,255,255,0.08); border-radius: 10px; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.15s; }
  .btn-cancel:hover { background: #0b0b0c; }
  .btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-delete { flex: 1; padding: 0.85rem; background: #ef4444; color: white; border: none; border-radius: 10px; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: background 0.15s; display: flex; align-items: center; justify-content: center; gap: 0.4rem; }
  .btn-delete:hover { background: #dc2626; }
  .btn-delete:disabled { opacity: 0.6; cursor: not-allowed; }
  .delete-box { max-width: 420px; }





  .modal-wizard {
    background: #161618; border-radius: 20px; width: 94%; max-width: 860px; max-height: 92vh;
    display: flex; flex-direction: column; box-shadow: 0 25px 60px -12px rgba(30,27,58,0.3);
    overflow: hidden;
  }
  .modal-head { display: flex; justify-content: space-between; align-items: flex-start; padding: 1.6rem 2rem; border-bottom: 1px solid rgba(255,255,255,0.08); }
  .modal-head-left { display: flex; gap: 1rem; align-items: flex-start; }
  .modal-head-icon {
    width: 46px; height: 46px; border-radius: 12px; background: rgba(16,185,129,0.12); color: #10b981;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .modal-head-icon svg { width: 22px; height: 22px; }
  .wiz-modal-title { font-size: 1.3rem; font-weight: 700; color: #e3e4e6; }
  .wiz-modal-subtitle { font-size: 0.92rem; color: #8b8aa3; margin-top: 0.25rem; }
  .wiz-modal-subtitle strong { color: #a1a1a5; }
  .wiz-modal-close {
    background: none; border: none; color: #71717a; cursor: pointer; padding: 0.5rem;
    border-radius: 10px; flex-shrink: 0; display: flex;
  }
  .wiz-modal-close svg { width: 20px; height: 20px; }
  .wiz-modal-close:hover { background: rgba(255,255,255,0.08); color: #a1a1a5; }

  /* Step indicator */
  .wiz-steps { display: flex; align-items: flex-start; padding: 1.6rem 3rem 1.4rem; }
  .wiz-step-dot { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
  .wiz-step-dot .dot-num {
    width: 34px; height: 34px; border-radius: 50%; background: rgba(255,255,255,0.08); color: #71717a;
    display: flex; align-items: center; justify-content: center; font-size: 0.9rem; font-weight: 700;
    transition: all 0.15s ease;
  }
  .wiz-step-dot .dot-label { font-size: 0.78rem; font-weight: 600; color: #71717a; white-space: nowrap; }
  .wiz-step-dot.active .dot-num { background: #10b981; color: white; box-shadow: 0 0 0 5px rgba(16,185,129,0.12); }
  .wiz-step-dot.active .dot-label { color: #10b981; }
  .wiz-step-dot.done .dot-num { background: #10b981; color: white; }
  .wiz-step-dot.done .dot-label { color: #a1a1a5; }
  .wiz-step-line { flex: 1; height: 3px; background: rgba(16,185,129,0.12); margin: 17px 0.75rem 0; border-radius: 2px; }
  .wiz-step-line.done { background: #10b981; }

  .wiz-body { overflow-y: auto; padding: 0 2rem 1.6rem; flex: 1; }
  .wizard-step { padding: 0.85rem 0; }
  .wiz-select {
    width: 100%; padding: 0.9rem 1.1rem; border: 1.5px solid rgba(255,255,255,0.08); border-radius: 12px;
    font-size: 0.95rem; color: #211f3d; font-family: inherit; background: #161618;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }
  .wiz-select:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12); }

  .wiz-serial-list { max-height: 400px; overflow-y: auto; display: flex; flex-direction: column; gap: 1.1rem; padding-right: 0.3rem; }
  .wiz-group-name {
    padding: 0.55rem 0.75rem; font-size: 0.88rem; font-weight: 700; color: #e3e4e6;
    display: flex; align-items: center; gap: 0.6rem; background: #161618; border-radius: 9px; margin-bottom: 0.5rem;
  }
  .wiz-cat { font-size: 0.68rem; font-weight: 700; background: rgba(16,185,129,0.12); color: #10b981; padding: 0.15rem 0.55rem; border-radius: 999px; }
  .wiz-serial {
    display: flex; align-items: center; justify-content: space-between; width: 100%; gap: 1rem;
    padding: 0.9rem 1.1rem; border: 1.5px solid rgba(16,185,129,0.12); border-radius: 12px; background: #161618;
    cursor: pointer; margin-bottom: 0.5rem; font-size: 0.9rem; text-align: left; transition: all 0.12s ease;
  }
  .wiz-serial:last-child { margin-bottom: 0; }
  .wiz-serial:hover { border-color: #a5b4fc; background: #161618; }
  .wiz-serial.selected { border-color: #10b981; background: rgba(16,185,129,0.12); }
  .wiz-sn { display: flex; align-items: center; gap: 0.65rem; }
  .wiz-radio {
    width: 19px; height: 19px; border-radius: 50%; border: 2px solid #d3d1e8; flex-shrink: 0;
    display: inline-block; position: relative; transition: border-color 0.12s ease;
  }
  .wiz-radio.checked { border-color: #10b981; }
  .wiz-radio.checked::after {
    content: ''; position: absolute; inset: 3px; border-radius: 50%; background: #10b981;
  }
  .wiz-sn-text { font-weight: 600; color: #211f3d; font-size: 0.95rem; }
  .wiz-spec { display: flex; align-items: center; gap: 0.5rem; font-size: 0.78rem; flex-shrink: 0; }
  .wiz-grade { padding: 0.15rem 0.55rem; border-radius: 6px; font-weight: 700; background: rgba(16,185,129,0.12); color: #10b981; }
  .wiz-grade.grade-b { background: #fffbeb; color: #d97706; }
  .wiz-grade.grade-c { background: #fef2f2; color: #dc2626; }
  .wiz-modal { padding: 0.15rem 0.6rem; border-radius: 999px; font-weight: 700; background: #fffbeb; color: #b45309; }
  .wiz-jual { padding: 0.15rem 0.6rem; border-radius: 999px; font-weight: 700; background: rgba(16,185,129,0.12); color: #10b981; }
  .hempty { padding: 3rem; text-align: center; font-size: 0.9rem; color: #71717a; display: flex; align-items: center; justify-content: center; }

  .wiz-detail { margin-top: 1.1rem; padding: 1.2rem 1.4rem; background: #161618; border: 1px solid rgba(16,185,129,0.12); border-radius: 14px; }
  .detail-label {
    font-size: 0.78rem; font-weight: 700; color: #10b981; text-transform: uppercase; letter-spacing: 0.03em;
    margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;
  }
  .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.65rem 1.5rem; font-size: 0.92rem; }
  .detail-grid div { display: flex; justify-content: space-between; gap: 0.5rem; }
  .detail-grid span { color: #8b8aa3; }
  .detail-grid strong { color: #211f3d; }

  .modal-foot { padding: 1.3rem 2rem; border-top: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: flex-end; gap: 0.75rem; }
</style>