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
    <canvas id="bg"></canvas>
    <div class="grid-overlay"></div>

    <div class="content">
        <div class="section-header">
            <div class="header-left">
                <p class="eyebrow">Inventory Management</p>
                <h2 class="section-title">Storage <span class="num">Cabinets</span></h2>
            </div>
            <div class="total-badge">
                <div class="badge-dot"></div>
                {showcases.length} Cabinets
            </div>
        </div>

        <div class="grid-container">
            {#each showcases as showcase}
                <div
                    class="card"
                    class:hovered={hoveredId === showcase.id}
                    onmouseenter={() => hoveredId = showcase.id}
                    onmouseleave={() => hoveredId = null}
                    onclick={() => goToShowcase(showcase.id)}
                    onkeydown={(e) => e.key === 'Enter' && goToShowcase(showcase.id)}
                    role="button"
                    tabindex="0"
                >
                    <div class="card-top-bar" class:active={hoveredId === showcase.id}></div>

                    <div class="card-header">
                        <div class="card-number">
                            <span class="number-label">Cabinet</span>
                            <span class="number-text">#{showcase.id.toString().padStart(2, '0')}</span>
                        </div>
                        <div class="status-pill" class:full={showcase.filled >= showcase.slots} class:empty={showcase.filled === 0}>
                            <div class="status-dot"></div>
                            <span>
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

                    <div class="card-name">{showcase.name}</div>

                    <div class="card-meta">
                        <div class="meta-item">
                            <svg viewBox="0 0 24 24" fill="none" width="12" height="12"><path d="M3 7h18M3 12h18M3 17h18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
                            {showcase.sections.length} Sections
                        </div>
                        <div class="meta-sep">·</div>
                        <div class="meta-item">
                            <svg viewBox="0 0 24 24" fill="none" width="12" height="12"><path d="M20 7L12 3L4 7L12 11L20 7Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 7V17L12 21L20 17V7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                            {showcase.filled}/{showcase.slots} Items
                        </div>
                    </div>

                    <div class="progress-wrap">
                        <div class="progress-bar">
                            <div
                                class="progress-fill"
                                class:fill-full={showcase.filled >= showcase.slots}
                                style="width: {Math.min((showcase.filled / showcase.slots) * 100, 100)}%"
                            ></div>
                        </div>
                        <div class="progress-label">
                            <span>{Math.round((showcase.filled / showcase.slots) * 100)}% capacity</span>
                            <span class="arrow" class:active={hoveredId === showcase.id}>→</span>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    </div>
</div>

<script context="module">
</script>

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

    canvas#bg {
        position: fixed;
        inset: 0;
        width: 100%;
        height: 100%;
        z-index: 0;
        pointer-events: none;
    }

    .grid-overlay {
        position: fixed;
        inset: 0;
        z-index: 1;
        pointer-events: none;
        background-image:
            linear-gradient(rgba(99,179,237,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,179,237,0.04) 1px, transparent 1px);
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

    /* Header */
    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-bottom: 2.5rem;
    }

    .eyebrow {
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: rgba(99,179,237,0.7);
        margin: 0 0 0.5rem 0;
    }

    .section-title {
        font-family: 'Inter', sans-serif;
        font-size: 2rem;
        font-weight: 700;
        color: #f1f5f9;
        margin: 0;
        letter-spacing: -0.5px;
        line-height: 1;
    }

    .section-title .num {
        display: inline-block;
        background: linear-gradient(180deg, #ffffff 0%, #93c5fd 50%, #ffffff 100%);
        background-size: 100% 200%;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        animation: num-shine 3s ease-in-out infinite;
        filter: drop-shadow(0 0 8px rgba(147,197,253,0.5));
    }

    @keyframes num-shine {
        0%   { background-position: 0% 0%; }
        50%  { background-position: 0% 100%; }
        100% { background-position: 0% 0%; }
    }

    .total-badge {
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 100px;
        padding: 8px 18px;
        font-size: 12px;
        font-weight: 600;
        color: rgba(255,255,255,0.6);
        letter-spacing: 0.04em;
        white-space: nowrap;
    }

    .badge-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #34d399;
        animation: pulse-dot 2s infinite;
    }

    @keyframes pulse-dot {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(0.8); }
    }

    /* Grid */
    .grid-container {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 1rem;
    }

    @media (max-width: 1600px) { .grid-container { grid-template-columns: repeat(5, 1fr); } }
    @media (max-width: 1400px) { .grid-container { grid-template-columns: repeat(4, 1fr); } }
    @media (max-width: 1100px) { .grid-container { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 768px)  { .grid-container { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 480px)  { .grid-container { grid-template-columns: 1fr; } }

    /* Card */
    .card {
        position: relative;
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.07);
        border-radius: 16px;
        padding: 1.25rem;
        cursor: pointer;
        transition: background 0.25s, border-color 0.25s, transform 0.25s;
        overflow: hidden;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
    }

    .card:hover, .card.hovered {
        background: rgba(255,255,255,0.07);
        border-color: rgba(147,197,253,0.25);
        transform: translateY(-3px);
    }

    .card-top-bar {
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 2px;
        background: linear-gradient(90deg, #2563eb, #7c3aed);
        transform: scaleX(0);
        transform-origin: left;
        transition: transform 0.3s ease;
        border-radius: 16px 16px 0 0;
    }

    .card-top-bar.active { transform: scaleX(1); }

    /* Card Header */
    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1rem;
    }

    .card-number {
        display: flex;
        flex-direction: column;
        gap: 1px;
    }

    .number-label {
        font-size: 9px;
        color: rgba(255,255,255,0.3);
        text-transform: uppercase;
        letter-spacing: 0.08em;
    }

    .number-text {
        font-size: 1.4rem;
        font-weight: 700;
        color: #f1f5f9;
        letter-spacing: -0.5px;
        line-height: 1;
    }

    .status-pill {
        display: flex;
        align-items: center;
        gap: 5px;
        background: rgba(52,211,153,0.1);
        border: 1px solid rgba(52,211,153,0.2);
        border-radius: 100px;
        padding: 3px 10px;
        font-size: 10px;
        font-weight: 600;
        color: #34d399;
        letter-spacing: 0.04em;
    }

    .status-pill.full {
        background: rgba(248,113,113,0.1);
        border-color: rgba(248,113,113,0.2);
        color: #f87171;
    }

    .status-pill.empty {
        background: rgba(255,255,255,0.05);
        border-color: rgba(255,255,255,0.1);
        color: rgba(255,255,255,0.4);
    }

    .status-dot {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: currentColor;
    }

    /* Card Body */
    .card-name {
        font-size: 0.9rem;
        font-weight: 600;
        color: #e2e8f0;
        margin-bottom: 0.6rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .card-meta {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 1rem;
        font-size: 11px;
        color: rgba(255,255,255,0.3);
    }

    .meta-item {
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .meta-sep { color: rgba(255,255,255,0.15); }

    /* Progress */
    .progress-wrap { margin-top: auto; }

    .progress-bar {
        height: 3px;
        background: rgba(255,255,255,0.07);
        border-radius: 99px;
        overflow: hidden;
        margin-bottom: 0.5rem;
    }

    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #2563eb, #7c3aed);
        border-radius: 99px;
        transition: width 0.5s ease;
    }

    .progress-fill.fill-full {
        background: linear-gradient(90deg, #f87171, #ef4444);
    }

    .progress-label {
        display: flex;
        justify-content: space-between;
        font-size: 10px;
        color: rgba(255,255,255,0.25);
    }

    .arrow {
        transition: transform 0.25s, color 0.25s;
    }

    .arrow.active {
        transform: translateX(3px);
        color: #93c5fd;
    }

    /* Responsive */
    @media (max-width: 768px) {
        .content { padding: 1.5rem 1rem 2rem; }
        .section-title { font-size: 1.5rem; }
        .section-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
    }
</style>