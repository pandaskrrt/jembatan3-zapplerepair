<div class="stock-silhouettes">
	<!-- Stock Item 1 - Top Left -->
	<div class="stock-item stock-1">
		<div class="item-icon">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
				<path d="M20 7L12 3L4 7L12 11L20 7Z" stroke="currentColor" fill="none"/>
				<path d="M4 7V17L12 21L20 17V7" stroke="currentColor" fill="none"/>
				<path d="M12 11V21" stroke="currentColor" fill="none"/>
				<path d="M8 5.5L16 9.5" stroke="currentColor" fill="none"/>
			</svg>
		</div>
		<div class="item-glow"></div>
		<div class="item-label">
			<span class="item-name">WAREHOUSE A</span>
			<span class="item-status">ACTIVE</span>
		</div>
	</div>

	<!-- Stock Item 2 - Top Right -->
	<div class="stock-item stock-2">
		<div class="item-icon">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
				<rect x="3" y="8" width="18" height="14" rx="2" stroke="currentColor" fill="none"/>
				<path d="M7 12H17" stroke="currentColor" stroke-linecap="round"/>
				<path d="M7 16H14" stroke="currentColor" stroke-linecap="round"/>
				<path d="M8 4L16 4" stroke="currentColor" stroke-linecap="round"/>
			</svg>
		</div>
		<div class="item-glow"></div>
		<div class="item-label">
			<span class="item-name">INVENTORY</span>
			<span class="item-status">MANAGED</span>
		</div>
	</div>

	<!-- Stock Item 3 - Bottom Left -->
	<div class="stock-item stock-3">
		<div class="item-icon">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
				<circle cx="12" cy="12" r="10" stroke="currentColor" fill="none"/>
				<path d="M12 6V12L16 14" stroke="currentColor" stroke-linecap="round"/>
			</svg>
		</div>
		<div class="item-glow"></div>
		<div class="item-label">
			<span class="item-name">TRACKING</span>
			<span class="item-status">REAL-TIME</span>
		</div>
	</div>

	<!-- Stock Item 4 - Bottom Right -->
	<div class="stock-item stock-4">
		<div class="item-icon">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
				<path d="M22 12H18L15 21L9 3L6 12H2" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
		</div>
		<div class="item-glow"></div>
		<div class="item-label">
			<span class="item-name">ANALYTICS</span>
			<span class="item-status">INSIGHTS</span>
		</div>
	</div>

	<!-- Stock Item 5 - Center Left -->
	<div class="stock-item stock-5">
		<div class="item-icon">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
				<path d="M20 7H4C2.9 7 2 7.9 2 9V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V9C22 7.9 21.1 7 20 7Z" stroke="currentColor" fill="none"/>
				<path d="M16 21V5C16 3.9 15.1 3 14 3H10C8.9 3 8 3.9 8 5V21" stroke="currentColor" fill="none"/>
			</svg>
		</div>
		<div class="item-glow"></div>
		<div class="item-label">
			<span class="item-name">STORAGE</span>
			<span class="item-status">SECURE</span>
		</div>
	</div>

	<!-- Stock Item 6 - Center Right -->
	<div class="stock-item stock-6">
		<div class="item-icon">
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
				<path d="M21 16V8C20.9996 7.6493 20.9071 7.30481 20.7315 7.00119C20.556 6.69757 20.3037 6.44536 20 6.27L13 2.27C12.696 2.0945 12.3511 2.00205 12 2.00205C11.6489 2.00205 11.304 2.0945 11 2.27L4 6.27C3.69626 6.44536 3.44398 6.69757 3.26846 7.00119C3.09294 7.30481 3.00036 7.6493 3 8V16C3.00036 16.3507 3.09294 16.6952 3.26846 16.9988C3.44398 17.3024 3.69626 17.5546 4 17.73L11 21.73C11.304 21.9055 11.6489 21.9979 12 21.9979C12.3511 21.9979 12.696 21.9055 13 21.73L20 17.73C20.3037 17.5546 20.556 17.3024 20.7315 16.9988C20.9071 16.6952 20.9996 16.3507 21 16Z" stroke="currentColor" fill="none"/>
				<path d="M12 11V21" stroke="currentColor" fill="none"/>
				<path d="M8 5.5L16 9.5" stroke="currentColor" fill="none"/>
			</svg>
		</div>
		<div class="item-glow"></div>
		<div class="item-label">
			<span class="item-name">LOGISTICS</span>
			<span class="item-status">EFFICIENT</span>
		</div>
	</div>
</div>

<div class="welcome-container">
	<div class="welcome-content">
		<h1 class="welcome-title">
			<span class="welcome-greeting">WELCOME TO</span>
			<span class="welcome-brand">STOCK SYSTEM</span>
		</h1>
		
		<p class="welcome-description">
			MANAGE YOUR INVENTORY EFFICIENTLY AND ACCURATELY
		</p>
		
		<a 
			href="/showcase"                 
			data-sveltekit-reload               
			class="welcome-button"
		>
			<span>GET STARTED</span>
			<svg class="button-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
		</a>
	</div>
</div>

