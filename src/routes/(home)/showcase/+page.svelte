<script lang="ts">
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    
    let { data } = $props();
    let showcases = data?.showcases || [];
    
    let hoveredId = $state<number | null>(null);
    let selectedCabinet = $state<any | null>(null);
    let showItemsModal = $state(false);
    
    function goToShowcase(id: number) {
        goto(`/showcase/${id}`);
    }
    
    function goHome() {
        goto('/');
    }
    
    function openItemsModal(cabinet: any) {
        selectedCabinet = cabinet;
        showItemsModal = true;
    }
    
    function closeItemsModal() {
        showItemsModal = false;
        selectedCabinet = null;
    }
    
    // Kumpulkan data untuk search dan kirim ke layout
    onMount(() => {
        const allSections: any[] = [];
        const allItems: any[] = [];
        
        showcases.forEach((cabinet: any) => {
            // Proses sections
            if (cabinet.sections && Array.isArray(cabinet.sections)) {
                cabinet.sections.forEach((section: any) => {
                    const sectionData = {
                        id: section.id,
                        name: section.name,
                        type: section.type,
                        cabinetId: cabinet.id,
                        cabinetName: cabinet.name
                    };
                    allSections.push(sectionData);
                    
                    // Proses items dalam section
                    if (section.items && Array.isArray(section.items)) {
                        section.items.forEach((item: any) => {
                            const itemData = {
                                id: item.id,
                                name: item.name,
                                stock: item.stock,
                                category: item.category,
                                subCategory: item.subCategory,
                                serialNumber: item.serialNumber,
                                location: item.location,
                                sectionId: section.id,
                                sectionName: section.name,
                                cabinetId: cabinet.id,
                                cabinetName: cabinet.name
                            };
                            allItems.push(itemData);
                        });
                    }
                });
            }
        });
        
        // Kirim data ke layout
        if (typeof window !== 'undefined' && (window as any).setSearchData) {
            (window as any).setSearchData({
                cabinets: showcases,
                sections: allSections,
                items: allItems
            });
        }
        
        console.log(`Search data loaded: ${showcases.length} cabinets, ${allSections.length} sections, ${allItems.length} items`);
    });
</script>

<svelte:head>
    <title>Stock Management - Cabinets</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700&display=swap" rel="stylesheet">
</svelte:head>

