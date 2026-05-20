<script>
	import { onMount } from 'svelte';
	
	let floatingCards = [
		{ id: 1, icon: '📱', title: 'iPhone Parts', value: '1,284 units', color: 'green', top: '7%', left: '4%', delay: 0.3, duration: 7 },
		{ id: 2, icon: '🔧', title: 'Samsung Parts', value: '876 units', color: 'blue', top: '12%', right: '4%', delay: 0.5, duration: 9 },
		{ id: 3, icon: '⚡', title: 'Xiaomi Parts', value: '432 units', color: 'amber', bottom: '22%', left: '3%', delay: 0.7, duration: 8 },
		{ id: 4, icon: '🔋', title: 'Batteries', value: '1,024 pcs', color: 'purple', bottom: '16%', right: '4%', delay: 0.9, duration: 10 },
		{ id: 5, icon: '🖥️', title: 'Screens', value: '786 pcs', color: 'green', top: '48%', left: '1%', delay: 1.1, duration: 11 },
		{ id: 6, icon: '🔌', title: 'Charging Ports', value: '543 pcs', color: 'blue', top: '44%', right: '2%', delay: 1.3, duration: 8.5 }
	];
</script>

<!-- Background Grid -->
<div class="bg-grid"></div>

<!-- Floating Particles -->
<div class="particles">
	<div class="particle" style="top: 15%; left: 10%; animation-delay: 0s;"></div>
	<div class="particle" style="top: 25%; right: 15%; animation-delay: 1s;"></div>
	<div class="particle" style="bottom: 30%; left: 20%; animation-delay: 2s;"></div>
	<div class="particle" style="top: 60%; right: 25%; animation-delay: 0.5s;"></div>
	<div class="particle" style="bottom: 15%; right: 10%; animation-delay: 1.5s;"></div>
	<div class="particle" style="top: 40%; left: 25%; animation-delay: 2.5s;"></div>
</div>

