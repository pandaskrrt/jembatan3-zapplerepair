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
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com">
	<link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700&display=swap" rel="stylesheet">
</svelte:head>

<!-- Navbar -->
<nav class="navbar">
	<div class="navbar-container">
		<!-- Left Section - Brand -->
		<div class="nav-left">
			<div class="brand-wrapper">
				<div class="icon-box">
					<svg class="store-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M20 7L12 3L4 7L12 11L20 7Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
						<path d="M4 7V17L12 21L20 17V7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
						<path d="M12 11V21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				</div>
				<h1 class="brand-title">
					ROXY ZAPPLEREPAIR<br>
					<span>SHOWCASE</span>
				</h1>
			</div>
		</div>

		<!-- Right Section -->
		<div class="nav-right">
			<div class="stats-wrapper">
				<span class="stats-text">INVENTORY SYSTEM</span>
				<button class="fullscreen-btn" onclick={toggleFullscreen} aria-label="Toggle fullscreen">
					<svg class="fullscreen-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						{#if !isFullscreen}
							<path d="M15 3H21V9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
							<path d="M9 21H3V15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
							<path d="M21 3L14 10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
							<path d="M3 21L10 14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
						{:else}
							<path d="M8 3V8H3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
							<path d="M16 3V8H21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
							<path d="M8 21V16H3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
							<path d="M16 21V16H21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
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
	* {
		margin: 0;
		padding: 0;
		box-sizing: border-box;
	}

	:global(body) {
		background: #f5f5f5;
		margin: 0;
		padding: 0;
		overflow-x: hidden;
		font-family: 'Inter', sans-serif;
	}

	/* Navbar */
	.navbar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 1000;
		background: #ffffff;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
		border-bottom: 1px solid #e5e7eb;
	}

	.navbar-container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 0.75rem 2rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 2rem;
	}

	/* Left Section - Brand */
	.nav-left {
		flex-shrink: 0;
	}

	.brand-wrapper {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.icon-box {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 42px;
		height: 42px;
		background: #f0fdf4;
		border-radius: 10px;
		transition: all 0.2s ease;
	}

	.icon-box:hover {
		background: #dcfce7;
		transform: scale(1.02);
	}

	.store-icon {
		width: 24px;
		height: 24px;
		color: #10b981;
	}

	.brand-title {
		font-family: 'Inter', sans-serif;
		font-size: 1rem;
		font-weight: 600;
		color: #111827;
		margin: 0;
		line-height: 1.3;
	}

	.brand-title span {
		font-size: 0.7rem;
		font-weight: 500;
		color: #10b981;
	}

	/* Center Section - Navigation Links */
	.nav-center {
		flex: 1;
		display: flex;
		justify-content: center;
	}

	.nav-links {
		display: flex;
		gap: 1.5rem;
	}

	.nav-link {
		font-family: 'Inter', sans-serif;
		font-size: 0.85rem;
		font-weight: 500;
		color: #4b5563;
		text-decoration: none;
		padding: 0.5rem 0;
		transition: all 0.2s ease;
		border-bottom: 2px solid transparent;
	}

	.nav-link:hover {
		color: #10b981;
		border-bottom-color: #10b981;
	}

	.nav-link.active {
		color: #10b981;
		border-bottom-color: #10b981;
	}

	/* Right Section */
	.nav-right {
		flex-shrink: 0;
	}

	.stats-wrapper {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		background: #f9fafb;
		padding: 0.4rem 0.75rem;
		border-radius: 8px;
		border: 1px solid #e5e7eb;
	}

	.stats-text {
		font-family: 'Inter', sans-serif;
		font-size: 0.7rem;
		font-weight: 500;
		color: #6b7280;
		letter-spacing: 0.5px;
	}

	.fullscreen-btn {
		background: transparent;
		border: none;
		padding: 4px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 6px;
		transition: all 0.2s ease;
	}

	.fullscreen-btn:hover {
		background: #f3f4f6;
	}

	.fullscreen-icon {
		width: 18px;
		height: 18px;
		color: #6b7280;
	}

	/* Main Content */
	.main-content {
		min-height: 100vh;
		padding-top: 72px;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.navbar-container {
			padding: 0.6rem 1rem;
			gap: 1rem;
		}

		.nav-links {
			gap: 0.75rem;
		}

		.nav-link {
			font-size: 0.75rem;
		}

		.brand-title {
			font-size: 0.8rem;
		}

		.brand-title span {
			font-size: 0.6rem;
		}

		.icon-box {
			width: 36px;
			height: 36px;
		}

		.store-icon {
			width: 20px;
			height: 20px;
		}

		.stats-text {
			display: none;
		}
	}

	@media (max-width: 600px) {
		.nav-center {
			display: none;
		}
	}
</style>