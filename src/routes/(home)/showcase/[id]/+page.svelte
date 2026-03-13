<script lang="ts">
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';

    interface Section {
        id: number;
        name: string;
        cards: number;
        filled: number;
        slug: string;
    }

    interface Showcase {
        name: string;
        number: number;
        slots: number;
        filled: number;
        sections: Section[];
    }

    interface ShowcaseDetails {
        [key: string]: Showcase;
    }

    let showcaseDetails: ShowcaseDetails = {
        '1': {
            name: 'Pokemon Collection',
            number: 1,
            slots: 98,
            filled: 97,
            sections: [
                { id: 101, name: 'Starter Evolution', cards: 24, filled: 22, slug: 'starter-evolution' },
                { id: 102, name: 'Legendary Birds', cards: 24, filled: 24, slug: 'legendary-birds' },
                { id: 103, name: 'Psychic Types', cards: 24, filled: 24, slug: 'psychic-types' },
                { id: 104, name: 'Dragon Masters', cards: 26, filled: 27, slug: 'dragon-masters' }
            ]
        },
        '2': {
            name: 'Magic The Gathering',
            number: 2,
            slots: 98,
            filled: 97,
            sections: [
                { id: 201, name: 'Black Lotus Set', cards: 24, filled: 24, slug: 'black-lotus' },
                { id: 202, name: 'Dragons', cards: 24, filled: 22, slug: 'dragons-mtg' },
                { id: 203, name: 'Planeswalkers', cards: 24, filled: 24, slug: 'planeswalkers' },
                { id: 204, name: 'Artifacts', cards: 26, filled: 27, slug: 'artifacts' }
            ]
        }
    };

    let showcaseId: string = $page.params.id || ''; 
    
    if (!showcaseId) {
        goto('/showcase');
    }
    
    let showcase: Showcase = showcaseId ? (showcaseDetails[showcaseId] || {
        name: `Showcase ${showcaseId}`,
        number: parseInt(showcaseId) || 0,
        slots: 98,
        filled: 75,
        sections: [
            { id: 301, name: 'Section A', cards: 24, filled: 18, slug: 'section-a' },
            { id: 302, name: 'Section B', cards: 24, filled: 20, slug: 'section-b' },
            { id: 303, name: 'Section C', cards: 24, filled: 19, slug: 'section-c' },
            { id: 304, name: 'Section D', cards: 26, filled: 21, slug: 'section-d' }
        ]
    }) : {
        name: 'Showcase Not Found',
        number: 0,
        slots: 0,
        filled: 0,
        sections: []
    };

    // Fungsi navigasi dengan tipe parameter - menggunakan goto
    function goToSection(sectionSlug: string): void {
        if (showcaseId) {
            goto(`/showcase/${showcaseId}/${sectionSlug}`);
        }
    }

    function goBack(): void {
        goto('/showcase');
    }

    // Keyboard handler untuk section card dengan tipe
    function handleSectionKeydown(e: KeyboardEvent, sectionSlug: string): void {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            goToSection(sectionSlug);
        }
    }

    // Fungsi untuk generate QR code dummy
    function getQRCodeUrl(sectionName: string, sectionId: number): string {
        // Menggunakan API QR code dummy dari Google Charts
        // Ini akan generate QR code yang berbeda untuk setiap section berdasarkan nama dan id
        return `https://chart.googleapis.com/chart?chs=150x150&cht=qr&chl=${encodeURIComponent(`Showcase:${showcaseId}-Section:${sectionName}-${sectionId}`)}&choe=UTF-8`;
    }
</script>

<svelte:head>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com">
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&family=Rajdhani:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</svelte:head>

