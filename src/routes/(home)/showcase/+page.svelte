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
                <svg class="title-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
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
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 4H3v16h18V4z"/><line x1="9" y1="4" x2="9" y2="20"/><line x1="15" y1="4" x2="15" y2="20"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        {:else if showcase.filled >= showcase.slots}
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                        {:else}
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/></svg>
                        {/if}
                    </span>
                </div>

                <div class="card-info">
                    <h3 class="card-name">{showcase.name}</h3>
                    <div class="card-meta">
                        <div class="meta-item">
                            <span class="meta-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg></span>
                            <span>{showcase.sections.length} Sections</span>
                        </div>
                        <div class="meta-item" onclick={(e) => { e.stopPropagation(); openItemsModal(showcase); }}>
                            <span class="meta-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg></span>
                            <span class="items-link">{showcase.filled}/{showcase.slots} Items</span>
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
                        <span class="badge-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="6" x2="9" y2="10"/><line x1="15" y1="6" x2="15" y2="10"/><line x1="9" y1="14" x2="9" y2="18"/><line x1="15" y1="14" x2="15" y2="18"/></svg></span>
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
                        <span class="modal-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg></span>
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
                                        <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> {section.name}</span>
                                        <span class="section-badge">{section.items.length} items</span>
                                    </div>
                                    <div class="items-grid">
                                        {#each section.items as item}
                                            <div class="item-card">
                                                <div class="item-header">
                                                    <span class="item-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></span>
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
                                                            <span class="detail-label"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> Location:</span>
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
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg> No items found
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
        background: #06090f;
        font-family: 'Inter', sans-serif;
        color: #e3e4e6;
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
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 8px;
        padding: 0.6rem 1.2rem;
        font-family: 'Inter', sans-serif;
        font-size: 0.85rem;
        font-weight: 500;
        color: #a1a1a5;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .back-button:hover {
        background: rgba(16,185,129,0.1);
        border-color: #10b981;
        color: #34d399;
        transform: translateX(-4px);
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
        color: #f1f5f9;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .title-icon {
        color: #34d399;
    }

    .total-badge {
        background: rgba(16,185,129,0.12);
        border: 1px solid rgba(16,185,129,0.3);
        border-radius: 40px;
        padding: 0.5rem 1.2rem;
        font-size: 0.85rem;
        font-weight: 600;
        color: #34d399;
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
        background: #161618;
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 12px;
        padding: 1.5rem;
        cursor: pointer;
        transition: all 0.3s ease;
        overflow: hidden;
    }

    .card:hover {
        transform: translateY(-4px);
        border-color: rgba(16,185,129,0.4);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
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
        color: #8f8f96;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .number-text {
        font-family: 'Inter', monospace;
        font-size: 1.5rem;
        font-weight: 700;
        color: #f1f5f9;
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
        background: rgba(16,185,129,0.12);
        color: #34d399;
    }

    .card-status.status-active .status-dot {
        background: #22c55e;
        animation: pulse-active 2s infinite;
    }

    .card-status.status-full {
        background: rgba(239,68,68,0.12);
        color: #f87171;
    }

    .card-status.status-full .status-dot {
        background: #ef4444;
    }

    .card-status.status-empty {
        background: rgba(255,255,255,0.05);
        color: #71717a;
    }

    .card-status.status-empty .status-dot {
        background: #52525b;
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
        color: #10b981;
    }

    .icon-main {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 56px;
        height: 56px;
        border-radius: 14px;
        background: rgba(16,185,129,0.08);
        border: 1px solid rgba(16,185,129,0.2);
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
        color: #f1f5f9;
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
        color: #a1a1a5;
        padding: 0.2rem 0.6rem;
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 6px;
        transition: all 0.2s ease;
    }

    .meta-item .items-link {
        cursor: pointer;
        color: #34d399;
        font-weight: 500;
        text-decoration: underline;
        text-underline-offset: 2px;
    }

    .meta-item .items-link:hover {
        color: #10b981;
    }

    .meta-icon {
        display: flex;
        color: #10b981;
    }

    .card-progress {
        margin: 1rem 0;
    }

    .progress-bar {
        height: 6px;
        background: rgba(255,255,255,0.08);
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
        color: #8f8f96;
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
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 30px;
        padding: 0.35rem 1rem;
        font-size: 0.7rem;
        color: #8f8f96;
    }

    .badge-icon {
        display: flex;
        color: #10b981;
    }

    /* Modal Styles */
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
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
        background: #161618;
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 16px;
        max-width: 900px;
        width: 100%;
        max-height: 80vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
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
        border-bottom: 1px solid rgba(255,255,255,0.08);
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
        color: #f1f5f9;
        margin: 0;
    }

    .modal-icon {
        display: flex;
        color: #10b981;
    }

    .modal-close {
        background: none;
        border: none;
        padding: 0.5rem;
        cursor: pointer;
        color: #8f8f96;
        border-radius: 8px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .modal-close:hover {
        background: rgba(255,255,255,0.08);
        color: #f1f5f9;
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
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 8px;
        font-size: 0.85rem;
        font-weight: 600;
        color: #d4d4d8;
        margin-bottom: 0.75rem;
    }

    .section-group-title span {
        display: flex;
        align-items: center;
        gap: 0.4rem;
    }

    .section-group-title svg {
        color: #10b981;
    }

    .section-badge {
        background: rgba(16,185,129,0.12);
        border: 1px solid rgba(16,185,129,0.25);
        padding: 0.15rem 0.6rem;
        border-radius: 999px;
        font-size: 0.7rem;
        color: #34d399;
    }

    .items-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 0.75rem;
    }

    .item-card {
        background: #121214;
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 8px;
        padding: 0.75rem 1rem;
        transition: all 0.2s ease;
    }

    .item-card:hover {
        background: #1a1a1d;
        border-color: rgba(16,185,129,0.4);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        transform: translateY(-2px);
    }

    .item-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
    }

    .item-icon {
        display: flex;
        color: #10b981;
    }

    .item-name {
        font-weight: 600;
        font-size: 0.85rem;
        color: #f1f5f9;
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
        gap: 0.5rem;
    }

    .detail-label {
        color: #8f8f96;
        display: flex;
        align-items: center;
        gap: 0.3rem;
    }

    .detail-value {
        color: #d4d4d8;
        font-weight: 500;
        text-align: right;
    }

    .no-items {
        text-align: center;
        padding: 3rem;
        color: #71717a;
        font-size: 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
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
            width: 46px;
            height: 46px;
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
