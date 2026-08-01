<script lang="ts">
  import { onMount } from 'svelte';

  let { data } = $props();
  let item = $derived(data?.item);
  let serials = $derived(data?.serials || []);
  let displaySerial = $derived(data?.displaySerial);
  let totalStock = $derived(data?.totalStock);

  let selectedSerial = $state<any>(displaySerial);
  let lightboxIdx = $state<number | null>(null);
  let copied = $state(false);

  let promoPct = 5;

  // On mount: check URL for ?serial=X
  onMount(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    const sid = parseInt(sp.get('serial') || '');
    if (sid) {
      const found = serials.find((s: any) => s.id === sid);
      if (found) selectedSerial = found;
    }
  });

  function selectSerial(s: any) {
    selectedSerial = s;
    lightboxIdx = null;
    // Update URL without reload
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('serial', s.id.toString());
      window.history.replaceState({}, '', url);
    }
  }

  function shareSerial() {
    if (typeof window === 'undefined' || !selectedSerial) return;
    const url = `${window.location.origin}/product/${item?.id}?serial=${selectedSerial.id}`;
    navigator.clipboard.writeText(url).then(() => { copied = true; setTimeout(() => copied = false, 2000); });
  }

  function diskon(price: number) { return Math.round(price * (100 - promoPct) / 100); }

  function prevLightbox() {
    if (!selectedSerial || !selectedSerial.images?.length) return;
    const total = selectedSerial.images.length;
    lightboxIdx = lightboxIdx === 0 ? total - 1 : lightboxIdx! - 1;
  }

  function nextLightbox() {
    if (!selectedSerial || !selectedSerial.images?.length) return;
    const total = selectedSerial.images.length;
    lightboxIdx = lightboxIdx === total - 1 ? 0 : lightboxIdx! + 1;
  }

  function back() { if (typeof window !== 'undefined') window.history.back(); }
</script>

<svelte:head>
  <title>{item?.name} — Jembatan 3</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700&display=swap" rel="stylesheet">
</svelte:head>

