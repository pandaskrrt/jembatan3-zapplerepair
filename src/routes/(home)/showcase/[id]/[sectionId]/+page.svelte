<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    
    let { data } = $props();
    let cabinet = data?.cabinet;
    let section = data?.section;
    let items = data?.items || [];
    
    let hoveredItem = $state<number | null>(null);
    let sortBy = $state<'name' | 'price' | 'stock'>('name');
    let searchQuery = $state('');
    
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
    
    function formatPriceIdr(price: number) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(price);
    }

    function getStockStatus(stock: number) {
        if (stock === 0) return { label: 'Out of Stock', class: 'sold-out' };
        if (stock < 3) return { label: `Only ${stock} Left`, class: 'critical' };
        if (stock < 6) return { label: `${stock} Available`, class: 'low' };
        return { label: `${stock} In Stock`, class: 'good' };
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
                    <span class="stat-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg></span>
                    {filteredItems().length} Items
                </span>
                <span class="stat-badge">
                    <span class="stat-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg></span>
                    {section?.type || 'Storage'}
                </span>
            </div>
        </div>
    </header>

    <!-- Controls -->
    <div class="controls">
        <div class="search-field">
            <span class="search-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
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
            <div class="empty-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg></div>
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
                    onclick={() => goto(`/product/${item.id}`)}
                    role="button"
                    tabindex="0"
                >
                    <div class="card-border" class:active={hoveredItem === item.id}></div>
                    
                    <div class="card-image-wrap">
                        {#if item.imageUrl}
                            <img src={item.imageUrl} alt={item.name} class="card-image" />
                        {:else}
                            <div class="card-no-image"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg></div>
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
                            <span class="location-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></span>
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
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 8px;
        padding: 0.5rem 1rem;
        color: #a1a1a5;
        font-size: 0.85rem;
        font-weight: 500;
        cursor: pointer;
        margin-bottom: 2rem;
        transition: all 0.2s;
    }

    .back-button:hover {
        background: rgba(16,185,129,0.1);
        border-color: #10b981;
        color: #34d399;
        transform: translateX(-4px);
    }

    /* Header */
    .page-header {
        background: #161618;
        border: 1px solid rgba(255,255,255,0.08);
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
        color: #8f8f96;
        margin-bottom: 0.5rem;
    }

    .header-title {
        font-size: 1.8rem;
        font-weight: 600;
        color: #f1f5f9;
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
        background: rgba(16,185,129,0.1);
        border: 1px solid rgba(16,185,129,0.25);
        border-radius: 30px;
        padding: 0.25rem 1rem;
        font-size: 0.8rem;
        color: #34d399;
    }

    .stat-icon {
        display: flex;
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
        color: #71717a;
        display: flex;
    }

    .search-input {
        width: 100%;
        padding: 0.75rem 1rem 0.75rem 2.5rem;
        background: #161618;
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 8px;
        color: #e3e4e6;
        font-size: 0.9rem;
        transition: all 0.2s;
        box-sizing: border-box;
    }

    .search-input::placeholder {
        color: #71717a;
    }

    .search-input:focus {
        outline: none;
        border-color: #10b981;
        box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.15);
    }

    .clear-btn {
        position: absolute;
        right: 1rem;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: #8f8f96;
        cursor: pointer;
    }

    .sort-field {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        background: #161618;
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 8px;
        padding: 0.5rem 1rem;
    }

    .sort-label {
        font-size: 0.8rem;
        color: #8f8f96;
    }

    .sort-select {
        background: transparent;
        border: none;
        color: #e3e4e6;
        font-size: 0.85rem;
        cursor: pointer;
        padding: 0.25rem;
    }

    .sort-select option {
        background: #161618;
        color: #e3e4e6;
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
        background: #161618;
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 12px;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.3s;
        animation: fadeIn 0.4s ease both;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .item-card:hover {
        transform: translateY(-4px);
        border-color: rgba(16,185,129,0.45);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
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
        background: #121214;
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
        display: flex;
        color: #3f3f46;
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

    .card-stock-badge.good { background: rgba(16, 185, 129, 0.85); color: white; }
    .card-stock-badge.low { background: rgba(245, 158, 11, 0.85); color: white; }
    .card-stock-badge.critical { background: rgba(239, 68, 68, 0.85); color: white; }
    .card-stock-badge.sold-out { background: rgba(107, 114, 128, 0.85); color: white; }

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
        background: rgba(255,255,255,0.06);
        color: #a1a1a5;
    }

    .card-subcategory {
        background: rgba(16,185,129,0.12);
        color: #34d399;
    }

    .card-name {
        font-size: 1rem;
        font-weight: 600;
        color: #f1f5f9;
        margin: 0 0 0.5rem 0;
        line-height: 1.3;
    }

    .card-serial {
        font-size: 0.7rem;
        color: #8f8f96;
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
        color: #34d399;
    }

    .price-note {
        font-size: 0.65rem;
        color: #8f8f96;
        margin-left: 0.25rem;
    }

    .card-location {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.7rem;
        color: #8f8f96;
    }

    .location-icon {
        display: flex;
        color: #10b981;
    }

    .card-footer {
        padding: 0.75rem 1rem;
        border-top: 1px solid rgba(255,255,255,0.06);
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.7rem;
        color: #34d399;
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
        background: #161618;
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 12px;
    }

    .empty-icon {
        display: flex;
        justify-content: center;
        margin-bottom: 1rem;
        color: #3f3f46;
    }

    .empty-title {
        font-size: 1.2rem;
        color: #f1f5f9;
        margin-bottom: 0.5rem;
    }

    .empty-text {
        color: #8f8f96;
        margin-bottom: 1.5rem;
    }

    .empty-action {
        padding: 0.5rem 1.5rem;
        background: rgba(16,185,129,0.1);
        border: 1px solid rgba(16,185,129,0.3);
        border-radius: 8px;
        color: #34d399;
        cursor: pointer;
        font-size: 0.85rem;
        transition: all 0.2s;
    }

    .empty-action:hover {
        background: rgba(16,185,129,0.2);
    }

    /* Responsive */
    @media (max-width: 768px) {
        .page-wrapper { padding: 1rem; }
        
        .header-content { 
            padding: 1.5rem;
        }
        
        .header-title { 
            font-size: 1.5rem; 
        }

        .stat-badge {
            font-size: 0.75rem;
        }
    }
</style>
