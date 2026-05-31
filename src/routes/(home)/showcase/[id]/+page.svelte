<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    
    let { data } = $props();
    let showcase = data?.showcase;
    let showcaseId = $page.params.id;
    
    let hoveredSection = $state<number | null>(null);
    
    function goToSection(sectionId: number) {
        goto(`/showcase/${showcaseId}/${sectionId}`);
    }
    
    function goBack() {
        goto('/');
    }
    
    function getSectionTypeColor(type: string) {
        const colors: Record<string, string> = {
            'display': '#10b981',    // Emerald
            'storage': '#f59e0b',    // Amber
            'archive': '#ef4444',    // Red
            'featured': '#3b82f6'    // Blue
        };
        return colors[type] || '#10b981';
    }
    
    function formatStock(stock: number) {
        if (stock === 0) return 'Out of Stock';
        if (stock < 5) return 'Low Stock';
        return `${stock} units`;
    }
</script>

<svelte:head>
    <title>{showcase?.name} - Stock Management</title>
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
            <span>Back to Cabinets</span>
        </button>

        {#if showcase}
            <div class="cabinet-header">
                <div class="header-bg"></div>
                <div class="header-content">
                    <div class="header-left">
                        <div class="cabinet-badge">
                            <div class="badge-dot"></div>
                            <span>CABINET #{showcase.id.toString().padStart(2, '0')}</span>
                        </div>
                        <h1 class="cabinet-title">{showcase.name}</h1>
                        
                        <div class="cabinet-stats">
                            <div class="stat-item">
                                <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M3 7h18M3 12h18M3 17h18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
                                <span>{showcase.sections?.length || 0} Sections</span>
                            </div>
                            <div class="stat-item">
                                <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M20 7L12 3L4 7L12 11L20 7Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 7V17L12 21L20 17V7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                <span>{showcase.totalItems || 0} / {showcase.maxSlots} Items</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="header-right">
                        <div class="capacity-box">
                            <div class="capacity-info">
                                <span class="capacity-value">{Math.round(((showcase.totalItems || 0) / showcase.maxSlots) * 100)}%</span>
                                <span class="capacity-label">Filled Capacity</span>
                            </div>
                            <div class="capacity-progress-bar">
                                <div class="capacity-progress-fill" style="width: {Math.min(((showcase.totalItems || 0) / showcase.maxSlots) * 100, 100)}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="sections-container">
                <div class="sections-header">
                    <div class="sections-header-left">
                        <p class="eyebrow">Internal Layout</p>
                        <h2 class="sections-title">Storage <span class="accent-text">Sections</span></h2>
                    </div>
                    <div class="sections-count">
                        {showcase.sections?.length || 0} Total
                    </div>
                </div>

                <div class="sections-grid">
                    {#each showcase.sections as section}
                        <div 
                            class="section-card"
                            class:hovered={hoveredSection === section.id}
                            onmouseenter={() => hoveredSection = section.id}
                            onmouseleave={() => hoveredSection = null}
                            onclick={() => goToSection(section.id)}
                            onkeydown={(e) => e.key === 'Enter' && goToSection(section.id)}
                            role="button"
                            tabindex="0"
                        >
                            <div class="card-top-bar" class:active={hoveredSection === section.id}></div>
                            
                            <div class="section-card-header">
                                <div class="section-type" style:border-color={getSectionTypeColor(section.type)}>
                                    <span class="type-dot" style:background={getSectionTypeColor(section.type)}></span>
                                    <span>{section.type}</span>
                                </div>
                                <div class="section-arrow" class:active={hoveredSection === section.id}>→</div>
                            </div>
                            
                            <h3 class="section-name">{section.name}</h3>
                            
                            <div class="section-stats-card">
                                <div class="stat-badge">
                                    <svg viewBox="0 0 24 24" fill="none" width="12" height="12"><path d="M20 7L12 3L4 7L12 11L20 7Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 7V17L12 21L20 17V7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                                    <span>{section.itemCount} Items</span>
                                </div>
                            </div>
                            
                            {#if section.previewItems?.length > 0}
                                <div class="preview-items">
                                    {#each section.previewItems.slice(0, 3) as item}
                                        <div class="preview-item">
                                            {#if item.imageUrl}
                                                <img src={item.imageUrl} alt={item.name} />
                                            {:else}
                                                <div class="preview-placeholder">📦</div>
                                            {/if}
                                            <div class="preview-tooltip">
                                                <strong>{item.name}</strong>
                                                <span>Stock: {formatStock(item.stock)}</span>
                                                <span>Price: Rp {item.price.toLocaleString('id-ID')}</span>
                                            </div>
                                        </div>
                                    {/each}
                                </div>
                            {/if}
                            
                            <div class="section-footer">
                                <div class="footer-text">Manage Layout</div>
                                <div class="footer-icon">→</div>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        {:else}
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h2>Cabinet Not Found</h2>
                <p>The cabinet you're looking for doesn't exist or has been relocated.</p>
                <button class="error-btn" onclick={goBack}>Return to Dashboard</button>
            </div>
        {/if}
    </div>
</div>

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

    /* Back Button */
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

    /* Cabinet Header */
    .cabinet-header {
        position: relative;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 20px;
        margin-bottom: 3rem;
        overflow: hidden;
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
    }

    .header-bg {
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at top left, rgba(37, 99, 235, 0.15), transparent 60%);
        pointer-events: none;
    }

    .header-content {
        position: relative;
        padding: 2.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 2rem;
    }

    .cabinet-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: rgba(37, 99, 235, 0.1);
        border: 1px solid rgba(37, 99, 235, 0.25);
        border-radius: 100px;
        padding: 5px 14px;
        font-size: 10px;
        font-weight: 600;
        color: #63b3ed;
        letter-spacing: 0.08em;
        margin-bottom: 1rem;
    }

    .badge-dot {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: #63b3ed;
        box-shadow: 0 0 8px #63b3ed;
    }

    .cabinet-title {
        font-size: 2.2rem;
        font-weight: 700;
        color: #f1f5f9;
        margin: 0 0 1.2rem 0;
        letter-spacing: -0.5px;
    }

    .cabinet-stats {
        display: flex;
        gap: 1.5rem;
        flex-wrap: wrap;
    }

    .stat-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.4);
    }

    /* Capacity Visualizer */
    .capacity-box {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 14px;
        padding: 1.25rem 1.75rem;
        min-width: 240px;
    }

    .capacity-info {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        margin-bottom: 0.5rem;
    }

    .capacity-value {
        font-size: 1.75rem;
        font-weight: 700;
        color: #f1f5f9;
    }

    .capacity-label {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.4);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .capacity-progress-bar {
        height: 4px;
        background: rgba(255, 255, 255, 0.06);
        border-radius: 99px;
        overflow: hidden;
    }

    .capacity-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #2563eb, #7c3aed);
        border-radius: 99px;
    }

    /* Sections Container Headers */
    .sections-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-bottom: 1.75rem;
    }

    .eyebrow {
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: rgba(99,179,237,0.7);
        margin: 0 0 0.4rem 0;
    }

    .sections-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: #f1f5f9;
        margin: 0;
        letter-spacing: -0.5px;
    }

    .sections-title .accent-text {
        background: linear-gradient(180deg, #ffffff 30%, #93c5fd 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .sections-count {
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 100px;
        padding: 6px 14px;
        font-size: 11px;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.5);
    }

    /* Grid Layout */
    .sections-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1.25rem;
    }

    @media (max-width: 1400px) { .sections-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 1000px) { .sections-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 600px)  { .sections-grid { grid-template-columns: 1fr; } }

    /* Section Cards (Glassmorphism UI) */
    .section-card {
        position: relative;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 16px;
        padding: 1.35rem;
        cursor: pointer;
        overflow: hidden;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        display: flex;
        flex-direction: column;
        transition: background 0.25s, border-color 0.25s, transform 0.25s;
    }

    .section-card:hover, .section-card.hovered {
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(147, 197, 253, 0.25);
        transform: translateY(-4px);
    }

    .card-top-bar {
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 2px;
        background: linear-gradient(90deg, #2563eb, #7c3aed);
        transform: scaleX(0);
        transform-origin: left;
        transition: transform 0.3s ease;
    }

    .card-top-bar.active { transform: scaleX(1); }

    .section-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    .section-type {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 9px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: rgba(255, 255, 255, 0.5);
        border-left: 2px solid;
        padding-left: 0.6rem;
    }

    .type-dot {
        width: 5px;
        height: 5px;
        border-radius: 50%;
    }

    .section-arrow {
        font-size: 1.1rem;
        color: rgba(255, 255, 255, 0.2);
        transition: transform 0.25s, color 0.25s;
    }

    .section-arrow.active {
        transform: translateX(3px);
        color: #93c5fd;
    }

    .section-name {
        font-size: 1rem;
        font-weight: 600;
        color: #e2e8f0;
        margin: 0 0 0.6rem 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .section-stats-card {
        margin-bottom: 1.25rem;
    }

    .stat-badge {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 20px;
        padding: 3px 10px;
        font-size: 11px;
        color: rgba(255, 255, 255, 0.4);
    }

    /* Preview Item Cells */
    .preview-items {
        display: flex;
        gap: 0.5rem;
        margin: 0.5rem 0 1.25rem 0;
    }

    .preview-item {
        position: relative;
        width: 48px;
        height: 48px;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: help;
    }

    .preview-item img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 6px;
    }

    .preview-placeholder {
        font-size: 1.2rem;
        opacity: 0.25;
    }

    /* Tooltip System */
    .preview-tooltip {
        position: absolute;
        bottom: 120%;
        left: 50%;
        transform: translateX(-50%) translateY(4px);
        background: #0f172a;
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #ffffff;
        padding: 0.6rem 0.8rem;
        border-radius: 8px;
        font-size: 11px;
        white-space: nowrap;
        opacity: 0;
        pointer-events: none;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
        z-index: 50;
        transition: opacity 0.2s, transform 0.2s;
    }

    .preview-item:hover .preview-tooltip {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
    }

    .preview-tooltip strong {
        display: block;
        color: #f1f5f9;
        margin-bottom: 0.15rem;
    }

    .preview-tooltip span {
        display: block;
        font-size: 10px;
        color: rgba(255, 255, 255, 0.5);
    }

    .section-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: auto;
        padding-top: 0.85rem;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
        font-size: 11px;
        color: rgba(255, 255, 255, 0.3);
    }

    .footer-icon {
        transition: transform 0.25s;
    }

    .section-card:hover .footer-icon {
        transform: translateX(3px);
        color: #93c5fd;
    }

    /* Error Handling View */
    .error-state {
        text-align: center;
        padding: 5rem 2rem;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 20px;
        backdrop-filter: blur(12px);
    }

    .error-icon {
        font-size: 3rem;
        margin-bottom: 1.5rem;
    }

    .error-state h2 {
        font-size: 1.5rem;
        color: #f1f5f9;
        margin-bottom: 0.5rem;
    }

    .error-state p {
        color: rgba(255, 255, 255, 0.4);
        margin-bottom: 2rem;
    }

    .error-btn {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #f1f5f9;
        padding: 0.75rem 2rem;
        border-radius: 10px;
        font-size: 0.85rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
    }

    .error-btn:hover {
        background: #2563eb;
        border-color: #2563eb;
    }

    /* Responsive Rules */
    @media (max-width: 768px) {
        .content { padding: 1.5rem 1rem 2rem; }
        .header-content { flex-direction: column; align-items: flex-start; padding: 1.75rem; }
        .cabinet-title { font-size: 1.75rem; }
        .capacity-box { width: 100%; box-sizing: border-box; }
        .sections-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
    }
</style>