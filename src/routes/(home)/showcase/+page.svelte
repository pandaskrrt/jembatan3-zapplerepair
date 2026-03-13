<script lang="ts">
    import { goto } from '$app/navigation';

    let items = [
        { id: 1,  number: 1,  name: 'Showcase 1',  slots: 98, filled: 97 },
        { id: 2,  number: 2,  name: 'Showcase 2',  slots: 98, filled: 97 },
        { id: 3,  number: 3,  name: 'Showcase 3',  slots: 98, filled: 75 },
        { id: 4,  number: 4,  name: 'Showcase 4',  slots: 98, filled: 84 },
        { id: 5,  number: 5,  name: 'Showcase 5',  slots: 98, filled: 58 },
        { id: 6,  number: 6,  name: 'Showcase 6',  slots: 98, filled: 80 },
        { id: 7,  number: 7,  name: 'Showcase 7',  slots: 98, filled: 97 },
        { id: 8,  number: 8,  name: 'Showcase 8',  slots: 98, filled: 90 },
        { id: 9,  number: 9,  name: 'Showcase 9',  slots: 98, filled: 90 },
        { id: 10, number: 10, name: 'Showcase 10', slots: 98, filled: 90 },
        { id: 11, number: 11, name: 'Showcase 11', slots: 98, filled: 57 },
        { id: 12, number: 12, name: 'Showcase 12', slots: 98, filled: 48 },
        { id: 13, number: 13, name: 'Showcase 13', slots: 98, filled: 91 },
        { id: 14, number: 14, name: 'Showcase 14', slots: 98, filled: 39 },
        { id: 15, number: 15, name: 'Showcase 15', slots: 98, filled: 74 },
        { id: 16, number: 16, name: 'Showcase 16', slots: 98, filled: 28 },
    ];

    function goToDetail(showcaseId: number) {
        goto(`/showcase/${showcaseId}`);
    }
</script>

<svelte:head>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com">
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&family=Rajdhani:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</svelte:head>

<div class="page-wrapper">
    <div class="header">
        <div class="header-left">
            <span class="icon">📦</span>
            <h1>Showcases</h1>
        </div>
        <div class="header-right">
            <span class="count">{items.length}</span>
        </div>
    </div>

    <div class="grid-container">
        {#each items as item (item.id)}
            <div class="card" onclick={() => goToDetail(item.id)} onkeydown={(e) => e.key === 'Enter' && goToDetail(item.id)} role="link" tabindex="0">
                <div class="top-row">
                    <div class="number">{item.number}</div>
                    <div class="filled">
                        <span class="arrow">▼</span>
                        <span class="value">{item.filled}</span>
                    </div>
                </div>

                <div class="showcase-icon">📦</div>

                <div class="name">{item.name}</div>
                <div class="slots">{item.slots} slots</div>
            </div>
        {/each}
    </div>
</div>

<style>
    :global(body) {
        margin: 0;
        padding: 0;
        background: #0d0d14;
        font-family: 'Rajdhani', sans-serif;
        color: #e0e0ff;
    }

    .page-wrapper {
        padding: 2rem;
        max-width: 1800px;
        margin: 0 auto;
    }

    .header {
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

    .icon { font-size: 2.2rem; }

    h1 {
        font-family: 'Orbitron', sans-serif;
        font-size: 2rem;
        margin: 0;
        color: #ffffff;
    }

    .count {
        background: rgba(0, 255, 140, 0.18);
        color: #00ff9d;
        padding: 0.5rem 1.2rem;
        border-radius: 999px;
        font-weight: 600;
        font-size: 1.1rem;
    }

    .grid-container {
        display: grid;
        grid-template-columns: repeat(7, minmax(180px, 1fr));
        gap: 1.4rem 1.2rem;
    }

    .card {
        background: #14141f;
        border: 1px solid #222244;
        border-radius: 12px;
        padding: 1.4rem 1.2rem;
        text-align: center;
        transition: all 0.18s ease;
        min-height: 160px;
        cursor: pointer;
    }

    .card:hover {
        border-color: #00ff9d66;
        background: #1c1c2c;
        transform: translateY(-4px);
        box-shadow: 0 8px 20px rgba(0, 255, 157, 0.12);
    }

    .card:focus-visible {
        outline: 2px solid #00ff9d;
        outline-offset: 2px;
    }

    .top-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.8rem;
    }

    .number {
        font-family: 'Orbitron', sans-serif;
        font-size: 1.6rem;
        font-weight: 700;
        color: #ffffff;
        background: rgba(255,255,255,0.06);
        width: 52px;
        height: 52px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 10px;
        border: 1px solid #444466;
    }

    .filled {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #00ff9d;
        font-weight: 600;
        font-size: 1.4rem;
    }

    .arrow { font-size: 1.35rem; }

    .showcase-icon {
        font-size: 2rem;
        margin: 0.3rem 0 0.6rem 0;
        color: #00ff9d88;
        filter: drop-shadow(0 0 6px rgba(0, 255, 157, 0.25));
    }

    .name {
        font-size: 1.1rem;
        font-weight: 500;
        margin-bottom: 0.7rem;
        color: #eeeeee;
    }

    .slots {
        font-size: 0.95rem;
        color: #9999bb;
    }

    /* Responsive */
    @media (max-width: 1600px) {
        .grid-container { grid-template-columns: repeat(6, minmax(170px, 1fr)); }
    }

    @media (max-width: 1400px) {
        .grid-container { grid-template-columns: repeat(5, minmax(165px, 1fr)); }
    }

    @media (max-width: 1200px) {
        .grid-container { grid-template-columns: repeat(4, minmax(160px, 1fr)); }
    }

    @media (max-width: 992px) {
        .grid-container { grid-template-columns: repeat(3, minmax(150px, 1fr)); }
    }

    @media (max-width: 768px) {
        .grid-container {
            grid-template-columns: repeat(2, minmax(140px, 1fr));
            gap: 1.2rem 1rem;
        }
        .card {
            padding: 1.2rem 1rem;
            min-height: 150px;
        }
        .number {
            width: 48px;
            height: 48px;
            font-size: 1.5rem;
        }
        .filled { font-size: 1.3rem; }
        .name { font-size: 1.05rem; }
        .showcase-icon { font-size: 1.9rem; }
    }

    @media (max-width: 480px) {
        .grid-container {
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem 0.8rem;
        }
        .page-wrapper { padding: 1.2rem; }
    }
</style>