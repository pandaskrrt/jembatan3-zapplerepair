<script lang="ts">
	import { goto } from '$app/navigation'

	let { data } = $props()

	let cabinets = data?.cabinets || []

	let searchTerm = $state('')
	let selectedCabinet = $state<number | null>(null)
	let showDeleteModal = $state(false)
	let isDeleting = $state(false)

	let showSuccessMessage = $state(false)
	let showErrorMessage = $state(false)
	let messageText = $state('')

	// Sintaks $derived Svelte 5 yang bersih dan benar
	let filteredCabinets = $derived(
		searchTerm
			? cabinets.filter(
					(cabinet) =>
						cabinet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
						cabinet.id.toString().includes(searchTerm)
				)
			: cabinets
	)

	let totalCabinets = cabinets.length

	async function navigateToAdd() {
		await goto('/admin/cabinet/create')
	}

	function openDeleteModal(id: number) {
		selectedCabinet = id
		showDeleteModal = true
	}

	function closeDeleteModal() {
		selectedCabinet = null
		showDeleteModal = false
	}

	async function handleDelete() {
		if (!selectedCabinet) return

		isDeleting = true

		try {
			const formData = new FormData()
			formData.append('id', selectedCabinet.toString())

			const response = await fetch('/admin/cabinet', {
				method: 'POST',
				body: formData
			})

			const result = await response.json()

			if (response.ok) {
				showSuccessMessage = true
				messageText = 'Cabinet deleted successfully'

				setTimeout(() => {
					window.location.reload()
				}, 1000)
			} else {
				showErrorMessage = true
				messageText = result.message || 'Failed to delete cabinet'
				isDeleting = false
				closeDeleteModal()

				setTimeout(() => {
					showErrorMessage = false
				}, 3000)
			}
		} catch (error) {
			console.error('Delete error:', error)
			showErrorMessage = true
			messageText = 'Network error! Please try again.'
			isDeleting = false
			closeDeleteModal()

			setTimeout(() => {
				showErrorMessage = false
			}, 3000)
		}
	}

	function handleModalKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			closeDeleteModal()
		}
	}
</script>

<svelte:head>
	<title>Admin - Cabinets</title>
</svelte:head>

