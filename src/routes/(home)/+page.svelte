<div class="card-silhouettes">
	<!-- Card 1 - Charizard (Top Left) -->
	<div class="card-silhouette card-1">
		<div class="card-image" style="background-image: url('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png')">
			<div class="shiny-overlay"></div>
			<div class="holo-effect"></div>
			<div class="sparkle sparkle-1"></div>
			<div class="sparkle sparkle-2"></div>
			<div class="sparkle sparkle-3"></div>
		</div>
		<div class="card-glow"></div>
		<div class="card-label">
			<span class="pokemon-name">CHARIZARD</span>
			<span class="pokemon-rarity">HOLOGRAPHIC</span>
		</div>
	</div>

	<!-- Card 2 - Pikachu (Top Right) -->
	<div class="card-silhouette card-2">
		<div class="card-image" style="background-image: url('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png')">
			<div class="shiny-overlay"></div>
			<div class="holo-effect"></div>
			<div class="sparkle sparkle-1"></div>
			<div class="sparkle sparkle-2"></div>
			<div class="sparkle sparkle-3"></div>
		</div>
		<div class="card-glow"></div>
		<div class="card-label">
			<span class="pokemon-name">PIKACHU</span>
			<span class="pokemon-rarity">HOLOGRAPHIC</span>
		</div>
	</div>

	<!-- Card 3 - Mewtwo (Bottom Left) -->
	<div class="card-silhouette card-3">
		<div class="card-image" style="background-image: url('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png')">
			<div class="shiny-overlay"></div>
			<div class="holo-effect"></div>
			<div class="sparkle sparkle-1"></div>
			<div class="sparkle sparkle-2"></div>
			<div class="sparkle sparkle-3"></div>
		</div>
		<div class="card-glow"></div>
		<div class="card-label">
			<span class="pokemon-name">MEWTWO</span>
			<span class="pokemon-rarity">HOLOGRAPHIC</span>
		</div>
	</div>

	<!-- Card 4 - Gengar (Bottom Right) -->
	<div class="card-silhouette card-4">
		<div class="card-image" style="background-image: url('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png')">
			<div class="shiny-overlay"></div>
			<div class="holo-effect"></div>
			<div class="sparkle sparkle-1"></div>
			<div class="sparkle sparkle-2"></div>
			<div class="sparkle sparkle-3"></div>
		</div>
		<div class="card-glow"></div>
		<div class="card-label">
			<span class="pokemon-name">GENGAR</span>
			<span class="pokemon-rarity">HOLOGRAPHIC</span>
		</div>
	</div>

	<!-- Card 5 - Rayquaza (Center Left) -->
	<div class="card-silhouette card-5">
		<div class="card-image" style="background-image: url('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/384.png')">
			<div class="shiny-overlay"></div>
			<div class="holo-effect"></div>
			<div class="sparkle sparkle-1"></div>
			<div class="sparkle sparkle-2"></div>
			<div class="sparkle sparkle-3"></div>
		</div>
		<div class="card-glow"></div>
		<div class="card-label">
			<span class="pokemon-name">RAYQUAZA</span>
			<span class="pokemon-rarity">HOLOGRAPHIC</span>
		</div>
	</div>

	<!-- Card 6 - Lucario (Center Right) -->
	<div class="card-silhouette card-6">
		<div class="card-image" style="background-image: url('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/448.png')">
			<div class="shiny-overlay"></div>
			<div class="holo-effect"></div>
			<div class="sparkle sparkle-1"></div>
			<div class="sparkle sparkle-2"></div>
			<div class="sparkle sparkle-3"></div>
		</div>
		<div class="card-glow"></div>
		<div class="card-label">
			<span class="pokemon-name">LUCARIO</span>
			<span class="pokemon-rarity">HOLOGRAPHIC</span>
		</div>
	</div>
</div>