<!-- Floating Cards -->
<div class="floating-cards">
	{#each floatingCards as card}
		<div 
			class="float-card {card.color}" 
			style="top: {card.top}; {card.left ? 'left: ' + card.left : ''} {card.right ? 'right: ' + card.right : ''}; animation-duration: {card.duration}s; animation-delay: {card.delay}s;"
		>
			<div class="card-icon">{card.icon}</div>
			<div class="card-body">
				<span class="card-label">{card.title}</span>
				<span class="card-value">{card.value}</span>
			</div>
			<div class="badge-dot {card.color}"></div>
		</div>
	{/each}
</div>

<!-- Main Content -->
<div class="welcome-container">
	<div class="welcome-content">
		<div class="logo-pill">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
				<path d="M20 7L12 3L4 7L12 11L20 7Z"/>
				<path d="M4 7V17L12 21L20 17V7"/>
				<path d="M12 11V21"/>
			</svg>
			Roxy ZappleRepair
		</div>

		<h1 class="welcome-title">
			<span class="welcome-greeting">Welcome to</span>
			<span class="welcome-brand">Stock <em>Management</em></span>
		</h1>

		<p class="welcome-description">
			Kelola stok sparepart HP dengan mudah dan real-time. 
			iPhone, Samsung, Xiaomi, OPPO, dan berbagai merek lainnya.
		</p>

		<!-- CTA Buttons -->
		<div class="cta-group">
			<a href="/showcase" class="btn-primary" data-sveltekit-reload>
				<span>View Inventory</span>
				<svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M5 12H19M19 12L12 5M19 12L12 19" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
			</a>
			<div class="btn-secondary-group">
				<button class="btn-secondary">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
						<path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.12 2.2 2 2 0 012.11 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.2 7.85a16 16 0 006 6l1.21-1.21a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z"/>
					</svg>
					Contact
				</button>
				<button class="btn-secondary">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
						<circle cx="12" cy="12" r="3"/>
						<path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
					</svg>
					Categories
				</button>
			</div>
		</div>

		<!-- Stats -->
		<div class="stats-row">
			<div class="stat-item">
				<span class="stat-value">2.4K+</span>
				<span class="stat-label">Items Tracked</span>
			</div>
			<div class="divider"></div>
			<div class="stat-item">
				<span class="stat-value">Real-time</span>
				<span class="stat-label">Stock Updates</span>
			</div>
			<div class="divider"></div>
			<div class="stat-item">
				<span class="stat-value">6+</span>
				<span class="stat-label">Categories</span>
			</div>
		</div>
	</div>
</div>

<!-- Ticker Bar -->
<div class="ticker-bar">
	<div class="ticker-track">
		<span class="ticker-item"><span class="dot green"></span> iPhone 15 Screen · 24 pcs</span>
		<span class="ticker-item"><span class="dot blue"></span> Samsung A54 Battery · 12 pcs</span>
		<span class="ticker-item"><span class="dot amber"></span> Xiaomi Charging Port · 8 pcs</span>
		<span class="ticker-item"><span class="dot purple"></span> OPPO Back Cover · 31 pcs</span>
		<span class="ticker-item"><span class="dot green"></span> iPhone 14 Camera Lens · 6 pcs</span>
		<span class="ticker-item"><span class="dot blue"></span> USB-C Flex Cable · 19 pcs</span>
		<span class="ticker-item"><span class="dot amber"></span> Samsung S23 Screen · 15 pcs</span>
		<span class="ticker-item"><span class="dot purple"></span> Xiaomi Battery · 22 pcs</span>
		<!-- Duplicate for seamless loop -->
		<span class="ticker-item"><span class="dot green"></span> iPhone 15 Screen · 24 pcs</span>
		<span class="ticker-item"><span class="dot blue"></span> Samsung A54 Battery · 12 pcs</span>
		<span class="ticker-item"><span class="dot amber"></span> Xiaomi Charging Port · 8 pcs</span>
		<span class="ticker-item"><span class="dot purple"></span> OPPO Back Cover · 31 pcs</span>
		<span class="ticker-item"><span class="dot green"></span> iPhone 14 Camera Lens · 6 pcs</span>
		<span class="ticker-item"><span class="dot blue"></span> USB-C Flex Cable · 19 pcs</span>
		<span class="ticker-item"><span class="dot amber"></span> Samsung S23 Screen · 15 pcs</span>
		<span class="ticker-item"><span class="dot purple"></span> Xiaomi Battery · 22 pcs</span>
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		background: #f5f5f5;
		font-family: 'Inter', sans-serif;
		overflow-x: hidden;
	}

	/* Background Grid */
	.bg-grid {
		position: fixed;
		inset: 0;
		background-image: 
			linear-gradient(to right, rgba(0, 0, 0, 0.03) 1px, transparent 1px),
			linear-gradient(to bottom, rgba(0, 0, 0, 0.03) 1px, transparent 1px);
		background-size: 40px 40px;
		animation: gridMove 20s linear infinite;
		z-index: 0;
	}

	@keyframes gridMove {
		0% { background-position: 0 0; }
		100% { background-position: 40px 40px; }
	}

	/* Particles */
	.particles {
		position: fixed;
		inset: 0;
		pointer-events: none;
		z-index: 1;
	}

	.particle {
		position: absolute;
		width: 4px;
		height: 4px;
		background: #10b981;
		border-radius: 50%;
		opacity: 0;
		animation: particleFloat 4s ease-in-out infinite;
	}

	@keyframes particleFloat {
		0% {
			opacity: 0;
			transform: translateY(0) scale(0);
		}
		50% {
			opacity: 0.4;
			transform: translateY(-20px) scale(1);
		}
		100% {
			opacity: 0;
			transform: translateY(-40px) scale(0);
		}
	}

	/* Floating Cards Container */
	.floating-cards {
		position: fixed;
		inset: 0;
		pointer-events: none;
		z-index: 2;
	}

	/* Floating Card */
	.float-card {
		position: absolute;
		background: #ffffff;
		border: 1px solid rgba(0, 0, 0, 0.08);
		border-radius: 16px;
		padding: 12px 16px;
		display: flex;
		align-items: center;
		gap: 12px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
		animation: cardFloat ease-in-out infinite;
		opacity: 0;
		animation-fill-mode: forwards;
		white-space: nowrap;
		z-index: 2;
	}

	@keyframes cardFloat {
		0% {
			opacity: 0;
			transform: translateY(20px) rotate(0deg);
		}
		20% {
			opacity: 1;
		}
		80% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			transform: translateY(-20px) rotate(0deg);
		}
	}

	.float-card.green { border-left: 3px solid #10b981; }
	.float-card.blue { border-left: 3px solid #3b82f6; }
	.float-card.amber { border-left: 3px solid #f59e0b; }
	.float-card.purple { border-left: 3px solid #8b5cf6; }

	.card-icon {
		font-size: 28px;
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f9fafb;
		border-radius: 12px;
	}

	.card-body {
		display: flex;
		flex-direction: column;
	}

	.card-label {
		font-size: 11px;
		font-weight: 500;
		color: #9ca3af;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.card-value {
		font-size: 16px;
		font-weight: 700;
		color: #111827;
		margin-top: 2px;
	}

	.badge-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		margin-left: auto;
		animation: pulse 2s ease-in-out infinite;
	}

	.badge-dot.green { background: #10b981; }
	.badge-dot.blue { background: #3b82f6; }
	.badge-dot.amber { background: #f59e0b; }
	.badge-dot.purple { background: #8b5cf6; }

	@keyframes pulse {
		0%, 100% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.5; transform: scale(0.8); }
	}

	/* Welcome Container */
	.welcome-container {
		position: relative;
		z-index: 10;
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
	}

	.welcome-content {
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(0, 0, 0, 0.06);
		border-radius: 28px;
		padding: 3rem 2.5rem;
		max-width: 520px;
		width: 100%;
		text-align: center;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.05);
		animation: fadeInUp 0.6s ease-out;
	}

	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(30px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Logo Pill */
	.logo-pill {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		background: #f0fdf4;
		border: 1px solid #bbf7d0;
		border-radius: 100px;
		padding: 6px 16px;
		font-size: 13px;
		font-weight: 500;
		color: #059669;
		margin-bottom: 1.5rem;
	}

	.logo-pill svg {
		width: 16px;
		height: 16px;
	}

	/* Title */
	.welcome-title {
		margin: 0 0 1rem;
	}

	.welcome-greeting {
		display: block;
		font-size: 0.9rem;
		font-weight: 500;
		color: #6b7280;
		text-transform: uppercase;
		letter-spacing: 2px;
		margin-bottom: 0.5rem;
	}

	.welcome-brand {
		display: block;
		font-size: 2.2rem;
		font-weight: 700;
		color: #111827;
	}

	.welcome-brand em {
		font-style: normal;
		color: #10b981;
	}

	.welcome-description {
		font-size: 0.9rem;
		color: #6b7280;
		line-height: 1.6;
		margin-bottom: 1.5rem;
	}

	/* CTA Group */
	.cta-group {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-bottom: 1.5rem;
	}

	.btn-primary {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		background: #10b981;
		color: #ffffff;
		font-family: 'Inter', sans-serif;
		font-size: 0.95rem;
		font-weight: 600;
		padding: 12px 24px;
		border-radius: 12px;
		border: none;
		cursor: pointer;
		text-decoration: none;
		transition: all 0.3s ease;
	}

	.btn-primary:hover {
		background: #059669;
		transform: translateY(-2px);
		box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
	}

	.btn-primary:hover .arrow-icon {
		transform: translateX(4px);
	}

	.arrow-icon {
		width: 18px;
		height: 18px;
		transition: transform 0.3s ease;
	}

	.btn-secondary-group {
		display: flex;
		gap: 10px;
		justify-content: center;
	}

	.btn-secondary {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		color: #374151;
		font-family: 'Inter', sans-serif;
		font-size: 0.8rem;
		font-weight: 500;
		padding: 8px 16px;
		border-radius: 10px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-secondary:hover {
		background: #f3f4f6;
		transform: translateY(-1px);
	}

	.btn-secondary svg {
		width: 14px;
		height: 14px;
	}

	/* Stats Row */
	.stats-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 20px;
		padding-top: 1rem;
		border-top: 1px solid #f0f0f0;
	}

	.stat-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
	}

	.stat-value {
		font-size: 1.1rem;
		font-weight: 700;
		color: #111827;
	}

	.stat-label {
		font-size: 0.65rem;
		font-weight: 500;
		color: #9ca3af;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.divider {
		width: 1px;
		height: 30px;
		background: #e5e7eb;
	}

	/* Ticker Bar */
	.ticker-bar {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background: #ffffff;
		border-top: 1px solid #f0f0f0;
		padding: 8px 0;
		overflow: hidden;
		z-index: 20;
	}

	.ticker-track {
		display: flex;
		gap: 32px;
		animation: tickerScroll 30s linear infinite;
		white-space: nowrap;
	}

	.ticker-item {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-size: 12px;
		color: #6b7280;
		font-weight: 500;
	}

	.ticker-item .dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
	}

	.ticker-item .dot.green { background: #10b981; }
	.ticker-item .dot.blue { background: #3b82f6; }
	.ticker-item .dot.amber { background: #f59e0b; }
	.ticker-item .dot.purple { background: #8b5cf6; }

	@keyframes tickerScroll {
		0% { transform: translateX(0); }
		100% { transform: translateX(-50%); }
	}

	/* Responsive */
	@media (max-width: 768px) {
		.floating-cards {
			display: none;
		}

		.welcome-content {
			padding: 2rem 1.5rem;
			margin: 1rem;
		}

		.welcome-brand {
			font-size: 1.6rem;
		}

		.welcome-greeting {
			font-size: 0.8rem;
		}

		.welcome-description {
			font-size: 0.85rem;
		}

		.btn-primary {
			font-size: 0.85rem;
			padding: 10px 20px;
		}

		.btn-secondary {
			font-size: 0.75rem;
			padding: 6px 12px;
		}

		.stats-row {
			gap: 12px;
		}

		.stat-value {
			font-size: 0.9rem;
		}
	}
</style>