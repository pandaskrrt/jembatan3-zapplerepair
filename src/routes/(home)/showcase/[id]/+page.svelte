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
    
    function getPokemonTypeColor(type: string) {
        const colors: Record<string, string> = {
            'display': '#00ff9d',
            'storage': '#ffaa00',
            'archive': '#ff6b6b',
            'featured': '#00ccff'
        };
        return colors[type] || '#00ff9d';
    }
</script>

<svelte:head>
    <title>{showcase?.name} - Pokemon Showcase</title>
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</svelte:head>

<div class="page-wrapper">
    <!-- Back Button -->
    <button class="back-button" onclick={goBack}>
        <span class="back-icon">←</span>
        <span>Back to Showcases</span>
    </button>

    <!-- Showcase Header -->
    {#if showcase}
        <div class="showcase-header">
            <div class="header-bg"></div>
            <div class="header-content">
                <div class="header-left">
                    <div class="showcase-badge">
                        <span class="badge-icon">🎴</span>
                        <span>SHOWCASE #{showcase.id}</span>
                    </div>
                    <h1 class="showcase-title">{showcase.name}</h1>
                    <div class="showcase-stats">
                        <div class="stat-item">
                            <span class="stat-icon">📊</span>
                            <span>{showcase.sections?.length || 0} Sections</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-icon">💳</span>
                            <span>{showcase.totalCards || 0} Cards</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-icon">📦</span>
                            <span>Max {showcase.maxSlots} Slots</span>
                        </div>
                    </div>
                </div>
                <div class="header-right">
                    <div class="energy-icon">⚡</div>
                </div>
            </div>
        </div>

        <!-- Sections Grid -->
        <div class="sections-container">
            <div class="sections-header">
                <div class="scan-line"></div>
                <h2 class="sections-title">Collection Sections</h2>
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
                        <div class="section-glow" class:active={hoveredSection === section.id}></div>
                        
                        <div class="section-header-card">
                            <div class="section-type" style:border-color={getPokemonTypeColor(section.type)}>
                                <span class="type-dot" style:background={getPokemonTypeColor(section.type)}></span>
                                <span>{section.type}</span>
                            </div>
                            <div class="section-arrow">→</div>
                        </div>
                        
                        <h3 class="section-name">{section.name}</h3>
                        
                        <div class="section-stats-card">
                            <div class="stat-badge">
                                <span>📊</span>
                                <span>{section.cardCount} Cards</span>
                            </div>
                        </div>
                        
                        <!-- Preview Cards -->
                        {#if section.previewCards?.length > 0}
                            <div class="preview-cards">
                                {#each section.previewCards.slice(0, 3) as card}
                                    <div class="preview-card">
                                        {#if card.imageUrl}
                                            <img src={card.imageUrl} alt={card.name} />
                                        {:else}
                                            <div class="preview-placeholder">🎴</div>
                                        {/if}
                                    </div>
                                {/each}
                            </div>
                        {/if}
                        
                        <div class="section-footer">
                            <div class="footer-text">Explore Collection</div>
                            <div class="footer-icon">▼</div>
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    {:else}
        <div class="error-state">
            <div class="error-icon">⚠️</div>
            <h2>Showcase Not Found</h2>
            <p>The showcase you're looking for doesn't exist.</p>
            <button class="error-btn" onclick={goBack}>Return Home</button>
        </div>
    {/if}
</div>

<style>
    :global(body) {
        margin: 0;
        padding: 0;
        background: #0a0a0f;
        font-family: 'Rajdhani', sans-serif;
        color: #e0e0ff;
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
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #ffffff;
        padding: 0.6rem 1.2rem;
        border-radius: 30px;
        font-family: 'Rajdhani', sans-serif;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        margin-bottom: 2rem;
        transition: all 0.2s;
    }

    .back-button:hover {
        background: rgba(0, 255, 157, 0.1);
        border-color: #00ff9d;
        transform: translateX(-4px);
    }

    /* Showcase Header */
    .showcase-header {
        position: relative;
        background: linear-gradient(135deg, rgba(0, 255, 157, 0.05), rgba(0, 0, 0, 0.3));
        border: 1px solid rgba(0, 255, 157, 0.2);
        border-radius: 30px;
        margin-bottom: 3rem;
        overflow: hidden;
    }

    .header-bg {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: radial-gradient(ellipse at 30% 50%, rgba(0, 255, 157, 0.1), transparent);
        pointer-events: none;
    }

    .header-content {
        position: relative;
        padding: 2rem 2.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .showcase-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        background: rgba(0, 255, 157, 0.1);
        border: 1px solid rgba(0, 255, 157, 0.3);
        border-radius: 30px;
        padding: 0.3rem 0.8rem;
        font-size: 0.7rem;
        font-weight: 600;
        letter-spacing: 1px;
        color: #00ff9d;
        margin-bottom: 1rem;
    }

    .showcase-title {
        font-family: 'Orbitron', sans-serif;
        font-size: 2.5rem;
        font-weight: 800;
        color: #ffffff;
        margin: 0 0 1rem 0;
    }

    .showcase-stats {
        display: flex;
        gap: 2rem;
        flex-wrap: wrap;
    }

    .stat-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.6);
    }

    .stat-icon {
        font-size: 1rem;
    }

    .energy-icon {
        font-size: 4rem;
        filter: drop-shadow(0 0 20px rgba(0, 255, 157, 0.5));
        animation: float 3s ease-in-out infinite;
    }

    @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
    }

    /* Sections Container */
    .sections-container {
        margin-top: 2rem;
    }

    .sections-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 2rem;
    }

    .scan-line {
        width: 4px;
        height: 25px;
        background: #00ff9d;
        border-radius: 2px;
        animation: scan 2s infinite;
    }

    @keyframes scan {
        0%, 100% { height: 25px; opacity: 1; }
        50% { height: 15px; opacity: 0.5; }
    }

    .sections-title {
        font-family: 'Orbitron', sans-serif;
        font-size: 1.5rem;
        font-weight: 700;
        color: #ffffff;
        margin: 0;
    }

    .sections-count {
        background: rgba(0, 255, 157, 0.1);
        border-radius: 30px;
        padding: 0.25rem 1rem;
        font-size: 0.8rem;
        color: #00ff9d;
    }

    /* Sections Grid - SEJAJAR KE SAMPING */
    .sections-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1.5rem;
    }

    /* Responsive breakpoints untuk sections grid */
    @media (max-width: 1400px) {
        .sections-grid {
            grid-template-columns: repeat(3, 1fr);
        }
    }

    @media (max-width: 1000px) {
        .sections-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }

    @media (max-width: 600px) {
        .sections-grid {
            grid-template-columns: 1fr;
        }
    }

    /* Section Card */
    .section-card {
        position: relative;
        background: linear-gradient(135deg, rgba(20, 20, 35, 0.8), rgba(15, 15, 25, 0.9));
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 20px;
        padding: 1.5rem;
        cursor: pointer;
        transition: all 0.3s;
        overflow: hidden;
    }

    .section-card:hover {
        transform: translateY(-5px);
        border-color: #00ff9d;
        box-shadow: 0 10px 30px rgba(0, 255, 157, 0.15);
    }

    .section-glow {
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

    .section-glow.active {
        opacity: 1;
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
        color: rgba(255, 255, 255, 0.6);
        border-left: 2px solid;
        padding-left: 0.75rem;
    }

    .type-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
    }

    .section-arrow {
        font-size: 1.2rem;
        color: rgba(0, 255, 157, 0.6);
        transition: transform 0.3s;
    }

    .section-card:hover .section-arrow {
        transform: translateX(5px);
        color: #00ff9d;
    }

    .section-name {
        font-family: 'Orbitron', sans-serif;
        font-size: 1.2rem;
        font-weight: 600;
        color: #ffffff;
        margin: 0 0 1rem 0;
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
        background: rgba(255, 255, 255, 0.05);
        border-radius: 20px;
        padding: 0.25rem 0.75rem;
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.7);
    }

    /* Preview Cards */
    .preview-cards {
        display: flex;
        gap: 0.5rem;
        margin: 1rem 0;
        justify-content: center;
    }

    .preview-card {
        width: 60px;
        height: 60px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 8px;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .preview-card img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .preview-placeholder {
        font-size: 2rem;
        opacity: 0.5;
    }

    .section-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.4);
    }

    .footer-icon {
        transition: transform 0.3s;
    }

    .section-card:hover .footer-icon {
        transform: translateY(3px);
        color: #00ff9d;
    }

    /* Error State */
    .error-state {
        text-align: center;
        padding: 4rem 2rem;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 30px;
    }

    .error-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
    }

    .error-state h2 {
        font-family: 'Orbitron', sans-serif;
        font-size: 1.8rem;
        color: #ffffff;
        margin-bottom: 0.5rem;
    }

    .error-state p {
        color: rgba(255, 255, 255, 0.5);
        margin-bottom: 2rem;
    }

    .error-btn {
        background: rgba(0, 255, 157, 0.1);
        border: 1px solid #00ff9d;
        color: #00ff9d;
        padding: 0.75rem 2rem;
        border-radius: 40px;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .error-btn:hover {
        background: #00ff9d;
        color: #000000;
        transform: translateY(-2px);
    }

    /* Responsive Global */
    @media (max-width: 768px) {
        .page-wrapper { 
            padding: 1rem; 
        }
        
        .header-content { 
            flex-direction: column; 
            text-align: center; 
            gap: 1rem; 
            padding: 1.5rem;
        }
        
        .showcase-stats { 
            justify-content: center; 
        }
        
        .showcase-title { 
            font-size: 1.8rem; 
        }
        
        .energy-icon { 
            font-size: 3rem; 
        }
        
        .preview-cards { 
            justify-content: center; 
        }
        
        .section-name {
            white-space: normal;
            word-break: break-word;
        }
    }

    @media (max-width: 480px) {
        .sections-header {
            flex-wrap: wrap;
        }
        
        .stat-item {
            font-size: 0.8rem;
        }
    }
</style>