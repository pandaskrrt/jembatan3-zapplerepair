<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  onMount(() => {
    const canvas = document.getElementById('bg');
    const ctx = canvas.getContext('2d');
    let W, H, blobs = [], t = 0, animId;

    function rand(a, b) { return a + Math.random() * (b - a); }

    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }

    function init() {
      blobs = [];
      const cols = [
        'rgba(56,189,248,', 'rgba(129,140,248,',
        'rgba(167,139,250,', 'rgba(34,211,238,', 'rgba(99,102,241,'
      ];
      for (let i = 0; i < 9; i++) {
        blobs.push({
          x: rand(0, W), y: rand(0, H),
          r: rand(80, 260),
          vx: rand(-0.1, 0.1), vy: rand(-0.08, 0.08),
          color: cols[i % cols.length] + rand(0.06, 0.16) + ')',
          phase: rand(0, Math.PI * 2),
          sp: rand(0.003, 0.007)
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#06090f';
      ctx.fillRect(0, 0, W, H);
      for (const b of blobs) {
        b.x += b.vx + Math.sin(t * b.sp + b.phase) * 0.4;
        b.y += b.vy + Math.cos(t * b.sp + b.phase * 1.4) * 0.3;
        if (b.x < -b.r) b.x = W + b.r;
        if (b.x > W + b.r) b.x = -b.r;
        if (b.y < -b.r) b.y = H + b.r;
        if (b.y > H + b.r) b.y = -b.r;
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        g.addColorStop(0, b.color);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      }
      t++;
      animId = requestAnimationFrame(draw);
    }

    resize();
    init();
    animId = requestAnimationFrame(draw);
    window.addEventListener('resize', () => { resize(); init(); });
    return () => cancelAnimationFrame(animId);
  });
</script>

<canvas id="bg"></canvas>

<div class="page">
  <div class="grid-overlay"></div>
  <div class="card">
    <div class="card-inner">

      <div class="top-bar">
        <div class="logo-pill">
          <div class="logo-dot">J3</div>
          <span class="logo-text">GUDANG SYSTEM</span>
        </div>
        <div class="status-pill">
          <div class="status-dot"></div>
          Live
        </div>
      </div>

      <div class="hero">
        <p class="eyebrow">Inventory Management</p>
        <h1 class="title">
          Jembatan <span class="num">3</span> Stocks
        </h1>
        <p class="subtitle">Monitor ketersediaan stok gudang secara real-time — akurat, cepat, satu klik.</p>
      </div>

      <div class="btn-wrap">
        <button class="btn" onclick={() => goto('/showcase')}>
          <span class="btn-icon">
            <i class="ti ti-package-search" aria-hidden="true"></i>
          </span>
          <span class="btn-text">Cek Stok Sekarang</span>
          <div class="shimmer-bar"></div>
        </button>
      </div>

    </div>
    <div class="card-glow"></div>
  </div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  canvas#bg {
    position: fixed;
    inset: 0; width: 100%; height: 100%;
    z-index: 0; pointer-events: none;
  }

  .page {
    min-height: 100vh;
    display: flex; align-items: center; justify-content: center;
    padding: 2.5rem 1.5rem;
    font-family: 'Inter', sans-serif;
    position: relative;
    background: #06090f;
  }

  .grid-overlay {
    position: fixed; inset: 0; z-index: 1; pointer-events: none;
    background-image:
      linear-gradient(rgba(99,179,237,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99,179,237,0.04) 1px, transparent 1px);
    background-size: 48px 48px;
    mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%);
  }

  .card {
    position: relative; z-index: 2;
    width: 100%; max-width: 480px;
    border-radius: 28px; overflow: hidden;
    border: 1px solid rgba(255,255,255,0.08);
  }

  .card-inner {
    background: linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%);
    backdrop-filter: blur(32px);
    -webkit-backdrop-filter: blur(32px);
    padding: 2.75rem 3rem 3rem;
  }

  .card-glow {
    position: absolute; inset: 0; border-radius: 28px;
    pointer-events: none; z-index: 3;
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.1),
      inset 0 -1px 0 rgba(0,0,0,0.3);
  }

  .top-bar {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 2.5rem;
  }

  .logo-pill {
    display: flex; align-items: center; gap: 8px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 100px; padding: 6px 14px 6px 8px;
  }

  .logo-dot {
    width: 24px; height: 24px; border-radius: 50%;
    background: linear-gradient(135deg, #38bdf8, #818cf8);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; color: #fff; font-weight: 700;
  }

  .logo-text {
    font-size: 12px; color: rgba(255,255,255,0.6);
    font-weight: 500; letter-spacing: 0.04em;
  }

  .status-pill {
    display: flex; align-items: center; gap: 6px;
    background: rgba(52,211,153,0.1);
    border: 1px solid rgba(52,211,153,0.2);
    border-radius: 100px; padding: 5px 12px;
    font-size: 11px; color: #34d399; font-weight: 600; letter-spacing: 0.03em;
  }

  .status-dot {
    width: 6px; height: 6px; border-radius: 50%; background: #34d399;
    animation: pulse-dot 2s infinite;
  }

  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }

  .hero { margin-bottom: 2.5rem; }

  .eyebrow {
    font-size: 11px; font-weight: 600; letter-spacing: 0.12em;
    text-transform: uppercase; color: rgba(99,179,237,0.7);
    margin-bottom: 1rem;
  }

  .title {
    font-size: 36px; font-weight: 700;
    line-height: 1.15; letter-spacing: -0.5px;
    color: #f1f5f9;
    margin-bottom: 0.85rem;
  }

  .title .num {
    display: inline-block;
    background: linear-gradient(180deg, #ffffff 0%, #93c5fd 50%, #ffffff 100%);
    background-size: 100% 200%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: num-shine 3s ease-in-out infinite;
    filter: drop-shadow(0 0 8px rgba(147,197,253,0.6));
  }

  @keyframes num-shine {
    0%   { background-position: 0% 0%; }
    50%  { background-position: 0% 100%; }
    100% { background-position: 0% 0%; }
  }

  .subtitle {
    font-size: 14px; color: rgba(255,255,255,0.38);
    line-height: 1.7;
  }

  .btn-wrap { display: flex; justify-content: center; }

  .btn {
    position: relative; overflow: hidden;
    display: inline-flex; align-items: center; justify-content: center;
    gap: 10px; width: 100%;
    padding: 17px 36px; border-radius: 16px; border: none; cursor: pointer;
    font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 600;
    background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .btn::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6, #3b82f6);
    background-size: 200%; opacity: 0; transition: opacity 0.3s;
    animation: shimmer 3s linear infinite;
  }

  @keyframes shimmer { to { background-position: 200% center; } }

  .btn:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(99,102,241,0.45); }
  .btn:hover::before { opacity: 1; }
  .btn:active { transform: scale(0.98); }

  .btn-text {
    position: relative; z-index: 1;
    color: #fff; font-weight: 700;
  }

  .btn-icon {
    position: relative; z-index: 1;
    font-size: 18px; color: #fff;
  }

  .shimmer-bar {
    position: absolute; bottom: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
    background-size: 200%; animation: shimmer 2s linear infinite;
  }
</style>