<div class="page-wrapper">
    <!-- Back Button -->
    <div class="top-bar">
        <button class="back-button" onclick={goHome}>
            <svg class="back-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Back to Home
        </button>
    </div>

    <div class="section-header">
        <div class="header-left">
            <div class="accent-line"></div>
            <h2 class="section-title">
                <span class="title-icon">📦</span>
                Storage Cabinets
            </h2>
        </div>
        <div class="header-right">
            <div class="total-badge">{showcases.length} Cabinets</div>
        </div>
    </div>

    <div class="grid-container">
        {#each showcases as showcase}
            <div 
                class="card" 
                onmouseenter={() => hoveredId = showcase.id}
                onmouseleave={() => hoveredId = null}
                onclick={() => goToShowcase(showcase.id)}
                onkeydown={(e) => e.key === 'Enter' && goToShowcase(showcase.id)}
                role="button"
                tabindex="0"
            >
                <div class="card-border" class:active={hoveredId === showcase.id}></div>
                
                <div class="card-header">
                    <div class="card-number">
                        <span class="number-label">Cabinet</span>
                        <span class="number-text">#{showcase.id.toString().padStart(2, '0')}</span>
                    </div>
                    <div class="card-status" class:status-empty={showcase.filled === 0} class:status-full={showcase.filled >= showcase.slots} class:status-active={showcase.filled > 0 && showcase.filled < showcase.slots}>
                        <div class="status-dot"></div>
                        <span class="status-text">
                            {#if showcase.filled === 0}
                                Empty
                            {:else if showcase.filled >= showcase.slots}
                                Full
                            {:else}
                                Active
                            {/if}
                        </span>
                    </div>
                </div>

                <div class="card-icon">
                    <span class="icon-main">
                        {#if showcase.filled === 0}
                            🗄️
                        {:else if showcase.filled >= showcase.slots}
                            📦
                        {:else}
                            🗃️
                        {/if}
                    </span>
                </div>

                <div class="card-info">
                    <h3 class="card-name">{showcase.name}</h3>
                    <div class="card-meta">
                        <div class="meta-item">
                            <span class="meta-icon">📂</span>
                            <span>{showcase.sections.length} Sections</span>
                        </div>
                        <div class="meta-item" onclick={(e) => { e.stopPropagation(); openItemsModal(showcase); }}>
                            <span class="meta-icon">📦</span>
                            <span class="items-link">{showcase.filled}/{showcase.slots} Items</span>
                            <span class="view-icon">👁️</span>
                        </div>
                    </div>
                </div>

                <div class="card-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: {(showcase.filled / showcase.slots) * 100}%;" class:progress-full={showcase.filled >= showcase.slots}></div>
                    </div>
                    <div class="progress-stats">
                        <span>{Math.round((showcase.filled / showcase.slots) * 100)}% Capacity</span>
                        <span class="progress-arrow">→</span>
                    </div>
                </div>

                <div class="card-footer">
                    <div class="footer-badge">
                        <span class="badge-icon">🏭</span>
                        <span>Warehouse Storage</span>
                    </div>
                </div>
            </div>
        {/each}
    </div>

    <!-- Items Modal -->
    {#if showItemsModal && selectedCabinet}
        <div class="modal-overlay" onclick={closeItemsModal}>
            <div class="modal-content" onclick={(e) => e.stopPropagation()}>
                <div class="modal-header">
                    <div class="modal-title">
                        <span class="modal-icon">📦</span>
                        <h3>Items in {selectedCabinet.name}</h3>
                    </div>
                    <button class="modal-close" onclick={closeItemsModal}>
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
                
                <div class="modal-body">
                    {#if selectedCabinet.sections && selectedCabinet.sections.length > 0}
                        {#each selectedCabinet.sections as section}
                            {#if section.items && section.items.length > 0}
                                <div class="section-group">
                                    <div class="section-group-title">
                                        <span>📂 {section.name}</span>
                                        <span class="section-badge">{section.items.length} items</span>
                                    </div>
                                    <div class="items-grid">
                                        {#each section.items as item}
                                            <div class="item-card">
                                                <div class="item-header">
                                                    <span class="item-icon">🔧</span>
                                                    <span class="item-name">{item.name}</span>
                                                </div>
                                                <div class="item-details">
                                                    <div class="item-detail">
                                                        <span class="detail-label">Stock:</span>
                                                        <span class="detail-value">{item.stock || 0}</span>
                                                    </div>
                                                    <div class="item-detail">
                                                        <span class="detail-label">Category:</span>
                                                        <span class="detail-value">{item.category || 'Uncategorized'}</span>
                                                    </div>
                                                    {#if item.subCategory}
                                                        <div class="item-detail">
                                                            <span class="detail-label">Sub:</span>
                                                            <span class="detail-value">{item.subCategory}</span>
                                                        </div>
                                                    {/if}
                                                    {#if item.serialNumber}
                                                        <div class="item-detail">
                                                            <span class="detail-label">SN:</span>
                                                            <span class="detail-value">{item.serialNumber}</span>
                                                        </div>
                                                    {/if}
                                                    {#if item.location}
                                                        <div class="item-detail">
                                                            <span class="detail-label">📍 Location:</span>
                                                            <span class="detail-value">{item.location}</span>
                                                        </div>
                                                    {/if}
                                                </div>
                                            </div>
                                        {/each}
                                    </div>
                                </div>
                            {/if}
                        {/each}
                    {:else}
                        <div class="no-items">
                            <span>📭 No items found in this cabinet</span>
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    :global(body) {
        margin: 0;
        padding: 0;
        background: #f5f5f5;
        font-family: 'Inter', sans-serif;
        color: #333333;
        overflow-x: hidden;
    }

    .page-wrapper {
        padding: 2rem;
        max-width: 1800px;
        margin: 0 auto;
    }

    /* Top Bar - Back Button */
    .top-bar {
        margin-bottom: 1.5rem;
    }

    .back-button {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 0.6rem 1.2rem;
        font-family: 'Inter', sans-serif;
        font-size: 0.85rem;
        font-weight: 500;
        color: #374151;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .back-button:hover {
        background: #f9fafb;
        border-color: #10b981;
        color: #059669;
        transform: translateX(-4px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .back-icon {
        width: 20px;
        height: 20px;
    }

    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
    }

    .header-left {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .accent-line {
        width: 4px;
        height: 32px;
        background: #10b981;
        border-radius: 2px;
    }

    .section-title {
        font-family: 'Inter', sans-serif;
        font-size: 1.5rem;
        font-weight: 600;
        color: #333333;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .title-icon {
        font-size: 1.5rem;
    }

    .total-badge {
        background: #f0fdf4;
        border: 1px solid #10b981;
        border-radius: 40px;
        padding: 0.5rem 1.2rem;
        font-size: 0.85rem;
        font-weight: 600;
        color: #059669;
    }

    /* Grid Container */
    .grid-container {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 1.5rem;
    }

    /* Responsive Breakpoints */
    @media (max-width: 1600px) {
        .grid-container { grid-template-columns: repeat(5, 1fr); }
    }

    @media (max-width: 1400px) {
        .grid-container { grid-template-columns: repeat(4, 1fr); }
    }

    @media (max-width: 1200px) {
        .grid-container { grid-template-columns: repeat(3, 1fr); }
    }

    @media (max-width: 900px) {
        .grid-container { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 600px) {
        .grid-container { grid-template-columns: 1fr; }
    }

    /* Card Styling */
    .card {
        position: relative;
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 1.5rem;
        cursor: pointer;
        transition: all 0.3s ease;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .card:hover {
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
        transition: transform 0.3s ease;
    }

    .card-border.active {
        transform: scaleX(1);
    }

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1.5rem;
    }

    .card-number {
        display: flex;
        flex-direction: column;
    }

    .number-label {
        font-size: 0.7rem;
        color: #9ca3af;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .number-text {
        font-family: 'Inter', monospace;
        font-size: 1.5rem;
        font-weight: 700;
        color: #111827;
        letter-spacing: 1px;
    }

    /* Status Styles */
    .card-status {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        border-radius: 30px;
        padding: 0.3rem 0.9rem;
        font-weight: 600;
        font-size: 0.7rem;
        text-transform: uppercase;
        transition: all 0.3s ease;
    }

    .card-status.status-active {
        background: #dcfce7;
        color: #166534;
    }

    .card-status.status-active .status-dot {
        background: #22c55e;
        animation: pulse-active 2s infinite;
    }

    .card-status.status-full {
        background: #fee2e2;
        color: #991b1b;
    }

    .card-status.status-full .status-dot {
        background: #ef4444;
    }

    .card-status.status-empty {
        background: #f3f4f6;
        color: #6b7280;
    }

    .card-status.status-empty .status-dot {
        background: #9ca3af;
    }

    .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
    }

    @keyframes pulse-active {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.6; transform: scale(0.8); }
    }

    .status-text {
        font-size: 0.7rem;
        font-weight: 600;
        letter-spacing: 0.3px;
    }

    .card-icon {
        display: flex;
        justify-content: center;
        margin: 0.5rem 0;
    }

    .icon-main {
        font-size: 3rem;
        transition: transform 0.3s ease;
    }

    .card:hover .icon-main {
        transform: scale(1.05);
    }

    .card-info {
        text-align: center;
        margin: 0.75rem 0;
    }

    .card-name {
        font-family: 'Inter', sans-serif;
        font-size: 1.1rem;
        font-weight: 600;
        color: #111827;
        margin: 0 0 0.75rem 0;
    }

    .card-meta {
        display: flex;
        justify-content: center;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .meta-item {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.75rem;
        color: #6b7280;
        padding: 0.2rem 0.6rem;
        background: #f9fafb;
        border-radius: 6px;
        transition: all 0.2s ease;
    }

    .meta-item .items-link {
        cursor: pointer;
        color: #059669;
        font-weight: 500;
        text-decoration: underline;
        text-underline-offset: 2px;
    }

    .meta-item .items-link:hover {
        color: #047857;
    }

    .view-icon {
        font-size: 0.65rem;
        opacity: 0.6;
    }

    .meta-icon {
        font-size: 0.85rem;
    }

    .card-progress {
        margin: 1rem 0;
    }

    .progress-bar {
        height: 6px;
        background: #f3f4f6;
        border-radius: 3px;
        overflow: hidden;
        margin-bottom: 0.5rem;
    }

    .progress-fill {
        height: 100%;
        background: #10b981;
        border-radius: 3px;
        transition: width 0.5s ease;
    }

    .progress-fill.progress-full {
        background: #ef4444;
    }

    .progress-stats {
        display: flex;
        justify-content: space-between;
        font-size: 0.7rem;
        color: #6b7280;
    }

    .progress-arrow {
        transition: transform 0.3s ease;
        font-size: 0.8rem;
    }

    .card:hover .progress-arrow {
        transform: translateX(4px);
        color: #10b981;
    }

    .card-footer {
        margin-top: 1rem;
        text-align: center;
    }

    .footer-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 30px;
        padding: 0.35rem 1rem;
        font-size: 0.7rem;
        color: #6b7280;
    }

    .badge-icon {
        font-size: 0.8rem;
    }

    /* Modal Styles */
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        z-index: 2000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    .modal-content {
        background: white;
        border-radius: 16px;
        max-width: 900px;
        width: 100%;
        max-height: 80vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem 2rem;
        border-bottom: 1px solid #e5e7eb;
    }

    .modal-title {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .modal-title h3 {
        font-family: 'Inter', sans-serif;
        font-size: 1.25rem;
        font-weight: 600;
        color: #111827;
        margin: 0;
    }

    .modal-icon {
        font-size: 1.5rem;
    }

    .modal-close {
        background: none;
        border: none;
        padding: 0.5rem;
        cursor: pointer;
        color: #6b7280;
        border-radius: 8px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .modal-close:hover {
        background: #f3f4f6;
        color: #111827;
    }

    .modal-close svg {
        width: 24px;
        height: 24px;
    }

    .modal-body {
        padding: 1.5rem 2rem;
        overflow-y: auto;
        flex: 1;
    }

    .section-group {
        margin-bottom: 2rem;
    }

    .section-group:last-child {
        margin-bottom: 0;
    }

    .section-group-title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 0.75rem;
        background: #f9fafb;
        border-radius: 8px;
        font-size: 0.85rem;
        font-weight: 600;
        color: #374151;
        margin-bottom: 0.75rem;
    }

    .section-badge {
        background: #e5e7eb;
        padding: 0.15rem 0.6rem;
        border-radius: 999px;
        font-size: 0.7rem;
        color: #6b7280;
    }

    .items-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 0.75rem;
    }

    .item-card {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 0.75rem 1rem;
        transition: all 0.2s ease;
    }

    .item-card:hover {
        background: white;
        border-color: #10b981;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        transform: translateY(-2px);
    }

    .item-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
    }

    .item-icon {
        font-size: 0.85rem;
    }

    .item-name {
        font-weight: 600;
        font-size: 0.85rem;
        color: #111827;
    }

    .item-details {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .item-detail {
        display: flex;
        justify-content: space-between;
        font-size: 0.75rem;
    }

    .detail-label {
        color: #6b7280;
    }

    .detail-value {
        color: #111827;
        font-weight: 500;
    }

    .no-items {
        text-align: center;
        padding: 3rem;
        color: #6b7280;
        font-size: 1rem;
    }

    /* Responsive */
    @media (max-width: 768px) {
        .page-wrapper {
            padding: 1rem;
        }
        
        .section-title {
            font-size: 1.2rem;
        }

        .back-button {
            padding: 0.5rem 1rem;
            font-size: 0.8rem;
        }
        
        .card {
            padding: 1.2rem;
        }
        
        .number-text {
            font-size: 1.2rem;
        }
        
        .icon-main {
            font-size: 2.5rem;
        }
        
        .card-name {
            font-size: 1rem;
        }
        
        .card-meta {
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
        }

        .modal-content {
            max-height: 90vh;
            margin: 1rem;
        }

        .modal-header {
            padding: 1rem 1.5rem;
        }

        .modal-body {
            padding: 1rem 1.5rem;
        }

        .items-grid {
            grid-template-columns: 1fr;
        }
    }

    @media (max-width: 480px) {
        .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
        }
        
        .total-badge {
            align-self: flex-start;
        }

        .modal-content {
            max-width: 100%;
            border-radius: 12px;
        }
    }
</style>