<div class="page">
	<div class="header">
		<div class="header-left">
			<h1 class="page-title">Cabinets</h1>
			<p class="page-subtitle">Manage your storage cabinets</p>
		</div>
		<div class="header-right">
			<button class="add-btn" onclick={navigateToAdd}>
				<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<line x1="12" y1="5" x2="12" y2="19"></line>
					<line x1="5" y1="12" x2="19" y2="12"></line>
				</svg>
				<span>Add New Cabinet</span>
			</button>
		</div>
	</div>

	<div class="stats-grid">
		<div class="stat-card">
			<div class="stat-icon">
				<svg class="icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="21 8 21 21 3 21 3 8"></polyline>
					<rect x="1" y="3" width="22" height="5"></rect>
					<line x1="10" y1="12" x2="14" y2="12"></line>
				</svg>
			</div>
			<div class="stat-content">
				<span class="stat-label">Total Cabinets</span>
				<span class="stat-value">{totalCabinets}</span>
			</div>
		</div>
	</div>

	<div class="search-container">
		<div class="search-wrapper">
			<span class="search-icon">
				<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="11" cy="11" r="8"></circle>
					<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
				</svg>
			</span>
			<input
				type="text"
				class="search-input"
				placeholder="Search cabinets by name or ID..."
				bind:value={searchTerm}
				aria-label="Search cabinets"
			/>
			{#if searchTerm}
				<button class="clear-search" onclick={() => (searchTerm = '')} aria-label="Clear search">
					<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
			{/if}
		</div>
	</div>

	{#if showSuccessMessage}
		<div class="global-success">
			<svg class="icon success-color" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
				<polyline points="22 4 12 14.01 9 11.01"></polyline>
			</svg>
			<span>{messageText}</span>
		</div>
	{/if}

	{#if showErrorMessage}
		<div class="global-error">
			<svg class="icon error-color" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
				<line x1="12" y1="9" x2="12" y2="13"></line>
				<line x1="12" y1="17" x2="12.01" y2="17"></line>
			</svg>
			<span>{messageText}</span>
		</div>
	{/if}

	{#if filteredCabinets.length === 0}
		<div class="empty-state">
			<div class="empty-icon-wrapper">
				<svg class="icon-xl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="21 8 21 21 3 21 3 8"></polyline>
					<rect x="1" y="3" width="22" height="5"></rect>
					<line x1="10" y1="12" x2="14" y2="12"></line>
				</svg>
			</div>
			<h3 class="empty-title">No Cabinets Found</h3>
			<p class="empty-description">
				{#if searchTerm}
					No cabinets match your search criteria. Try a different search term.
				{:else}
					Get started by creating your first cabinet.
				{/if}
			</p>
			{#if searchTerm}
				<button class="empty-btn" onclick={() => (searchTerm = '')}>Clear Search</button>
			{:else}
				<button class="empty-btn" onclick={navigateToAdd}>Add Cabinet</button>
			{/if}
		</div>
	{:else}
		<div class="cabinets-grid">
			{#each filteredCabinets as cabinet (cabinet.id)}
				<div class="cabinet-card">
					<div class="card-header">
						<span class="cabinet-id">#{cabinet.id}</span>
						<div class="card-actions">
							<a
								href={`/admin/cabinet/edit?id=${cabinet.id}`}
								class="action-btn edit"
								data-sveltekit-reload
								aria-label="Edit cabinet"
							>
								<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
									<path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"></path>
								</svg>
							</a>
							<button
								class="action-btn delete"
								onclick={() => openDeleteModal(cabinet.id)}
								aria-label="Delete cabinet"
							>
								<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<polyline points="3 6 5 6 21 6"></polyline>
									<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
									<line x1="10" y1="11" x2="10" y2="17"></line>
									<line x1="14" y1="11" x2="14" y2="17"></line>
								</svg>
							</button>
						</div>
					</div>

					<div class="card-body">
						<h3 class="cabinet-name">{cabinet.name}</h3>

						<div class="cabinet-stats">
							<div class="stat-row">
								<span class="stat-label">Max Slots</span>
								<span class="stat-value">{cabinet.maxSlots}</span>
							</div>
						</div>
					</div>

					<div class="card-footer">
						<span class="footer-text">ID: {cabinet.id}</span>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	{#if showDeleteModal}
		<div
			class="modal-overlay"
			onclick={closeDeleteModal}
			onkeydown={handleModalKeydown}
			role="button"
			tabindex="0"
			aria-label="Close modal"
		>
			<div class="modal-content" onclick={(e) => e.stopPropagation()}>
				<button class="modal-close" onclick={closeDeleteModal}>
					<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>

				<div class="modal-icon text-error">
					<svg class="icon-xl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
						<line x1="12" y1="9" x2="12" y2="13"></line>
						<line x1="12" y1="17" x2="12.01" y2="17"></line>
					</svg>
				</div>
				<h2 class="modal-title">Delete Cabinet</h2>
				<p class="modal-description">
					Are you sure you want to delete this cabinet? This action cannot be undone.
				</p>

				<div class="modal-actions">
					<button class="modal-btn cancel" onclick={closeDeleteModal} disabled={isDeleting}>
						Cancel
					</button>
					<button class="modal-btn delete" onclick={handleDelete} disabled={isDeleting}>
						{#if isDeleting}
							Deleting...
						{:else}
							Delete Cabinet
						{/if}
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	/* UTILITY SVG GLOBAL */
	.icon {
		width: 1.25rem;
		height: 1.25rem;
	}
	.icon-sm {
		width: 1rem;
		height: 1rem;
	}
	.icon-lg {
		width: 1.75rem;
		height: 1.75rem;
	}
	.icon-xl {
		width: 3.5rem;
		height: 3.5rem;
	}

	.page {
		padding: 1.5rem;
		max-width: 1400px;
		margin: 0 auto;
		background: transparent;
		min-height: 100vh;
		color: #e3e4e6;
	}

	/* Header */
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	.page-title {
		font-family: 'Inter', sans-serif;
		font-size: 2rem;
		font-weight: 600;
		color: #ffffff;
		margin: 0 0 0.25rem 0;
	}

	.page-subtitle {
		color: #a1a1a5;
		font-size: 0.95rem;
	}

	.add-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		background: #10b981;
		border: none;
		border-radius: 8px;
		color: #ffffff;
		font-family: 'Inter', sans-serif;
		font-size: 0.95rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.add-btn:hover {
		background: #059669;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(1, 1fr);
		max-width: 300px;
		margin-bottom: 2rem;
	}

	.stat-card {
		display: flex;
		align-items: center;
		gap: 1.25rem;
		padding: 1.25rem;
		background: rgba(20, 20, 22, 0.8);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 12px;
		transition: all 0.2s ease;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
		backdrop-filter: blur(10px);
	}

	.stat-card:hover {
		transform: translateY(-2px);
		border-color: rgba(255, 255, 255, 0.15);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.stat-icon {
		color: #10b981;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.stat-content {
		display: flex;
		flex-direction: column;
	}

	.stat-label {
		font-size: 0.8rem;
		color: #71717a;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.stat-value {
		font-family: 'Inter', sans-serif;
		font-size: 1.5rem;
		font-weight: 600;
		color: #ffffff;
		line-height: 1.2;
	}

	.global-success {
		position: fixed;
		top: 100px;
		right: 2rem;
		background: #18181b;
		border: 1px solid #10b981;
		color: #ffffff;
		padding: 1rem 2rem;
		border-radius: 8px;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		z-index: 1100;
		animation: slideInRight 0.3s ease;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
	}

	.global-error {
		position: fixed;
		top: 100px;
		right: 2rem;
		background: #18181b;
		border: 1px solid #ef4444;
		color: #ffffff;
		padding: 1rem 2rem;
		border-radius: 8px;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		z-index: 1100;
		animation: slideInRight 0.3s ease;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
	}

	.success-color { color: #10b981; }
	.error-color { color: #ef4444; }

	@keyframes slideInRight {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	.search-container {
		margin-bottom: 2rem;
	}

	.search-wrapper {
		position: relative;
		max-width: 400px;
		display: flex;
		align-items: center;
	}

	.search-icon {
		position: absolute;
		left: 1rem;
		color: #71717a;
		display: flex;
		align-items: center;
	}

	.search-input {
		width: 100%;
		padding: 0.75rem 1rem 0.75rem 2.75rem;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 8px;
		color: #ffffff;
		font-family: 'Inter', sans-serif;
		font-size: 0.95rem;
		transition: all 0.2s ease;
	}

	.search-input:focus {
		outline: none;
		border-color: #10b981;
		box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1);
		background: rgba(255, 255, 255, 0.05);
	}

	.search-input::placeholder {
		color: #52525b;
	}

	.clear-search {
		position: absolute;
		right: 0.75rem;
		background: none;
		border: none;
		color: #71717a;
		cursor: pointer;
		padding: 0.25rem;
		border-radius: 50%;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.clear-search:hover {
		color: #ffffff;
		background: rgba(255, 255, 255, 0.08);
	}

	.cabinets-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 1.5rem;
	}

	.cabinet-card {
		background: rgba(20, 20, 22, 0.8);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 12px;
		overflow: hidden;
		transition: all 0.3s ease;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
		backdrop-filter: blur(10px);
	}

	.cabinet-card:hover {
		transform: translateY(-4px);
		border-color: rgba(255, 255, 255, 0.15);
		box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.02);
		border-bottom: 1px solid rgba(255, 255, 255, 0.04);
	}

	.cabinet-id {
		font-family: 'Inter', sans-serif;
		font-size: 0.85rem;
		font-weight: 500;
		color: #a1a1a5;
		background: rgba(255, 255, 255, 0.05);
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
	}

	.card-actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: nowrap;
		align-items: center;
	}

	.action-btn {
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 6px;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s ease;
		text-decoration: none;
		color: #a1a1a5;
		flex-shrink: 0;
	}

	.action-btn.edit:hover {
		background: rgba(16, 185, 129, 0.1);
		border-color: #10b981;
		color: #10b981;
		transform: scale(1.05);
	}

	.action-btn.delete:hover {
		background: rgba(239, 68, 68, 0.1);
		border-color: #ef4444;
		color: #ef4444;
		transform: scale(1.05);
	}

	.card-body {
		padding: 1.25rem;
	}

	.cabinet-name {
		font-family: 'Inter', sans-serif;
		font-size: 1.2rem;
		font-weight: 600;
		color: #ffffff;
		margin: 0 0 1rem 0;
	}

	.cabinet-stats {
		margin-bottom: 0;
	}

	.stat-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0;
		border-top: 1px solid rgba(255, 255, 255, 0.04);
	}

	.stat-row .stat-label {
		color: #71717a;
		font-size: 0.85rem;
	}

	.stat-row .stat-value {
		font-family: 'Inter', sans-serif;
		font-size: 1rem;
		font-weight: 600;
		color: #10b981;
	}

	.card-footer {
		padding: 0.75rem 1rem;
		background: rgba(255, 255, 255, 0.01);
		border-top: 1px solid rgba(255, 255, 255, 0.04);
		font-size: 0.75rem;
		color: #52525b;
	}

	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		background: rgba(20, 20, 22, 0.6);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 12px;
	}

	.empty-icon-wrapper {
		color: #71717a;
		margin-bottom: 1rem;
		display: flex;
		justify-content: center;
	}

	.empty-title {
		font-family: 'Inter', sans-serif;
		font-size: 1.25rem;
		font-weight: 500;
		color: #ffffff;
		margin-bottom: 0.5rem;
	}

	.empty-description {
		color: #a1a1a5;
		margin-bottom: 1.5rem;
	}

	.empty-btn {
		padding: 0.75rem 2rem;
		background: #10b981;
		border: none;
		border-radius: 8px;
		color: #ffffff;
		font-family: 'Inter', sans-serif;
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.empty-btn:hover {
		background: #059669;
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
	}

	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(8px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal-content {
		background: #121214;
		border-radius: 12px;
		padding: 2rem;
		max-width: 400px;
		width: 90%;
		position: relative;
		text-align: center;
		box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
		border: 1px solid rgba(255, 255, 255, 0.08);
	}

	.modal-close {
		position: absolute;
		top: 1rem;
		right: 1rem;
		background: none;
		border: none;
		color: #71717a;
		cursor: pointer;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		transition: all 0.2s ease;
	}

	.modal-close:hover {
		background: rgba(255, 255, 255, 0.05);
		color: #ffffff;
	}

	.modal-icon {
		margin-bottom: 1rem;
		display: flex;
		justify-content: center;
	}
	
	.text-error {
		color: #ef4444;
	}

	.modal-title {
		font-family: 'Inter', sans-serif;
		font-size: 1.5rem;
		font-weight: 600;
		color: #ffffff;
		margin-bottom: 0.5rem;
	}

	.modal-description {
		color: #a1a1a5;
		font-size: 0.95rem;
		margin-bottom: 1.5rem;
		line-height: 1.5;
	}

	.modal-actions {
		display: flex;
		gap: 1rem;
	}

	.modal-btn {
		flex: 1;
		padding: 0.75rem;
		border-radius: 8px;
		font-family: 'Inter', sans-serif;
		font-size: 0.95rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		border: none;
	}

	.modal-btn.cancel {
		background: rgba(255, 255, 255, 0.03);
		color: #a1a1a5;
		border: 1px solid rgba(255, 255, 255, 0.08);
	}

	.modal-btn.cancel:hover {
		background: rgba(255, 255, 255, 0.08);
		color: #ffffff;
	}

	.modal-btn.delete {
		background: #ef4444;
		color: #ffffff;
	}

	.modal-btn.delete:hover {
		background: #dc2626;
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
	}

	.modal-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
		transform: none;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.page {
			padding: 1rem;
		}

		.header {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		.page-title {
			font-size: 1.5rem;
		}

		.add-btn {
			width: 100%;
			justify-content: center;
		}

		.cabinets-grid {
			grid-template-columns: 1fr;
		}

		.global-success,
		.global-error {
			top: auto;
			bottom: 2rem;
			right: 1rem;
			left: 1rem;
		}
	}
</style>