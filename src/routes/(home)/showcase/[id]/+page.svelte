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
            'display': '#10b981',
            'storage': '#f59e0b',
            'archive': '#ef4444',
            'featured': '#3b82f6'
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
    <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700&display=swap" rel="stylesheet">
</svelte:head>

<div class="page-wrapper">
    <!-- Back Button -->
    <button class="back-button" onclick={goBack}>
        <span class="back-icon">←</span>
        <span>Back to Cabinets</span>
    </button>

    <!-- Cabinet Header -->
    {#if showcase}
        <div class="cabinet-header">
            <div class="header-bg"></div>
            <div class="header-content">
                <div class="header-left">
                    <div class="cabinet-badge">
                        <span class="badge-icon">📦</span>
                        <span>CABINET #{showcase.id}</span>
                    </div>
                    <h1 class="cabinet-title">{showcase.name}</h1>
                    <div class="cabinet-stats">
                        <div class="stat-item">
                            <span class="stat-icon">📂</span>
                            <span>{showcase.sections?.length || 0} Sections</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-icon">📦</span>
                            <span>{showcase.totalItems || 0} Items</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-icon">🏭</span>
                            <span>Capacity {showcase.maxSlots} Slots</span>
                        </div>
                    </div>
                </div>
                <div class="header-right">
                    <div class="capacity-indicator">
                        <div class="capacity-circle">
                            <span class="capacity-value">{Math.round(((showcase.totalItems || 0) / showcase.maxSlots) * 100)}%</span>
                            <span class="capacity-label">Filled</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Sections Grid -->
        <div class="sections-container">
            <div class="sections-header">
                <div class="accent-line"></div>
                <h2 class="sections-title">Storage Sections</h2>
                <div class="sections-count">{showcase.sections?.length || 0} Total</div>
            </div>

            <div class="sections-grid">
                {#each showcase.sections as section}
                    <div 
                        class="section-card"
                        onmouseenter={() => hoveredSection = section.id}
                        onmouseleave={() => hoveredSection = null}
                        onclick={() => goToSection(section.id)}
                        onkeydown={(e) => e.key === 'Enter' && goToSection(section.id)}
                        role="button"
                        tabindex="0"
                    >
                        <div class="section-border" class:active={hoveredSection === section.id}></div>
                        
                        <div class="section-header-card">
                            <div class="section-type" style:border-color={getSectionTypeColor(section.type)}>
                                <span class="type-dot" style:background={getSectionTypeColor(section.type)}></span>
                                <span>{section.type}</span>
                            </div>
                            <div class="section-arrow">→</div>
                        </div>
                        
                        <h3 class="section-name">{section.name}</h3>
                        
                        <div class="section-stats-card">
                            <div class="stat-badge">
                                <span>📦</span>
                                <span>{section.itemCount} Items</span>
                            </div>
                        </div>
                        
                        <!-- Preview Items -->
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
                            <div class="footer-text">Manage Section</div>
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
            <p>The cabinet you're looking for doesn't exist.</p>
            <button class="error-btn" onclick={goBack}>Return Home</button>
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
    }

    .page-wrapper {
        padding: 2rem;
        max-width: 1800px;
        margin: 0 auto;
    }

    /* Back Button */
    .back-button {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        background: #ffffff;
        border: 1px solid #e0e0e0;
        color: #666666;
        padding: 0.6rem 1.2rem;
        border-radius: 8px;
        font-family: 'Inter', sans-serif;
        font-size: 0.85rem;
        font-weight: 500;
        cursor: pointer;
        margin-bottom: 2rem;
        transition: all 0.2s;
    }

    .back-button:hover {
        background: #f5f5f5;
        border-color: #10b981;
        transform: translateX(-4px);
        color: #10b981;
    }

    /* Cabinet Header */
    .cabinet-header {
        position: relative;
        background: #ffffff;
        border: 1px solid #e0e0e0;
        border-radius: 12px;
        margin-bottom: 2rem;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .header-bg {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.05), transparent);
        pointer-events: none;
    }

    .header-content {
        position: relative;
        padding: 2rem 2.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .cabinet-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        background: #f0fdf4;
        border: 1px solid #10b981;
        border-radius: 30px;
        padding: 0.3rem 0.8rem;
        font-size: 0.7rem;
        font-weight: 600;
        letter-spacing: 1px;
        color: #059669;
        margin-bottom: 1rem;
    }

    .cabinet-title {
        font-family: 'Inter', sans-serif;
        font-size: 2rem;
        font-weight: 600;
        color: #333333;
        margin: 0 0 1rem 0;
    }

    .cabinet-stats {
        display: flex;
        gap: 2rem;
        flex-wrap: wrap;
    }

    .stat-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.85rem;
        color: #666666;
    }

    .stat-icon {
        font-size: 1rem;
    }

    .capacity-indicator {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .capacity-circle {
        width: 80px;
        height: 80px;
        background: #f0fdf4;
        border: 2px solid #10b981;
        border-radius: 50%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }

    .capacity-value {
        font-size: 1.2rem;
        font-weight: 700;
        color: #059669;
    }

    .capacity-label {
        font-size: 0.65rem;
        color: #666666;
    }

    /* Sections Container */
    .sections-container {
        margin-top: 2rem;
    }

    .sections-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1.5rem;
    }

    .accent-line {
        width: 4px;
        height: 24px;
        background: #10b981;
        border-radius: 2px;
    }

    .sections-title {
        font-family: 'Inter', sans-serif;
        font-size: 1.2rem;
        font-weight: 600;
        color: #333333;
        margin: 0;
    }

    .sections-count {
        background: #f5f5f5;
        border-radius: 30px;
        padding: 0.25rem 1rem;
        font-size: 0.75rem;
        color: #666666;
    }

    /* Sections Grid */
    .sections-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1.5rem;
    }

    @media (max-width: 1400px) {
        .sections-grid { grid-template-columns: repeat(3, 1fr); }
    }

    @media (max-width: 1000px) {
        .sections-grid { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 600px) {
        .sections-grid { grid-template-columns: 1fr; }
    }

    /* Section Card */
    .section-card {
        position: relative;
        background: #ffffff;
        border: 1px solid #e0e0e0;
        border-radius: 12px;
        padding: 1.5rem;
        cursor: pointer;
        transition: all 0.3s;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .section-card:hover {
        transform: translateY(-4px);
        border-color: #10b981;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    }

    .section-border {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: #10b981;
        transform: scaleX(0);
        transition: transform 0.3s;
    }

    .section-border.active {
        transform: scaleX(1);
    }

    .section-header-card {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    .section-type {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: #666666;
        border-left: 2px solid;
        padding-left: 0.75rem;
    }

    .type-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
    }

    .section-arrow {
        font-size: 1rem;
        color: #cccccc;
        transition: transform 0.3s;
    }

    .section-card:hover .section-arrow {
        transform: translateX(5px);
        color: #10b981;
    }

    .section-name {
        font-family: 'Inter', sans-serif;
        font-size: 1rem;
        font-weight: 600;
        color: #333333;
        margin: 0 0 0.75rem 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .section-stats-card {
        margin-bottom: 1rem;
    }

    .stat-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        background: #f5f5f5;
        border-radius: 20px;
        padding: 0.25rem 0.75rem;
        font-size: 0.75rem;
        color: #666666;
    }

    /* Preview Items */
    .preview-items {
        display: flex;
        gap: 0.5rem;
        margin: 1rem 0;
        justify-content: center;
    }

    .preview-item {
        position: relative;
        width: 60px;
        height: 60px;
        background: #f9fafb;
        border-radius: 8px;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid #e0e0e0;
    }

    .preview-item img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .preview-placeholder {
        font-size: 2rem;
        opacity: 0.3;
    }

    .preview-tooltip {
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background: #333333;
        color: #ffffff;
        padding: 0.5rem;
        border-radius: 8px;
        font-size: 0.7rem;
        white-space: nowrap;
        display: none;
        z-index: 10;
    }

    .preview-item:hover .preview-tooltip {
        display: block;
    }

    .preview-tooltip strong {
        display: block;
        margin-bottom: 0.25rem;
    }

    .preview-tooltip span {
        display: block;
        font-size: 0.65rem;
        color: #cccccc;
    }

    .section-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 1rem;
        padding-top: 0.75rem;
        border-top: 1px solid #f0f0f0;
        font-size: 0.7rem;
        color: #888888;
    }

    .footer-icon {
        transition: transform 0.3s;
    }

    .section-card:hover .footer-icon {
        transform: translateX(5px);
        color: #10b981;
    }

    /* Error State */
    .error-state {
        text-align: center;
        padding: 4rem 2rem;
        background: #ffffff;
        border: 1px solid #e0e0e0;
        border-radius: 12px;
    }

    .error-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
    }

    .error-state h2 {
        font-family: 'Inter', sans-serif;
        font-size: 1.5rem;
        color: #333333;
        margin-bottom: 0.5rem;
    }

    .error-state p {
        color: #666666;
        margin-bottom: 2rem;
    }

    .error-btn {
        background: #f5f5f5;
        border: 1px solid #e0e0e0;
        color: #666666;
        padding: 0.75rem 2rem;
        border-radius: 8px;
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .error-btn:hover {
        background: #10b981;
        border-color: #10b981;
        color: #ffffff;
    }

    /* Responsive */
    @media (max-width: 768px) {
        .page-wrapper { padding: 1rem; }
        
        .header-content { 
            flex-direction: column; 
            text-align: center; 
            gap: 1rem; 
            padding: 1.5rem;
        }
        
        .cabinet-stats { 
            justify-content: center; 
        }
        
        .cabinet-title { 
            font-size: 1.5rem; 
        }
        
        .capacity-circle { 
            width: 70px; 
            height: 70px; 
        }
        
        .section-name {
            white-space: normal;
            word-break: break-word;
        }
        
        .preview-items { 
            justify-content: center; 
        }
    }

    @media (max-width: 480px) {
        .sections-header {
            flex-wrap: wrap;
        }
        
        .stat-item {
            font-size: 0.75rem;
        }
    }
</style>