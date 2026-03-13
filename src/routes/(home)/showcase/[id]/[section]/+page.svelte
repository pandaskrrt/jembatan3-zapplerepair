<script lang="ts">
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';

    interface Card {
        id: number;
        name: string;
        price: number;
        image: string;
        category: string;
        location: string;
        stock: number;
    }

    interface SectionInfo {
        name: string;
        showcaseId: number;
        showcaseName: string;
    }

    interface SectionCards {
        [key: string]: Card[];
    }

    interface SectionInfoMap {
        [key: string]: SectionInfo;
    }

    let sectionCards: SectionCards = {
        'starter-evolution': [
            { id: 1, name: 'Charizard', price: 299.99, image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png', category: 'Pokemon', location: 'Section A-1', stock: 5 },
            { id: 2, name: 'Blastoise', price: 199.99, image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/9.png', category: 'Pokemon', location: 'Section A-2', stock: 3 },
            { id: 3, name: 'Venusaur', price: 189.99, image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/3.png', category: 'Pokemon', location: 'Section A-3', stock: 4 },
            { id: 4, name: 'Pikachu', price: 79.99, image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png', category: 'Pokemon', location: 'Section A-4', stock: 10 },
            { id: 5, name: 'Charizard Holo', price: 599.99, image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png', category: 'Pokemon', location: 'Section A-5', stock: 2 }
        ],
        'legendary-birds': [
            { id: 6, name: 'Articuno', price: 249.99, image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/144.png', category: 'Pokemon', location: 'Section B-1', stock: 3 },
            { id: 7, name: 'Zapdos', price: 259.99, image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/145.png', category: 'Pokemon', location: 'Section B-2', stock: 4 },
            { id: 8, name: 'Moltres', price: 269.99, image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/146.png', category: 'Pokemon', location: 'Section B-3', stock: 2 }
        ],
        'black-lotus': [
            { id: 9, name: 'Black Lotus', price: 9999.99, image: 'https://images.unsplash.com/photo-1626224581984-a0ac5c7f8a6b?w=400', category: 'Magic', location: 'Section C-1', stock: 1 },
            { id: 10, name: 'Ancestral Recall', price: 4999.99, image: 'https://images.unsplash.com/photo-1626224581984-a0ac5c7f8a6b?w=400', category: 'Magic', location: 'Section C-2', stock: 2 }
        ]
    };

    let sectionInfo: SectionInfoMap = {
        'starter-evolution': { name: 'Starter Evolution', showcaseId: 1, showcaseName: 'Pokemon Collection' },
        'legendary-birds': { name: 'Legendary Birds', showcaseId: 1, showcaseName: 'Pokemon Collection' },
        'psychic-types': { name: 'Psychic Types', showcaseId: 1, showcaseName: 'Pokemon Collection' },
        'dragon-masters': { name: 'Dragon Masters', showcaseId: 1, showcaseName: 'Pokemon Collection' },
        'black-lotus': { name: 'Black Lotus Set', showcaseId: 2, showcaseName: 'Magic The Gathering' },
        'dragons-mtg': { name: 'Dragons', showcaseId: 2, showcaseName: 'Magic The Gathering' },
        'planeswalkers': { name: 'Planeswalkers', showcaseId: 2, showcaseName: 'Magic The Gathering' },
        'artifacts': { name: 'Artifacts', showcaseId: 2, showcaseName: 'Magic The Gathering' }
    };

    let showcaseId: string = $page.params.id || '';
    let sectionSlug: string = $page.params.section || '';
    
    let cards: Card[] = sectionSlug ? (sectionCards[sectionSlug] || []) : [];
    
    let info: SectionInfo = sectionSlug ? (sectionInfo[sectionSlug] || { 
        name: sectionSlug, 
        showcaseId: parseInt(showcaseId) || 0, 
        showcaseName: `Showcase ${showcaseId}` 
    }) : { 
        name: 'Unknown Section', 
        showcaseId: 0, 
        showcaseName: 'Unknown Showcase' 
    };

    let selectedCard: Card | null = $state(null);

    function goBack(): void {
        if (showcaseId) {
            goto(`/showcase/${showcaseId}`);
        } else {
            goto('/showcase');
        }
    }

    function viewCardDetail(card: Card): void {
        selectedCard = card;
    }

    function closeDetail(): void {
        selectedCard = null;
    }

    function handleCardKeydown(e: KeyboardEvent, card: Card): void {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            viewCardDetail(card);
        }
    }

    function handleOverlayKeydown(e: KeyboardEvent): void {
        if (e.key === 'Escape') {
            closeDetail();
        }
    }

    function formatPrice(price: number): string {
        return price.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    }
</script>

<svelte:head>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com">
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&family=Rajdhani:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</svelte:head>

<div class="section-page">
    <div class="section-header">
        <button class="back-button" onclick={goBack}>
            <span class="back-icon">←</span>
            <span>Back to {info.showcaseName}</span>
        </button>
        <div class="section-title">
            <h1>{info.name}</h1>
            <p class="section-stats">{cards.length} cards available</p>
        </div>
    </div>

    <div class="cards-grid">
        {#each cards as card (card.id)}
            <div 
                class="card-item" 
                onclick={() => viewCardDetail(card)}
                onkeydown={(e) => handleCardKeydown(e, card)}
                role="button"
                tabindex="0"
                aria-label={`View details for ${card.name}`}
            >
                <div class="card-image-container">
                    <img src={card.image} alt={card.name} class="card-image">
                    <div class="card-stock-badge" class:low-stock={card.stock < 3}>
                        {card.stock} left
                    </div>
                </div>
                <div class="card-info">
                    <h3 class="card-name">{card.name}</h3>
                    <p class="card-category">{card.category}</p>
                    <div class="card-price">
                        <span class="price-currency">$</span>
                        <span class="price-value">{formatPrice(card.price)}</span>
                    </div>
                </div>
            </div>
        {/each}
    </div>

    {#if selectedCard}
        <div 
            class="modal-overlay" 
            onclick={closeDetail}
            onkeydown={handleOverlayKeydown}
            role="button"
            tabindex="0"
            aria-label="Close modal"
        >
            <div 
                class="modal-content" 
                onclick={(e) => e.stopPropagation()}
                onkeydown={(e) => {
                    if (e.key === 'Escape') {
                        closeDetail();
                    }
                }}
                role="dialog"
                aria-label="Card details modal"
            >
                <button class="modal-close" onclick={closeDetail}>×</button>
                
                <div class="modal-layout">
                    <div class="modal-image">
                        <img src={selectedCard.image} alt={selectedCard.name}>
                    </div>

                    <div class="modal-details">
                        <h2 class="modal-title">{selectedCard.name}</h2>
                        
                        <div class="detail-grid">
                            <div class="detail-item">
                                <span class="detail-label">Category</span>
                                <span class="detail-value">{selectedCard.category}</span>
                            </div>
                            
                            <div class="detail-item">
                                <span class="detail-label">Location</span>
                                <span class="detail-value">{selectedCard.location}</span>
                            </div>
                            
                            <div class="detail-item">
                                <span class="detail-label">Stock</span>
                                <span class="detail-value" class:low-stock={selectedCard.stock < 3}>
                                    {selectedCard.stock} units
                                </span>
                            </div>
                            
                            <div class="detail-item">
                                <span class="detail-label">Showcase</span>
                                <span class="detail-value">{info.showcaseName}</span>
                            </div>
                            
                            <div class="detail-item">
                                <span class="detail-label">Section</span>
                                <span class="detail-value">{info.name}</span>
                            </div>
                        </div>

                        <div class="price-section">
                            <div class="price-label">PRICE (incl. 9% GST)</div>
                            <div class="price-container">
                                <div class="price-glow"></div>
                                <span class="price-symbol">$</span>
                                <span class="price-amount">{formatPrice(selectedCard.price)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
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

    .section-page {
        padding: 2rem;
        max-width: 1400px;
        margin: 0 auto;
    }

    .section-header {
        margin-bottom: 2rem;
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
        margin-bottom: 1rem;
        transition: all 0.2s ease;
    }

    .back-button:hover {
        background: rgba(0, 255, 157, 0.1);
        border-color: #00ff9d66;
        transform: translateX(-4px);
    }

    .section-title h1 {
        font-family: 'Orbitron', sans-serif;
        font-size: 2.5rem;
        font-weight: 700;
        color: #ffffff;
        margin: 0 0 0.5rem 0;
    }

    .section-stats {
        font-size: 1.1rem;
        color: rgba(255, 255, 255, 0.6);
    }

    .cards-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 1.5rem;
    }

    .card-item {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.2s ease;
        outline: none;
    }

    .card-item:hover {
        transform: translateY(-4px);
        border-color: #00ff9d66;
        box-shadow: 0 8px 20px rgba(0, 255, 157, 0.15);
    }

    .card-item:focus-visible {
        outline: 2px solid #00ff9d;
        outline-offset: 2px;
    }

    .card-image-container {
        position: relative;
        aspect-ratio: 1;
        overflow: hidden;
    }

    .card-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;
    }

    .card-item:hover .card-image {
        transform: scale(1.05);
    }

    .card-stock-badge {
        position: absolute;
        top: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.7);
        color: #00ff9d;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 600;
        border: 1px solid #00ff9d66;
    }

    .card-stock-badge.low-stock {
        color: #ff4444;
        border-color: #ff4444;
    }

    .card-info {
        padding: 1rem;
    }

    .card-name {
        font-family: 'Orbitron', sans-serif;
        font-size: 1rem;
        font-weight: 600;
        color: #ffffff;
        margin: 0 0 0.25rem 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .card-category {
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.5);
        margin-bottom: 0.5rem;
    }

    .card-price {
        display: flex;
        align-items: baseline;
        gap: 0.1rem;
    }

    .price-currency {
        font-size: 0.9rem;
        color: #00ff9d;
    }

    .price-value {
        font-family: 'Orbitron', sans-serif;
        font-size: 1.2rem;
        font-weight: 700;
        color: #00ff9d;
    }

    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(5px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        outline: none;
    }

    .modal-content {
        background: #1a1a2a;
        border: 1px solid rgba(0, 255, 157, 0.2);
        border-radius: 20px;
        padding: 2rem;
        max-width: 1000px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        position: relative;
        outline: none;
    }

    .modal-close {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.5);
        font-size: 2rem;
        cursor: pointer;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.2s ease;
    }

    .modal-close:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
    }

    .modal-layout {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
    }

    .modal-image {
        aspect-ratio: 1;
        border-radius: 12px;
        overflow: hidden;
    }

    .modal-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .modal-details {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .modal-title {
        font-family: 'Orbitron', sans-serif;
        font-size: 2rem;
        font-weight: 700;
        color: #ffffff;
        margin: 0;
    }

    .detail-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        padding: 1.5rem;
    }

    .detail-item {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .detail-label {
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.4);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .detail-value {
        font-family: 'Orbitron', sans-serif;
        font-size: 1.1rem;
        font-weight: 600;
        color: #ffffff;
    }

    .detail-value.low-stock {
        color: #ff4444;
    }

    .price-section {
        margin-top: 1rem;
        padding: 1.5rem;
        background: linear-gradient(135deg, rgba(0, 255, 157, 0.1), rgba(0, 200, 255, 0.1));
        border-radius: 16px;
        border: 1px solid rgba(0, 255, 157, 0.3);
        position: relative;
        overflow: hidden;
    }

    .price-label {
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.7);
        letter-spacing: 1px;
        margin-bottom: 0.5rem;
        text-transform: uppercase;
    }

    .price-container {
        position: relative;
        display: flex;
        align-items: baseline;
        gap: 0.2rem;
        font-family: 'Orbitron', sans-serif;
    }

    .price-glow {
        position: absolute;
        top: -20px;
        left: -20px;
        right: -20px;
        bottom: -20px;
        background: radial-gradient(circle at 30% 50%, rgba(0, 255, 157, 0.4), transparent 70%);
        filter: blur(20px);
        animation: priceGlow 3s ease-in-out infinite;
        pointer-events: none;
    }

    .price-symbol {
        font-size: 1.8rem;
        font-weight: 600;
        background: linear-gradient(135deg, #00ff9d, #00ccff);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        position: relative;
        z-index: 2;
        text-shadow: 0 0 20px rgba(0, 255, 157, 0.5);
    }

    .price-amount {
        font-size: 3rem;
        font-weight: 800;
        background: linear-gradient(135deg, #00ff9d, #00ccff);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        position: relative;
        z-index: 2;
        text-shadow: 0 0 30px rgba(0, 255, 157, 0.6);
        letter-spacing: 2px;
    }

    @keyframes priceGlow {
        0%, 100% {
            opacity: 0.5;
            transform: scale(1);
        }
        50% {
            opacity: 0.8;
            transform: scale(1.1);
        }
    }

    @media (max-width: 1200px) {
        .cards-grid {
            grid-template-columns: repeat(4, 1fr);
        }
    }

    @media (max-width: 992px) {
        .cards-grid {
            grid-template-columns: repeat(3, 1fr);
        }
    }

    @media (max-width: 768px) {
        .cards-grid {
            grid-template-columns: repeat(2, 1fr);
        }

        .modal-layout {
            grid-template-columns: 1fr;
        }

        .detail-grid {
            grid-template-columns: 1fr;
        }

        .price-symbol {
            font-size: 1.5rem;
        }

        .price-amount {
            font-size: 2.2rem;
        }
    }

    @media (max-width: 480px) {
        .cards-grid {
            grid-template-columns: 1fr;
        }

        .price-symbol {
            font-size: 1.2rem;
        }

        .price-amount {
            font-size: 1.8rem;
        }
    }
</style>