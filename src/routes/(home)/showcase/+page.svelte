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
    <title>Showcase - Pokemon Collection</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com">
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</svelte:head>

<div class="page-wrapper">
    <div class="section-header">
        <div class="header-left">
            <div class="scan-line"></div>
            <h2 class="section-title">
                <span class="title-icon">📦</span>
                All Showcases
            </h2>
        </div>
        <div class="header-right">
            <div class="total-badge">{showcases.length} Total</div>
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
                <div class="card-glow" class:active={hoveredId === showcase.id}></div>
                
                <div class="card-header">
                    <div class="card-number">
                        <span class="number-text">#{showcase.id.toString().padStart(2, '0')}</span>
                        <div class="number-glow"></div>
                    </div>
                    <div class="card-status">
                        <div class="status-dot"></div>
                        <span class="status-text">Active</span>
                    </div>
                </div>

                <div class="card-icon">
                    <div class="icon-pulse" class:active={hoveredId === showcase.id}></div>
                    <span class="icon-main">🎴</span>
                </div>

                <div class="card-info">
                    <h3 class="card-name">{showcase.name}</h3>
                    <div class="card-meta">
                        <div class="meta-item">
                            <span class="meta-icon">📊</span>
                            <span>{showcase.sections.length} Sections</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-icon">💳</span>
                            <span>{showcase.filled}/{showcase.slots} Cards</span>
                        </div>
                    </div>
                </div>

                <div class="card-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: {(showcase.filled / showcase.slots) * 100}%;"></div>
                    </div>
                    <div class="progress-stats">
                        <span>{Math.round((showcase.filled / showcase.slots) * 100)}% Filled</span>
                        <span class="progress-arrow">→</span>
                    </div>
                </div>

                <div class="card-footer">
                    <div class="footer-badge">
                        <span>✨ Premium Collection</span>
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
        background: #0a0a0f;
        font-family: 'Rajdhani', sans-serif;
        color: #e0e0ff;
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

    .scan-line {
        width: 4px;
        height: 30px;
        background: #00ff9d;
        border-radius: 2px;
        animation: scan 2s ease-in-out infinite;
    }

    @keyframes scan {
        0%, 100% { opacity: 1; height: 30px; }
        50% { opacity: 0.5; height: 20px; }
    }

    .section-title {
        font-family: 'Orbitron', sans-serif;
        font-size: 1.8rem;
        font-weight: 700;
        color: #ffffff;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .title-icon {
        font-size: 1.8rem;
    }

    .total-badge {
        background: rgba(0, 255, 157, 0.1);
        border: 1px solid rgba(0, 255, 157, 0.3);
        border-radius: 40px;
        padding: 0.5rem 1.2rem;
        font-size: 0.9rem;
        font-weight: 600;
        color: #00ff9d;
    }

    /* Grid Container - SEJAJAR KE SAMPING */
    .grid-container {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 1.5rem;
    }

    /* Responsive Breakpoints */
    @media (max-width: 1600px) {
        .grid-container {
            grid-template-columns: repeat(5, 1fr);
        }
    }

    @media (max-width: 1400px) {
        .grid-container {
            grid-template-columns: repeat(4, 1fr);
        }
    }

    @media (max-width: 1200px) {
        .grid-container {
            grid-template-columns: repeat(3, 1fr);
        }
    }

    @media (max-width: 900px) {
        .grid-container {
            grid-template-columns: repeat(2, 1fr);
        }
    }

    @media (max-width: 600px) {
        .grid-container {
            grid-template-columns: 1fr;
        }
    }

    /* Card Styling */
    .card {
        position: relative;
        background: linear-gradient(135deg, rgba(20, 20, 35, 0.8), rgba(15, 15, 25, 0.9));
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 20px;
        padding: 1.5rem;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: hidden;
        backdrop-filter: blur(10px);
    }

    .card:hover {
        transform: translateY(-8px);
        border-color: rgba(0, 255, 157, 0.4);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 255, 157, 0.2);
    }

    .card-glow {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: radial-gradient(circle at 50% 0%, rgba(0, 255, 157, 0.1), transparent);
        opacity: 0;
        transition: opacity 0.3s;
        pointer-events: none;
    }

    .card-glow.active {
        opacity: 1;
    }

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1.5rem;
    }

    .card-number {
        position: relative;
    }

    .number-text {
        font-family: 'Orbitron', sans-serif;
        font-size: 2rem;
        font-weight: 800;
        color: rgba(255, 255, 255, 0.3);
        letter-spacing: 2px;
    }

    .number-glow {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(0, 255, 157, 0.3), transparent);
        transform: translateX(-100%);
        transition: transform 0.5s;
    }

    .card:hover .number-glow {
        transform: translateX(100%);
    }

    .card-status {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: rgba(0, 255, 157, 0.1);
        border-radius: 30px;
        padding: 0.25rem 0.75rem;
    }

    .status-dot {
        width: 8px;
        height: 8px;
        background: #00ff9d;
        border-radius: 50%;
        animation: blink 2s infinite;
    }

    @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
    }

    .status-text {
        font-size: 0.7rem;
        font-weight: 600;
        color: #00ff9d;
        text-transform: uppercase;
    }

    .card-icon {
        position: relative;
        display: flex;
        justify-content: center;
        margin: 1rem 0;
    }

    .icon-pulse {
        position: absolute;
        width: 80px;
        height: 80px;
        background: radial-gradient(circle, rgba(0, 255, 157, 0.2), transparent);
        border-radius: 50%;
        opacity: 0;
        transition: all 0.3s;
    }

    .icon-pulse.active {
        opacity: 1;
        animation: ripple 1s ease-out infinite;
    }

    @keyframes ripple {
        0% { transform: scale(0.8); opacity: 0.5; }
        100% { transform: scale(1.5); opacity: 0; }
    }

    .icon-main {
        font-size: 3.5rem;
        filter: drop-shadow(0 0 20px rgba(0, 255, 157, 0.3));
        transition: transform 0.3s;
    }

    .card:hover .icon-main {
        transform: scale(1.1);
    }

    .card-info {
        text-align: center;
        margin: 1rem 0;
    }

    .card-name {
        font-family: 'Orbitron', sans-serif;
        font-size: 1.3rem;
        font-weight: 700;
        color: #ffffff;
        margin: 0 0 1rem 0;
    }

    .card-meta {
        display: flex;
        justify-content: center;
        gap: 1.5rem;
    }

    .meta-item {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.6);
    }

    .meta-icon {
        font-size: 0.9rem;
    }

    .card-progress {
        margin: 1rem 0;
    }

    .progress-bar {
        height: 6px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
        overflow: hidden;
        margin-bottom: 0.5rem;
    }

    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #00ff9d, #00ccff);
        border-radius: 3px;
        transition: width 0.5s;
        position: relative;
        overflow: hidden;
    }

    .progress-fill::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
        animation: shimmer 2s infinite;
    }

    @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
    }

    .progress-stats {
        display: flex;
        justify-content: space-between;
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.5);
    }

    .progress-arrow {
        transition: transform 0.3s;
    }

    .card:hover .progress-arrow {
        transform: translateX(4px);
        color: #00ff9d;
    }

    .card-footer {
        margin-top: 1rem;
        text-align: center;
    }

    .footer-badge {
        display: inline-block;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 30px;
        padding: 0.25rem 1rem;
        font-size: 0.7rem;
        color: rgba(255, 255, 255, 0.4);
    }

    /* Tablet */
    @media (max-width: 768px) {
        .page-wrapper {
            padding: 1rem;
        }
        
        .section-title {
            font-size: 1.3rem;
        }
        
        .card {
            padding: 1.2rem;
        }
        
        .card-number .number-text {
            font-size: 1.5rem;
        }
        
        .card-icon .icon-main {
            font-size: 2.5rem;
        }
        
        .card-name {
            font-size: 1.1rem;
        }
        
        .card-meta {
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
        }
    }

    /* Mobile Small */
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