<div class="page">
  <button class="back-btn" onclick={back}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
    Kembali
  </button>

  <div class="layout">
    <!-- Left: Image -->
    <div class="gallery-col">
      {#if selectedSerial?.images?.length > 0}
        {@const mainImg = selectedSerial.images.find((i: any) => i.isMain) || selectedSerial.images[0]}
        <div class="main-image" class:sold={selectedSerial.stock === 0} onclick={() => { if (selectedSerial.images.length > 1) lightboxIdx = 0 }}>
          <img src={mainImg.url} alt={item?.name} />
          {#if selectedSerial.stock === 0}
            <div class="sold-overlay">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              <span>TERJUAL</span>
            </div>
          {/if}
          {#if selectedSerial.images.length > 1}
            <div class="image-count">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              {selectedSerial.images.length} foto
            </div>
          {/if}
        </div>
        {#if selectedSerial.images.length > 1}
          <div class="thumbnails">
            {#each selectedSerial.images as img, idx}
              <div class="thumb" class:active={mainImg.url === img.url} onclick={() => lightboxIdx = idx}>
                <img src={img.url} alt="" />
              </div>
            {/each}
          </div>
        {/if}
      {:else}
        <div class="main-image no-img">
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          <p>Tidak ada gambar</p>
        </div>
      {/if}
    </div>

    <!-- Right: Details -->
    <div class="info-col">
      <div class="breadcrumb">
        <span class="crumb">{item?.section?.cabinet?.name}</span>
        <span class="sep">/</span>
        <span class="crumb">{item?.section?.name}</span>
      </div>

      <h1 class="title">{item?.name}</h1>

      <div class="meta-row">
        <span class="badge cat">{item?.category}</span>
        <span class="badge sub">{item?.subCategory}</span>
      </div>

      <!-- Serial Selector -->
      {#if serials.filter(s => s.category !== 'NoReadySale').length > 1}
        <div class="serial-selector">
          <label>Pilih Serial:</label>
          <div class="serial-chips">
            {#each serials.filter(s => s.category !== 'NoReadySale') as s}
              <button class="chip" class:active={selectedSerial?.id === s.id} class:sold={s.status !== 'AVAILABLE'} onclick={() => selectSerial(s)}>
                <span class="chip-sn">{s.serialNumber}</span>
                {#if s.grade}<span class="chip-grade">{s.grade}</span>{/if}
                {#if s.isDisplay}<span class="chip-display">★</span>{/if}
                {#if s.status !== 'AVAILABLE'}<span class="chip-sold">Sold</span>{/if}
              </button>
            {/each}
          </div>
        </div>
      {/if}

      {#if selectedSerial}
        <!-- Price -->
        <div class="price-row">
          {#if selectedSerial.stock === 0}
            <div class="price-discount">
              <span class="price-original">Rp {(selectedSerial.price ?? 0).toLocaleString('id-ID')}</span>
              <span class="discount-badge">-{promoPct}%</span>
            </div>
            <div class="price-promo">Rp {(diskon(selectedSerial.price ?? 0)).toLocaleString('id-ID')}</div>
          {:else}
            <div class="price">Rp {(selectedSerial.price ?? 0).toLocaleString('id-ID')}</div>
          {/if}
          {#if selectedSerial.costPrice > 0}
            <div class="cost">Modal: Rp {(selectedSerial.costPrice ?? 0).toLocaleString('id-ID')}</div>
          {/if}
        </div>

        <div class="serial-info">
          <div class="info-item"><span class="info-label">Serial Number</span><span class="info-value">{selectedSerial.serialNumber || '-'}</span></div>
          <div class="info-item"><span class="info-label">Grade</span><span class="info-value grade-value">{selectedSerial.grade || '-'}</span></div>
          <div class="info-item"><span class="info-label">Status</span><span class="info-value" class:green={selectedSerial.status === 'AVAILABLE'} class:red={selectedSerial.status !== 'AVAILABLE'}>{selectedSerial.status === 'AVAILABLE' ? 'Tersedia' : 'Terjual'}</span></div>
        </div>

        {#if selectedSerial.videoUrl}
          <div class="video-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
            <a href={selectedSerial.videoUrl} target="_blank" rel="noopener">Lihat Video</a>
          </div>
        {/if}

        <!-- Action Buttons -->
        <div class="action-row">
          {#if selectedSerial.status === 'AVAILABLE'}
            <button class="btn-beli">Beli Sekarang</button>
          {:else}
            <button class="btn-order">Order Sekarang</button>
          {/if}
          <button class="btn-share" onclick={shareSerial} title="Salin tautan serial ini">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            {copied ? 'Tersalin!' : 'Share'}
          </button>
        </div>

        <!-- Specs -->
        <div class="spec-section">
          <div class="spec-label">Spesifikasi</div>
          <div class="spec-content">
            {#if selectedSerial?.spec}
              {@html selectedSerial.spec}
            {:else}
              <p class="empty">Tidak ada spesifikasi untuk serial ini</p>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<!-- Lightbox -->
{#if lightboxIdx !== null && selectedSerial?.images?.[lightboxIdx]}
  <div class="lightbox" onclick={() => lightboxIdx = null} onkeydown={(e) => { if (e.key === 'Escape') lightboxIdx = null }}>
    <div class="lb-content" onclick={(e) => e.stopPropagation()}>
      <img src={selectedSerial.images[lightboxIdx].url} alt="" />
      <div class="lb-controls">
        <button onclick={prevLightbox}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg></button>
        <span>{lightboxIdx + 1} / {selectedSerial.images.length}</span>
        <button onclick={nextLightbox}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg></button>
      </div>
      <button class="lb-close" onclick={() => lightboxIdx = null}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    </div>
  </div>
{/if}

<style>
  :global(body) { margin: 0; font-family: 'Inter', sans-serif; background: #0b0b0c; color: #e3e4e6; }
  .page { max-width: 1200px; margin: 0 auto; padding: 1.5rem; min-height: 100vh; }
  .back-btn { display: inline-flex; align-items: center; gap: 0.375rem; background: none; border: 1px solid rgba(255,255,255,0.08); color: #10b981; cursor: pointer; font-size: 0.9rem; font-weight: 500; padding: 0.5rem 0.75rem; border-radius: 8px; transition: all 0.2s; }
  .back-btn:hover { background: rgba(16,185,129,0.1); }
  .layout { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 1rem; }

  /* Gallery */
  .gallery-col { }
  .main-image { position: relative; border-radius: 16px; overflow: hidden; background: #161618; border: 1px solid rgba(255,255,255,0.08); aspect-ratio: 1 / 1; display: flex; align-items: center; justify-content: center; cursor: pointer; }
  .main-image img { width: 100%; height: 100%; object-fit: contain; transition: filter 0.3s; }
  .main-image.sold img { filter: grayscale(1); opacity: 0.6; }
  .main-image.no-img { flex-direction: column; gap: 0.5rem; color: #71717a; cursor: default; }
  .sold-overlay { position: absolute; display: flex; flex-direction: column; align-items: center; gap: 0.25rem; color: white; background: rgba(0,0,0,0.55); padding: 1rem 1.5rem; border-radius: 12px; }
  .sold-overlay span { font-size: 1.1rem; font-weight: 800; letter-spacing: 0.1em; }
  .image-count { position: absolute; bottom: 12px; right: 12px; display: flex; align-items: center; gap: 0.375rem; padding: 0.375rem 0.75rem; background: rgba(0,0,0,0.6); color: white; border-radius: 8px; font-size: 0.75rem; font-weight: 500; }
  .thumbnails { display: flex; gap: 0.5rem; margin-top: 0.75rem; overflow-x: auto; padding-bottom: 0.25rem; }
  .thumb { width: 72px; height: 72px; border-radius: 8px; overflow: hidden; border: 2px solid rgba(255,255,255,0.1); cursor: pointer; flex-shrink: 0; }
  .thumb.active { border-color: #10b981; }
  .thumb img { width: 100%; height: 100%; object-fit: cover; }

  /* Info */
  .info-col { display: flex; flex-direction: column; gap: 0.75rem; }
  .breadcrumb { display: flex; align-items: center; gap: 0.375rem; font-size: 0.85rem; color: #8f8f96; }
  .sep { color: #71717a; }
  .title { margin: 0; font-size: 1.6rem; font-weight: 700; color: #e3e4e6; line-height: 1.2; }
  .meta-row { display: flex; gap: 0.5rem; flex-wrap: wrap; }
  .badge { padding: 0.25rem 0.625rem; border-radius: 6px; font-size: 0.75rem; font-weight: 600; }
  .badge.cat { background: rgba(16,185,129,0.12); color: #10b981; }
  .badge.sub { background: rgba(59,130,246,0.12); color: #3b82f6; }

  /* Serial Selector */
  .serial-selector { }
  .serial-selector label { font-size: 0.7rem; font-weight: 600; color: #8f8f96; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.375rem; display: block; }
  .serial-chips { display: flex; gap: 0.5rem; flex-wrap: wrap; }
  .chip { display: flex; align-items: center; gap: 0.375rem; padding: 0.375rem 0.75rem; border: 2px solid rgba(255,255,255,0.1); border-radius: 8px; background: #161618; cursor: pointer; font-size: 0.8rem; transition: all 0.2s; }
  .chip:hover { border-color: rgba(16,185,129,0.4); }
  .chip.active { border-color: #10b981; background: rgba(16,185,129,0.12); }
  .chip.sold { opacity: 0.55; }
  .chip-sn { font-family: monospace; font-weight: 600; color: #e3e4e6; }
  .chip-grade { background: rgba(255,255,255,0.08); padding: 0.1rem 0.35rem; border-radius: 4px; font-size: 0.65rem; font-weight: 600; }
  .chip-display { color: #f59e0b; }
  .chip-sold { font-size: 0.6rem; background: rgba(239,68,68,0.2); color: #f87171; padding: 0.1rem 0.35rem; border-radius: 4px; font-weight: 600; }

  /* Price */
  .price-row { display: flex; align-items: baseline; gap: 1rem; flex-wrap: wrap; }
  .price { font-size: 1.5rem; font-weight: 800; color: #10b981; }
  .price-discount { display: flex; align-items: center; gap: 0.5rem; }
  .price-original { font-size: 0.95rem; color: #71717a; text-decoration: line-through; }
  .discount-badge { background: rgba(239,68,68,0.2); color: #f87171; padding: 0.15rem 0.5rem; border-radius: 6px; font-size: 0.75rem; font-weight: 700; }
  .price-promo { font-size: 1.5rem; font-weight: 800; color: #f87171; }
  .cost { font-size: 0.85rem; color: #71717a; }

  .serial-info { display: flex; gap: 1.5rem; padding: 0.75rem; background: #161618; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; }
  .info-item { }
  .info-label { display: block; font-size: 0.65rem; font-weight: 600; color: #8f8f96; text-transform: uppercase; letter-spacing: 0.05em; }
  .info-value { font-size: 0.9rem; font-weight: 600; color: #e3e4e6; }
  .info-value.green { color: #10b981; }
  .info-value.red { color: #f87171; }
  .grade-value { color: #3b82f6; }

  .video-link { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #3b82f6; }
  .video-link a { color: #3b82f6; font-weight: 500; }

  /* Action Buttons */
  .action-row { display: flex; gap: 0.75rem; }
  .btn-beli { flex: 1; padding: 0.75rem; background: #10b981; color: white; border: none; border-radius: 10px; font-size: 0.95rem; font-weight: 700; cursor: pointer; transition: all 0.2s; }
  .btn-beli:hover { background: #0ea371; }
  .btn-order { flex: 1; padding: 0.75rem; background: #3b82f6; color: white; border: none; border-radius: 10px; font-size: 0.95rem; font-weight: 700; cursor: pointer; transition: all 0.2s; }
  .btn-order:hover { background: #2563eb; }
  .btn-share { display: flex; align-items: center; gap: 0.375rem; padding: 0.75rem 1rem; background: #161618; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; cursor: pointer; font-size: 0.85rem; font-weight: 500; color: #a1a1a5; white-space: nowrap; transition: all 0.2s; }
  .btn-share:hover { background: rgba(255,255,255,0.05); }

  /* Specs */
  .spec-section { }
  .spec-label { font-size: 0.75rem; font-weight: 700; color: #8f8f96; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; }
  .spec-content { font-size: 0.9rem; line-height: 1.7; color: #d4d4d8; }
  .spec-content :global(p) { margin: 0 0 0.75rem; }
  .spec-content :global(strong) { font-weight: 700; } .spec-content :global(em) { font-style: italic; }
  .spec-content :global(u) { text-decoration: underline; } .spec-content :global(s) { text-decoration: line-through; }
  .spec-content :global(h1), .spec-content :global(h2), .spec-content :global(h3), .spec-content :global(h4) { margin: 1rem 0 0.5rem; font-weight: 700; color: #e3e4e6; }
  .spec-content :global(h1) { font-size: 1.4rem; } .spec-content :global(h2) { font-size: 1.2rem; } .spec-content :global(h3) { font-size: 1.1rem; }
  .spec-content :global(ul), .spec-content :global(ol) { margin: 0 0 0.75rem; padding-left: 1.5rem; }
  .spec-content :global(li) { margin-bottom: 0.25rem; }
  .spec-content :global(img) { max-width: 100%; border-radius: 8px; margin: 0.5rem 0; }
  .spec-content :global(a) { color: #3b82f6; text-decoration: underline; }
  .spec-content :global(blockquote) { border-left: 3px solid rgba(255,255,255,0.1); padding-left: 1rem; color: #8f8f96; margin: 0 0 0.75rem; }
  .spec-content :global(pre) { background: rgba(255,255,255,0.04); padding: 0.75rem; border-radius: 6px; overflow-x: auto; font-size: 0.85rem; }
  .empty { color: #71717a; font-size: 0.85rem; }

  /* Lightbox */
  .lightbox { position: fixed; inset: 0; background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 2rem; }
  .lb-content { position: relative; max-width: 90vw; max-height: 90vh; cursor: default; }
  .lb-content img { max-width: 100%; max-height: 80vh; border-radius: 8px; display: block; }
  .lb-controls { position: absolute; bottom: -3rem; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 1rem; }
  .lb-controls button { background: rgba(255,255,255,0.15); border: none; color: white; padding: 0.5rem; border-radius: 8px; cursor: pointer; }
  .lb-controls button:hover { background: rgba(255,255,255,0.3); }
  .lb-controls span { color: white; font-size: 0.875rem; font-weight: 500; min-width: 60px; text-align: center; }
  .lb-close { position: absolute; top: 0.5rem; right: 0.5rem; background: rgba(0,0,0,0.5); border: none; color: white; padding: 0.5rem; border-radius: 8px; cursor: pointer; }

  @media (max-width: 768px) { .layout { grid-template-columns: 1fr; } .title { font-size: 1.2rem; } }
</style>
