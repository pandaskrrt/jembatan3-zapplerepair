<script lang="ts">
    import { goto } from '$app/navigation';
    
    let { data } = $props();
    let showcases = data?.showcases || [];
    
    let hoveredId = $state<number | null>(null);
    
    function goToShowcase(id: number) {
        goto(`/showcase/${id}`);
    }
</script>

<svelte:head>
    <title>Stock Management - Cabinets</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700&display=swap" rel="stylesheet">
</svelte:head>

<div class="page-wrapper">
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
                    <div class="card-status">
                        <div class="status-dot" class:active={showcase.filled < showcase.slots}></div>
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
                        <div class="meta-item">
                            <span class="meta-icon">📦</span>
                            <span>{showcase.filled}/{showcase.slots} Items</span>
                        </div>
                    </div>
                </div>

                <div class="card-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: {(showcase.filled / showcase.slots) * 100}%;"></div>
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
        border: 1px solid #e0e0e0;
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
        color: #888888;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .number-text {
        font-family: 'Inter', monospace;
        font-size: 1.5rem;
        font-weight: 700;
        color: #333333;
        letter-spacing: 1px;
    }

    .card-status {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: #f5f5f5;
        border-radius: 30px;
        padding: 0.25rem 0.75rem;
    }

    .status-dot {
        width: 8px;
        height: 8px;
        background: #10b981;
        border-radius: 50%;
    }

    .status-dot.active {
        background: #f59e0b;
    }

    .status-text {
        font-size: 0.7rem;
        font-weight: 600;
        color: #555555;
        text-transform: uppercase;
    }

    .card-icon {
        display: flex;
        justify-content: center;
        margin: 1rem 0;
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
        margin: 1rem 0;
    }

    .card-name {
        font-family: 'Inter', sans-serif;
        font-size: 1.1rem;
        font-weight: 600;
        color: #333333;
        margin: 0 0 0.75rem 0;
    }

    .card-meta {
        display: flex;
        justify-content: center;
        gap: 1rem;
    }

    .meta-item {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.75rem;
        color: #666666;
    }

    .meta-icon {
        font-size: 0.85rem;
    }

    .card-progress {
        margin: 1rem 0;
    }

    .progress-bar {
        height: 6px;
        background: #f0f0f0;
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

    .progress-stats {
        display: flex;
        justify-content: space-between;
        font-size: 0.7rem;
        color: #888888;
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
        border: 1px solid #e0e0e0;
        border-radius: 30px;
        padding: 0.35rem 1rem;
        font-size: 0.7rem;
        color: #666666;
    }

    .badge-icon {
        font-size: 0.8rem;
    }

    /* Responsive */
    @media (max-width: 768px) {
        .page-wrapper {
            padding: 1rem;
        }
        
        .section-title {
            font-size: 1.2rem;
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
    }
</style>