<div class="detail-page">
    <!-- Back Button -->
    <button class="back-button" onclick={goBack}>
        <span class="back-icon">←</span>
        <span>Back to Showcases</span>
    </button>

    <!-- Showcase Header - Tampilkan hanya jika showcase ada -->
    {#if showcase.name !== 'Showcase Not Found'}
        <div class="showcase-header">
            <div class="header-left">
                <div class="showcase-number-large">#{showcase.number}</div>
                <div class="showcase-title">
                    <h1>{showcase.name}</h1>
                    <p class="showcase-stats">{showcase.filled}/{showcase.slots} slots filled • {showcase.sections.length} sections</p>
                </div>
            </div>
            <div class="header-right">
                <div class="showcase-icon-large">📦</div>
            </div>
        </div>

        <!-- Sections Grid -->
        <h2 class="sections-title">Sections</h2>
        <div class="sections-grid">
            {#each showcase.sections as section (section.id)}
                <div 
                    class="section-card" 
                    onclick={() => goToSection(section.slug)}
                    onkeydown={(e) => handleSectionKeydown(e, section.slug)}
                    role="button"
                    tabindex="0"
                    aria-label={`View ${section.name} section with ${section.filled} cards`}
                >
                    <div class="section-content">
                        <div class="section-main">
                            <div class="section-header">
                                <div class="section-left">
                                    <span class="section-icon">📁</span>
                                    <h3 class="section-name">{section.name}</h3>
                                </div>
                                <div class="section-right">
                                    <span class="section-stats">{section.filled}/{section.cards}</span>
                                    <span class="section-arrow">→</span>
                                </div>
                            </div>
                            <div class="section-preview">
                                <div class="preview-bar">
                                    <div class="preview-fill" style="width: {(section.filled/section.cards)*100}%;"></div>
                                </div>
                                <span class="preview-text">{section.filled} cards available</span>
                            </div>
                        </div>
                        
                        <!-- QR Code Section -->
                        <div class="qr-section">
                            <div class="qr-container">
                                <img 
                                    src={getQRCodeUrl(section.name, section.id)} 
                                    alt={`QR Code for ${section.name}`}
                                    class="qr-code"
                                    loading="lazy"
                                />
                                <span class="qr-label">Scan to view</span>
                            </div>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    {:else}
        <!-- Tampilkan pesan error jika showcase tidak ditemukan -->
        <div class="error-message">
            <h2>Showcase Not Found</h2>
            <p>The showcase you're looking for doesn't exist.</p>
            <button class="back-button" onclick={goBack}>Return to Showcases</button>
        </div>
    {/if}
</div>

<style>
    :global(body) {
        margin: 0;
        padding: 0;
        background: #0d0d14;
        font-family: 'Rajdhani', sans-serif;
        color: #e0e0ff;
    }

    .detail-page {
        padding: 2rem;
        max-width: 1400px;
        margin: 0 auto;
    }

    .back-button {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #ffffff;
        padding: 0.6rem 1.2rem;
        border-radius: 8px;
        font-family: 'Rajdhani', sans-serif;
        font-size: 1rem;
        cursor: pointer;
        margin-bottom: 2rem;
        transition: all 0.2s ease;
    }

    .back-button:hover {
        background: rgba(0, 255, 157, 0.1);
        border-color: #00ff9d66;
        transform: translateX(-4px);
    }

    .showcase-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        padding: 1.5rem;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 16px;
    }

    .header-left {
        display: flex;
        align-items: center;
        gap: 2rem;
    }

    .showcase-number-large {
        font-family: 'Orbitron', sans-serif;
        font-size: 4rem;
        font-weight: 800;
        color: #00ff9d;
        text-shadow: 0 0 20px rgba(0, 255, 157, 0.3);
        line-height: 1;
    }

    .showcase-title h1 {
        font-family: 'Orbitron', sans-serif;
        font-size: 2rem;
        font-weight: 600;
        color: #ffffff;
        margin: 0 0 0.5rem 0;
    }

    .showcase-stats {
        font-size: 1rem;
        color: rgba(255, 255, 255, 0.6);
    }

    .showcase-icon-large {
        font-size: 4rem;
        color: #00ff9d88;
        filter: drop-shadow(0 0 20px rgba(0, 255, 157, 0.3));
    }

    .sections-title {
        font-family: 'Orbitron', sans-serif;
        font-size: 1.5rem;
        margin-bottom: 1.5rem;
        color: #ffffff;
    }

    .sections-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
    }

    .section-card {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.2s ease;
        outline: none;
    }

    .section-card:hover {
        border-color: #00ff9d66;
        background: rgba(0, 255, 157, 0.05);
        transform: translateY(-2px);
    }

    .section-card:focus-visible {
        outline: 2px solid #00ff9d;
        outline-offset: 2px;
    }

    .section-content {
        display: flex;
        padding: 1rem;
        gap: 1rem;
    }

    .section-main {
        flex: 1;
    }

    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }

    .section-left {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .section-icon {
        font-size: 1.2rem;
        color: #00ff9d;
    }

    .section-name {
        font-family: 'Orbitron', sans-serif;
        font-size: 1rem;
        font-weight: 500;
        color: #ffffff;
        margin: 0;
    }

    .section-right {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .section-stats {
        color: #00ff9d;
        font-weight: 600;
    }

    .section-arrow {
        color: rgba(255, 255, 255, 0.5);
        font-size: 1.1rem;
    }

    .section-preview {
        margin-top: 0.5rem;
    }

    .preview-bar {
        height: 4px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 2px;
        overflow: hidden;
        margin-bottom: 0.5rem;
    }

    .preview-fill {
        height: 100%;
        background: #00ff9d;
        border-radius: 2px;
    }

    .preview-text {
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.5);
    }

    /* QR Code Styles */
    .qr-section {
        display: flex;
        align-items: center;
        justify-content: center;
        border-left: 1px solid rgba(255, 255, 255, 0.1);
        padding-left: 1rem;
    }

    .qr-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
    }

    .qr-code {
        width: 60px;
        height: 60px;
        border-radius: 4px;
        background: white;
        padding: 4px;
        transition: transform 0.2s ease;
    }

    .section-card:hover .qr-code {
        transform: scale(1.05);
    }

    .qr-label {
        font-size: 0.7rem;
        color: rgba(255, 255, 255, 0.4);
    }

    /* Error Message */
    .error-message {
        text-align: center;
        padding: 4rem 2rem;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 16px;
    }

    .error-message h2 {
        font-family: 'Orbitron', sans-serif;
        font-size: 2rem;
        color: #ff4444;
        margin-bottom: 1rem;
    }

    .error-message p {
        font-size: 1.1rem;
        color: rgba(255, 255, 255, 0.6);
        margin-bottom: 2rem;
    }

    @media (max-width: 768px) {
        .sections-grid {
            grid-template-columns: 1fr;
        }
        
        .section-content {
            flex-direction: column;
        }
        
        .qr-section {
            border-left: none;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            padding-left: 0;
            padding-top: 1rem;
        }
    }
</style>