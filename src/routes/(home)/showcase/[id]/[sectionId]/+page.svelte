<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    
    let { data } = $props();
    let showcase = data?.showcase;
    let section = data?.section;
    let cards = data?.cards || [];
    
    let selectedCard = $state<any>(null);
    let hoveredCard = $state<number | null>(null);
    let sortBy = $state<'name' | 'price' | 'stock'>('name');
    let searchQuery = $state('');
    let modalEntering = $state(false);
    let qrCodeUrl = $state<string>('');
    
    let showcaseId = $page.params.id;
    
    let filteredCards = $derived(() => {
        let result = [...cards];
        if (searchQuery) {
            result = result.filter(card => 
                card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                card.category.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        result.sort((a, b) => {
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            if (sortBy === 'price') return (a.prices.idr?.amount || 0) - (b.prices.idr?.amount || 0);
            if (sortBy === 'stock') return b.stock - a.stock;
            return 0;
        });
        return result;
    });
    
    function goBack() {
        goto(`/showcase/${showcaseId}`);
    }
    
    function generateQRForCard(card: any) {
        if (!card) return;
        const baseUrl = window.location.origin;
        const url = card.qrCustomUrl || `${baseUrl}/showcase/${showcaseId}/${section?.id}?card=${card.id}`;
        // Menggunakan API QR code eksternal (gratis, tanpa install library)
        qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&margin=10&color=210,175,100&bgcolor=255,255,255&data=${encodeURIComponent(url)}`;
        console.log('QR URL generated:', qrCodeUrl);
    }
    
    function viewCardDetail(card: any) {
        selectedCard = card;
        modalEntering = true;
        document.body.style.overflow = 'hidden';
        generateQRForCard(card);
        setTimeout(() => modalEntering = false, 100);
    }
    
    function closeDetail() {
        selectedCard = null;
        qrCodeUrl = '';
        document.body.style.overflow = '';
    }
    
    function formatPriceIdr(price: number) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(price);
    }
    
    function formatPriceSgd(price: number) {
        return new Intl.NumberFormat('en-SG', {
            style: 'currency',
            currency: 'SGD',
            minimumFractionDigits: 2
        }).format(price);
    }
    
    function handleOverlayKeydown(e: KeyboardEvent) {
        if (e.key === 'Escape') closeDetail();
    }

    function getStockStatus(stock: number) {
        if (stock === 0) return { label: 'Sold Out', class: 'sold-out' };
        if (stock < 3) return { label: `Only ${stock} Left`, class: 'critical' };
        if (stock < 6) return { label: `${stock} Available`, class: 'low' };
        return { label: `${stock} In Stock`, class: 'good' };
    }

    function copyLinkToClipboard() {
        if (!selectedCard) return;
        const baseUrl = window.location.origin;
        const url = selectedCard.qrCustomUrl || `${baseUrl}/showcase/${showcaseId}/${section?.id}?card=${selectedCard.id}`;
        navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
    }
</script>

<svelte:head>
    <title>{section?.name} — {showcase?.name}</title>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Cinzel:wght@400;500;600;700&family=Lato:wght@300;400;700&display=swap" rel="stylesheet">
</svelte:head>

<div class="cosmos">
    <!-- Ambient orbs -->
    <div class="orb orb-1"></div>
    <div class="orb orb-2"></div>
    <div class="orb orb-3"></div>
    <div class="star-field">
        {#each Array(30) as _, i}
            <div class="star" style="--x:{Math.random()*100}%;--y:{Math.random()*100}%;--d:{0.5+Math.random()*2}s;--s:{1+Math.random()*2}px"></div>
        {/each}
    </div>

    <div class="page-wrapper">

        <!-- Back -->
        <button class="back-button" onclick={goBack}>
            <span class="back-arrow">←</span>
            <span>Return to {showcase?.name}</span>
        </button>

        <!-- Hero Header -->
        <header class="hero-header">
            <div class="hero-ornament top-left"></div>
            <div class="hero-ornament top-right"></div>
            <div class="hero-ornament bottom-left"></div>
            <div class="hero-ornament bottom-right"></div>
            <p class="hero-eyebrow">
                <span class="eyebrow-line"></span>
                {showcase?.name}
                <span class="eyebrow-line"></span>
            </p>
            <h1 class="hero-title">{section?.name}</h1>
            <div class="hero-divider">
                <span class="divider-gem">◆</span>
            </div>
            <p class="hero-count">{filteredCards().length} Rare Treasures</p>
        </header>

        <!-- Controls -->
        <div class="controls">
            <div class="search-field">
                <span class="search-icon-el">⌕</span>
                <input
                    type="text"
                    placeholder="Search the collection…"
                    bind:value={searchQuery}
                    class="search-input"
                />
                {#if searchQuery}
                    <button class="clear-btn" onclick={() => searchQuery = ''}>✕</button>
                {/if}
            </div>
            <div class="sort-field">
                <span class="sort-label">Order by</span>
                <select bind:value={sortBy} class="sort-select">
                    <option value="name">Name</option>
                    <option value="price">Price</option>
                    <option value="stock">Availability</option>
                </select>
            </div>
        </div>

        <!-- Grid -->
        {#if filteredCards().length === 0}
            <div class="empty-state">
                <div class="empty-glyph">✦</div>
                <p class="empty-text">No cards match your search</p>
                <button class="empty-action" onclick={() => searchQuery = ''}>Clear Filter</button>
            </div>
        {:else}
            <div class="cards-grid">
                {#each filteredCards() as card, i}
                    {@const stock = getStockStatus(card.stock)}
                    <button
                        class="card-tile"
                        style="--delay:{i * 0.04}s"
                        onmouseenter={() => hoveredCard = card.id}
                        onmouseleave={() => hoveredCard = null}
                        onclick={() => viewCardDetail(card)}
                    >
                        <div class="tile-shimmer"></div>
                        <div class="tile-border-glow" class:active={hoveredCard === card.id}></div>

                        <div class="tile-image-wrap">
                            {#if card.imageUrl}
                                <img src={card.imageUrl} alt={card.name} class="tile-image" />
                            {:else}
                                <div class="tile-no-image">✦</div>
                            {/if}
                            <div class="tile-stock-badge {stock.class}">{stock.label}</div>
                        </div>

                        <div class="tile-body">
                            <div class="tile-cats">
                                <span class="tile-cat main">{card.category}</span>
                                <span class="tile-cat sub">{card.subCategory}</span>
                            </div>
                            <h3 class="tile-name">{card.name}</h3>
                            <div class="tile-prices">
                                <span class="tile-price idr">Rp {(card.prices.idr?.amount || 0).toLocaleString('id-ID')}</span>
                                <span class="tile-price-sep">·</span>
                                <span class="tile-price sgd">SGD {(card.prices.sgd?.amount || 0).toLocaleString()}</span>
                            </div>
                        </div>

                        <div class="tile-cta">View Card →</div>
                    </button>
                {/each}
            </div>
        {/if}
    </div>

    <!-- MODAL -->
    {#if selectedCard}
        {@const stock = getStockStatus(selectedCard.stock)}
        <div
            class="modal-veil"
            onclick={closeDetail}
            onkeydown={handleOverlayKeydown}
            role="button"
            tabindex="0"
        >
            <div class="modal-stage" onclick={(e) => e.stopPropagation()}>
                <!-- Close -->
                <button class="modal-x" onclick={closeDetail} aria-label="Close">✕</button>

                <!-- Top decorative strip -->
                <div class="modal-crown">
                    <span class="crown-line"></span>
                    <span class="crown-gem">◆</span>
                    <span class="crown-text">COLLECTOR'S CARD</span>
                    <span class="crown-gem">◆</span>
                    <span class="crown-line"></span>
                </div>

                <div class="modal-body">
                    <!-- Left: Image showcase -->
                    <div class="modal-showcase">
                        <div class="showcase-frame">
                            <div class="frame-corner tl"></div>
                            <div class="frame-corner tr"></div>
                            <div class="frame-corner bl"></div>
                            <div class="frame-corner br"></div>
                            <div class="showcase-glow-bg"></div>
                            {#if selectedCard.imageUrl}
                                <img
                                    src={selectedCard.imageUrl}
                                    alt={selectedCard.name}
                                    class="showcase-img"
                                />
                            {:else}
                                <div class="showcase-fallback">✦</div>
                            {/if}
                        </div>

                        <!-- Stock ribbon -->
                        <div class="stock-ribbon {stock.class}">
                            <span class="stock-dot"></span>
                            <span>{stock.label}</span>
                        </div>

                        <!-- Video link -->
                        {#if selectedCard.videoUrl}
                            <a
                                href={selectedCard.videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                class="video-link"
                            >
                                <span class="video-icon">▶</span>
                                Watch Showcase Video
                            </a>
                        {/if}
                    </div>

                    <!-- Right: Details -->
                    <div class="modal-details">
                        <div class="detail-cats">
                            <span class="detail-cat main">{selectedCard.category}</span>
                            <span class="detail-cat sub">{selectedCard.subCategory}</span>
                        </div>

                        <h2 class="detail-title">{selectedCard.name}</h2>

                        <div class="detail-divider">
                            <span class="detail-line"></span>
                            <span class="detail-gem">◈</span>
                            <span class="detail-line"></span>
                        </div>

                        <!-- Meta info -->
                        <div class="detail-meta">
                            <div class="meta-row">
                                <span class="meta-key">Location</span>
                                <span class="meta-val">{selectedCard.location}</span>
                            </div>
                            <div class="meta-row">
                                <span class="meta-key">Section</span>
                                <span class="meta-val">{section?.name}</span>
                            </div>
                            <div class="meta-row">
                                <span class="meta-key">Collection</span>
                                <span class="meta-val">{showcase?.name}</span>
                            </div>
                        </div>

                        <!-- QR CODE SECTION -->
                        <div class="qr-section">
                            <div class="qr-header">
                                <span class="qr-icon">◈</span>
                                <span class="qr-label">SCAN QR</span>
                                <span class="qr-icon">◈</span>
                            </div>
                            <div class="qr-container">
                                {#if qrCodeUrl}
                                    <img src={qrCodeUrl} alt="QR Code" class="qr-image" />
                                    <div class="qr-link">
                                        <span class="qr-url">
                                            {selectedCard?.qrCustomUrl ? 'Custom Link' : 'Card Page'}
                                        </span>
                                        <button class="qr-copy" onclick={copyLinkToClipboard}>Copy Link</button>
                                    </div>
                                {:else}
                                    <div class="qr-loading">
                                        <div class="qr-spinner"></div>
                                        <span>generating QR...</span>
                                    </div>
                                {/if}
                            </div>
                        </div>

                        <!-- Price display -->
                        <div class="price-panel">
                            <p class="price-panel-label">
                                <span class="panel-line"></span>
                                PRICING
                                <span class="panel-line"></span>
                            </p>

                            <div class="price-twins">
                                <div class="price-twin idr">
                                    <div class="twin-flag">🇮🇩</div>
                                    <div class="twin-country">Indonesia</div>
                                    <div class="twin-amount">{formatPriceIdr(selectedCard.prices.idr?.amount || 0)}</div>
                                    {#if selectedCard.prices.idr?.priceNote}
                                        <div class="twin-note">{selectedCard.prices.idr.priceNote}</div>
                                    {/if}
                                </div>

                                <div class="price-divider-v">
                                    <span></span>
                                    <span class="pdv-gem">◆</span>
                                    <span></span>
                                </div>

                                <div class="price-twin sgd">
                                    <div class="twin-flag">🇸🇬</div>
                                    <div class="twin-country">Singapore</div>
                                    <div class="twin-amount">{formatPriceSgd(selectedCard.prices.sgd?.amount || 0)}</div>
                                    {#if selectedCard.prices.sgd?.priceNote}
                                        <div class="twin-note">{selectedCard.prices.sgd.priceNote}</div>
                                    {/if}
                                </div>
                            </div>
                        </div>

                        <!-- Bottom seal -->
                        <div class="modal-seal">
                            <span class="seal-line"></span>
                            <span class="seal-text">✦ AUTHENTICATED COLLECTION ✦</span>
                            <span class="seal-line"></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    /* ── RESET & BASE ── */
    :global(body) {
        margin: 0;
        padding: 0;
        background: #080810;
        color: #e8e0d0;
        font-family: 'Lato', sans-serif;
        -webkit-font-smoothing: antialiased;
    }

    /* ── COSMOS BACKGROUND ── */
    .cosmos {
        min-height: 100vh;
        position: relative;
        overflow-x: hidden;
    }

    .orb {
        position: fixed;
        border-radius: 50%;
        filter: blur(100px);
        pointer-events: none;
        z-index: 0;
    }
    .orb-1 {
        width: 600px; height: 600px;
        background: radial-gradient(circle, rgba(180,140,60,0.12) 0%, transparent 70%);
        top: -200px; left: -150px;
        animation: driftOrb 20s ease-in-out infinite alternate;
    }
    .orb-2 {
        width: 500px; height: 500px;
        background: radial-gradient(circle, rgba(100,60,180,0.1) 0%, transparent 70%);
        bottom: -100px; right: -150px;
        animation: driftOrb 25s ease-in-out infinite alternate-reverse;
    }
    .orb-3 {
        width: 400px; height: 400px;
        background: radial-gradient(circle, rgba(60,120,180,0.08) 0%, transparent 70%);
        top: 50%; left: 50%;
        transform: translate(-50%,-50%);
        animation: driftOrb 30s ease-in-out infinite alternate;
    }

    @keyframes driftOrb {
        from { transform: translate(0,0); }
        to   { transform: translate(40px, 30px); }
    }

    .star-field {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 0;
    }

    .star {
        position: absolute;
        left: var(--x);
        top: var(--y);
        width: var(--s);
        height: var(--s);
        background: rgba(255,245,220,0.6);
        border-radius: 50%;
        animation: twinkle var(--d) ease-in-out infinite alternate;
    }

    @keyframes twinkle {
        from { opacity: 0.2; }
        to   { opacity: 1; }
    }

    /* ── LAYOUT ── */
    .page-wrapper {
        position: relative;
        z-index: 1;
        max-width: 1700px;
        margin: 0 auto;
        padding: 2rem 2.5rem 5rem;
    }

    /* ── BACK BUTTON ── */
    .back-button {
        display: inline-flex;
        align-items: center;
        gap: 0.6rem;
        background: transparent;
        border: 1px solid rgba(210,175,100,0.3);
        color: rgba(210,175,100,0.8);
        font-family: 'Cinzel', serif;
        font-size: 0.75rem;
        letter-spacing: 1px;
        padding: 0.5rem 1.25rem;
        border-radius: 2px;
        cursor: pointer;
        margin-bottom: 3rem;
        transition: all 0.3s;
    }

    .back-button:hover {
        background: rgba(210,175,100,0.08);
        border-color: rgba(210,175,100,0.7);
        color: #d4b060;
        transform: translateX(-4px);
    }

    .back-arrow {
        font-size: 1rem;
    }

    /* ── HERO HEADER ── */
    .hero-header {
        position: relative;
        text-align: center;
        padding: 3.5rem 2rem;
        margin-bottom: 3rem;
        border: 1px solid rgba(210,175,100,0.15);
        background: radial-gradient(ellipse at center top, rgba(210,175,100,0.06) 0%, transparent 70%);
    }

    .hero-ornament {
        position: absolute;
        width: 24px;
        height: 24px;
        border-color: rgba(210,175,100,0.5);
        border-style: solid;
    }
    .hero-ornament.top-left  { top: 0; left: 0; border-width: 2px 0 0 2px; }
    .hero-ornament.top-right { top: 0; right: 0; border-width: 2px 2px 0 0; }
    .hero-ornament.bottom-left  { bottom: 0; left: 0; border-width: 0 0 2px 2px; }
    .hero-ornament.bottom-right { bottom: 0; right: 0; border-width: 0 2px 2px 0; }

    .hero-eyebrow {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        font-family: 'Cinzel', serif;
        font-size: 0.7rem;
        letter-spacing: 3px;
        color: rgba(210,175,100,0.6);
        margin: 0 0 1.25rem;
        text-transform: uppercase;
    }

    .eyebrow-line {
        display: inline-block;
        width: 60px;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(210,175,100,0.5));
    }

    .eyebrow-line:last-child {
        background: linear-gradient(270deg, transparent, rgba(210,175,100,0.5));
    }

    .hero-title {
        font-family: 'Cinzel Decorative', serif;
        font-size: clamp(2rem, 5vw, 3.5rem);
        font-weight: 700;
        color: #f0e0b0;
        margin: 0 0 1.25rem;
        letter-spacing: 2px;
        text-shadow:
            0 0 60px rgba(210,175,100,0.3),
            0 0 120px rgba(210,175,100,0.1);
    }

    .hero-divider {
        margin: 0 auto 1rem;
        color: rgba(210,175,100,0.6);
        font-size: 0.75rem;
        letter-spacing: 6px;
    }

    .hero-count {
        font-family: 'Cinzel', serif;
        font-size: 0.8rem;
        letter-spacing: 2px;
        color: rgba(255,255,255,0.4);
        margin: 0;
    }

    /* ── CONTROLS ── */
    .controls {
        display: flex;
        gap: 1rem;
        margin-bottom: 2.5rem;
        flex-wrap: wrap;
    }

    .search-field {
        position: relative;
        flex: 1;
        min-width: 220px;
    }

    .search-icon-el {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: rgba(210,175,100,0.4);
        font-size: 1.2rem;
        pointer-events: none;
    }

    .search-input {
        width: 100%;
        padding: 0.75rem 1rem 0.75rem 2.75rem;
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(210,175,100,0.2);
        color: #e8e0d0;
        font-family: 'Lato', sans-serif;
        font-size: 0.9rem;
        border-radius: 2px;
        transition: all 0.3s;
        box-sizing: border-box;
    }

    .search-input:focus {
        outline: none;
        border-color: rgba(210,175,100,0.6);
        background: rgba(210,175,100,0.04);
        box-shadow: 0 0 20px rgba(210,175,100,0.08);
    }

    .search-input::placeholder { color: rgba(255,255,255,0.25); }

    .clear-btn {
        position: absolute;
        right: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: rgba(255,255,255,0.3);
        cursor: pointer;
        font-size: 0.85rem;
        padding: 0.25rem;
    }

    .clear-btn:hover { color: rgba(210,175,100,0.8); }

    .sort-field {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        background: rgba(255,255,255,0.02);
        border: 1px solid rgba(210,175,100,0.2);
        padding: 0.5rem 1.25rem;
        border-radius: 2px;
    }

    .sort-label {
        font-family: 'Cinzel', serif;
        font-size: 0.65rem;
        letter-spacing: 1.5px;
        color: rgba(210,175,100,0.5);
        text-transform: uppercase;
        white-space: nowrap;
    }

    .sort-select {
        background: transparent;
        border: none;
        color: #d4b060;
        font-family: 'Cinzel', serif;
        font-size: 0.75rem;
        cursor: pointer;
        padding: 0.25rem;
    }

    .sort-select:focus { outline: none; }
    .sort-select option { background: #10101a; color: #e8e0d0; }

    /* ── CARDS GRID ── */
    .cards-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 1.5rem;
    }

    @media (max-width: 1600px) { .cards-grid { grid-template-columns: repeat(4, 1fr); } }
    @media (max-width: 1280px) { .cards-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 900px)  { .cards-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 550px)  { .cards-grid { grid-template-columns: 1fr; } }

    /* ── CARD TILE ── */
    .card-tile {
        position: relative;
        background: linear-gradient(145deg, rgba(20,18,30,0.95), rgba(12,10,20,0.98));
        border: 1px solid rgba(210,175,100,0.12);
        border-radius: 4px;
        overflow: hidden;
        cursor: pointer;
        text-align: left;
        padding: 0;
        transition: transform 0.4s cubic-bezier(0.4,0,0.2,1), border-color 0.3s, box-shadow 0.4s;
        animation: riseIn 0.5s ease both;
        animation-delay: var(--delay);
    }

    @keyframes riseIn {
        from { opacity: 0; transform: translateY(24px); }
        to   { opacity: 1; transform: translateY(0); }
    }

    .card-tile:hover {
        transform: translateY(-8px) scale(1.01);
        border-color: rgba(210,175,100,0.5);
        box-shadow:
            0 20px 50px rgba(0,0,0,0.6),
            0 0 40px rgba(210,175,100,0.1),
            inset 0 0 30px rgba(210,175,100,0.03);
    }

    .tile-shimmer {
        position: absolute;
        inset: 0;
        background: linear-gradient(120deg, transparent 30%, rgba(210,175,100,0.06) 50%, transparent 70%);
        transform: translateX(-100%);
        transition: transform 0.6s;
        z-index: 1;
        pointer-events: none;
    }

    .card-tile:hover .tile-shimmer { transform: translateX(100%); }

    .tile-border-glow {
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 2px;
        background: linear-gradient(90deg, transparent, #d4b060, transparent);
        opacity: 0;
        transition: opacity 0.3s;
        z-index: 2;
    }

    .tile-border-glow.active { opacity: 1; }

    .tile-image-wrap {
        position: relative;
        aspect-ratio: 3/4;
        overflow: hidden;
        background: linear-gradient(135deg, rgba(8,8,16,0.8), rgba(20,15,35,0.8));
    }

    .tile-image {
        width: 100%;
        height: 100%;
        object-fit: contain;
        padding: 1rem;
        box-sizing: border-box;
        transition: transform 0.5s cubic-bezier(0.4,0,0.2,1);
    }

    .card-tile:hover .tile-image { transform: scale(1.06); }

    .tile-no-image {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2.5rem;
        color: rgba(210,175,100,0.2);
    }

    /* Stock badges */
    .tile-stock-badge {
        position: absolute;
        top: 10px;
        right: 10px;
        font-family: 'Cinzel', serif;
        font-size: 0.6rem;
        letter-spacing: 0.5px;
        padding: 0.25rem 0.6rem;
        border-radius: 2px;
        backdrop-filter: blur(6px);
        z-index: 3;
    }

    .tile-stock-badge.good     { background: rgba(0,0,0,0.6); border: 1px solid rgba(100,200,120,0.5); color: #80d090; }
    .tile-stock-badge.low      { background: rgba(0,0,0,0.6); border: 1px solid rgba(210,175,60,0.5); color: #d4b060; }
    .tile-stock-badge.critical { background: rgba(0,0,0,0.6); border: 1px solid rgba(220,100,60,0.5); color: #e06040; }
    .tile-stock-badge.sold-out { background: rgba(0,0,0,0.7); border: 1px solid rgba(120,100,100,0.4); color: rgba(255,255,255,0.3); }

    /* Tile body */
    .tile-body {
        padding: 1rem 1rem 0.75rem;
        position: relative;
        z-index: 2;
    }

    .tile-cats {
        display: flex;
        gap: 0.4rem;
        margin-bottom: 0.5rem;
        flex-wrap: wrap;
    }

    .tile-cat {
        font-family: 'Cinzel', serif;
        font-size: 0.55rem;
        letter-spacing: 0.5px;
        padding: 0.15rem 0.5rem;
        border-radius: 1px;
    }

    .tile-cat.main {
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.1);
        color: rgba(255,255,255,0.6);
    }

    .tile-cat.sub {
        background: rgba(210,175,100,0.08);
        border: 1px solid rgba(210,175,100,0.25);
        color: rgba(210,175,100,0.8);
    }

    .tile-name {
        font-family: 'Cinzel', serif;
        font-size: 0.95rem;
        font-weight: 600;
        color: #f0e0b0;
        margin: 0 0 0.6rem;
        line-height: 1.3;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .tile-prices {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.75rem;
        padding-top: 0.6rem;
        border-top: 1px solid rgba(255,255,255,0.05);
    }

    .tile-price.idr { color: #80d090; font-weight: 700; }
    .tile-price.sgd { color: #d4b060; font-weight: 700; }
    .tile-price-sep { color: rgba(255,255,255,0.2); }

    .tile-cta {
        background: linear-gradient(90deg, rgba(210,175,100,0.08), rgba(210,175,100,0.15));
        border-top: 1px solid rgba(210,175,100,0.2);
        padding: 0.6rem 1rem;
        font-family: 'Cinzel', serif;
        font-size: 0.65rem;
        letter-spacing: 1px;
        color: rgba(210,175,100,0.7);
        text-align: center;
        transform: translateY(0);
        transition: all 0.3s;
        position: relative;
        z-index: 2;
    }

    .card-tile:hover .tile-cta {
        background: linear-gradient(90deg, rgba(210,175,100,0.15), rgba(210,175,100,0.25));
        color: #d4b060;
    }

    /* ── EMPTY STATE ── */
    .empty-state {
        text-align: center;
        padding: 6rem 2rem;
        border: 1px solid rgba(210,175,100,0.1);
    }

    .empty-glyph {
        font-size: 3rem;
        color: rgba(210,175,100,0.2);
        margin-bottom: 1rem;
    }

    .empty-text {
        font-family: 'Cinzel', serif;
        color: rgba(255,255,255,0.4);
        margin-bottom: 1.5rem;
        font-size: 0.9rem;
        letter-spacing: 1px;
    }

    .empty-action {
        font-family: 'Cinzel', serif;
        font-size: 0.7rem;
        letter-spacing: 1px;
        padding: 0.6rem 1.5rem;
        background: transparent;
        border: 1px solid rgba(210,175,100,0.4);
        color: rgba(210,175,100,0.8);
        cursor: pointer;
        transition: all 0.3s;
        border-radius: 2px;
    }

    .empty-action:hover {
        background: rgba(210,175,100,0.1);
        color: #d4b060;
    }

    /* ══════════════════════════════════════
       MODAL — THE GRAND SHOWCASE
    ══════════════════════════════════════ */
    .modal-veil {
        position: fixed;
        inset: 0;
        background: rgba(4,4,10,0.96);
        backdrop-filter: blur(20px);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: veilIn 0.3s ease;
        padding: 1rem;
        box-sizing: border-box;
    }

    @keyframes veilIn {
        from { opacity: 0; }
        to   { opacity: 1; }
    }

    .modal-stage {
        position: relative;
        background: linear-gradient(145deg, #0e0c18, #0a0814, #0e0c18);
        border: 1px solid rgba(210,175,100,0.3);
        max-width: 1000px;
        width: 100%;
        max-height: 92vh;
        overflow-y: auto;
        animation: stageIn 0.4s cubic-bezier(0.4,0,0.2,1);
        box-shadow:
            0 0 0 1px rgba(210,175,100,0.08),
            0 40px 120px rgba(0,0,0,0.8),
            0 0 80px rgba(210,175,100,0.06),
            inset 0 0 100px rgba(210,175,100,0.02);
    }

    .modal-stage::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, #d4b060, rgba(210,175,100,0.6), #d4b060, transparent);
    }

    .modal-stage::after {
        content: '';
        position: absolute;
        bottom: 0; left: 0; right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(210,175,100,0.3), transparent);
    }

    @keyframes stageIn {
        from { opacity: 0; transform: scale(0.94) translateY(20px); }
        to   { opacity: 1; transform: scale(1) translateY(0); }
    }

    .modal-stage::-webkit-scrollbar { width: 4px; }
    .modal-stage::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); }
    .modal-stage::-webkit-scrollbar-thumb { background: rgba(210,175,100,0.3); border-radius: 2px; }

    /* Close button */
    .modal-x {
        position: absolute;
        top: 1rem; right: 1rem;
        width: 36px; height: 36px;
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(210,175,100,0.2);
        color: rgba(210,175,100,0.6);
        font-size: 0.85rem;
        border-radius: 2px;
        cursor: pointer;
        z-index: 10;
        transition: all 0.25s;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .modal-x:hover {
        background: rgba(210,175,100,0.12);
        border-color: rgba(210,175,100,0.6);
        color: #d4b060;
        transform: scale(1.05);
    }

    /* Crown / top strip */
    .modal-crown {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        padding: 1.25rem 2rem;
        border-bottom: 1px solid rgba(210,175,100,0.1);
        background: linear-gradient(90deg, transparent, rgba(210,175,100,0.04), transparent);
    }

    .crown-line {
        flex: 1;
        max-width: 120px;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(210,175,100,0.4));
    }

    .crown-line:last-child {
        background: linear-gradient(270deg, transparent, rgba(210,175,100,0.4));
    }

    .crown-gem {
        color: rgba(210,175,100,0.5);
        font-size: 0.5rem;
    }

    .crown-text {
        font-family: 'Cinzel', serif;
        font-size: 0.65rem;
        letter-spacing: 4px;
        color: rgba(210,175,100,0.5);
    }

    /* Modal body layout */
    .modal-body {
        display: grid;
        grid-template-columns: 1fr 1.2fr;
        gap: 0;
    }

    /* ── SHOWCASE (image side) ── */
    .modal-showcase {
        padding: 2.5rem 2rem;
        border-right: 1px solid rgba(210,175,100,0.1);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.25rem;
        background: linear-gradient(145deg, rgba(210,175,100,0.02), transparent);
    }

    .showcase-frame {
        position: relative;
        width: 100%;
        aspect-ratio: 3/4;
        max-width: 280px;
        background: radial-gradient(ellipse at center, rgba(210,175,100,0.06) 0%, rgba(0,0,0,0.4) 70%);
    }

    /* Corner brackets */
    .frame-corner {
        position: absolute;
        width: 20px; height: 20px;
        border-color: rgba(210,175,100,0.6);
        border-style: solid;
        z-index: 2;
    }

    .frame-corner.tl { top: -1px; left: -1px; border-width: 2px 0 0 2px; }
    .frame-corner.tr { top: -1px; right: -1px; border-width: 2px 2px 0 0; }
    .frame-corner.bl { bottom: -1px; left: -1px; border-width: 0 0 2px 2px; }
    .frame-corner.br { bottom: -1px; right: -1px; border-width: 0 2px 2px 0; }

    .showcase-glow-bg {
        position: absolute;
        inset: 0;
        background: radial-gradient(ellipse at 50% 30%, rgba(210,175,100,0.08) 0%, transparent 70%);
        pointer-events: none;
    }

    .showcase-img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        padding: 1rem;
        box-sizing: border-box;
        position: relative;
        z-index: 1;
        filter: drop-shadow(0 8px 30px rgba(0,0,0,0.6));
        animation: floatImg 6s ease-in-out infinite;
    }

    @keyframes floatImg {
        0%, 100% { transform: translateY(0px); }
        50%       { transform: translateY(-8px); }
    }

    .showcase-fallback {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 3rem;
        color: rgba(210,175,100,0.2);
    }

    /* Stock ribbon */
    .stock-ribbon {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        font-family: 'Cinzel', serif;
        font-size: 0.65rem;
        letter-spacing: 1px;
        padding: 0.4rem 1rem;
        border-radius: 2px;
    }

    .stock-ribbon.good     { background: rgba(0,0,0,0.6); border: 1px solid rgba(100,200,120,0.4); color: #80d090; }
    .stock-ribbon.low      { background: rgba(0,0,0,0.6); border: 1px solid rgba(210,175,60,0.4); color: #d4b060; }
    .stock-ribbon.critical { background: rgba(0,0,0,0.6); border: 1px solid rgba(220,100,60,0.4); color: #e06040; }
    .stock-ribbon.sold-out { background: rgba(0,0,0,0.6); border: 1px solid rgba(120,100,100,0.3); color: rgba(255,255,255,0.3); }

    .stock-dot {
        width: 6px; height: 6px;
        border-radius: 50%;
        background: currentColor;
        animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50%       { opacity: 0.4; transform: scale(0.7); }
    }

    /* Video link */
    .video-link {
        display: inline-flex;
        align-items: center;
        gap: 0.6rem;
        font-family: 'Cinzel', serif;
        font-size: 0.65rem;
        letter-spacing: 1px;
        color: rgba(210,175,100,0.6);
        border: 1px solid rgba(210,175,100,0.25);
        padding: 0.4rem 1rem;
        border-radius: 2px;
        text-decoration: none;
        transition: all 0.3s;
    }

    .video-link:hover {
        background: rgba(210,175,100,0.08);
        border-color: rgba(210,175,100,0.5);
        color: #d4b060;
    }

    .video-icon {
        font-size: 0.7rem;
    }

    /* ── DETAILS SIDE ── */
    .modal-details {
        padding: 2.5rem 2.5rem 2rem;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
    }

    .detail-cats {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .detail-cat {
        font-family: 'Cinzel', serif;
        font-size: 0.6rem;
        letter-spacing: 1px;
        padding: 0.3rem 0.8rem;
        border-radius: 2px;
    }

    .detail-cat.main {
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.12);
        color: rgba(255,255,255,0.55);
    }

    .detail-cat.sub {
        background: rgba(210,175,100,0.08);
        border: 1px solid rgba(210,175,100,0.3);
        color: rgba(210,175,100,0.85);
    }

    .detail-title {
        font-family: 'Cinzel Decorative', serif;
        font-size: clamp(1.4rem, 3vw, 2rem);
        font-weight: 700;
        color: #f0e0b0;
        margin: 0;
        line-height: 1.25;
        letter-spacing: 1px;
    }

    /* Ornamental divider */
    .detail-divider {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .detail-line {
        flex: 1;
        height: 1px;
        background: linear-gradient(90deg, rgba(210,175,100,0.4), transparent);
    }

    .detail-line:last-child {
        background: linear-gradient(270deg, rgba(210,175,100,0.4), transparent);
    }

    .detail-gem {
        color: rgba(210,175,100,0.5);
        font-size: 0.8rem;
    }

    /* Meta info */
    .detail-meta {
        background: rgba(255,255,255,0.02);
        border: 1px solid rgba(210,175,100,0.1);
        padding: 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .meta-row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 1rem;
    }

    .meta-key {
        font-family: 'Cinzel', serif;
        font-size: 0.6rem;
        letter-spacing: 1.5px;
        color: rgba(210,175,100,0.45);
        text-transform: uppercase;
        white-space: nowrap;
    }

    .meta-val {
        font-size: 0.9rem;
        font-weight: 700;
        color: rgba(255,255,255,0.8);
        text-align: right;
    }

    /* ── QR CODE SECTION ── */
    .qr-section {
        background: rgba(210, 175, 100, 0.04);
        border: 1px solid rgba(210, 175, 100, 0.15);
        padding: 0.75rem;
        border-radius: 2px;
    }
    
    .qr-header {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
    }
    
    .qr-icon {
        font-size: 0.5rem;
        color: rgba(210, 175, 100, 0.4);
    }
    
    .qr-label {
        font-family: 'Cinzel', serif;
        font-size: 0.5rem;
        letter-spacing: 2px;
        color: rgba(210, 175, 100, 0.5);
    }
    
    .qr-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
    }
    
    .qr-image {
        width: 90px;
        height: 90px;
        background: white;
        padding: 4px;
        border-radius: 4px;
    }
    
    .qr-link {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.55rem;
    }
    
    .qr-url {
        color: rgba(210, 175, 100, 0.5);
        font-family: monospace;
        font-size: 0.5rem;
    }
    
    .qr-copy {
        background: transparent;
        border: 1px solid rgba(210, 175, 100, 0.3);
        color: rgba(210, 175, 100, 0.6);
        padding: 0.15rem 0.5rem;
        font-size: 0.5rem;
        cursor: pointer;
        transition: all 0.2s;
        border-radius: 2px;
    }
    
    .qr-copy:hover {
        background: rgba(210, 175, 100, 0.1);
        border-color: rgba(210, 175, 100, 0.6);
        color: #d4b060;
    }
    
    .qr-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.6rem;
        color: rgba(210, 175, 100, 0.3);
        padding: 0.5rem;
    }
    
    .qr-spinner {
        width: 20px;
        height: 20px;
        border: 2px solid rgba(210, 175, 100, 0.2);
        border-top-color: #d4b060;
        border-radius: 50%;
        animation: qrSpin 0.8s linear infinite;
    }
    
    @keyframes qrSpin {
        to { transform: rotate(360deg); }
    }

    /* ── PRICE PANEL ── */
    .price-panel {
        background: linear-gradient(135deg, rgba(210,175,100,0.04), rgba(0,0,0,0.3));
        border: 1px solid rgba(210,175,100,0.2);
        padding: 1.5rem;
        position: relative;
        overflow: hidden;
    }

    .price-panel::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(210,175,100,0.5), transparent);
    }

    .price-panel-label {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-family: 'Cinzel', serif;
        font-size: 0.6rem;
        letter-spacing: 3px;
        color: rgba(210,175,100,0.5);
        margin: 0 0 1.25rem;
    }

    .panel-line {
        flex: 1;
        height: 1px;
        background: rgba(210,175,100,0.2);
    }

    .price-twins {
        display: flex;
        align-items: stretch;
        gap: 0;
    }

    .price-twin {
        flex: 1;
        text-align: center;
        padding: 1rem;
    }

    .twin-flag {
        font-size: 1.75rem;
        margin-bottom: 0.4rem;
        display: block;
        filter: drop-shadow(0 2px 6px rgba(0,0,0,0.5));
    }

    .twin-country {
        font-family: 'Cinzel', serif;
        font-size: 0.55rem;
        letter-spacing: 1.5px;
        color: rgba(255,255,255,0.35);
        text-transform: uppercase;
        margin-bottom: 0.6rem;
    }

    .twin-amount {
        font-family: 'Cinzel Decorative', serif;
        font-size: 1.3rem;
        font-weight: 700;
        margin-bottom: 0.4rem;
        letter-spacing: 0.5px;
    }

    .price-twin.idr .twin-amount { color: #80d090; text-shadow: 0 0 20px rgba(120,210,140,0.3); }
    .price-twin.sgd .twin-amount { color: #d4b060; text-shadow: 0 0 20px rgba(210,175,100,0.3); }

    .twin-note {
        font-size: 0.65rem;
        color: rgba(255,255,255,0.3);
        font-style: italic;
    }

    .price-divider-v {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.3rem;
        padding: 0.5rem 0;
        width: 1px;
        position: relative;
    }

    .price-divider-v span:not(.pdv-gem) {
        flex: 1;
        width: 1px;
        background: linear-gradient(180deg, transparent, rgba(210,175,100,0.3), transparent);
    }

    .pdv-gem {
        font-size: 0.5rem;
        color: rgba(210,175,100,0.4);
    }

    /* Modal seal */
    .modal-seal {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-top: auto;
        padding-top: 0.5rem;
    }

    .seal-line {
        flex: 1;
        height: 1px;
        background: rgba(210,175,100,0.15);
    }

    .seal-text {
        font-family: 'Cinzel', serif;
        font-size: 0.55rem;
        letter-spacing: 2px;
        color: rgba(210,175,100,0.3);
        white-space: nowrap;
    }

    /* ── RESPONSIVE ── */
    @media (max-width: 768px) {
        .page-wrapper { padding: 1rem 1.25rem 4rem; }

        .hero-title { font-size: 1.75rem; }

        .modal-body {
            grid-template-columns: 1fr;
        }

        .modal-showcase {
            border-right: none;
            border-bottom: 1px solid rgba(210,175,100,0.1);
            padding: 1.5rem;
        }

        .showcase-frame { max-width: 200px; }

        .modal-details { padding: 1.5rem; }

        .detail-title { font-size: 1.4rem; }

        .twin-amount { font-size: 1.1rem; }

        .controls { flex-direction: column; }
    }

    @media (max-width: 480px) {
        .hero-header { padding: 2rem 1rem; }
        .cards-grid { gap: 1rem; }
        .price-twins { flex-direction: column; }
        .price-divider-v { display: none; }
        .modal-crown { padding: 1rem; }
        .crown-text { font-size: 0.55rem; letter-spacing: 2px; }
        .qr-image { width: 70px; height: 70px; }
    }
</style>