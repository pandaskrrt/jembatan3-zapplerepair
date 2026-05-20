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
	<!-- Professional Fonts -->
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
						<path d="M3 9L12 3L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
						<path d="M9 22V12H15V22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				</div>
				<h1 class="brand-title">
					ROXY ZAPPLEREPAIR<br>
					<span>STOCK MANAGEMENT</span>
				</h1>
			</div>
		</div>

		<!-- Center Section - Empty -->
		<div class="nav-center"></div>

		<!-- Right Section -->
		<div class="nav-right">
			<div class="stats-wrapper">
				<span class="stats-text">INVENTORY SYSTEM</span>
				<button class="fullscreen-btn" onclick={toggleFullscreen} aria-label="Toggle fullscreen">
					<svg class="fullscreen-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						{#if !isFullscreen}
							<path d="M15 3H21V9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
							<path d="M9 21H3V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
							<path d="M21 3L14 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
							<path d="M3 21L10 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
						{:else}
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
	* {
		margin: 0;
		padding: 0;
		box-sizing: border-box;
	}

	/* White Background */
	:global(body) {
		background: #f5f5f5;
		margin: 0;
		padding: 0;
		overflow-x: hidden;
		font-family: 'Inter', sans-serif;
	}

	/* Navbar Styles - Professional */
	.navbar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 1000;
		background: #ffffff;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
		border-bottom: 1px solid #e0e0e0;
	}

	.navbar-container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 0.75rem 2rem;
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
		gap: 1rem;
		text-decoration: none;
	}

	.icon-box {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		background: #f0fdf4;
		border-radius: 10px;
		transition: all 0.3s ease;
	}

	.icon-box:hover {
		transform: scale(1.02);
		background: #dcfce7;
	}

	.store-icon {
		width: 26px;
		height: 26px;
		color: #10b981;
	}

	.brand-title {
		font-family: 'Inter', sans-serif;
		font-size: 1.2rem;
		font-weight: 600;
		color: #333333;
		margin: 0;
		letter-spacing: -0.3px;
		line-height: 1.3;
	}

	.brand-title span {
		font-size: 0.85rem;
		font-weight: 500;
		color: #10b981;
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
		gap: 0.75rem;
		background: #f5f5f5;
		padding: 0.5rem 1rem;
		border-radius: 8px;
		border: 1px solid #e0e0e0;
	}

	.stats-text {
		font-family: 'Inter', sans-serif;
		font-size: 0.75rem;
		font-weight: 500;
		color: #666666;
		letter-spacing: 0.5px;
	}

	.fullscreen-btn {
		background: #f5f5f5;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		padding: 6px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.fullscreen-btn:hover {
		background: #10b981;
		border-color: #10b981;
	}

	.fullscreen-btn:hover .fullscreen-icon {
		color: #ffffff;
	}

	.fullscreen-icon {
		width: 18px;
		height: 18px;
		color: #666666;
		transition: all 0.2s ease;
	}

	/* Main Content */
	.main-content {
		min-height: 100vh;
		background: #f5f5f5;
		position: relative;
		padding-top: 70px;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.navbar-container {
			padding: 0.6rem 1rem;
		}

		.brand-wrapper {
			gap: 0.75rem;
		}

		.icon-box {
			width: 38px;
			height: 38px;
		}

		.store-icon {
			width: 22px;
			height: 22px;
		}

		.brand-title {
			font-size: 1rem;
		}

		.brand-title span {
			font-size: 0.7rem;
		}

		.stats-text {
			display: none;
		}

		.stats-wrapper {
			padding: 0.5rem;
		}
	}

	@media (max-width: 480px) {
		.icon-box {
			width: 34px;
			height: 34px;
		}

		.store-icon {
			width: 20px;
			height: 20px;
		}

		.brand-title {
			font-size: 0.85rem;
		}
	}
</style>