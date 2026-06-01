<script lang="ts">
	import { goto } from '$app/navigation'

	let { data } = $props()

	let sections = data?.sections || []
	let cabinets = data?.cabinets || []
	let userRole = data?.userRole || ''
	let userId = data?.userId || ''
	let stats = data?.stats || { totalSections: 0, lockedSections: 0, types: 0, cabinets: 0 }

	let searchTerm = $state('')
	let filterType = $state('')
	let filterCabinet = $state('')
	let filterLockStatus = $state('')

	let selectedSection = $state<number | null>(null)
	let showDeleteModal = $state(false)
	let isDeleting = $state(false)

	let showSuccessMessage = $state(false)
	let showErrorMessage = $state(false)
	let messageText = $state('')
	let errorDetail = $state<string | null>(null)

	let filteredSections = $derived(() => {
		return sections.filter((section) => {
			const matchesSearch =
				!searchTerm ||
				section.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				section.id.toString().includes(searchTerm) ||
				section.type.toLowerCase().includes(searchTerm.toLowerCase())

			const matchesType = !filterType || filterType === '' || section.type === filterType

			const matchesCabinet =
				!filterCabinet ||
				filterCabinet === '' ||
				section.cabinetId.toString() === filterCabinet.toString()

			// TAMBAHKAN FILTER LOCK STATUS
			let matchesLockStatus = true
			if (filterLockStatus === 'locked') {
				matchesLockStatus = section.isLocked === true
			} else if (filterLockStatus === 'unlocked') {
				matchesLockStatus = section.isLocked !== true
			}

			return matchesSearch && matchesType && matchesCabinet && matchesLockStatus
		})
	})

	let uniqueTypes = $derived(() => {
		return [...new Set(sections.map((s) => s.type))]
	})

	let totalSections = sections.length

	async function navigateToAdd() {
		await goto('/admin/section/create')
	}

	function openDeleteModal(id: number) {
		const section = sections.find(s => s.id === id)
		if (section?.isLocked && userRole !== 'SUPER_ADMIN') {
			showNotification('error', `Section "${section.name}" sedang dalam proses audit! Tidak dapat dihapus. Sisa waktu: ${section.lockRemainingHours}j ${section.lockRemainingMinutes}m`)
			return
		}
		selectedSection = id
		showDeleteModal = true
	}

	function closeDeleteModal() {
		selectedSection = null
		showDeleteModal = false
		errorDetail = null
	}

	function showNotification(type: 'success' | 'error', message: string) {
		showSuccessMessage = type === 'success'
		showErrorMessage = type === 'error'
		messageText = message

		setTimeout(() => {
			showSuccessMessage = false
			showErrorMessage = false
		}, 3000)
	}

	async function handleDelete() {
		if (!selectedSection) return

		isDeleting = true
		errorDetail = null

		try {
			const formData = new FormData()
			formData.append('id', selectedSection.toString())

			const response = await fetch('/admin/section?/delete', {
				method: 'POST',
				body: formData
			})

			const result = await response.json()

			if (response.ok && result.success) {
				closeDeleteModal()
				showNotification('success', result.message || 'Section deleted successfully')
				setTimeout(() => window.location.reload(), 1500)
			} else {
				const errorMsg = result.message || 'Failed to delete section'
				showNotification('error', errorMsg)
				isDeleting = false
				closeDeleteModal()
			}
		} catch (error) {
			console.error('Delete error:', error)
			showNotification('error', 'Network error! Please try again.')
			isDeleting = false
			closeDeleteModal()
		}
	}

	function handleModalKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			closeDeleteModal()
		}
	}

	function getCabinetName(cabinetId: number) {
		const cabinet = cabinets.find((c) => c.id === cabinetId)
		return cabinet ? cabinet.name : 'Unknown'
	}

	function resetFilters() {
		searchTerm = ''
		filterType = ''
		filterCabinet = ''
		filterLockStatus = ''
	}

	function getTypeColor(type: string) {
		switch (type) {
			case 'display':
				return '#10b981'
			case 'storage':
				return '#f59e0b'
			default:
				return '#3b82f6'
		}
	}

	function getTypeBg(type: string) {
		switch (type) {
			case 'display':
				return 'rgba(16, 185, 129, 0.1)'
			case 'storage':
				return 'rgba(245, 158, 11, 0.1)'
			default:
				return 'rgba(59, 130, 246, 0.1)'
		}
	}

	function canEditSection(section: any) {
		if (userRole === 'SUPER_ADMIN') return true
		if (!section.isLocked) return true
		return false
	}

	function getEditUrl(section: any) {
		if (canEditSection(section)) {
			return `/admin/section/edit?id=${section.id}`
		}
		return '#'
	}

	function handleEditClick(e: Event, section: any) {
		if (!canEditSection(section)) {
			e.preventDefault()
			showNotification('error', `Section "${section.name}" sedang dalam proses audit oleh ${section.activeAuditorName || 'auditor'}. Tidak dapat diedit sampai audit selesai.`)
		}
	}
