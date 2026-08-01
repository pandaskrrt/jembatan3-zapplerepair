<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    
    let { data } = $props();
    let cabinet = data?.cabinet;
    let section = data?.section;
    let items = data?.items || [];
    
    let selectedItem = $state<any>(null);
    let hoveredItem = $state<number | null>(null);
    let sortBy = $state<'name' | 'price' | 'stock'>('name');
    let searchQuery = $state('');
    let modalEntering = $state(false);
    let qrCodeUrl = $state<string>('');
    
    let cabinetId = $page.params.id;
    
    let filteredItems = $derived(() => {
        let result = [...items];
        if (searchQuery) {
            result = result.filter(item => 
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.serialNumber && item.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }
        result.sort((a, b) => {
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            if (sortBy === 'price') return (a.priceIdr || 0) - (b.priceIdr || 0);
            if (sortBy === 'stock') return b.stock - a.stock;
            return 0;
        });
        return result;
    });
    
    function goBack() {
        goto(`/showcase/${cabinetId}`);
    }
    
    function generateQRForItem(item: any) {
        if (!item) return;
        const baseUrl = window.location.origin;
        const url = item.qrCustomUrl || `${baseUrl}/showcase/${cabinetId}/${section?.id}?item=${item.id}`;
        // Color diatur ke #63b3ed agar serasi dengan aksen biru neon sistem data
        qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=10&color=99,179,237&bgcolor=15,23,42&data=${encodeURIComponent(url)}`;
    }
    
    function viewItemDetail(item: any) {
        selectedItem = item;
        modalEntering = true;
        document.body.style.overflow = 'hidden';
        generateQRForItem(item);
        setTimeout(() => modalEntering = false, 100);
    }
    
    function closeDetail() {
        selectedItem = null;
        qrCodeUrl = '';
        document.body.style.overflow = '';
    }
    
    function formatPriceIdr(price: number) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(price);
    }
    
    function handleOverlayKeydown(e: KeyboardEvent) {
        if (e.key === 'Escape') closeDetail();
    }

    function getStockStatus(stock: number) {
        if (stock === 0) return { label: 'Out of Stock', class: 'sold-out' };
        if (stock < 3) return { label: `Critically Low (${stock})`, class: 'critical' };
        if (stock < 6) return { label: `Low Stock (${stock})`, class: 'low' };
        return { label: `${stock} Available`, class: 'good' };
    }

    function copyLinkToClipboard() {
        if (!selectedItem) return;
        const baseUrl = window.location.origin;
        const url = selectedItem.qrCustomUrl || `${baseUrl}/showcase/${cabinetId}/${section?.id}?item=${selectedItem.id}`;
        navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
    }
</script>

<svelte:head>
    <title>{section?.name} — {cabinet?.name}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700&display=swap" rel="stylesheet">
</svelte:head>

<div class="page-wrapper">
    <div class="grid-overlay"></div>

    <div class="content">
        <button class="back-button" onclick={goBack}>
            <svg class="back-icon" viewBox="0 0 24 24" fill="none" width="16" height="16">
                <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Back to {cabinet?.name}</span>
        </button>

        <header class="page-header">
            <div class="header-bg"></div>
            <div class="header-content">
                <p class="header-breadcrumb">{cabinet?.name} / Layout Layouts</p>
                <h1 class="header-title">{section?.name || 'Loading Layout...'}</h1>
                <div class="header-stats">
                    <span class="stat-badge">
                        <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M20 7L12 3L4 7L12 11L20 7Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 7V17L12 21L20 17V7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        {filteredItems().length} Items Listed
                    </span>
                    <span class="stat-badge color-tag">
                        <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M3 7h18M3 12h18M3 17h18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
                        Type: {section?.type || 'Storage'}
                    </span>
                </div>
            </div>
        </header>

        <div class="controls">
            <div class="search-field">
                <svg class="search-icon" viewBox="0 0 24 24" fill="none" width="16" height="16">
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <input
                    type="text"
                    placeholder="Search by SKU name, category, or SN number..."
                    bind:value={searchQuery}
                    class="search-input"
                />
                {#if searchQuery}
                    <button class="clear-btn" onclick={() => searchQuery = ''}>✕</button>
                {/if}
            </div>
            
            <div class="sort-field">
                <span class="sort-label">Sort Layout</span>
                <select bind:value={sortBy} class="sort-select">
                    <option value="name">Alphabetical</option>
                    <option value="price">Price Rates</option>
                    <option value="stock">Stock Inventory</option>
                </select>
            </div>
        </div>

        {#if filteredItems().length === 0}
            <div class="empty-state">
                <div class="empty-icon">
                    <svg viewBox="0 0 24 24" fill="none" width="48" height="48"><path d="M20 7L12 3L4 7L12 11L20 7Z" stroke="currentColor" stroke-width="1.5"/><path d="M4 7V17L12 21L20 17V7" stroke="currentColor" stroke-width="1.5"/><path d="M12 11V21" stroke="currentColor" stroke-width="1.5"/></svg>
                </div>
                <h3 class="empty-title">No units detected</h3>
                <p class="empty-text">{searchQuery ? "No internal parts match current search queries." : "This sector profile doesn't contain any material items."}</p>
                {#if searchQuery}
                    <button class="empty-action" onclick={() => searchQuery = ''}>Reset Filters</button>
                {/if}
            </div>
        {:else}
            <div class="items-grid">
                {#each filteredItems() as item, i}
                    {@const stock = getStockStatus(item.stock)}
                    <div 
                        class="item-card"
                        style="animation-delay: {i * 0.02}s"
                        onmouseenter={() => hoveredItem = item.id}
                        onmouseleave={() => hoveredItem = null}
                        onclick={() => viewItemDetail(item)}
                        role="button"
                        tabindex="0"
                    >
                        <div class="card-top-bar" class:active={hoveredItem === item.id}></div>
                        
                        <div class="card-image-wrap">
                            {#if item.imageUrl}
                                <img src={item.imageUrl} alt={item.name} class="card-image" />
                            {:else}
                                <div class="card-no-image">
                                    <svg viewBox="0 0 24 24" fill="none" width="36" height="36" stroke="currentColor" stroke-width="1"><path d="M20 7L12 3L4 7L12 11L20 7Z"/><path d="M4 7V17L12 21L20 17V7"/></svg>
                                </div>
                            {/if}
                            <div class="card-stock-badge {stock.class}">
                                <span class="stock-indicator-dot"></span>
                                {stock.label}
                            </div>
                        </div>

                        <div class="card-body">
                            <div class="card-categories">
                                <span class="card-category">{item.category}</span>
                                {#if item.subCategory}
                                    <span class="card-subcategory">{item.subCategory}</span>
                                {/if}
                            </div>
                            
                            <h3 class="card-name">{item.name}</h3>
                            
                            {#if item.serialNumber}
                                <div class="card-serial">
                                    <span class="serial-label">SN:</span>
                                    <span class="serial-value">{item.serialNumber}</span>
                                </div>
                            {/if}
                            
                            <div class="card-meta-pricing">
                                <div class="card-price">
                                    <span class="price-amount">{formatPriceIdr(item.priceIdr)}</span>
                                    {#if item.priceNote}<span class="price-note">/{item.priceNote}</span>{/if}
                                </div>
                            </div>

                            <div class="card-location">
                                <svg viewBox="0 0 24 24" fill="none" width="11" height="11"><path d="M12 21s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 7.2c0 7.3-8 11.8-8 11.8z" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="9" r="2" stroke="currentColor" stroke-width="1.8"/></svg>
                                <span>{item.location}</span>
                            </div>
                        </div>

                        <div class="card-footer">
                            <span class="footer-text">Inspect Properties</span>
                            <span class="footer-arrow" class:active={hoveredItem === item.id}>→</span>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>

{#if selectedItem}
    {@const stock = getStockStatus(selectedItem.stock)}
    <div
        class="modal-overlay"
        class:entering={modalEntering}
        onclick={closeDetail}
        onkeydown={handleOverlayKeydown}
        role="button"
        tabindex="0"
    >
        <div class="modal-container" onclick={(e) => e.stopPropagation()}>
            <button class="modal-close" onclick={closeDetail}>✕</button>
            
            <div class="modal-header">
                <div class="modal-badge">System Registry // {cabinet?.name} / {section?.name}</div>
                <h2 class="modal-title">{selectedItem.name}</h2>
                <div class="modal-categories">
                    <span class="modal-category">{selectedItem.category}</span>
                    {#if selectedItem.subCategory}
                        <span class="modal-subcategory">{selectedItem.subCategory}</span>
                    {/if}
                </div>
            </div>

            <div class="modal-body">
                <div class="modal-image-panel">
                    <div class="modal-img-container">
                        {#if selectedItem.imageUrl}
                            <img src={selectedItem.imageUrl} alt={selectedItem.name} />
                        {:else}
                            <div class="modal-no-image">
                                <svg viewBox="0 0 24 24" fill="none" width="64" height="64" stroke="currentColor" stroke-width="1"><path d="M20 7L12 3L4 7L12 11L20 7Z"/><path d="M4 7V17L12 21L20 17V7"/></svg>
                            </div>
                        {/if}
                    </div>
                    <div class="modal-stock-badge {stock.class}">
                        <span class="stock-indicator-dot"></span>
                        {stock.label}
                    </div>
                </div>

                <div class="modal-info-panel">
                    <div class="info-rows-group">
                        <div class="info-row">
                            <span class="info-label">Storage Location</span>
                            <span class="info-value text-highlight">{selectedItem.location}</span>
                        </div>
                        {#if selectedItem.serialNumber}
                            <div class="info-row">
                                <span class="info-label">Serial Hardware Id</span>
                                <span class="info-value serial-code">{selectedItem.serialNumber}</span>
                            </div>
                        {/if}
                        <div class="info-row">
                            <span class="info-label">Total Volume Stock</span>
                            <span class="info-value">{selectedItem.stock} units</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Valuation Rate</span>
                            <span class="info-value valuation-price">{formatPriceIdr(selectedItem.priceIdr)}</span>
                        </div>
                        {#if selectedItem.priceNote}
                            <div class="info-row">
                                <span class="info-label">Pricing Variant Description</span>
                                <span class="info-value note-text">{selectedItem.priceNote}</span>
                            </div>
                        {/if}
                    </div>

                    <div class="qr-system-card">
                        <div class="qr-info-meta">
                            <div class="qr-title-row">
                                <svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                                <span class="qr-label">Asset Identity Link</span>
                            </div>
                            <p class="qr-description">Scan matrix token code to parse direct hardware URL routing variables.</p>
                            <button class="qr-copy-action-btn" onclick={copyLinkToClipboard}>
                                <svg viewBox="0 0 24 24" fill="none" width="12" height="12" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                                <span>Copy Link Blueprint</span>
                            </button>
                        </div>
                        <div class="qr-display-box">
                            {#if qrCodeUrl}
                                <img src={qrCodeUrl} alt="Matrix Asset QR" class="qr-matrix-img" />
                            {:else}
                                <div class="qr-generating-skeleton">
                                    <div class="spinner"></div>
                                </div>
                            {/if}
                        </div>
                    </div>

                {#if selectedItem.videoUrl}
                        <a href={selectedItem.videoUrl} target="_blank" rel="noopener noreferrer" class="media-stream-btn">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M8 5v14l11-7z"/></svg>
                            <span>Initialize Media Stream Reference</span>
                        </a>
                    {/if}

                    <a href={`/product/${selectedItem.id}`} class="product-detail-btn">
                        <svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor" stroke-width="2"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/></svg>
                        <span>Buka Halaman Produk / Serial</span>
                    </a>
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    :global(body) {
        margin: 0;
        padding: 0;
        background: #06090f;
        font-family: 'Inter', sans-serif;
        color: #f1f5f9;
        overflow-x: hidden;
    }

    .page-wrapper {
        position: relative;
        min-height: 100vh;
        overflow: hidden;
    }

    .grid-overlay {
        position: fixed;
        inset: 0;
        z-index: 1;
        pointer-events: none;
        background-image:
            linear-gradient(rgba(99,179,237,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,179,237,0.03) 1px, transparent 1px);
        background-size: 48px 48px;
        mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%);
    }

    .content {
        position: relative;
        z-index: 2;
        padding: 2rem 2.5rem 3rem;
        max-width: 1800px;
        margin: 0 auto;
    }

    /* Back Button Link */
    .back-button {
        display: inline-flex;
        align-items: center;
        gap: 0.6rem;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        color: rgba(255, 255, 255, 0.6);
        padding: 0.6rem 1.2rem;
        border-radius: 10px;
        font-family: 'Inter', sans-serif;
        font-size: 0.8rem;
        font-weight: 500;
        cursor: pointer;
        margin-bottom: 2rem;
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        transition: all 0.25s ease;
    }

    .back-button:hover {
        background: rgba(255, 255, 255, 0.07);
        border-color: rgba(147, 197, 253, 0.3);
        color: #93c5fd;
    }

    .back-icon {
        transition: transform 0.25s ease;
    }

    .back-button:hover .back-icon {
        transform: translateX(-3px);
    }

    /* Section Sub-Header Banner */
    .page-header {
        position: relative;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 20px;
        margin-bottom: 2.5rem;
        overflow: hidden;
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
    }

    .header-bg {
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at top left, rgba(124, 58, 237, 0.12), transparent 60%);
        pointer-events: none;
    }

    .header-content {
        position: relative;
        padding: 2.5rem;
    }

    .header-breadcrumb {
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: rgba(255, 255, 255, 0.3);
        margin: 0 0 0.5rem 0;
    }

    .header-title {
        font-size: 2.2rem;
        font-weight: 700;
        color: #f1f5f9;
        margin: 0 0 1.2rem 0;
        letter-spacing: -0.5px;
    }

    .header-stats {
        display: flex;
        gap: 1rem;
    }

    .stat-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 30px;
        padding: 5px 14px;
        font-size: 11px;
        color: rgba(255, 255, 255, 0.5);
    }

    .stat-badge.color-tag {
        background: rgba(124, 58, 237, 0.1);
        border-color: rgba(124, 58, 237, 0.2);
        color: #c084fc;
    }

    /* Controls Filtration Bar */
    .controls {
        display: flex;
        gap: 1.25rem;
        margin-bottom: 2.5rem;
        flex-wrap: wrap;
    }

    .search-field {
        position: relative;
        flex: 1;
        min-width: 300px;
    }

    .search-icon {
        position: absolute;
        left: 1.1rem;
        top: 50%;
        transform: translateY(-50%);
        color: rgba(255, 255, 255, 0.3);
        pointer-events: none;
    }

    .search-input {
        width: 100%;
        padding: 0.85rem 1rem 0.85rem 2.8rem;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 12px;
        color: #f1f5f9;
        font-size: 0.9rem;
        transition: all 0.25s;
        box-sizing: border-box;
    }

    .search-input:focus {
        outline: none;
        background: rgba(255, 255, 255, 0.04);
        border-color: rgba(147, 197, 253, 0.3);
        box-shadow: 0 0 0 3px rgba(147, 197, 253, 0.05);
    }

    .clear-btn {
        position: absolute;
        right: 1.1rem;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.4);
        cursor: pointer;
        font-size: 0.8rem;
    }

    .clear-btn:hover { color: #f1f5f9; }

    .sort-field {
        display: flex;
        align-items: center;
        gap: 0.85rem;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 12px;
        padding: 0.5rem 1.25rem;
    }

    .sort-label {
        font-size: 11px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: rgba(255, 255, 255, 0.3);
    }

    .sort-select {
        background: transparent;
        border: none;
        color: #e2e8f0;
        font-size: 0.85rem;
        font-weight: 500;
        cursor: pointer;
        padding: 0.25rem 0.5rem;
    }

    .sort-select:focus { outline: none; }
    .sort-select option { background: #0f172a; color: #f1f5f9; }

    /* Material Items Multi-Grid Matrix */
    .items-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 1.25rem;
    }

    @media (max-width: 1600px) { .items-grid { grid-template-columns: repeat(4, 1fr); } }
    @media (max-width: 1200px) { .items-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 900px)  { .items-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 600px)  { .items-grid { grid-template-columns: 1fr; } }

    /* Micro Stock Grid Item Cards */
    .item-card {
        position: relative;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 16px;
        overflow: hidden;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        transition: background 0.25s, border-color 0.25s, transform 0.25s;
        animation: cardSpawn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    @keyframes cardSpawn {
        from { opacity: 0; transform: translateY(15px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .item-card:hover {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(147, 197, 253, 0.25);
        transform: translateY(-4px);
    }

    .card-top-bar {
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 2px;
        background: linear-gradient(90deg, #63b3ed, #7c3aed);
        transform: scaleX(0);
        transform-origin: left;
        transition: transform 0.3s ease;
    }
    .card-top-bar.active { transform: scaleX(1); }

    .card-image-wrap {
        position: relative;
        aspect-ratio: 1.1;
        background: rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        border-bottom: 1px solid rgba(255, 255, 255, 0.03);
    }

    .card-image {
        width: 100%;
        height: 100%;
        object-fit: contain;
        padding: 1.25rem;
        transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .item-card:hover .card-image { transform: scale(1.06); }

    .card-no-image {
        color: rgba(255, 255, 255, 0.12);
    }

    /* Core Inventory Status Tags */
    .card-stock-badge {
        position: absolute;
        top: 10px; right: 10px;
        font-size: 9px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.02em;
        padding: 4px 10px;
        border-radius: 100px;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        border: 1px solid transparent;
    }

    .stock-indicator-dot {
        width: 4px; height: 4px;
        border-radius: 50%;
        background: currentColor;
    }

    .card-stock-badge.good { background: rgba(52, 211, 153, 0.1); border-color: rgba(52, 211, 153, 0.2); color: #34d399; }
    .card-stock-badge.low { background: rgba(251, 191, 36, 0.1); border-color: rgba(251, 191, 36, 0.2); color: #fbbf24; }
    .card-stock-badge.critical { background: rgba(248, 113, 113, 0.1); border-color: rgba(248, 113, 113, 0.2); color: #f87171; }
    .card-stock-badge.sold-out { background: rgba(255, 255, 255, 0.05); border-color: rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.4); }

    .card-body {
        padding: 1.25rem;
        display: flex;
        flex-direction: column;
        flex: 1;
    }

    .card-categories {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        margin-bottom: 0.6rem;
    }

    .card-category, .card-subcategory {
        font-size: 9px;
        font-weight: 600;
        text-transform: uppercase;
        padding: 2px 6px;
        border-radius: 4px;
    }

    .card-category { background: rgba(255, 255, 255, 0.04); color: rgba(255, 255, 255, 0.5); }
    .card-subcategory { background: rgba(99, 179, 237, 0.08); color: #93c5fd; }

    .card-name {
        font-size: 0.95rem;
        font-weight: 600;
        color: #e2e8f0;
        margin: 0 0 0.5rem 0;
        line-height: 1.4;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .card-serial {
        font-size: 10px;
        font-family: monospace;
        color: rgba(255, 255, 255, 0.3);
        margin-bottom: 0.85rem;
    }
    .serial-value { color: #a7f3d0; }

    .card-meta-pricing {
        margin-top: auto;
        margin-bottom: 0.6rem;
    }

    .price-amount {
        font-size: 1.05rem;
        font-weight: 700;
        color: #f1f5f9;
        letter-spacing: -0.3px;
    }

    .price-note {
        font-size: 10px;
        color: rgba(255, 255, 255, 0.3);
        margin-left: 2px;
    }

    .card-location {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 11px;
        color: rgba(255, 255, 255, 0.35);
    }

    .card-footer {
        padding: 0.85rem 1.25rem;
        border-top: 1px solid rgba(255, 255, 255, 0.04);
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 11px;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.3);
        transition: color 0.2s;
    }

    .item-card:hover .card-footer { color: #93c5fd; }

    .footer-arrow { transition: transform 0.2s ease; }
    .footer-arrow.active { transform: translateX(4px); color: #93c5fd; }

    /* Empty Grid Profile Block */
    .empty-state {
        text-align: center;
        padding: 5rem 2rem;
        background: rgba(255, 255, 255, 0.01);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 20px;
    }

    .empty-icon {
        color: rgba(255, 255, 255, 0.15);
        margin-bottom: 1.25rem;
    }

    .empty-title {
        font-size: 1.2rem;
        color: #e2e8f0;
        margin: 0 0 0.4rem 0;
    }

    .empty-text {
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.4);
        margin-bottom: 1.75rem;
    }

    .empty-action {
        padding: 0.6rem 1.5rem;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 10px;
        color: #e2e8f0;
        cursor: pointer;
        font-size: 0.8rem;
        transition: background 0.2s;
    }
    .empty-action:hover { background: rgba(255, 255, 255, 0.08); }

    /* Glassmorphism Dialog Modal View */
    .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(3, 5, 10, 0.85);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 1.5rem;
        transition: opacity 0.2s ease;
    }

    .modal-container {
        background: #0b0f17;
        border: 1px solid rgba(255, 255, 255, 0.08);
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
        border-radius: 24px;
        max-width: 840px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        position: relative;
        animation: modalScaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    @keyframes modalScaleUp {
        from { opacity: 0; transform: scale(0.96) translateY(10px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
    }

    .modal-close {
        position: absolute;
        top: 1.25rem; right: 1.25rem;
        width: 34px; height: 34px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 10px;
        color: rgba(255, 255, 255, 0.5);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
        transition: all 0.2s;
    }
    .modal-close:hover { background: rgba(255, 255, 255, 0.08); color: #f1f5f9; }

    .modal-header {
        padding: 2rem 2rem 1.5rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    }

    .modal-badge {
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: rgba(99, 179, 237, 0.7);
        margin-bottom: 0.5rem;
    }

    .modal-title {
        font-size: 1.6rem;
        font-weight: 700;
        color: #f1f5f9;
        margin: 0 0 1rem 0;
        letter-spacing: -0.5px;
    }

    .modal-categories {
        display: flex;
        gap: 6px;
    }

    .modal-category, .modal-subcategory {
        font-size: 10px;
        font-weight: 500;
        padding: 3px 10px;
        border-radius: 30px;
    }
    .modal-category { background: rgba(255, 255, 255, 0.05); color: rgba(255, 255, 255, 0.6); }
    .modal-subcategory { background: rgba(124, 58, 237, 0.15); color: #d8b4fe; }

    .modal-body {
        display: flex;
        gap: 2rem;
        padding: 2rem;
    }

    @media (max-width: 700px) { .modal-body { flex-direction: column; } }

    /* Modal Left View Panel */
    .modal-image-panel {
        flex: 1.1;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .modal-img-container {
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.04);
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.5rem;
        aspect-ratio: 1.2;
    }

    .modal-img-container img {
        max-width: 100%;
        max-height: 240px;
        object-fit: contain;
    }

    .modal-no-image { color: rgba(255, 255, 255, 0.08); }

    .modal-stock-badge {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 0.6rem;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.02em;
        border: 1px solid transparent;
    }
    .modal-stock-badge.good { background: rgba(52, 211, 153, 0.06); border-color: rgba(52, 211, 153, 0.15); color: #34d399; }
    .modal-stock-badge.low { background: rgba(251, 191, 36, 0.06); border-color: rgba(251, 191, 36, 0.15); color: #fbbf24; }
    .modal-stock-badge.critical { background: rgba(248, 113, 113, 0.06); border-color: rgba(248, 113, 113, 0.15); color: #f87171; }
    .modal-stock-badge.sold-out { background: rgba(255, 255, 255, 0.03); border-color: rgba(255, 255, 255, 0.08); color: rgba(255, 255, 255, 0.4); }

    /* Modal Right View Panel */
    .modal-info-panel {
        flex: 1.3;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
    }

    .info-rows-group {
        background: rgba(255, 255, 255, 0.01);
        border: 1px solid rgba(255, 255, 255, 0.04);
        border-radius: 16px;
        padding: 0.5rem 1.25rem;
    }

    .info-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.85rem 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        font-size: 13px;
    }
    .info-row:last-child { border-bottom: none; }

    .info-label { color: rgba(255, 255, 255, 0.4); }
    .info-value { color: #e2e8f0; font-weight: 500; }
    .info-value.text-highlight { color: #f1f5f9; }
    .info-value.serial-code { font-family: monospace; color: #a7f3d0; background: rgba(167, 243, 208, 0.05); padding: 2px 6px; border-radius: 4px; }
    .info-value.valuation-price { color: #63b3ed; font-weight: 700; font-size: 15px; }
    .info-value.note-text { color: rgba(255, 255, 255, 0.5); font-size: 12px; }

    /* Integrated QR Card Dashboard */
    .qr-system-card {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 16px;
        padding: 1.25rem;
        display: flex;
        gap: 1rem;
        align-items: center;
    }

    .qr-info-meta { flex: 1; }
    
    .qr-title-row {
        display: flex;
        align-items: center;
        gap: 6px;
        color: rgba(255, 255, 255, 0.6);
        margin-bottom: 0.35rem;
    }

    .qr-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
    .qr-description { font-size: 11px; color: rgba(255, 255, 255, 0.35); margin: 0 0 0.85rem 0; line-height: 1.4; }

    .qr-copy-action-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        padding: 5px 12px;
        font-size: 11px;
        font-weight: 500;
        color: #e2e8f0;
        cursor: pointer;
        transition: all 0.2s;
    }
    .qr-copy-action-btn:hover { background: rgba(99, 179, 237, 0.1); border-color: rgba(99, 179, 237, 0.2); color: #93c5fd; }

    .qr-display-box {
        width: 100px; height: 100px;
        background: #0f172a;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 10px;
        padding: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
    }

    .qr-matrix-img { width: 100%; height: 100%; object-fit: contain; border-radius: 6px; }

    .qr-generating-skeleton {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .spinner {
        width: 20px; height: 20px;
        border: 2px solid rgba(255, 255, 255, 0.1);
        border-top-color: #63b3ed;
        border-radius: 50%;
        animation: spin 0.8s infinite linear;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Product Detail Link */
    .product-detail-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 0.85rem;
        background: rgba(16, 185, 129, 0.08);
        border: 1px solid rgba(16, 185, 129, 0.25);
        border-radius: 12px;
        text-decoration: none;
        font-size: 12px;
        font-weight: 600;
        color: #34d399;
        transition: all 0.25s ease;
    }

    .product-detail-btn:hover {
        background: rgba(16, 185, 129, 0.15);
        border-color: rgba(16, 185, 129, 0.45);
        box-shadow: 0 0 15px rgba(16, 185, 129, 0.15);
    }

    /* Media Reference Action Link */
    .media-stream-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 0.85rem;
        background: linear-gradient(180deg, rgba(124, 58, 237, 0.15) 0%, rgba(124, 58, 237, 0.05) 100%);
        border: 1px solid rgba(168, 85, 247, 0.25);
        border-radius: 12px;
        text-decoration: none;
        font-size: 12px;
        font-weight: 600;
        color: #d8b4fe;
        transition: all 0.25s ease;
    }

    .media-stream-btn:hover {
        background: linear-gradient(180deg, rgba(124, 58, 237, 0.25) 0%, rgba(124, 58, 237, 0.1) 100%);
        border-color: rgba(168, 85, 247, 0.4);
        box-shadow: 0 0 15px rgba(168, 85, 247, 0.15);
    }

    /* Responsive Overrides */
    @media (max-width: 768px) {
        .content { padding: 1.5rem 1rem 2rem; }
        .page-header { border-radius: 14px; }
        .header-content { padding: 1.75rem; }
        .header-title { font-size: 1.6rem; }
        .controls { gap: 0.75rem; }
        .search-field { min-width: 100%; }
        .sort-field { width: 100%; justify-content: space-between; box-sizing: border-box; }
    }
</style>