<script lang="ts">
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    
    let { data } = $props();
    
    let cards = data?.cards || [];
    let sections = data?.sections || [];
    
    let searchTerm = $state('');
    let filterCategory = $state('');
    let filterSection = $state('');
    let filterStock = $state('');
    
    let selectedCard = $state<number | null>(null);
    let showDeleteModal = $state(false);
    let isDeleting = $state(false);
    let showSuccessMessage = $state(false);
    let showErrorMessage = $state(false);
    let messageText = $state('');
    
    function getPrice(card: any, currency: string) {
        return card.prices?.find((p: any) => p.currency === currency);
    }
    
    function getPriceIdr(card: any) {
        const price = getPrice(card, 'IDR');
        return {
            amount: price?.amount || 0,
            priceNote: price?.priceNote || '',
            formatted: `Rp ${(price?.amount || 0).toLocaleString('id-ID')}`
        };
    }
    
    function getPriceSgd(card: any) {
        const price = getPrice(card, 'SGD');
        return {
            amount: price?.amount || 0,
            priceNote: price?.priceNote || '',
            formatted: `SGD ${(price?.amount || 0).toLocaleString()}`
        };
    }
    
    function getImageUrl(imageUrl: string) {
        if (!imageUrl) return null;
        if (imageUrl.startsWith('/')) return imageUrl;
        return `/${imageUrl}`;
    }
    
    onMount(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('success') === 'true') {
            showNotification('success', 'Card created successfully!');
            window.history.replaceState({}, '', '/admin/card');
        }
    });
    
    let filteredCards = $derived(() => {
        return cards.filter(card => {
            const matchesSearch = !searchTerm || 
                card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                card.id.toString().includes(searchTerm) ||
                card.category.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesCategory = !filterCategory || card.category === filterCategory;
            const matchesSection = !filterSection || card.sectionId?.toString() === filterSection;
            const matchesStock = !filterStock || 
                (filterStock === 'inStock' && card.stock > 0) ||
                (filterStock === 'outOfStock' && card.stock === 0) ||
                (filterStock === 'lowStock' && card.stock > 0 && card.stock < 5);
            
            return matchesSearch && matchesCategory && matchesSection && matchesStock;
        });
    });
    
    let uniqueCategories = $derived(() => {
        return [...new Set(cards.map(c => c.category))];
    });
    
    let totalCards = cards.length;
    let totalStock = cards.reduce((sum, card) => sum + card.stock, 0);
    let totalValueIdr = cards.reduce((sum, card) => {
        const priceIdr = getPriceIdr(card);
        return sum + (priceIdr.amount * card.stock);
    }, 0);
    
    async function navigateToAdd() {
        await goto('/admin/card/create');
    }
    
    function openDeleteModal(id: number) {
        selectedCard = id;
        showDeleteModal = true;
    }
    
    function closeDeleteModal() {
        selectedCard = null;
        showDeleteModal = false;
    }
    
    function showNotification(type: 'success' | 'error', message: string) {
        showSuccessMessage = type === 'success';
        showErrorMessage = type === 'error';
        messageText = message;
        
        setTimeout(() => {
            showSuccessMessage = false;
            showErrorMessage = false;
        }, 3000);
    }
    
    async function handleDelete() {
    if (!selectedCard) return;
    isDeleting = true;
    
    try {
        const formData = new FormData();
        formData.append('id', selectedCard.toString());
        
        const response = await fetch('/admin/card?/delete', {
            method: 'POST',
            body: formData
        });
        
        // SvelteKit action response bisa di-parse dengan cara ini
        const text = await response.text();
        let result;
        
        try {
            result = JSON.parse(text);
        } catch {
            result = { type: 'success' };
        }
        
        // SvelteKit action sukses = status 200-299 dan bukan fail()
        if (response.ok && result.type !== 'failure') {
            showNotification('success', 'Card deleted successfully');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            const message = result.data?.message || 'Failed to delete card';
            showNotification('error', message);
            isDeleting = false;
            closeDeleteModal();
        }
    } catch (error) {
        console.error('Delete error:', error);
        showNotification('error', 'Network error! Please try again.');
        isDeleting = false;
        closeDeleteModal();
    }
}
    
    function resetFilters() {
        searchTerm = '';
        filterCategory = '';
        filterSection = '';
        filterStock = '';
    }
    
    function formatPrice(price: number) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    }
    
    function getStockBadge(stock: number) {
        if (stock === 0) return { text: 'Out of Stock', class: 'out' };
        if (stock < 5) return { text: 'Low Stock', class: 'low' };
        return { text: 'In Stock', class: 'in' };
    }
    
    function getSectionName(sectionId: number | null) {
        const section = sections.find(s => s.id === sectionId);
        return section ? section.name : 'No Section';
    }
    
    function getCabinetName(sectionId: number | null) {
        const section = sections.find(s => s.id === sectionId);
        return section?.cabinet?.name || 'No Cabinet';
    }