</script>

<svelte:head>
	<title>Admin - Sections</title>
</svelte:head>

<div class="page">
	<div class="header">
		<div class="header-left">
			<h1 class="page-title">Sections</h1>
			<p class="page-subtitle">Manage your sections</p>
		</div>
		<div class="header-right">
			<a href="/admin/section/create" class="add-btn" data-sveltekit-reload>
				<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
					<line x1="12" y1="5" x2="12" y2="19"></line>
					<line x1="5" y1="12" x2="19" y2="12"></line>
				</svg>
				<span>Add New Section</span>
			</a>
		</div>
	</div>

	<div class="stats-grid">
		<div class="stat-card">
			<div class="stat-icon-wrapper">
				<svg class="stat-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
				</svg>
			</div>
			<div class="stat-content">
				<span class="stat-label">Total Sections</span>
				<span class="stat-value">{totalSections}</span>
			</div>
		</div>

		<div class="stat-card">
			<div class="stat-icon-wrapper">
				<svg class="stat-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
					<line x1="7" y1="7" x2="7.01" y2="7"></line>
				</svg>
			</div>
			<div class="stat-content">
				<span class="stat-label">Types</span>
				<span class="stat-value">{uniqueTypes().length}</span>
			</div>
		</div>

		<div class="stat-card">
			<div class="stat-icon-wrapper">
				<svg class="stat-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="21 8 21 21 3 21 3 8"></polyline>
					<rect x="1" y="3" width="22" height="5"></rect>
					<line x1="10" y1="12" x2="14" y2="12"></line>
				</svg>
			</div>
			<div class="stat-content">
				<span class="stat-label">Cabinets</span>
				<span class="stat-value">{cabinets.length}</span>
			</div>
		</div>

		<div class="stat-card warning">
			<div class="stat-icon-wrapper text-error">
				<svg class="stat-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
					<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
				</svg>
			</div>
			<div class="stat-content">
				<span class="stat-label">Locked Sections</span>
				<span class="stat-value text-error">{stats.lockedSections || 0}</span>
			</div>
		</div>
	</div>

	<div class="filter-container">
		<div class="search-wrapper">
			<span class="search-icon">
				<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="11" cy="11" r="8"></circle>
					<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
				</svg>
			</span>
			<input
				type="text"
				class="search-input"
				placeholder="Search sections by name, ID, or type..."
				bind:value={searchTerm}
				aria-label="Search sections"
			/>
			{#if searchTerm}
				<button class="clear-search" onclick={() => (searchTerm = '')} aria-label="Clear search">
					✕
				</button>
			{/if}
		</div>

		<div class="filter-wrapper">
			<div class="filter-group">
				<span class="filter-label">Type</span>
				<select class="filter-select" bind:value={filterType}>
					<option value="">All Types</option>
					{#each uniqueTypes() as type}
						<option value={type}>{type}</option>
					{/each}
				</select>
			</div>

			<div class="filter-group">
				<span class="filter-label">Cabinet</span>
				<select class="filter-select" bind:value={filterCabinet}>
					<option value="">All Cabinets</option>
					{#each cabinets as cabinet}
						<option value={cabinet.id}>
							#{cabinet.id} - {cabinet.name}
						</option>
					{/each}
				</select>
			</div>

			<div class="filter-group">
				<span class="filter-label">Status</span>
				<select class="filter-select" bind:value={filterLockStatus}>
					<option value="">All Sections</option>
					<option value="locked">Locked (Diaudit)</option>
					<option value="unlocked">Unlocked</option>
				</select>
			</div>

			<div class="active-filters">
				{#if searchTerm || filterType || filterCabinet || filterLockStatus}
					<div class="filter-badge">
						<span>
							Filters Active
						</span>
						<button class="reset-filters" onclick={resetFilters} aria-label="Reset filters">
							✕
						</button>
					</div>
				{/if}
			</div>
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

	{#if filteredSections().length === 0}
		<div class="empty-state">
			<div class="empty-icon-wrapper">
				<svg class="empty-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
				</svg>
			</div>
			<h3 class="empty-title">No Sections Found</h3>
			<p class="empty-description">
				{#if searchTerm || filterType || filterCabinet || filterLockStatus}
					No sections match your filters. Try different search criteria.
				{:else}
					Get started by creating your first section.
				{/if}
			</p>
			<div class="empty-actions">
				{#if searchTerm || filterType || filterCabinet || filterLockStatus}
					<button class="empty-btn" onclick={resetFilters}> Clear Filters </button>
				{:else}
					<a href="/admin/section/create" class="empty-btn primary-btn" data-sveltekit-reload> Add Section </a>
				{/if}
			</div>
		</div>
	{:else}
		<div class="sections-grid">
			{#each filteredSections() as section (section.id)}
				<div class="section-card {section.isLocked ? 'locked' : ''}">
					<div class="card-header" style="border-left-color: {getTypeColor(section.type)}">
						<div class="header-left-group">
							<span class="section-id">#{section.id}</span>
							{#if section.isLocked}
								<span class="lock-badge" title="Section sedang diaudit">
									<svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
										<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
									</svg>
									Locked
								</span>
							{/if}
						</div>
						<div class="card-actions">
							<a
								href={getEditUrl(section)}
								class="action-btn edit {!canEditSection(section) ? 'disabled' : ''}"
								data-sveltekit-reload
								aria-label="Edit section"
								onclick={(e) => handleEditClick(e, section)}
							>
								<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
									<path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"></path>
								</svg>
							</a>
							<button
								class="action-btn delete"
								onclick={() => openDeleteModal(section.id)}
								aria-label="Delete section"
								disabled={section.isLocked && userRole !== 'SUPER_ADMIN'}
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
						<div
							class="section-type-badge"
							style="background: {getTypeBg(section.type)}; color: {getTypeColor(section.type)}"
						>
							{section.type}
						</div>

						<h3 class="section-name">{section.name}</h3>

						<div class="section-details">
							<div class="detail-row">
								<span class="detail-label">Cabinet</span>
								<span class="detail-value">
									<a href={`/admin/cabinet/edit?id=${section.cabinetId}`} class="cabinet-link">
										#{section.cabinetId}: {getCabinetName(section.cabinetId)}
									</a>
								</span>
							</div>
						</div>

						{#if section.isLocked}
							<div class="lock-info">
								<div class="lock-info-header">
									<svg class="icon-sm text-error" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
										<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
									</svg>
									<span class="lock-title">Sedang dalam proses audit</span>
								</div>
								<div class="lock-details">
									<div class="lock-detail-row">
										<span class="lock-label">Auditor:</span>
										<span class="lock-value">{section.activeAuditorName || 'Unknown'}</span>
									</div>
									<div class="lock-detail-row">
										<span class="lock-label">Sisa waktu:</span>
										<span class="lock-value timer">
											{section.lockRemainingHours}j {section.lockRemainingMinutes}m
										</span>
									</div>
								</div>
								<div class="lock-warning">
									Section tidak dapat diedit/dihapus sampai audit selesai
								</div>
							</div>
						{/if}
					</div>

					<div class="card-footer">
						<span class="footer-text">ID: {section.id}</span>
						<span
							class="footer-badge"
							style="background: {getTypeBg(section.type)}; color: {getTypeColor(section.type)}"
						>
							{section.type}
						</span>
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
				<button class="modal-close" onclick={closeDeleteModal}>×</button>

				<div class="modal-icon-container">
					<svg class="modal-svg-error" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
						<line x1="12" y1="9" x2="12" y2="13"></line>
						<line x1="12" y1="17" x2="12.01" y2="17"></line>
					</svg>
				</div>
				<h2 class="modal-title">Delete Section</h2>
				<p class="modal-description">
					Are you sure you want to delete this section? This action cannot be undone and will delete all items inside.
				</p>

				{#if errorDetail}
					<div class="modal-error">
						{errorDetail}
					</div>
				{/if}

				<div class="modal-actions">
					<button class="modal-btn cancel" onclick={closeDeleteModal} disabled={isDeleting}>
						Cancel
					</button>
					<button class="modal-btn delete" onclick={handleDelete} disabled={isDeleting}>
						{#if isDeleting}
							Deleting...
						{:else}
							Delete Section
						{/if}
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	/* UTILITY ICONS & COLORS */
	.icon { width: 1.25rem; height: 1.25rem; }
	.icon-sm { width: 1rem; height: 1rem; }
	.icon-xs { width: 0.85rem; height: 0.85rem; }
	.success-color { color: #10b981; }
	.error-color { color: #ef4444; }
	.text-error { color: #ef4444 !important; }

	.page {
		padding: 2rem;
		max-width: 1400px;
		margin: 0 auto;
		background: transparent;
		min-height: 100vh;
		color: #e3e4e6;
	}

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
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background: #10b981;
		border: none;
		border-radius: 8px;
		color: #ffffff;
		font-family: 'Inter', sans-serif;
		font-size: 0.95rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		text-decoration: none;
	}

	.add-btn:hover {
		background: #059669;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
	}

	/* Stats Grid */
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1.5rem;
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
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
		backdrop-filter: blur(10px);
	}

	.stat-card:hover {
		transform: translateY(-2px);
		border-color: rgba(255, 255, 255, 0.15);
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
	}

	.stat-card.warning {
		background: rgba(239, 68, 68, 0.05);
		border-color: rgba(239, 68, 68, 0.2);
	}

	.stat-icon-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 10px;
		color: #a1a1a5;
	}

	.stat-card.warning .stat-icon-wrapper {
		background: rgba(239, 68, 68, 0.1);
	}

	.stat-svg {
		width: 1.5rem;
		height: 1.5rem;
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
		margin-bottom: 0.25rem;
	}

	.stat-value {
		font-family: 'Inter', sans-serif;
		font-size: 1.5rem;
		font-weight: 600;
		color: #ffffff;
		line-height: 1.2;
	}

	/* Filtering */
	.filter-container {
		margin-bottom: 2rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.search-wrapper {
		position: relative;
		max-width: 500px;
	}

	.search-icon {
		position: absolute;
		left: 1rem;
		top: 50%;
		transform: translateY(-50%);
		color: #71717a;
		display: flex;
		align-items: center;
		z-index: 1;
	}

	.search-input {
		width: 100%;
		padding: 0.75rem 1rem 0.75rem 2.5rem;
		background: rgba(20, 20, 22, 0.8);
		border: 1px solid rgba(255, 255, 255, 0.06);
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
	}

	.search-input::placeholder {
		color: #52525b;
	}

	.clear-search {
		position: absolute;
		right: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		color: #71717a;
		cursor: pointer;
		padding: 0.25rem;
		border-radius: 50%;
		transition: all 0.2s ease;
	}

	.clear-search:hover {
		color: #ffffff;
		background: rgba(255, 255, 255, 0.08);
	}

	.filter-wrapper {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1rem;
		background: rgba(20, 20, 22, 0.6);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 12px;
		padding: 0.75rem 1rem;
	}

	.filter-group {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: rgba(255, 255, 255, 0.02);
		padding: 0.35rem 0.6rem;
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.04);
	}

	.filter-label {
		font-size: 0.85rem;
		color: #a1a1a5;
	}

	.filter-select {
		padding: 0.4rem 2rem 0.4rem 0.75rem;
		background: rgba(20, 20, 22, 0.9);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 6px;
		color: #ffffff;
		font-family: 'Inter', sans-serif;
		font-size: 0.85rem;
		cursor: pointer;
		min-width: 150px;
		appearance: none;
		background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2310b981' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
		background-repeat: no-repeat;
		background-position: right 0.5rem center;
		background-size: 0.9rem;
	}

	.filter-select:focus {
		outline: none;
		border-color: #10b981;
	}

	.filter-select option {
		background: #141416;
		color: #ffffff;
	}

	.active-filters {
		flex: 1;
		display: flex;
		justify-content: flex-end;
	}

	.filter-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.4rem 0.8rem;
		background: rgba(16, 185, 129, 0.1);
		border: 1px solid #10b981;
		border-radius: 20px;
		color: #10b981;
		font-size: 0.85rem;
	}

	.reset-filters {
		background: none;
		border: none;
		color: #10b981;
		cursor: pointer;
		padding: 0.15rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.reset-filters:hover {
		background: rgba(16, 185, 129, 0.2);
		transform: scale(1.1);
	}

	/* Notifications Alert */
	.global-success,
	.global-error {
		position: fixed;
		top: 100px;
		right: 2rem;
		background: #141416;
		padding: 1rem 1.5rem;
		border-radius: 8px;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		z-index: 1100;
		animation: slideInRight 0.3s ease;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
	}

	.global-success { border: 1px solid #10b981; color: #ffffff; }
	.global-error { border: 1px solid #ef4444; color: #ffffff; }

	@keyframes slideInRight {
		from { transform: translateX(100%); opacity: 0; }
		to { transform: translateX(0); opacity: 1; }
	}

	/* Sections Cards Grid */
	.sections-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
		gap: 1.5rem;
	}

	.section-card {
		background: rgba(20, 20, 22, 0.8);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 12px;
		overflow: hidden;
		transition: all 0.3s ease;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
		backdrop-filter: blur(10px);
	}

	.section-card.locked {
		border-color: rgba(239, 68, 68, 0.25);
		background: rgba(239, 68, 68, 0.02);
	}

	.section-card:hover {
		transform: translateY(-4px);
		border-color: rgba(255, 255, 255, 0.15);
		box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.01);
		border-bottom: 1px solid rgba(255, 255, 255, 0.04);
		border-left: 4px solid;
	}

	.header-left-group {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.section-id {
		font-family: 'Inter', sans-serif;
		font-size: 0.85rem;
		font-weight: 500;
		color: #a1a1a5;
		background: rgba(255, 255, 255, 0.04);
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
	}

	.lock-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.75rem;
		background: rgba(239, 68, 68, 0.1);
		color: #ef4444;
		padding: 0.25rem 0.6rem;
		border-radius: 20px;
		border: 1px solid rgba(239, 68, 68, 0.2);
	}

	.card-actions {
		display: flex;
		gap: 0.5rem;
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
		color: #a1a1a5;
		text-decoration: none;
	}

	.action-btn.edit:hover:not(.disabled) {
		background: rgba(16, 185, 129, 0.15);
		border-color: #10b981;
		color: #10b981;
		transform: scale(1.05);
	}

	.action-btn.edit.disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.action-btn.delete:hover:not(:disabled) {
		background: rgba(239, 68, 68, 0.15);
		border-color: #ef4444;
		color: #ef4444;
		transform: scale(1.05);
	}

	.action-btn.delete:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.card-body {
		padding: 1rem;
	}

	.section-type-badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		font-size: 0.75rem;
		font-weight: 500;
		margin-bottom: 0.75rem;
		text-transform: capitalize;
	}

	.section-name {
		font-family: 'Inter', sans-serif;
		font-size: 1.15rem;
		font-weight: 600;
		color: #ffffff;
		margin: 0 0 1rem 0;
	}

	.section-details {
		background: rgba(255, 255, 255, 0.02);
		border-radius: 8px;
		padding: 0.75rem;
	}

	.detail-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.detail-label {
		color: #71717a;
		font-size: 0.85rem;
	}

	.detail-value {
		font-family: 'Inter', sans-serif;
		color: #e3e4e6;
		font-size: 0.85rem;
		font-weight: 500;
	}

	.cabinet-link {
		color: #10b981;
		text-decoration: none;
		transition: all 0.2s ease;
	}

	.cabinet-link:hover {
		color: #059669;
		text-decoration: underline;
	}

	/* Lock Info Card */
	.lock-info {
		margin-top: 1rem;
		padding: 0.75rem;
		background: rgba(239, 68, 68, 0.05);
		border: 1px solid rgba(239, 68, 68, 0.15);
		border-radius: 8px;
	}

	.lock-info-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.lock-title {
		font-size: 0.8rem;
		font-weight: 600;
		color: #ef4444;
	}

	.lock-details {
		margin-bottom: 0.5rem;
	}

	.lock-detail-row {
		display: flex;
		justify-content: space-between;
		font-size: 0.75rem;
		padding: 0.2rem 0;
	}

	.lock-label {
		color: #71717a;
	}

	.lock-value {
		color: #ffffff;
		font-weight: 500;
	}

	.lock-value.timer {
		color: #ef4444;
		font-family: monospace;
	}

	.lock-warning {
		font-size: 0.7rem;
		color: rgba(239, 68, 68, 0.8);
		text-align: center;
		padding-top: 0.5rem;
		border-top: 1px solid rgba(239, 68, 68, 0.1);
		margin-top: 0.25rem;
	}

	.card-footer {
		padding: 0.75rem 1rem;
		background: rgba(255, 255, 255, 0.01);
		border-top: 1px solid rgba(255, 255, 255, 0.04);
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.75rem;
	}

	.footer-text {
		color: #52525b;
	}

	.footer-badge {
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		font-size: 0.7rem;
		text-transform: capitalize;
	}

	/* Empty State */
	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		background: rgba(20, 20, 22, 0.8);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 12px;
	}

	.empty-icon-wrapper {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 80px;
		height: 80px;
		background: rgba(255, 255, 255, 0.02);
		border-radius: 50%;
		color: #52525b;
		margin-bottom: 1.5rem;
	}

	.empty-svg {
		width: 3rem;
		height: 3rem;
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
		font-size: 0.95rem;
	}

	.empty-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
	}

	.empty-btn {
		padding: 0.75rem 1.5rem;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 8px;
		color: #a1a1a5;
		font-family: 'Inter', sans-serif;
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.2s ease;
		text-decoration: none;
		display: inline-block;
	}

	.empty-btn:hover {
		background: rgba(255, 255, 255, 0.08);
		color: #ffffff;
	}

	.empty-btn.primary-btn {
		background: #10b981;
		border: none;
		color: #ffffff;
	}

	.empty-btn.primary-btn:hover {
		background: #059669;
	}

	/* Modern Modal Blur overlay */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal-content {
		background: #141416;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 12px;
		padding: 2rem;
		max-width: 400px;
		width: 90%;
		position: relative;
		text-align: center;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
	}

	.modal-close {
		position: absolute;
		top: 1rem;
		right: 1rem;
		background: none;
		border: none;
		color: #71717a;
		font-size: 1.5rem;
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

	.modal-icon-container {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 60px;
		height: 60px;
		background: rgba(239, 68, 68, 0.1);
		border-radius: 50%;
		color: #ef4444;
		margin-bottom: 1.25rem;
	}

	.modal-svg-error {
		width: 2rem;
		height: 2rem;
	}

	.modal-title {
		font-family: 'Inter', sans-serif;
		font-size: 1.25rem;
		font-weight: 600;
		color: #ffffff;
		margin-bottom: 0.5rem;
	}

	.modal-description {
		color: #a1a1a5;
		font-size: 0.9rem;
		margin-bottom: 1.5rem;
		line-height: 1.5;
	}

	.modal-error {
		background: rgba(239, 68, 68, 0.1);
		color: #ef4444;
		padding: 0.75rem;
		border-radius: 8px;
		margin-bottom: 1rem;
		font-size: 0.85rem;
		border: 1px solid rgba(239, 68, 68, 0.2);
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
		font-size: 0.9rem;
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

	.modal-btn.delete:hover:not(:disabled) {
		background: #dc2626;
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
	}

	.modal-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
		transform: none;
	}

	/* Responsive System */
	@media (max-width: 1024px) {
		.stats-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

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

		.stats-grid {
			grid-template-columns: 1fr;
		}

		.filter-wrapper {
			flex-direction: column;
			align-items: stretch;
		}

		.filter-group {
			width: 100%;
		}

		.filter-select {
			flex: 1;
		}

		.active-filters {
			justify-content: flex-start;
		}

		.sections-grid {
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