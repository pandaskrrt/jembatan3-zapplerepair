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
        qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&margin=10&color=16,185,129&bgcolor=255,255,255&data=${encodeURIComponent(url)}`;
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
        if (stock < 3) return { label: `Only ${stock} Left`, class: 'critical' };
        if (stock < 6) return { label: `${stock} Available`, class: 'low' };
        return { label: `${stock} In Stock`, class: 'good' };
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
    <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700&display=swap" rel="stylesheet">
</svelte:head>

<div class="page-wrapper">
    <!-- Back Button -->
    <button class="back-button" onclick={goBack}>
        <span class="back-arrow">←</span>
        <span>Back to {cabinet?.name}</span>
    </button>

    <!-- Header -->
    <header class="page-header">
        <div class="header-accent"></div>
        <div class="header-content">
            <p class="header-breadcrumb">{cabinet?.name} / {section?.name}</p>
            <h1 class="header-title">{section?.name}</h1>
            <div class="header-stats">
                <span class="stat-badge">
                    <span class="stat-icon">📦</span>
                    {filteredItems().length} Items
                </span>
                <span class="stat-badge">
                    <span class="stat-icon">🏷️</span>
                    {section?.type || 'Storage'}
                </span>
            </div>
        </div>
    </header>

    <!-- Controls -->
    <div class="controls">
        <div class="search-field">
            <span class="search-icon">🔍</span>
            <input
                type="text"
                placeholder="Search by name, category, or serial number..."
                bind:value={searchQuery}
                class="search-input"
            />
            {#if searchQuery}
                <button class="clear-btn" onclick={() => searchQuery = ''}>✕</button>
            {/if}
        </div>
        <div class="sort-field">
            <span class="sort-label">Sort by</span>
            <select bind:value={sortBy} class="sort-select">
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="stock">Stock</option>
            </select>
        </div>
    </div>

    <!-- Items Grid -->
    {#if filteredItems().length === 0}
        <div class="empty-state">
            <div class="empty-icon">📭</div>
            <h3 class="empty-title">No items found</h3>
            <p class="empty-text">{#if searchQuery}No items match your search.{:else}This section is empty.{/if}</p>
            {#if searchQuery}
                <button class="empty-action" onclick={() => searchQuery = ''}>Clear Search</button>
            {/if}
        </div>
    {:else}
        <div class="items-grid">
            {#each filteredItems() as item, i}
                {@const stock = getStockStatus(item.stock)}
                <div 
                    class="item-card"
                    style="animation-delay: {i * 0.03}s"
                    onmouseenter={() => hoveredItem = item.id}
                    onmouseleave={() => hoveredItem = null}
                    onclick={() => viewItemDetail(item)}
                    role="button"
                    tabindex="0"
                >
                    <div class="card-border" class:active={hoveredItem === item.id}></div>
                    
                    <div class="card-image-wrap">
                        {#if item.imageUrl}
                            <img src={item.imageUrl} alt={item.name} class="card-image" />
                        {:else}
                            <div class="card-no-image">📦</div>
                        {/if}
                        <div class="card-stock-badge {stock.class}">{stock.label}</div>
                    </div>

                    <div class="card-body">
                        <div class="card-categories">
                            <span class="card-category">{item.category}</span>
                            <span class="card-subcategory">{item.subCategory}</span>
                        </div>
                        <h3 class="card-name">{item.name}</h3>
                        {#if item.serialNumber}
                            <div class="card-serial">
                                <span class="serial-label">SN:</span>
                                <span class="serial-value">{item.serialNumber}</span>
                            </div>
                        {/if}
                        <div class="card-price">
                            <span class="price-amount">{formatPriceIdr(item.priceIdr)}</span>
                            {#if item.priceNote}<span class="price-note">({item.priceNote})</span>{/if}
                        </div>
                        <div class="card-location">
                            <span class="location-icon">📍</span>
                            <span>{item.location}</span>
                        </div>
                    </div>

                    <div class="card-footer">
                        <span class="footer-text">View Details</span>
                        <span class="footer-arrow">→</span>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<!-- Item Detail Modal -->
{#if selectedItem}
    {@const stock = getStockStatus(selectedItem.stock)}
    <div
        class="modal-overlay"
        onclick={closeDetail}
        onkeydown={handleOverlayKeydown}
        role="button"
        tabindex="0"
    >
        <div class="modal-container" onclick={(e) => e.stopPropagation()}>
            <button class="modal-close" onclick={closeDetail}>✕</button>
            
            <div class="modal-header">
                <div class="modal-badge">{cabinet?.name} / {section?.name}</div>
                <h2 class="modal-title">{selectedItem.name}</h2>
                <div class="modal-categories">
                    <span class="modal-category">{selectedItem.category}</span>
                    <span class="modal-subcategory">{selectedItem.subCategory}</span>
                </div>
            </div>

            <div class="modal-body">
                <!-- Image Section -->
                <div class="modal-image">
                    {#if selectedItem.imageUrl}
                        <img src={selectedItem.imageUrl} alt={selectedItem.name} />
                    {:else}
                        <div class="modal-no-image">📦</div>
                    {/if}
                    <div class="modal-stock {stock.class}">{stock.label}</div>
                </div>

                <!-- Details Section -->
                <div class="modal-info">
                    <div class="info-grid">
                        <div class="info-row">
                            <span class="info-label">Location</span>
                            <span class="info-value">{selectedItem.location}</span>
                        </div>
                        {#if selectedItem.serialNumber}
                            <div class="info-row">
                                <span class="info-label">Serial Number</span>
                                <span class="info-value serial">{selectedItem.serialNumber}</span>
                            </div>
                        {/if}
                        <div class="info-row">
                            <span class="info-label">Stock</span>
                            <span class="info-value">{selectedItem.stock} units</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Price</span>
                            <span class="info-value price">{formatPriceIdr(selectedItem.priceIdr)}</span>
                        </div>
                        {#if selectedItem.priceNote}
                            <div class="info-row">
                                <span class="info-label">Price Note</span>
                                <span class="info-value">{selectedItem.priceNote}</span>
                            </div>
                        {/if}
                    </div>

                    <!-- QR Code Section -->
                    <div class="qr-section">
                        <div class="qr-header">
                            <span class="qr-icon">📱</span>
                            <span class="qr-label">SCAN QR CODE</span>
                        </div>
                        <div class="qr-container">
                            {#if qrCodeUrl}
                                <img src={qrCodeUrl} alt="QR Code" class="qr-image" />
                                <div class="qr-actions">
                                    <button class="qr-copy" onclick={copyLinkToClipboard}>Copy Link</button>
                                </div>
                            {:else}
                                <div class="qr-loading">Generating QR...</div>
                            {/if}
                        </div>
                    </div>

                    <!-- Video Link -->
                    {#if selectedItem.videoUrl}
                        <a href={selectedItem.videoUrl} target="_blank" rel="noopener noreferrer" class="video-link">
                            <span class="video-icon">▶</span>
                            Watch Video
                        </a>
                    {/if}
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    .page-wrapper {
        max-width: 1400px;
        margin: 0 auto;
        padding: 2rem;
        font-family: 'Inter', sans-serif;
    }

    /* Back Button */
    .back-button {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        background: #ffffff;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 0.5rem 1rem;
        color: #666666;
        font-size: 0.85rem;
        font-weight: 500;
        cursor: pointer;
        margin-bottom: 2rem;
        transition: all 0.2s;
    }

    .back-button:hover {
        background: #f5f5f5;
        border-color: #10b981;
        color: #10b981;
        transform: translateX(-4px);
    }

    /* Header */
    .page-header {
        background: #ffffff;
        border: 1px solid #e0e0e0;
        border-radius: 12px;
        padding: 2rem;
        margin-bottom: 2rem;
        position: relative;
        overflow: hidden;
    }

    .header-accent {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: #10b981;
    }

    .header-breadcrumb {
        font-size: 0.75rem;
        color: #888888;
        margin-bottom: 0.5rem;
    }

    .header-title {
        font-size: 1.8rem;
        font-weight: 600;
        color: #333333;
        margin: 0 0 1rem 0;
    }

    .header-stats {
        display: flex;
        gap: 1rem;
    }

    .stat-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        background: #f5f5f5;
        border-radius: 30px;
        padding: 0.25rem 1rem;
        font-size: 0.8rem;
        color: #666666;
    }

    /* Controls */
    .controls {
        display: flex;
        gap: 1rem;
        margin-bottom: 2rem;
        flex-wrap: wrap;
    }

    .search-field {
        position: relative;
        flex: 1;
        min-width: 250px;
    }

    .search-icon {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: #999999;
        font-size: 0.9rem;
    }

    .search-input {
        width: 100%;
        padding: 0.75rem 1rem 0.75rem 2.5rem;
        background: #ffffff;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        color: #333333;
        font-size: 0.9rem;
        transition: all 0.2s;
        box-sizing: border-box;
    }

    .search-input:focus {
        outline: none;
        border-color: #10b981;
        box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1);
    }

    .clear-btn {
        position: absolute;
        right: 1rem;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: #999999;
        cursor: pointer;
    }

    .sort-field {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        background: #ffffff;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 0.5rem 1rem;
    }

    .sort-label {
        font-size: 0.8rem;
        color: #666666;
    }

    .sort-select {
        background: transparent;
        border: none;
        color: #333333;
        font-size: 0.85rem;
        cursor: pointer;
        padding: 0.25rem;
    }

    .sort-select:focus {
        outline: none;
    }

    /* Items Grid */
    .items-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 1.5rem;
    }

    @media (max-width: 1400px) { .items-grid { grid-template-columns: repeat(4, 1fr); } }
    @media (max-width: 1200px) { .items-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 900px)  { .items-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 600px)  { .items-grid { grid-template-columns: 1fr; } }

    /* Item Card */
    .item-card {
        position: relative;
        background: #ffffff;
        border: 1px solid #e0e0e0;
        border-radius: 12px;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.3s;
        animation: fadeIn 0.4s ease both;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .item-card:hover {
        transform: translateY(-4px);
        border-color: #10b981;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    }

    .card-border {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: #10b981;
        transform: scaleX(0);
        transition: transform 0.3s;
    }

    .card-border.active {
        transform: scaleX(1);
    }

    .card-image-wrap {
        position: relative;
        aspect-ratio: 1;
        background: #f9fafb;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
    }

    .card-image {
        width: 100%;
        height: 100%;
        object-fit: contain;
        padding: 1rem;
        transition: transform 0.3s;
    }

    .item-card:hover .card-image {
        transform: scale(1.05);
    }

    .card-no-image {
        font-size: 3rem;
        opacity: 0.3;
    }

    .card-stock-badge {
        position: absolute;
        top: 8px;
        right: 8px;
        font-size: 0.65rem;
        font-weight: 600;
        padding: 0.25rem 0.6rem;
        border-radius: 20px;
        backdrop-filter: blur(4px);
    }

    .card-stock-badge.good { background: rgba(16, 185, 129, 0.9); color: white; }
    .card-stock-badge.low { background: rgba(245, 158, 11, 0.9); color: white; }
    .card-stock-badge.critical { background: rgba(239, 68, 68, 0.9); color: white; }
    .card-stock-badge.sold-out { background: rgba(107, 114, 128, 0.9); color: white; }

    .card-body {
        padding: 1rem;
    }

    .card-categories {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
    }

    .card-category, .card-subcategory {
        font-size: 0.65rem;
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
    }

    .card-category {
        background: #f5f5f5;
        color: #666666;
    }

    .card-subcategory {
        background: #f0fdf4;
        color: #059669;
    }

    .card-name {
        font-size: 1rem;
        font-weight: 600;
        color: #333333;
        margin: 0 0 0.5rem 0;
        line-height: 1.3;
    }

    .card-serial {
        font-size: 0.7rem;
        color: #888888;
        margin-bottom: 0.5rem;
        font-family: monospace;
    }

    .serial-label {
        font-weight: 500;
    }

    .card-price {
        margin-bottom: 0.5rem;
    }

    .price-amount {
        font-size: 1rem;
        font-weight: 700;
        color: #059669;
    }

    .price-note {
        font-size: 0.65rem;
        color: #999999;
        margin-left: 0.25rem;
    }

    .card-location {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.7rem;
        color: #888888;
    }

    .card-footer {
        padding: 0.75rem 1rem;
        border-top: 1px solid #f0f0f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.7rem;
        color: #10b981;
        font-weight: 500;
    }

    .footer-arrow {
        transition: transform 0.2s;
    }

    .item-card:hover .footer-arrow {
        transform: translateX(4px);
    }

    /* Empty State */
    .empty-state {
        text-align: center;
        padding: 4rem 2rem;
        background: #ffffff;
        border: 1px solid #e0e0e0;
        border-radius: 12px;
    }

    .empty-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
        opacity: 0.5;
    }

    .empty-title {
        font-size: 1.2rem;
        color: #333333;
        margin-bottom: 0.5rem;
    }

    .empty-text {
        color: #666666;
        margin-bottom: 1.5rem;
    }

    .empty-action {
        padding: 0.5rem 1.5rem;
        background: #f5f5f5;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        color: #666666;
        cursor: pointer;
        font-size: 0.85rem;
    }

    /* Modal */
    .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 1rem;
    }

    .modal-container {
        background: #ffffff;
        border-radius: 16px;
        max-width: 800px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        position: relative;
    }

    .modal-close {
        position: absolute;
        top: 1rem;
        right: 1rem;
        width: 32px;
        height: 32px;
        background: #f5f5f5;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        cursor: pointer;
        font-size: 1rem;
        z-index: 10;
    }

    .modal-header {
        padding: 1.5rem;
        border-bottom: 1px solid #f0f0f0;
    }

    .modal-badge {
        font-size: 0.7rem;
        color: #10b981;
        margin-bottom: 0.5rem;
    }

    .modal-title {
        font-size: 1.5rem;
        font-weight: 600;
        color: #333333;
        margin: 0 0 0.75rem 0;
    }

    .modal-categories {
        display: flex;
        gap: 0.5rem;
    }

    .modal-category, .modal-subcategory {
        font-size: 0.7rem;
        padding: 0.2rem 0.75rem;
        border-radius: 20px;
    }

    .modal-category {
        background: #f5f5f5;
        color: #666666;
    }

    .modal-subcategory {
        background: #f0fdf4;
        color: #059669;
    }

    .modal-body {
        display: flex;
        gap: 1.5rem;
        padding: 1.5rem;
    }

    @media (max-width: 600px) {
        .modal-body {
            flex-direction: column;
        }
    }

    .modal-image {
        flex: 1;
        background: #f9fafb;
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        position: relative;
    }

    .modal-image img {
        max-width: 100%;
        max-height: 250px;
        object-fit: contain;
    }

    .modal-no-image {
        font-size: 4rem;
        opacity: 0.3;
    }

    .modal-stock {
        margin-top: 1rem;
        padding: 0.25rem 1rem;
        border-radius: 20px;
        font-size: 0.7rem;
        font-weight: 600;
    }

    .modal-stock.good { background: #f0fdf4; color: #059669; }
    .modal-stock.low { background: #fffbeb; color: #d97706; }
    .modal-stock.critical { background: #fef2f2; color: #dc2626; }
    .modal-stock.sold-out { background: #f5f5f5; color: #666666; }

    .modal-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .info-grid {
        background: #f9fafb;
        border-radius: 12px;
        padding: 1rem;
    }

    .info-row {
        display: flex;
        justify-content: space-between;
        padding: 0.5rem 0;
        border-bottom: 1px solid #f0f0f0;
    }

    .info-row:last-child {
        border-bottom: none;
    }

    .info-label {
        font-size: 0.75rem;
        color: #888888;
    }

    .info-value {
        font-size: 0.85rem;
        font-weight: 500;
        color: #333333;
    }

    .info-value.serial {
        font-family: monospace;
        color: #10b981;
    }

    .info-value.price {
        color: #059669;
        font-weight: 700;
    }

    .qr-section {
        background: #f9fafb;
        border-radius: 12px;
        padding: 1rem;
        text-align: center;
    }

    .qr-header {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
    }

    .qr-icon {
        font-size: 0.9rem;
    }

    .qr-label {
        font-size: 0.7rem;
        font-weight: 600;
        color: #666666;
    }

    .qr-image {
        width: 100px;
        height: 100px;
        background: white;
        padding: 4px;
        border-radius: 8px;
        margin: 0 auto;
    }

    .qr-actions {
        margin-top: 0.5rem;
    }

    .qr-copy {
        background: transparent;
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        padding: 0.25rem 0.75rem;
        font-size: 0.7rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .qr-copy:hover {
        background: #10b981;
        border-color: #10b981;
        color: white;
    }

    .video-link {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.75rem;
        background: #f5f5f5;
        border-radius: 8px;
        text-decoration: none;
        font-size: 0.8rem;
        font-weight: 500;
        color: #10b981;
        transition: all 0.2s;
    }

    .video-link:hover {
        background: #10b981;
        color: white;
    }
</style>