</script>

<svelte:head>
    <title>Admin - Cards</title>
</svelte:head>

<div class="page">
    <!-- Header -->
    <div class="header">
        <div class="header-left">
            <h1 class="page-title">Cards</h1>
            <p class="page-subtitle">Manage your Pokemon card collection</p>
        </div>
        <div class="header-right">
            <button class="add-btn" onclick={navigateToAdd}>
                <span class="add-icon">➕</span>
                <span>Add New Card</span>
            </button>
        </div>
    </div>
    
    <!-- Stats Cards -->
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-icon">💳</div>
            <div class="stat-content">
                <span class="stat-label">Total Cards</span>
                <span class="stat-value">{totalCards}</span>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">📦</div>
            <div class="stat-content">
                <span class="stat-label">Total Stock</span>
                <span class="stat-value">{totalStock}</span>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">💰</div>
            <div class="stat-content">
                <span class="stat-label">Total Value (IDR)</span>
                <span class="stat-value">{formatPrice(totalValueIdr)}</span>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">🏷️</div>
            <div class="stat-content">
                <span class="stat-label">Categories</span>
                <span class="stat-value">{uniqueCategories().length}</span>
            </div>
        </div>
    </div>
    
    <!-- Search and Filter Bar -->
    <div class="filter-container">
        <div class="search-wrapper">
            <span class="search-icon">🔍</span>
            <input 
                type="text" 
                class="search-input" 
                placeholder="Search cards by name, ID, or category..."
                bind:value={searchTerm}
            />
            {#if searchTerm}
                <button class="clear-search" onclick={() => searchTerm = ''}>✕</button>
            {/if}
        </div>
        
        <div class="filter-wrapper">
            <div class="filter-group">
                <span class="filter-label">Category</span>
                <select class="filter-select" bind:value={filterCategory}>
                    <option value="">All Categories</option>
                    {#each uniqueCategories() as cat}
                        <option value={cat}>{cat}</option>
                    {/each}
                </select>
            </div>
            
            <div class="filter-group">
                <span class="filter-label">Section</span>
                <select class="filter-select" bind:value={filterSection}>
                    <option value="">All Sections</option>
                    {#each sections as section}
                        <option value={section.id}>
                            {section.name} ({section.cabinet?.name})
                        </option>
                    {/each}
                </select>
            </div>
            
            <div class="filter-group">
                <span class="filter-label">Stock Status</span>
                <select class="filter-select" bind:value={filterStock}>
                    <option value="">All</option>
                    <option value="inStock">In Stock (≥5)</option>
                    <option value="lowStock">Low Stock (1-4)</option>
                    <option value="outOfStock">Out of Stock (0)</option>
                </select>
            </div>
            
            {#if searchTerm || filterCategory || filterSection || filterStock}
                <div class="filter-badge">
                    <span>🎯 {filteredCards().length} results</span>
                    <button class="reset-filters" onclick={resetFilters}>Clear all</button>
                </div>
            {/if}
        </div>
    </div>
    
    <!-- Messages -->
    {#if showSuccessMessage}
        <div class="global-success">
            <span>✅</span>
            <span>{messageText}</span>
        </div>
    {/if}
    {#if showErrorMessage}
        <div class="global-error">
            <span>⚠️</span>
            <span>{messageText}</span>
        </div>
    {/if}
    
    <!-- Cards Grid -->
    {#if filteredCards().length === 0}
        <div class="empty-state">
            <span class="empty-icon">🃏</span>
            <h3 class="empty-title">No Cards Found</h3>
            <p class="empty-description">
                {#if searchTerm || filterCategory || filterSection || filterStock}
                    No cards match your filters. Try adjusting your search criteria.
                {:else}
                    Get started by creating your first Pokemon card.
                {/if}
            </p>
            <div class="empty-actions">
                {#if searchTerm || filterCategory || filterSection || filterStock}
                    <button class="empty-btn" onclick={resetFilters}>Clear Filters</button>
                {:else}
                    <button class="empty-btn primary" onclick={navigateToAdd}>Add New Card</button>
                {/if}
            </div>
        </div>
    {:else}
        <div class="cards-grid">
            {#each filteredCards() as card}
                <div class="card">
                    <!-- Card Actions (Top Right) -->
                    <div class="card-actions">
                        <a href={`/admin/card/edit?id=${card.id}`} class="action-btn edit" title="Edit card">
                            ✏️
                        </a>
                        <button class="action-btn delete" onclick={() => openDeleteModal(card.id)} title="Delete card">
                            🗑️
                        </button>
                    </div>
                    
                    <!-- Card Image -->
                    <div class="card-image">
                        {#if card.imageUrl}
                            <img 
                                src={getImageUrl(card.imageUrl)} 
                                alt={card.name}
                                loading="lazy"
                            />
                        {:else}
                            <div class="no-image">🃏</div>
                        {/if}
                    </div>
                    
                    <!-- Card Content -->
                    <div class="card-content">
                        <!-- Badges -->
                        <div class="card-badges">
                            <span class="badge category">{card.category}</span>
                            <span class="badge sub">{card.subCategory}</span>
                            <span class="badge stock {getStockBadge(card.stock).class}">
                                {getStockBadge(card.stock).text}
                            </span>
                        </div>
                        
                        <!-- Card Name -->
                        <h3 class="card-name">{card.name}</h3>
                        <span class="card-id">#{card.id}</span>
                        
                        <!-- Prices -->
                        <div class="card-prices">
                            <div class="price-row idr">
                                <span class="currency">🇮🇩 IDR</span>
                                <span class="amount">{getPriceIdr(card).formatted}</span>
                                <span class="note">({getPriceIdr(card).priceNote})</span>
                            </div>
                            <div class="price-row sgd">
                                <span class="currency">🇸🇬 SGD</span>
                                <span class="amount">{getPriceSgd(card).formatted}</span>
                                <span class="note">({getPriceSgd(card).priceNote})</span>
                            </div>
                        </div>
                        
                        <!-- Card Details -->
                        <div class="card-details">
                            <div class="detail">
                                <span>📦 Stock: {card.stock}</span>
                            </div>
                            <div class="detail">
                                <span>📍 {card.location || 'No location'}</span>
                            </div>
                            <div class="detail">
                                <span>📁 {getSectionName(card.sectionId)}</span>
                            </div>
                            <div class="detail">
                                <span>🗄️ {getCabinetName(card.sectionId)}</span>
                            </div>
                            {#if card.videoUrl}
                                <div class="detail">
                                    <a href={card.videoUrl} target="_blank" class="video-link">🎥 Watch Video</a>
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>
            {/each}
        </div>
        
        {#if filteredCards().length < cards.length}
            <div class="pagination-info">
                Showing {filteredCards().length} of {cards.length} cards
            </div>
        {/if}
    {/if}
    
    <!-- Delete Confirmation Modal -->
    {#if showDeleteModal}
        <div class="modal-overlay" onclick={closeDeleteModal}>
            <div class="modal-content" onclick={(e) => e.stopPropagation()}>
                <button class="modal-close" onclick={closeDeleteModal}>×</button>
                <div class="modal-icon">⚠️</div>
                <h2 class="modal-title">Delete Card</h2>
                <p class="modal-description">
                    Are you sure you want to delete this card? 
                    This action cannot be undone.
                </p>
                <div class="modal-actions">
                    <button class="modal-btn cancel" onclick={closeDeleteModal} disabled={isDeleting}>
                        Cancel
                    </button>
                    <button class="modal-btn delete" onclick={handleDelete} disabled={isDeleting}>
                        {#if isDeleting}
                            <span class="spinner-small"></span>
                            Deleting...
                        {:else}
                            Delete Card
                        {/if}
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .page {
        padding: 1.5rem;
        max-width: 1400px;
        margin: 0 auto;
    }
    
    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        flex-wrap: wrap;
        gap: 1rem;
    }
    
    .page-title {
        font-size: 2rem;
        font-weight: 600;
        color: #ffffff;
        margin: 0 0 0.25rem;
    }
    
    .page-subtitle {
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.95rem;
    }
    
    .add-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        color: #ffffff;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 0.95rem;
        font-weight: 500;
    }
    
    .add-btn:hover {
        background: rgba(255, 255, 255, 0.15);
        transform: translateY(-2px);
        border-color: rgba(255, 255, 255, 0.3);
    }
    
    .add-icon {
        font-size: 1.2rem;
    }
    
    .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1rem;
        margin-bottom: 2rem;
    }
    
    .stat-card {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1.25rem;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 16px;
        transition: all 0.2s;
    }
    
    .stat-card:hover {
        background: rgba(255, 255, 255, 0.03);
        transform: translateY(-2px);
    }
    
    .stat-icon {
        font-size: 2rem;
    }
    
    .stat-content {
        display: flex;
        flex-direction: column;
    }
    
    .stat-label {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.5);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .stat-value {
        font-size: 1.5rem;
        font-weight: 600;
        color: #ffffff;
        line-height: 1.2;
    }
    
    .filter-container {
        margin-bottom: 2rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .search-wrapper {
        position: relative;
        max-width: 400px;
    }
    
    .search-icon {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: rgba(255, 255, 255, 0.4);
        font-size: 1rem;
    }
    
    .search-input {
        width: 100%;
        padding: 0.85rem 1rem 0.85rem 2.5rem;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        color: #ffffff;
        font-size: 0.95rem;
        transition: all 0.2s;
    }
    
    .search-input:focus {
        outline: none;
        border-color: #00ff00;
        background: rgba(255, 255, 255, 0.05);
    }
    
    .search-input::placeholder {
        color: rgba(255, 255, 255, 0.3);
    }
    
    .clear-search {
        position: absolute;
        right: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.4);
        cursor: pointer;
        font-size: 1rem;
        padding: 0.25rem;
    }
    
    .clear-search:hover {
        color: #ffffff;
    }
    
    .filter-wrapper {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 1rem;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        padding: 1rem;
    }
    
    .filter-group {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: rgba(0, 0, 0, 0.2);
        padding: 0.25rem 0.5rem;
        border-radius: 8px;
    }
    
    .filter-label {
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.5);
    }
    
    .filter-select {
        padding: 0.5rem 2rem 0.5rem 1rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        color: #ffffff;
        font-size: 0.85rem;
        cursor: pointer;
        appearance: none;
        background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2300ff00' stroke-width='2'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
        background-repeat: no-repeat;
        background-position: right 0.5rem center;
        background-size: 1rem;
    }
    
    .filter-select:focus {
        outline: none;
        border-color: #00ff00;
    }
    
    .filter-badge {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.5rem 1rem;
        background: rgba(0, 255, 0, 0.1);
        border: 1px solid rgba(0, 255, 0, 0.3);
        border-radius: 20px;
        color: #00ff00;
        font-size: 0.85rem;
    }
    
    .reset-filters {
        background: none;
        border: none;
        color: #00ff00;
        cursor: pointer;
        font-size: 0.8rem;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
    }
    
    .reset-filters:hover {
        background: rgba(255, 255, 255, 0.1);
    }
    
    .global-success, .global-error {
        position: fixed;
        top: 90px;
        right: 1.5rem;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        z-index: 1100;
        backdrop-filter: blur(10px);
        animation: slideIn 0.3s ease;
    }
    
    .global-success {
        background: rgba(0, 255, 0, 0.1);
        border: 1px solid #00ff00;
        color: #00ff00;
    }
    
    .global-error {
        background: rgba(255, 0, 0, 0.1);
        border: 1px solid #ff6b6b;
        color: #ff6b6b;
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 1.5rem;
    }
    
    .card {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 20px;
        overflow: hidden;
        transition: all 0.3s ease;
        position: relative;
    }
    
    .card:hover {
        transform: translateY(-5px);
        border-color: rgba(255, 255, 255, 0.15);
        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
    }
    
    .card-actions {
        position: absolute;
        top: 0.75rem;
        right: 0.75rem;
        display: flex;
        gap: 0.5rem;
        z-index: 10;
        opacity: 0;
        transition: opacity 0.2s ease;
    }
    
    .card:hover .card-actions {
        opacity: 1;
    }
    
    .action-btn {
        width: 34px;
        height: 34px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(5px);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 8px;
        cursor: pointer;
        text-decoration: none;
        color: #ffffff;
        transition: all 0.2s;
        font-size: 1rem;
    }
    
    .action-btn.edit:hover {
        background: #00ff00;
        color: #000000;
        transform: scale(1.05);
        border-color: #00ff00;
    }
    
    .action-btn.delete:hover {
        background: #ff6b6b;
        color: #ffffff;
        transform: scale(1.05);
        border-color: #ff6b6b;
    }
    
    .card-image {
        width: 100%;
        height: 220px;
        background: linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.5) 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
    }
    
    .card-image img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        transition: transform 0.3s ease;
    }
    
    .card:hover .card-image img {
        transform: scale(1.05);
    }
    
    .no-image {
        font-size: 4rem;
        opacity: 0.4;
    }
    
    .card-content {
        padding: 1.25rem;
    }
    
    .card-badges {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
        flex-wrap: wrap;
    }
    
    .badge {
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.7rem;
        font-weight: 500;
    }
    
    .badge.category {
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
    }
    
    .badge.sub {
        background: rgba(0, 255, 0, 0.1);
        color: #00ff00;
    }
    
    .badge.stock.in {
        background: rgba(0, 255, 0, 0.15);
        color: #00ff00;
        border: 1px solid rgba(0, 255, 0, 0.3);
    }
    
    .badge.stock.low {
        background: rgba(255, 170, 0, 0.15);
        color: #ffaa00;
        border: 1px solid rgba(255, 170, 0, 0.3);
    }
    
    .badge.stock.out {
        background: rgba(255, 0, 0, 0.15);
        color: #ff6b6b;
        border: 1px solid rgba(255, 0, 0, 0.3);
    }
    
    .card-name {
        font-size: 1.25rem;
        font-weight: 600;
        color: #ffffff;
        margin: 0 0 0.25rem;
    }
    
    .card-id {
        display: inline-block;
        font-size: 0.7rem;
        color: rgba(255, 255, 255, 0.4);
        font-family: monospace;
        background: rgba(255, 255, 255, 0.05);
        padding: 0.2rem 0.5rem;
        border-radius: 20px;
        margin-bottom: 0.75rem;
    }
    
    .card-prices {
        background: rgba(0, 0, 0, 0.25);
        border-radius: 12px;
        padding: 0.75rem;
        margin-bottom: 1rem;
    }
    
    .price-row {
        display: flex;
        align-items: baseline;
        gap: 0.5rem;
        font-size: 0.9rem;
        padding: 0.25rem 0;
    }
    
    .price-row.idr .amount {
        color: #00ff00;
        font-weight: 600;
    }
    
    .price-row.sgd .amount {
        color: #ffaa00;
        font-weight: 600;
    }
    
    .price-row .currency {
        font-weight: 500;
        min-width: 70px;
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.7);
    }
    
    .price-row .note {
        font-size: 0.7rem;
        color: rgba(255, 255, 255, 0.45);
    }
    
    .card-details {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        padding-top: 0.75rem;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
    }
    
    .detail {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.7rem;
        color: rgba(255, 255, 255, 0.55);
        background: rgba(255, 255, 255, 0.02);
        padding: 0.25rem 0.6rem;
        border-radius: 20px;
    }
    
    .video-link {
        color: #00ff00;
        text-decoration: none;
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }
    
    .video-link:hover {
        text-decoration: underline;
    }
    
    .empty-state {
        text-align: center;
        padding: 4rem 2rem;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 20px;
    }
    
    .empty-icon {
        font-size: 4rem;
        display: block;
        margin-bottom: 1rem;
        opacity: 0.6;
    }
    
    .empty-title {
        font-size: 1.5rem;
        font-weight: 500;
        color: #ffffff;
        margin-bottom: 0.5rem;
    }
    
    .empty-description {
        color: rgba(255, 255, 255, 0.5);
        margin-bottom: 1.5rem;
    }
    
    .empty-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
    }
    
    .empty-btn {
        padding: 0.75rem 1.5rem;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 10px;
        color: #ffffff;
        cursor: pointer;
        font-size: 0.9rem;
        transition: all 0.2s;
    }
    
    .empty-btn.primary {
        background: #ffffff;
        color: #000000;
        border: none;
    }
    
    .empty-btn.primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(255, 255, 255, 0.2);
    }
    
    .empty-btn:hover:not(.primary) {
        background: rgba(255, 255, 255, 0.15);
    }
    
    .pagination-info {
        text-align: center;
        padding: 1.5rem;
        color: rgba(255, 255, 255, 0.4);
        font-size: 0.85rem;
    }
    
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }
    
    .modal-content {
        background: #1a1a2a;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        padding: 2rem;
        max-width: 400px;
        width: 90%;
        position: relative;
        text-align: center;
        animation: modalFadeIn 0.2s ease;
    }
    
    @keyframes modalFadeIn {
        from {
            opacity: 0;
            transform: scale(0.95);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }
    
    .modal-close {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.5);
        font-size: 1.5rem;
        cursor: pointer;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.2s;
    }
    
    .modal-close:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
    }
    
    .modal-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
    }
    
    .modal-title {
        font-size: 1.5rem;
        font-weight: 600;
        color: #ffffff;
        margin-bottom: 0.5rem;
    }
    
    .modal-description {
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.95rem;
        margin-bottom: 1.5rem;
        line-height: 1.5;
    }
    
    .modal-actions {
        display: flex;
        gap: 1rem;
    }
    
    .modal-btn {
        flex: 1;
        padding: 0.75rem;
        border-radius: 10px;
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
    }
    
    .modal-btn.cancel {
        background: rgba(255, 255, 255, 0.05);
        color: rgba(255, 255, 255, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .modal-btn.cancel:hover {
        background: rgba(255, 255, 255, 0.1);
        transform: translateY(-1px);
    }
    
    .modal-btn.delete {
        background: #ff6b6b;
        color: #ffffff;
    }
    
    .modal-btn.delete:hover {
        background: #ff5252;
        transform: translateY(-1px);
        box-shadow: 0 5px 15px rgba(255, 107, 107, 0.3);
    }
    
    .modal-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
    }
    
    .spinner-small {
        width: 14px;
        height: 14px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: #ffffff;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        display: inline-block;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    @media (max-width: 768px) {
        .page {
            padding: 1rem;
        }
        
        .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 0.75rem;
        }
        
        .cards-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
        }
        
        .filter-wrapper {
            flex-direction: column;
            align-items: stretch;
        }
        
        .filter-group {
            justify-content: space-between;
        }
        
        .filter-select {
            flex: 1;
        }
        
        .global-success, .global-error {
            top: auto;
            bottom: 1rem;
            right: 1rem;
            left: 1rem;
        }
        
        .card-actions {
            opacity: 1;
        }
    }
    
    @media (max-width: 480px) {
        .stats-grid {
            grid-template-columns: 1fr;
        }
        
        .card-name {
            font-size: 1.1rem;
        }
        
        .price-row {
            flex-wrap: wrap;
        }
    }
</style>