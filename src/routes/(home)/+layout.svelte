<script lang="ts">
	let { children } = $props();

	
	let isFullscreen = $state(false);

	function toggleFullscreen() {
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen();
			isFullscreen = true;
		} else {
			if (document.exitFullscreen) {
				document.exitFullscreen();
				isFullscreen = false;
			}
		}
	}
</script>

<svelte:head>
	<!-- Tech/Gaming Fonts - Orbitron and Rajdhani -->
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com">
	<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</svelte:head>

<!-- Navbar -->
<nav class="navbar">
	<div class="navbar-container">
		<!-- Left Section - Icon + Text -->
		<div class="nav-left">
			<div class="brand-wrapper">
				<div class="icon-box">
					<!-- Store Icon -->
					<svg class="store-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M3 9L12 3L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
						<path d="M9 22V12H15V22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				</div>
				<h1 class="brand-title">
					ROXY ZAPPLEREPAIR<br>
					SHOWCASE
				</h1>
			</div>
		</div>

		<!-- Center Section - Empty -->
		<div class="nav-center"></div>

		<!-- Right Section -->
		<div class="nav-right">
			<div class="stats-wrapper">
				<span class="stats-text">100+ LISTED</span>
				<button class="fullscreen-btn" onclick={toggleFullscreen} aria-label="Toggle fullscreen">
					<svg class="fullscreen-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						{#if !isFullscreen}
							<!-- Fullscreen Enter Icon -->
							<path d="M15 3H21V9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
							<path d="M9 21H3V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
							<path d="M21 3L14 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
							<path d="M3 21L10 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
						{:else}
							<!-- Fullscreen Exit Icon -->
							<path d="M8 3V8H3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
							<path d="M16 3V8H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
							<path d="M8 21V16H3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
							<path d="M16 21V16H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
						{/if}
					</svg>
				</button>
			</div>
		</div>
	</div>
</nav>

<!-- Page Content -->
<main class="main-content">
	{@render children()}
</main>

<style>
	/* Font Orbitron & Rajdhani */
	* {
		margin: 0;
		padding: 0;
		box-sizing: border-box;
	}

	/* Black Background for entire page */
	:global(body) {
		background: #000000;
		margin: 0;
		padding: 0;
		overflow-x: hidden;
	}

	/* Navbar Styles dengan font gaming */
	.navbar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 1000;
		background: rgba(0, 0, 0, 0.8);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border-bottom: 1px solid rgba(0, 255, 0, 0.1);
	}

	.navbar-container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 1rem 2rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	/* Left Section - Brand */
	.nav-left {
		flex: 0 0 auto;
	}

	.brand-wrapper {
		display: flex;
		align-items: center;
		gap: 1.1rem;
		text-decoration: none;
	}

	.icon-box {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 48px;           /* dikecilkan sedikit */
		height: 48px;
		background: rgba(45, 106, 79, 0.12);     /* warna hijau lebih natural */
		backdrop-filter: blur(6px);
		-webkit-backdrop-filter: blur(6px);
		border: 1px solid rgba(45, 106, 79, 0.25);
		border-radius: 12px;
		box-shadow: 
			0 4px 15px rgba(45, 106, 79, 0.15),
			inset 0 2px 8px rgba(45, 106, 79, 0.1);
		transition: all 0.3s ease;
	}

	.icon-box:hover {
		transform: scale(1.05);
		box-shadow: 
			0 6px 20px rgba(45, 106, 79, 0.25),
			inset 0 2px 8px rgba(45, 106, 79, 0.15);
	}

	.brand-title {
		font-size: 2.1rem;           /* dikecilkan */
		font-weight: 700;
		line-height: 1.05;
		margin: 0;
		color: #1a3a2f;
		letter-spacing: -0.02em;
	}

	/* Untuk membuat 2 baris dengan proporsi yang bagus */
	.brand-title br {
		display: block;
	}

	/* Optional: Jika ingin baris kedua lebih ringan */
	.brand-title span {
		font-size: 1.85rem;
		font-weight: 600;
		color: #2d6a4f;
	}

	.store-icon {
		width: 30px;
		height: 30px;
		color: #00ff00;
		filter: drop-shadow(0 0 8px rgba(0, 255, 0, 0.6));
	}

	.brand-title {
		font-family: 'Orbitron', sans-serif;
		font-size: 1.5rem;
		font-weight: 700;
		color: #00ff00;
		text-shadow: 0 0 15px rgba(0, 255, 0, 0.5);
		margin: 0;
		letter-spacing: 2px;
	}

	/* Center Section - Empty */
	.nav-center {
		flex: 1;
	}

	/* Right Section */
	.nav-right {
		flex: 0 0 auto;
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.stats-wrapper {
		display: flex;
		align-items: center;
		gap: 1rem;
		background: rgba(0, 255, 0, 0.05);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		padding: 0.5rem 1.5rem;
		border-radius: 2rem;
		border: 1px solid rgba(0, 255, 0, 0.2);
	}

	.stats-text {
		font-family: 'Orbitron', sans-serif;
		font-size: 0.95rem;
		font-weight: 500;
		color: #00ff00;
		text-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
		letter-spacing: 2px;
	}

	.fullscreen-btn {
		background: rgba(0, 255, 0, 0.05);
		border: 1px solid rgba(0, 255, 0, 0.2);
		border-radius: 12px;
		padding: 8px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s ease;
		backdrop-filter: blur(5px);
		-webkit-backdrop-filter: blur(5px);
	}

	.fullscreen-btn:hover {
		background: rgba(0, 255, 0, 0.1);
		border-color: rgba(0, 255, 0, 0.4);
		transform: scale(1.05);
		box-shadow: 0 0 20px rgba(0, 255, 0, 0.2);
	}

	.fullscreen-icon {
		width: 22px;
		height: 22px;
		color: #00ff00;
		filter: drop-shadow(0 0 8px rgba(0, 255, 0, 0.3));
	}

	/* Main Content - Page wrapper */
	.main-content {
		min-height: 100vh;
		background: #000000;
		color: #fff;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		padding-top: 80px;
		overflow: hidden;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.navbar-container {
			padding: 0.75rem 1rem;
		}

		.brand-wrapper {
			gap: 0.75rem;
		}

		.icon-box {
			width: 44px;
			height: 44px;
			border-radius: 12px;
		}

		.store-icon {
			width: 26px;
			height: 26px;
		}

		.brand-title {
			font-size: 1.2rem;
		}

		.stats-text {
			display: none;
		}

		.stats-wrapper {
			padding: 0.5rem;
		}

		.fullscreen-btn {
			padding: 6px;
		}

		.fullscreen-icon {
			width: 20px;
			height: 20px;
		}
	}

	@media (max-width: 480px) {
		.icon-box {
			width: 38px;
			height: 38px;
			border-radius: 10px;
		}

		.store-icon {
			width: 22px;
			height: 22px;
		}

		.brand-title {
			font-size: 1rem;
			letter-spacing: 1px;
		}
	}
</style>