<div class="welcome-container">
	<div class="welcome-content">
		<h1 class="welcome-title">
			<span class="welcome-greeting">WELCOME TO</span>
			<span class="welcome-brand">CARD SHOWCASE</span>
		</h1>
		
		<p class="welcome-description">
			DISCOVER AMAZING POKEMON CARDS AND COLLECTIONS
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
	.card-silhouettes {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 1;
	}

	.card-silhouette {
		position: absolute;
		width: 280px;
		height: 390px;
		border-radius: 24px;
		overflow: hidden;
		box-shadow: 0 20px 40px rgba(0, 255, 0, 0.2);
		animation: floatCard 10s ease-in-out infinite;
		transition: all 0.5s ease;
		border: 1px solid rgba(0, 255, 0, 0.3);
	}

	.card-silhouette:hover {
		transform: scale(1.02) rotate(0deg) !important;
		z-index: 100;
		border-color: rgba(0, 255, 0, 0.8);
		box-shadow: 0 0 30px rgba(0, 255, 0, 0.4);
	}

	.card-image {
		width: 100%;
		height: 100%;
		background-size: cover;
		background-position: center;
		position: relative;
	}

	/* Shiny Overlay - Efek mengkilap dasar */
	.shiny-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(
			135deg,
			rgba(0, 255, 0, 0.3) 0%,
			rgba(0, 255, 0, 0.1) 40%,
			rgba(0, 255, 0, 0) 60%,
			rgba(0, 255, 0, 0.2) 100%
		);
		pointer-events: none;
		z-index: 2;
		animation: shinyMove 6s ease-in-out infinite;
	}

	/* Holographic Effect - Efek hologram */
	.holo-effect {
		position: absolute;
		top: -50%;
		left: -50%;
		width: 200%;
		height: 200%;
		background: linear-gradient(
			45deg,
			rgba(0, 255, 0, 0.15) 0%,
			rgba(0, 255, 0, 0.15) 25%,
			rgba(0, 255, 0, 0.15) 50%,
			rgba(0, 255, 0, 0.15) 75%,
			rgba(0, 255, 0, 0.15) 100%
		);
		animation: holoRotate 8s linear infinite;
		pointer-events: none;
		z-index: 3;
		mix-blend-mode: overlay;
		opacity: 0.3;
	}

	/* Sparkles - Kilauan bintang */
	.sparkle {
		position: absolute;
		width: 4px;
		height: 4px;
		background: #00ff00;
		border-radius: 50%;
		filter: blur(1px);
		animation: sparkle 3s ease-in-out infinite;
		z-index: 4;
	}

	.sparkle-1 {
		top: 20%;
		left: 30%;
		animation-delay: 0s;
	}

	.sparkle-2 {
		top: 60%;
		right: 25%;
		width: 6px;
		height: 6px;
		animation-delay: 1s;
	}

	.sparkle-3 {
		bottom: 30%;
		left: 40%;
		width: 3px;
		height: 3px;
		animation-delay: 2s;
	}

	/* Card Glow - Efek cahaya di sekitar card */
	.card-glow {
		position: absolute;
		top: -1px;
		left: -1px;
		right: -1px;
		bottom: -1px;
		border-radius: 25px;
		background: linear-gradient(
			45deg,
			#00ff00,
			#00cc00,
			#009900,
			#00ff00
		);
		background-size: 200% 200%;
		opacity: 0;
		animation: glowPulse 4s ease-in-out infinite;
		z-index: -1;
		filter: blur(3px);
	}

	.card-silhouette:hover .card-glow {
		opacity: 0.4;
	}

	/* Card Label */
	.card-label {
		position: absolute;
		bottom: 15px;
		left: 15px;
		right: 15px;
		display: flex;
		flex-direction: column;
		background: rgba(0, 0, 0, 0.8);
		backdrop-filter: blur(5px);
		-webkit-backdrop-filter: blur(5px);
		padding: 0.8rem;
		border-radius: 12px;
		border: 1px solid rgba(0, 255, 0, 0.3);
		z-index: 10;
	}

	.pokemon-name {
		font-family: 'Orbitron', sans-serif;
		font-size: 1rem;
		font-weight: 700;
		color: #00ff00;
		text-transform: uppercase;
		letter-spacing: 2px;
		text-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
	}

	.pokemon-rarity {
		font-family: 'Rajdhani', sans-serif;
		font-size: 0.7rem;
		color: #00ff00;
		letter-spacing: 3px;
		margin-top: 2px;
		opacity: 0.8;
	}

	/* Individual Card Positions and Rotations - Desktop Only */
	.card-1 {
		width: 280px;
		height: 390px;
		top: 5%;
		left: 5%;
		transform: rotate(-12deg);
		animation-delay: 0s;
	}

	.card-2 {
		width: 260px;
		height: 360px;
		top: 8%;
		right: 5%;
		transform: rotate(8deg);
		animation-delay: 1s;
	}

	.card-3 {
		width: 300px;
		height: 420px;
		bottom: 5%;
		left: 3%;
		transform: rotate(10deg);
		animation-delay: 2s;
	}

	.card-4 {
		width: 270px;
		height: 380px;
		bottom: 8%;
		right: 4%;
		transform: rotate(-8deg);
		animation-delay: 3s;
	}

	.card-5 {
		width: 240px;
		height: 340px;
		top: 40%;
		left: 15%;
		transform: rotate(15deg);
		animation-delay: 4s;
	}

	.card-6 {
		width: 250px;
		height: 350px;
		top: 45%;
		right: 12%;
		transform: rotate(-15deg);
		animation-delay: 5s;
	}

	/* Animations */
	@keyframes floatCard {
		0%, 100% {
			transform: translateY(0) rotate(var(--rotate, 0deg));
		}
		50% {
			transform: translateY(-10px) rotate(var(--rotate, 0deg));
		}
	}

	@keyframes shinyMove {
		0%, 100% {
			opacity: 0.3;
			transform: translateX(-5%) translateY(-5%);
		}
		50% {
			opacity: 0.5;
			transform: translateX(5%) translateY(5%);
		}
	}

	@keyframes holoRotate {
		0% {
			transform: rotate(0deg) scale(1);
			opacity: 0.2;
		}
		50% {
			transform: rotate(180deg) scale(1.1);
			opacity: 0.3;
		}
		100% {
			transform: rotate(360deg) scale(1);
			opacity: 0.2;
		}
	}

	@keyframes sparkle {
		0%, 100% {
			opacity: 0;
			transform: scale(0);
		}
		50% {
			opacity: 1;
			transform: scale(1.2);
			box-shadow: 0 0 10px #00ff00;
		}
	}

	@keyframes glowPulse {
		0%, 100% {
			background-position: 0% 50%;
			opacity: 0.1;
		}
		50% {
			background-position: 100% 50%;
			opacity: 0.2;
		}
	}

	/* Set rotate variables for each card */
	.card-1 { --rotate: -12deg; }
	.card-2 { --rotate: 8deg; }
	.card-3 { --rotate: 10deg; }
	.card-4 { --rotate: -8deg; }
	.card-5 { --rotate: 15deg; }
	.card-6 { --rotate: -15deg; }

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
		gap: 2rem;
		padding: 3rem;
		border-radius: 2rem;
		max-width: 700px;
		margin: 0 auto;
	}

	.welcome-title {
		font-family: 'Orbitron', sans-serif;
		font-size: 4rem;
		font-weight: 800;
		line-height: 1.2;
		margin: 0;
		text-transform: uppercase;
	}

	.welcome-greeting {
		display: block;
		font-family: 'Rajdhani', sans-serif;
		font-size: 2rem;
		font-weight: 500;
		color: #00ff00;
		margin-bottom: 0.5rem;
		letter-spacing: 4px;
		text-shadow: 0 0 20px rgba(0, 255, 0, 0.5);
	}

	.welcome-brand {
		display: block;
		font-family: 'Orbitron', sans-serif;
		font-weight: 900;
		color: #00ff00;
		text-shadow: 0 0 30px rgba(0, 255, 0, 0.6);
		letter-spacing: 6px;
	}

	.welcome-description {
		font-family: 'Rajdhani', sans-serif;
		font-size: 1.25rem;
		font-weight: 500;
		color: #00ff00;
		max-width: 600px;
		margin: 0 auto;
		line-height: 1.6;
		letter-spacing: 2px;
		opacity: 0.8;
	}

	.welcome-button {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		background: rgba(0, 255, 0, 0.1);
		border: 2px solid rgba(0, 255, 0, 0.4);
		color: #00ff00;
		font-family: 'Orbitron', sans-serif;
		font-size: 1.125rem;
		font-weight: 600;
		padding: 1rem 2.5rem;
		border-radius: 50px;
		cursor: pointer;
		transition: all 0.3s ease;
		backdrop-filter: blur(5px);
		-webkit-backdrop-filter: blur(5px);
		margin-top: 1rem;
		letter-spacing: 3px;
		text-decoration: none;
	}

	.welcome-button:hover {
		background: rgba(0, 255, 0, 0.2);
		border-color: #00ff00;
		transform: translateY(-2px);
		box-shadow: 0 0 30px rgba(0, 255, 0, 0.3);
	}

	.button-icon {
		width: 20px;
		height: 20px;
		transition: transform 0.3s ease;
		stroke: #00ff00;
	}

	.welcome-button:hover .button-icon {
		transform: translateX(5px);
	}

	/* RESPONSIVE DESIGN */
	
	/* Desktop (769px and above) - Cards Tampil */
	@media (min-width: 769px) {
		.card-silhouettes {
			display: block;
		}
	}

	/* Mobile (max-width: 768px) - Cards Hilang */
	@media (max-width: 768px) {
		.card-silhouettes {
			display: none;
		}

		.welcome-content {
			padding: 2rem;
		}

		.welcome-title {
			font-size: 2.5rem;
		}

		.welcome-greeting {
			font-size: 1.5rem;
		}

		.welcome-description {
			font-size: 1rem;
			padding: 0 1rem;
		}

		.welcome-button {
			padding: 0.875rem 2rem;
			font-size: 1rem;
		}
	}

	/* Small Mobile (max-width: 480px) */
	@media (max-width: 480px) {
		.welcome-title {
			font-size: 2rem;
		}

		.welcome-greeting {
			font-size: 1.25rem;
		}

		.welcome-brand {
			letter-spacing: 4px;
		}
	}
</style>