<style>
	.stock-silhouettes {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 1;
	}

	.stock-item {
		position: absolute;
		width: 200px;
		height: 200px;
		border-radius: 20px;
		overflow: hidden;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
		animation: floatItem 8s ease-in-out infinite;
		transition: all 0.3s ease;
		background: #ffffff;
		border: 1px solid #e0e0e0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
	}

	.stock-item:hover {
		transform: scale(1.02) rotate(0deg) !important;
		z-index: 100;
		border-color: #10b981;
		box-shadow: 0 8px 24px rgba(16, 185, 129, 0.15);
	}

	.item-icon {
		width: 70px;
		height: 70px;
		color: #10b981;
	}

	.item-icon svg {
		width: 100%;
		height: 100%;
	}

	.item-glow {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, rgba(16, 185, 129, 0.05), transparent);
		opacity: 0;
		transition: opacity 0.3s;
		border-radius: 20px;
		pointer-events: none;
	}

	.stock-item:hover .item-glow {
		opacity: 1;
	}

	.item-label {
		text-align: center;
		display: flex;
		flex-direction: column;
		background: #ffffff;
		padding: 0.5rem 1rem;
		border-radius: 8px;
		border: 1px solid #f0f0f0;
		z-index: 10;
	}

	.item-name {
		font-family: 'Inter', sans-serif;
		font-size: 0.85rem;
		font-weight: 600;
		color: #333333;
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	.item-status {
		font-family: 'Inter', sans-serif;
		font-size: 0.65rem;
		color: #10b981;
		letter-spacing: 0.5px;
		margin-top: 2px;
	}

	/* Individual Item Positions */
	.stock-1 {
		width: 180px;
		height: 180px;
		top: 5%;
		left: 5%;
		transform: rotate(-8deg);
		animation-delay: 0s;
	}

	.stock-2 {
		width: 160px;
		height: 160px;
		top: 10%;
		right: 5%;
		transform: rotate(6deg);
		animation-delay: 0.5s;
	}

	.stock-3 {
		width: 170px;
		height: 170px;
		bottom: 8%;
		left: 3%;
		transform: rotate(5deg);
		animation-delay: 1s;
	}

	.stock-4 {
		width: 155px;
		height: 155px;
		bottom: 12%;
		right: 4%;
		transform: rotate(-6deg);
		animation-delay: 1.5s;
	}

	.stock-5 {
		width: 150px;
		height: 150px;
		top: 42%;
		left: 8%;
		transform: rotate(10deg);
		animation-delay: 2s;
	}

	.stock-6 {
		width: 165px;
		height: 165px;
		top: 48%;
		right: 7%;
		transform: rotate(-10deg);
		animation-delay: 2.5s;
	}

	/* Animations */
	@keyframes floatItem {
		0%, 100% {
			transform: translateY(0) rotate(var(--rotate, 0deg));
		}
		50% {
			transform: translateY(-8px) rotate(var(--rotate, 0deg));
		}
	}

	/* Set rotate variables */
	.stock-1 { --rotate: -8deg; }
	.stock-2 { --rotate: 6deg; }
	.stock-3 { --rotate: 5deg; }
	.stock-4 { --rotate: -6deg; }
	.stock-5 { --rotate: 10deg; }
	.stock-6 { --rotate: -10deg; }

	/* Welcome Container */
	.welcome-container {
		width: 100%;
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		position: relative;
		z-index: 20;
	}

	.welcome-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		gap: 1.5rem;
		padding: 3rem;
		border-radius: 16px;
		max-width: 600px;
		margin: 0 auto;
		background: #ffffff;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
		border: 1px solid #e0e0e0;
	}

	.welcome-title {
		font-family: 'Inter', sans-serif;
		font-size: 2.5rem;
		font-weight: 700;
		line-height: 1.2;
		margin: 0;
	}

	.welcome-greeting {
		display: block;
		font-size: 0.9rem;
		font-weight: 500;
		color: #10b981;
		margin-bottom: 0.5rem;
		letter-spacing: 2px;
	}

	.welcome-brand {
		display: block;
		font-weight: 800;
		color: #333333;
		letter-spacing: -0.5px;
		font-size: 2rem;
	}

	.welcome-description {
		font-family: 'Inter', sans-serif;
		font-size: 0.9rem;
		font-weight: 400;
		color: #666666;
		max-width: 500px;
		margin: 0 auto;
		line-height: 1.5;
	}

	.welcome-button {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		background: #10b981;
		border: none;
		color: #ffffff;
		font-family: 'Inter', sans-serif;
		font-size: 0.9rem;
		font-weight: 600;
		padding: 0.875rem 2rem;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.3s ease;
		text-decoration: none;
		margin-top: 0.5rem;
	}

	.welcome-button:hover {
		background: #059669;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
	}

	.button-icon {
		width: 18px;
		height: 18px;
		transition: transform 0.3s ease;
	}

	.welcome-button:hover .button-icon {
		transform: translateX(4px);
	}

	/* RESPONSIVE DESIGN */
	@media (min-width: 769px) {
		.stock-silhouettes {
			display: block;
		}
	}

	@media (max-width: 768px) {
		.stock-silhouettes {
			display: none;
		}

		.welcome-content {
			padding: 2rem;
		}

		.welcome-title {
			font-size: 1.8rem;
		}

		.welcome-brand {
			font-size: 1.5rem;
		}

		.welcome-greeting {
			font-size: 0.8rem;
		}

		.welcome-description {
			font-size: 0.85rem;
			padding: 0 1rem;
		}

		.welcome-button {
			padding: 0.75rem 1.5rem;
			font-size: 0.85rem;
		}
	}

	@media (max-width: 480px) {
		.welcome-title {
			font-size: 1.5rem;
		}

		.welcome-brand {
			font-size: 1.2rem;
		}

		.welcome-greeting {
			font-size: 0.75rem;
		}
	}
</style>