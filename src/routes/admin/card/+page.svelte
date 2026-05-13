<script lang="ts">
    import { goto, invalidate } from '$app/navigation';
    import { onMount, onDestroy } from 'svelte';
    import { browser } from '$app/environment';
    
    let { data } = $props();
    
    // Data dari server
    let cabinets = $state(data?.cabinets || []);
    let allCards = $state(data?.cards || []);
    let sections = $state(data?.sections || []);
    
    // State untuk navigasi
    let selectedCabinetId = $state<number | null>(null);
    let selectedSectionId = $state<number | null>(null);
    
    // Search state
    let searchTerm = $state('');
    
    // Delete modal state
    let selectedCard = $state<any | null>(null);
    let showDeleteModal = $state(false);
    let isDeleting = $state(false);
    let showSuccessMessage = $state(false);
    let showErrorMessage = $state(false);
    let messageText = $state('');
    
    // Fungsi untuk refresh data
    async function refreshData() {
        await invalidate('admin:data');
    }
    
    // Auto-refresh ketika tab menjadi aktif
    function handleVisibilityChange() {
        if (browser && document.visibilityState === 'visible') {
            refreshData();
        }
    }
    
    let refreshInterval: NodeJS.Timeout;
    
    onMount(() => {
        refreshData();
        
        if (browser) {
            document.addEventListener('visibilitychange', handleVisibilityChange);
            refreshInterval = setInterval(() => {
                if (document.visibilityState === 'visible') {
                    refreshData();
                }
            }, 10000);
        }
        
        // Check URL params for success message
        if (browser) {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('success') === 'true') {
                showNotification('success', 'Card created successfully!');
                window.history.replaceState({}, '', '/admin/card');
            }
        }
    });
    
    onDestroy(() => {
        if (browser) {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        }
        if (refreshInterval) clearInterval(refreshInterval);
    });
    
    // Helper functions
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
    
    // Get cards for selected section
    let displayedCards = $derived(() => {
        if (selectedSectionId !== null) {
            return allCards.filter(card => card.sectionId === selectedSectionId);
        } else if (selectedCabinetId !== null) {
            const cabinet = cabinets.find(c => c.id === selectedCabinetId);
            if (cabinet && cabinet.sections) {
                const sectionIds = cabinet.sections.map((s: any) => s.id);
                return allCards.filter(card => sectionIds.includes(card.sectionId));
            }
        }
        return [];
    });
    
    // Filtered cards by search
    let searchedCards = $derived(() => {
        if (!searchTerm) return [];
        const term = searchTerm.toLowerCase();
        return allCards.filter(card => 
            card.name.toLowerCase().includes(term) ||
            card.id.toString().includes(term) ||
            card.category.toLowerCase().includes(term)
        );
    });
    
    let isSearchActive = $derived(() => searchTerm.trim().length > 0);
    
    // Navigation functions
    function selectCabinet(cabinetId: number) {
        selectedCabinetId = cabinetId;
        selectedSectionId = null;
    }
    
    function selectSection(sectionId: number) {
        selectedSectionId = sectionId;
    }
    
    function getSectionName(sectionId: number | null) {
        if (!sectionId) return 'Unknown';
        const section = sections.find(s => s.id === sectionId);
        return section?.name || 'Unknown';
    }
    
    function getCabinetNameBySection(sectionId: number | null) {
        if (!sectionId) return 'Unknown';
        const section = sections.find(s => s.id === sectionId);
        return section?.cabinet?.name || 'Unknown';
    }
    
    function getStockBadge(stock: number) {
        if (stock === 0) return { text: 'Out of Stock', class: 'out' };
        if (stock < 5) return { text: 'Low Stock', class: 'low' };
        return { text: 'In Stock', class: 'in' };
    }
    
    function clearSearch() {
        searchTerm = '';
    }
    
    function goBack() {
        if (selectedSectionId !== null) {
            selectedSectionId = null;
        } else if (selectedCabinetId !== null) {
            selectedCabinetId = null;
        }
    }
    
    let currentPath = $derived(() => {
        if (selectedSectionId !== null) {
            const sectionName = getSectionName(selectedSectionId);
            const cabinetName = getCabinetNameBySection(selectedSectionId);
            return { cabinet: cabinetName, section: sectionName };
        } else if (selectedCabinetId !== null) {
            const cabinet = cabinets.find(c => c.id === selectedCabinetId);
            return { cabinet: cabinet?.name, section: null };
        }
        return { cabinet: null, section: null };
    });
    
    // Navigation
    async function navigateToAdd() {
        await goto('/admin/card/create');
    }
    
    async function navigateToEdit(cardId: number) {
        await goto(`/admin/card/edit?id=${cardId}`);
    }
    
    // Delete functions
    function openDeleteModal(card: any) {
        selectedCard = card;
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
            formData.append('id', selectedCard.id.toString());
            
            const response = await fetch('/admin/card?/delete', {
                method: 'POST',
                body: formData
            });
            
            const text = await response.text();
            let result;
            
            try {
                result = JSON.parse(text);
            } catch {
                result = { type: 'success' };
            }
            
            if (response.ok && result.type !== 'failure') {
                showNotification('success', 'Card deleted successfully');
                await refreshData();
                setTimeout(() => {
                    closeDeleteModal();
                    isDeleting = false;
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
</script>

<svelte:head>
    <title>Admin - Cards</title>
</svelte:head>

<div class="file-manager">
    <!-- Header -->
    <div class="header">
        <div class="header-left">
            <h1 class="title">Card Collection</h1>
            <div class="subtitle">File Manager - Cabinet / Section / Card</div>
        </div>
        <div class="header-right">
            <div class="search-box">
                <span class="search-icon">🔍</span>
                <input 
                    type="text" 
                    placeholder="Search cards..." 
                    bind:value={searchTerm}
                    class="search-input"
                />
                {#if searchTerm}
                    <button class="search-clear" onclick={clearSearch}>✕</button>
                {/if}
            </div>
            <button class="refresh-btn" onclick={refreshData} title="Refresh">
                🔄
            </button>
            <button class="add-btn" onclick={navigateToAdd}>
                <span>➕</span>
                <span>Add Card</span>
            </button>
        </div>
    </div>
    
    <!-- Messages -->
    {#if showSuccessMessage}
        <div class="toast success">✅ {messageText}</div>
    {/if}
    {#if showErrorMessage}
        <div class="toast error">⚠️ {messageText}</div>
    {/if}
    
    <!-- Main Content - Full Width (No Tree Panel) -->
    <div class="main-content">
        <div class="content-panel">
            <!-- Navigation Breadcrumb -->
            <div class="breadcrumb">
                <div class="breadcrumb-path">
                    <span class="nav-icon">🗂️</span>
                    <span class="nav-item" class:active={selectedCabinetId === null && selectedSectionId === null} onclick={() => { selectedCabinetId = null; selectedSectionId = null; }}>
                        All Cabinets
                    </span>
                    {#if currentPath().cabinet}
                        <span class="nav-separator">›</span>
                        <span class="nav-item" onclick={() => { selectedSectionId = null; }}>
                            {currentPath().cabinet}
                        </span>
                    {/if}
                    {#if currentPath().section}
                        <span class="nav-separator">›</span>
                        <span class="nav-item active">{currentPath().section}</span>
                    {/if}
                </div>
                <div class="breadcrumb-info">
                    {#if isSearchActive()}
                        🔍 Found {searchedCards().length} cards
                    {:else}
                        📄 {displayedCards().length} items
                    {/if}
                </div>
            </div>
            
            <!-- Search Results Mode -->
            {#if isSearchActive()}
                {#if searchedCards().length === 0}
                    <div class="empty-state">
                        <span class="empty-icon">🔍</span>
                        <h3>No cards found</h3>
                        <p>No cards match "{searchTerm}"</p>
                        <button class="empty-btn" onclick={clearSearch}>Clear Search</button>
                    </div>
                {:else}
                    <div class="cards-grid">
                        {#each searchedCards() as card}
                            <div class="card-item">
                                <div class="card-actions">
                                    <button class="action-btn edit" onclick={() => navigateToEdit(card.id)}>✏️</button>
                                    <button class="action-btn delete" onclick={() => openDeleteModal(card)}>🗑️</button>
                                </div>
                                <div class="card-image">
                                    {#if card.imageUrl}
                                        <img src={getImageUrl(card.imageUrl)} alt={card.name} />
                                    {:else}
                                        <div class="no-image">🃏</div>
                                    {/if}
                                </div>
                                <div class="card-info">
                                    <div class="card-badges">
                                        <span class="badge cat">{card.category}</span>
                                        <span class="badge sub">{card.subCategory}</span>
                                        <span class="badge stock {getStockBadge(card.stock).class}">{getStockBadge(card.stock).text}</span>
                                    </div>
                                    <h4 class="card-name">{card.name}</h4>
                                    <div class="card-prices">
                                        <div class="price-idr">🇮🇩 {getPriceIdr(card).formatted}</div>
                                        <div class="price-sgd">🇸🇬 {getPriceSgd(card).formatted}</div>
                                    </div>
                                    <div class="card-location">
                                        <span>📍 {card.location || 'No location'}</span>
                                        <span>📦 Stock: {card.stock}</span>
                                    </div>
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}
            
            {:else if selectedSectionId !== null}
                <!-- Section View - Show Cards -->
                {#if displayedCards().length === 0}
                    <div class="empty-state">
                        <span class="empty-icon">📭</span>
                        <h3>Empty Section</h3>
                        <p>No cards in this section yet</p>
                        <button class="empty-btn primary" onclick={navigateToAdd}>Add New Card</button>
                    </div>
                {:else}
                    <div class="cards-grid">
                        {#each displayedCards() as card}
                            <div class="card-item">
                                <div class="card-actions">
                                    <button class="action-btn edit" onclick={() => navigateToEdit(card.id)}>✏️</button>
                                    <button class="action-btn delete" onclick={() => openDeleteModal(card)}>🗑️</button>
                                </div>
                                <div class="card-image">
                                    {#if card.imageUrl}
                                        <img src={getImageUrl(card.imageUrl)} alt={card.name} />
                                    {:else}
                                        <div class="no-image">🃏</div>
                                    {/if}
                                </div>
                                <div class="card-info">
                                    <div class="card-badges">
                                        <span class="badge cat">{card.category}</span>
                                        <span class="badge sub">{card.subCategory}</span>
                                        <span class="badge stock {getStockBadge(card.stock).class}">{getStockBadge(card.stock).text}</span>
                                    </div>
                                    <h4 class="card-name">{card.name}</h4>
                                    <div class="card-prices">
                                        <div class="price-idr">🇮🇩 {getPriceIdr(card).formatted}</div>
                                        <div class="price-sgd">🇸🇬 {getPriceSgd(card).formatted}</div>
                                    </div>
                                    <div class="card-location">
                                        <span>📍 {card.location || 'No location'}</span>
                                        <span>📦 Stock: {card.stock}</span>
                                    </div>
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}
            
            {:else if selectedCabinetId !== null}
                <!-- Cabinet View - Show All Sections as Folders -->
                {@const cabinet = cabinets.find(c => c.id === selectedCabinetId)}
                {#if cabinet && cabinet.sections?.length === 0}
                    <div class="empty-state">
                        <span class="empty-icon">📭</span>
                        <h3>Empty Cabinet</h3>
                        <p>No sections in this cabinet yet</p>
                    </div>
                {:else}
                    <div class="folders-grid">
                        {#each cabinet?.sections || [] as section}
                            <div class="folder-card" onclick={() => selectSection(section.id)}>
                                <div class="folder-icon">📂</div>
                                <div class="folder-name">{section.name}</div>
                                <div class="folder-count">{section.cards?.length || 0} cards</div>
                            </div>
                        {/each}
                    </div>
                {/if}
            
            {:else}
                <!-- Root View - Show All Cabinets as Folders -->
                {#if cabinets.length === 0}
                    <div class="empty-state">
                        <span class="empty-icon">📭</span>
                        <h3>No Cabinets</h3>
                        <p>Create a cabinet to start organizing cards</p>
                        <button class="empty-btn primary" onclick={navigateToAdd}>Add New Card</button>
                    </div>
                {:else}
                    <div class="folders-grid">
                        {#each cabinets as cabinet}
                            <div class="folder-card" onclick={() => selectCabinet(cabinet.id)}>
                                <div class="folder-icon">📁</div>
                                <div class="folder-name">{cabinet.name}</div>
                                <div class="folder-count">{cabinet.sections?.length || 0} sections</div>
                            </div>
                        {/each}
                    </div>
                {/if}
            {/if}
        </div>
    </div>
</div>

<!-- Delete Confirmation Modal -->
{#if showDeleteModal}
    <div class="modal-overlay" onclick={closeDeleteModal}>
        <div class="modal" onclick={(e) => e.stopPropagation()}>
            <button class="modal-close" onclick={closeDeleteModal}>×</button>
            <div class="modal-icon">⚠️</div>
            <h3>Delete Card</h3>
            <p>Are you sure you want to delete <strong>"{selectedCard?.name}"</strong>?<br>This action cannot be undone.</p>
            <div class="modal-actions">
                <button class="btn-cancel" onclick={closeDeleteModal} disabled={isDeleting}>Cancel</button>
                <button class="btn-delete" onclick={handleDelete} disabled={isDeleting}>
                    {#if isDeleting}<span class="spinner"></span>{/if}
                    Delete
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    .file-manager {
        height: 100%;
        display: flex;
        flex-direction: column;
        background: #0a0a0a;
        color: #e0e0e0;
    }
    
    /* Header */
    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 24px;
        background: #111111;
        border-bottom: 1px solid #2a2a2a;
        flex-shrink: 0;
    }
    
    .title {
        font-size: 20px;
        font-weight: 600;
        margin: 0;
        color: white;
    }
    
    .subtitle {
        font-size: 12px;
        color: #888;
        margin-top: 4px;
    }
    
    .header-right {
        display: flex;
        gap: 12px;
        align-items: center;
    }
    
    .search-box {
        position: relative;
    }
    
    .search-input {
        padding: 8px 32px 8px 36px;
        background: #1e1e1e;
        border: 1px solid #3a3a3a;
        border-radius: 8px;
        color: white;
        width: 250px;
        font-size: 14px;
    }
    
    .search-input:focus {
        outline: none;
        border-color: #00ff00;
    }
    
    .search-icon {
        position: absolute;
        left: 10px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 14px;
        opacity: 0.6;
    }
    
    .search-clear {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: #888;
        cursor: pointer;
    }
    
    .refresh-btn {
        background: #1e1e1e;
        border: 1px solid #3a3a3a;
        border-radius: 8px;
        padding: 8px 12px;
        cursor: pointer;
        font-size: 16px;
        transition: all 0.2s;
    }
    
    .refresh-btn:hover {
        background: #2a2a2a;
        border-color: #00ff00;
    }
    
    .add-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        background: #00ff00;
        border: none;
        border-radius: 8px;
        color: #000;
        font-weight: 600;
        cursor: pointer;
        font-size: 14px;
    }
    
    .add-btn:hover {
        background: #00cc00;
        transform: translateY(-1px);
    }
    
    /* Toast */
    .toast {
        position: fixed;
        top: 80px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    }
    
    .toast.success {
        background: #1a3a1a;
        border: 1px solid #00ff00;
        color: #00ff00;
    }
    
    .toast.error {
        background: #3a1a1a;
        border: 1px solid #ff4444;
        color: #ff4444;
    }
    
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    /* Main Content */
    .main-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        background: #0a0a0a;
    }
    
    .content-panel {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }
    
    /* Breadcrumb */
    .breadcrumb {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 20px;
        background: #111111;
        border-bottom: 1px solid #2a2a2a;
        flex-shrink: 0;
    }
    
    .breadcrumb-path {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 13px;
    }
    
    .nav-icon {
        margin-right: 4px;
    }
    
    .nav-item {
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        transition: all 0.2s;
    }
    
    .nav-item:hover {
        background: #1e1e1e;
    }
    
    .nav-item.active {
        color: #00ff00;
        font-weight: 600;
    }
    
    .nav-separator {
        color: #555;
        margin: 0 4px;
    }
    
    .breadcrumb-info {
        font-size: 12px;
        color: #888;
    }
    
    /* Folders Grid (Windows Explorer Style) */
    .folders-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 20px;
        padding: 24px;
        overflow-y: auto;
    }
    
    .folder-card {
        background: #111111;
        border: 1px solid #2a2a2a;
        border-radius: 12px;
        padding: 28px 16px;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .folder-card:hover {
        background: #1a1a1a;
        transform: translateY(-4px);
        border-color: #00ff00;
    }
    
    .folder-icon {
        font-size: 48px;
        margin-bottom: 12px;
    }
    
    .folder-name {
        font-weight: 600;
        margin-bottom: 4px;
        color: white;
        font-size: 14px;
    }
    
    .folder-count {
        font-size: 11px;
        color: #888;
    }
    
    /* Cards Grid */
    .cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 20px;
        padding: 24px;
        overflow-y: auto;
    }
    
    .card-item {
        background: #111111;
        border: 1px solid #2a2a2a;
        border-radius: 12px;
        overflow: hidden;
        transition: all 0.2s;
        position: relative;
    }
    
    .card-item:hover {
        transform: translateY(-4px);
        border-color: #444;
    }
    
    .card-actions {
        position: absolute;
        top: 8px;
        right: 8px;
        display: flex;
        gap: 6px;
        opacity: 0;
        transition: opacity 0.2s;
        z-index: 2;
    }
    
    .card-item:hover .card-actions {
        opacity: 1;
    }
    
    .action-btn {
        width: 30px;
        height: 30px;
        background: rgba(0,0,0,0.7);
        border: 1px solid #444;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        backdrop-filter: blur(4px);
    }
    
    .action-btn.edit:hover {
        background: #00ff00;
        color: #000;
    }
    
    .action-btn.delete:hover {
        background: #ff4444;
        color: white;
    }
    
    .card-image {
        height: 180px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #0a0a0a;
        overflow: hidden;
    }
    
    .card-image img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
    }
    
    .no-image {
        font-size: 48px;
        opacity: 0.3;
    }
    
    .card-info {
        padding: 12px;
    }
    
    .card-badges {
        display: flex;
        gap: 6px;
        margin-bottom: 8px;
        flex-wrap: wrap;
    }
    
    .badge {
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: 500;
    }
    
    .badge.cat {
        background: #1e1e1e;
        color: #aaa;
    }
    
    .badge.sub {
        background: #1a3a1a;
        color: #00ff00;
    }
    
    .badge.stock.in {
        background: #1a3a1a;
        color: #00ff00;
    }
    
    .badge.stock.low {
        background: #3a3a1a;
        color: #ffaa00;
    }
    
    .badge.stock.out {
        background: #3a1a1a;
        color: #ff6666;
    }
    
    .card-name {
        font-size: 14px;
        font-weight: 600;
        margin: 0 0 8px 0;
        color: white;
    }
    
    .card-prices {
        margin-bottom: 8px;
    }
    
    .price-idr {
        font-size: 12px;
        color: #00ff00;
    }
    
    .price-sgd {
        font-size: 12px;
        color: #ffaa00;
    }
    
    .card-location {
        display: flex;
        justify-content: space-between;
        font-size: 10px;
        color: #666;
        padding-top: 8px;
        border-top: 1px solid #1e1e1e;
    }
    
    /* Empty State */
    .empty-state {
        text-align: center;
        padding: 60px 20px;
        color: #666;
    }
    
    .empty-icon {
        font-size: 64px;
        display: block;
        margin-bottom: 16px;
        opacity: 0.5;
    }
    
    .empty-state h3 {
        color: white;
        margin-bottom: 8px;
    }
    
    .empty-btn {
        margin-top: 20px;
        padding: 8px 20px;
        background: #1e1e1e;
        border: 1px solid #3a3a3a;
        border-radius: 8px;
        color: white;
        cursor: pointer;
    }
    
    .empty-btn.primary {
        background: #00ff00;
        color: #000;
        border: none;
    }
    
    .empty-btn.primary:hover {
        background: #00cc00;
    }
    
    /* Modal */
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
    }
    
    .modal {
        background: #1a1a1a;
        border: 1px solid #3a3a3a;
        border-radius: 16px;
        padding: 24px;
        max-width: 380px;
        width: 90%;
        text-align: center;
        position: relative;
    }
    
    .modal-close {
        position: absolute;
        top: 12px;
        right: 12px;
        background: none;
        border: none;
        color: #888;
        font-size: 20px;
        cursor: pointer;
    }
    
    .modal-icon {
        font-size: 48px;
        margin-bottom: 16px;
    }
    
    .modal h3 {
        color: white;
        margin-bottom: 8px;
    }
    
    .modal p {
        color: #aaa;
        margin-bottom: 24px;
        font-size: 14px;
    }
    
    .modal-actions {
        display: flex;
        gap: 12px;
    }
    
    .btn-cancel, .btn-delete {
        flex: 1;
        padding: 10px;
        border-radius: 8px;
        border: none;
        cursor: pointer;
        font-weight: 600;
    }
    
    .btn-cancel {
        background: #2a2a2a;
        color: white;
    }
    
    .btn-delete {
        background: #ff4444;
        color: white;
    }
    
    .btn-delete:hover {
        background: #ff2222;
    }
    
    .spinner {
        display: inline-block;
        width: 14px;
        height: 14px;
        border: 2px solid rgba(255,255,255,0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
        margin-right: 6px;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    /* Scrollbar */
    .folders-grid::-webkit-scrollbar,
    .cards-grid::-webkit-scrollbar {
        width: 6px;
    }
    
    .folders-grid::-webkit-scrollbar-track,
    .cards-grid::-webkit-scrollbar-track {
        background: #111;
    }
    
    .folders-grid::-webkit-scrollbar-thumb,
    .cards-grid::-webkit-scrollbar-thumb {
        background: #333;
        border-radius: 3px;
    }
    
    /* Responsive */
    @media (max-width: 768px) {
        .header {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
        }
        
        .header-right {
            justify-content: space-between;
        }
        
        .search-input {
            width: 180px;
        }
        
        .folders-grid {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 12px;
            padding: 16px;
        }
        
        .cards-grid {
            grid-template-columns: 1fr;
            padding: 16px;
        }
        
        .folder-card {
            padding: 20px 12px;
        }
        
        .folder-icon {
            font-size: 36px;
        }
    }
</style>