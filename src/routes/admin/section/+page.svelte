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
				if (result.code === 'SECTION_LOCKED') {
					showNotification('error', errorMsg)
				} else {
					showNotification('error', errorMsg)
				}
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
				return '#f0fdf4'
			case 'storage':
				return '#fffbeb'
			default:
				return '#eff6ff'
		}
	}

	function formatLockTime(hours: number, minutes: number) {
		if (hours > 0) {
			return `${hours}j ${minutes}m`
		}
		return `${minutes} menit`
	}

	function canEditSection(section: any) {
		// SUPER_ADMIN bisa edit apapun
		if (userRole === 'SUPER_ADMIN') return true
		// Jika section tidak locked, bisa edit
		if (!section.isLocked) return true
		// Jika locked tapi oleh user ini sendiri (auditor) tidak bisa edit dari sini
		// Karena auditor harus edit lewat halaman audit
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
	<!-- Header Section -->
	<div class="header">
		<div class="header-left">
			<h1 class="page-title">Sections</h1>
			<p class="page-subtitle">Manage your sections</p>
		</div>
		<div class="header-right">
			<a href="/admin/section/create" class="add-btn" data-sveltekit-reload>
				<span class="add-icon">➕</span>
				<span>Add New Section</span>
			</a>
		</div>
	</div>

	<!-- Stats Cards -->
	<div class="stats-grid">
		<div class="stat-card">
			<div class="stat-icon">📁</div>
			<div class="stat-content">
				<span class="stat-label">Total Sections</span>
				<span class="stat-value">{totalSections}</span>
			</div>
		</div>

		<div class="stat-card">
			<div class="stat-icon">🏷️</div>
			<div class="stat-content">
				<span class="stat-label">Types</span>
				<span class="stat-value">{uniqueTypes().length}</span>
			</div>
		</div>

		<div class="stat-card">
			<div class="stat-icon">📦</div>
			<div class="stat-content">
				<span class="stat-label">Cabinets</span>
				<span class="stat-value">{cabinets.length}</span>
			</div>
		</div>

		<!-- Card Locked Sections -->
		<div class="stat-card warning">
			<div class="stat-icon">🔒</div>
			<div class="stat-content">
				<span class="stat-label">Locked Sections</span>
				<span class="stat-value">{stats.lockedSections || 0}</span>
			</div>
		</div>
	</div>

	<!-- Search and Filter Bar -->
	<div class="filter-container">
		<div class="search-wrapper">
			<span class="search-icon">🔍</span>
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

			<!-- Filter Lock Status -->
			<div class="filter-group">
				<span class="filter-label">Status</span>
				<select class="filter-select" bind:value={filterLockStatus}>
					<option value="">All Sections</option>
					<option value="locked">🔒 Locked (Sedang Diaudit)</option>
					<option value="unlocked">🔓 Unlocked</option>
				</select>
			</div>

			<div class="active-filters">
				{#if searchTerm || filterType || filterCabinet}
					<div class="filter-badge">
						<span>
							{#if searchTerm}🔍 "{searchTerm}"
							{/if}
							{#if filterType}🏷️ {filterType}
							{/if}
							{#if filterCabinet}📦 Cabinet {filterCabinet}
							{/if}
						</span>
						<button class="reset-filters" onclick={resetFilters} aria-label="Reset filters">
							✕
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Success Message -->
	{#if showSuccessMessage}
		<div class="global-success">
			<span class="success-icon">✅</span>
			<span>{messageText}</span>
		</div>
	{/if}

	<!-- Error Message -->
	{#if showErrorMessage}
		<div class="global-error">
			<span class="error-icon">⚠️</span>
			<span>{messageText}</span>
		</div>
	{/if}

	<!-- Sections Grid -->
	{#if filteredSections().length === 0}
		<div class="empty-state">
			<span class="empty-icon">📁</span>
			<h3 class="empty-title">No Sections Found</h3>
			<p class="empty-description">
				{#if searchTerm || filterType || filterCabinet}
					No sections match your filters.
					{#if sections.length === 0}
						There are no sections in the database yet.
					{:else}
						Try different search criteria.
					{/if}
				{:else}
					Get started by creating your first section.
				{/if}
			</p>
			<div class="empty-actions">
				{#if searchTerm || filterType || filterCabinet}
					<button class="empty-btn" onclick={resetFilters}> Clear Filters </button>
				{:else}
					<a href="/admin/section/create" class="empty-btn" data-sveltekit-reload> Add Section </a>
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
									🔒 Locked
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
								✏️
							</a>
							<button
								class="action-btn delete"
								onclick={() => openDeleteModal(section.id)}
								aria-label="Delete section"
								disabled={section.isLocked && userRole !== 'SUPER_ADMIN'}
							>
								🗑️
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
									<span class="lock-icon-small">🔒</span>
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
									⚠️ Section tidak dapat diedit/dihapus sampai audit selesai
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

	<!-- Delete Confirmation Modal -->
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

				<div class="modal-icon">⚠️</div>
				<h2 class="modal-title">Delete Section</h2>
				<p class="modal-description">
					Are you sure you want to delete this section? This action cannot be undone and will delete
					all items inside.
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
	.page {
		padding: 1.5rem;
		max-width: 1400px;
		margin: 0 auto;
		background: #f5f5f5;
		min-height: 100vh;
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
		color: #333333;
		margin: 0 0 0.25rem 0;
	}

	.page-subtitle {
		color: #666666;
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

	.add-icon {
		font-size: 1.2rem;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.stat-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.25rem;
		background: #ffffff;
		border: 1px solid #e5e5e5;
		border-radius: 12px;
		transition: all 0.2s ease;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	}

	.stat-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
	}

	.stat-card.warning {
		background: #fef2f2;
		border-color: #fecaca;
	}

	.stat-icon {
		font-size: 2rem;
	}

	.stat-content {
		display: flex;
		flex-direction: column;
	}

	.stat-label {
		font-size: 0.8rem;
		color: #999999;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.stat-value {
		font-family: 'Inter', sans-serif;
		font-size: 1.5rem;
		font-weight: 600;
		color: #333333;
		line-height: 1.2;
	}

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
		color: #999999;
		font-size: 1.1rem;
		z-index: 1;
	}

	.search-input {
		width: 100%;
		padding: 0.75rem 1rem 0.75rem 2.5rem;
		background: #ffffff;
		border: 1px solid #e5e5e5;
		border-radius: 8px;
		color: #333333;
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
		color: #cccccc;
	}

	.clear-search {
		position: absolute;
		right: 0.75rem;
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		color: #999999;
		cursor: pointer;
		padding: 0.25rem;
		border-radius: 50%;
		transition: all 0.2s ease;
	}

	.clear-search:hover {
		color: #333333;
		background: #f5f5f5;
	}

	.filter-wrapper {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1rem;
		background: #ffffff;
		border: 1px solid #e5e5e5;
		border-radius: 12px;
		padding: 1rem;
	}

	.filter-group {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: #f9fafb;
		padding: 0.5rem;
		border-radius: 8px;
		border: 1px solid #f0f0f0;
	}

	.filter-label {
		font-size: 0.85rem;
		color: #666666;
		padding: 0 0.5rem;
	}

	.filter-select {
		padding: 0.5rem 2rem 0.5rem 1rem;
		background: #ffffff;
		border: 1px solid #e5e5e5;
		border-radius: 6px;
		color: #333333;
		font-family: 'Inter', sans-serif;
		font-size: 0.85rem;
		cursor: pointer;
		min-width: 150px;
		appearance: none;
		background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2310b981' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
		background-repeat: no-repeat;
		background-position: right 0.5rem center;
		background-size: 1rem;
	}

	.filter-select:focus {
		outline: none;
		border-color: #10b981;
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
		padding: 0.5rem 1rem;
		background: #f0fdf4;
		border: 1px solid #10b981;
		border-radius: 20px;
		color: #059669;
		font-size: 0.85rem;
	}

	.reset-filters {
		background: none;
		border: none;
		color: #059669;
		cursor: pointer;
		padding: 0.25rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.reset-filters:hover {
		background: rgba(16, 185, 129, 0.1);
		transform: scale(1.1);
	}

	.global-success {
		position: fixed;
		top: 100px;
		right: 2rem;
		background: #ffffff;
		border: 1px solid #10b981;
		color: #059669;
		padding: 1rem 2rem;
		border-radius: 8px;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		z-index: 1100;
		animation: slideInRight 0.3s ease;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.global-error {
		position: fixed;
		top: 100px;
		right: 2rem;
		background: #ffffff;
		border: 1px solid #ef4444;
		color: #dc2626;
		padding: 1rem 2rem;
		border-radius: 8px;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		z-index: 1100;
		animation: slideInRight 0.3s ease;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.success-icon,
	.error-icon {
		font-size: 1.2rem;
	}

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

	.sections-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
		gap: 1.5rem;
	}

	.section-card {
		background: #ffffff;
		border: 1px solid #e5e5e5;
		border-radius: 12px;
		overflow: hidden;
		transition: all 0.3s ease;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	}

	.section-card.locked {
		opacity: 0.95;
		border-color: #fecaca;
		background: #fefafaf;
	}

	.section-card:hover {
		transform: translateY(-4px);
		border-color: #d1d5db;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background: #f9fafb;
		border-bottom: 1px solid #f0f0f0;
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
		color: #666666;
		background: #f5f5f5;
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
	}

	.lock-badge {
		font-size: 0.7rem;
		background: #fef2f2;
		color: #dc2626;
		padding: 0.2rem 0.5rem;
		border-radius: 20px;
		border: 1px solid #fecaca;
	}

	.card-actions {
		display: flex;
		gap: 0.5rem;
	}

	.action-btn {
		background: #ffffff;
		border: 1px solid #e5e5e5;
		border-radius: 6px;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 1rem;
		text-decoration: none;
		color: #666666;
	}

	.action-btn.edit:hover:not(.disabled) {
		background: #f0fdf4;
		border-color: #10b981;
		color: #059669;
		transform: scale(1.05);
	}

	.action-btn.edit.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.action-btn.delete:hover:not(:disabled) {
		background: #fef2f2;
		border-color: #ef4444;
		color: #dc2626;
		transform: scale(1.05);
	}

	.action-btn.delete:disabled {
		opacity: 0.5;
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
	}

	.section-name {
		font-family: 'Inter', sans-serif;
		font-size: 1.1rem;
		font-weight: 600;
		color: #333333;
		margin: 0 0 1rem 0;
	}

	.section-details {
		background: #f9fafb;
		border-radius: 8px;
		padding: 0.75rem;
		margin-bottom: 0;
	}

	.detail-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.25rem 0;
	}

	.detail-label {
		color: #666666;
		font-size: 0.85rem;
	}

	.detail-value {
		font-family: 'Inter', sans-serif;
		color: #333333;
		font-size: 0.85rem;
		font-weight: 500;
	}

	.cabinet-link {
		color: #10b981;
		text-decoration: none;
		transition: all 0.2s ease;
	}

	.cabinet-link:hover {
		text-decoration: underline;
	}

	/* Lock Info Styles */
	.lock-info {
		margin-top: 1rem;
		padding: 0.75rem;
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 8px;
	}

	.lock-info-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.lock-icon-small {
		font-size: 0.9rem;
	}

	.lock-title {
		font-size: 0.8rem;
		font-weight: 600;
		color: #dc2626;
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
		color: #666666;
	}

	.lock-value {
		color: #333333;
		font-weight: 500;
	}

	.lock-value.timer {
		color: #dc2626;
		font-family: monospace;
	}

	.lock-warning {
		font-size: 0.7rem;
		color: #dc2626;
		text-align: center;
		padding-top: 0.5rem;
		border-top: 1px solid #fecaca;
		margin-top: 0.25rem;
	}

	.card-footer {
		padding: 0.75rem 1rem;
		background: #f9fafb;
		border-top: 1px solid #f0f0f0;
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.75rem;
	}

	.footer-text {
		color: #999999;
	}

	.footer-badge {
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		font-size: 0.7rem;
	}

	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		background: #ffffff;
		border: 1px solid #e5e5e5;
		border-radius: 12px;
	}

	.empty-icon {
		font-size: 4rem;
		display: block;
		margin-bottom: 1rem;
	}

	.empty-title {
		font-family: 'Inter', sans-serif;
		font-size: 1.25rem;
		font-weight: 500;
		color: #333333;
		margin-bottom: 0.5rem;
	}

	.empty-description {
		color: #666666;
		margin-bottom: 1.5rem;
	}

	.empty-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
	}

	.empty-btn {
		padding: 0.75rem 1.5rem;
		background: #f5f5f5;
		border: 1px solid #e5e5e5;
		border-radius: 8px;
		color: #333333;
		font-family: 'Inter', sans-serif;
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.2s ease;
		text-decoration: none;
		display: inline-block;
	}

	.empty-btn:hover {
		background: #e5e5e5;
	}

	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal-content {
		background: #ffffff;
		border-radius: 12px;
		padding: 2rem;
		max-width: 400px;
		width: 90%;
		position: relative;
		text-align: center;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
	}

	.modal-close {
		position: absolute;
		top: 1rem;
		right: 1rem;
		background: none;
		border: none;
		color: #999999;
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
		background: #f5f5f5;
		color: #333333;
	}

	.modal-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.modal-title {
		font-family: 'Inter', sans-serif;
		font-size: 1.25rem;
		font-weight: 600;
		color: #333333;
		margin-bottom: 0.5rem;
	}

	.modal-description {
		color: #666666;
		font-size: 0.9rem;
		margin-bottom: 1.5rem;
		line-height: 1.5;
	}

	.modal-error {
		background: #fef2f2;
		color: #dc2626;
		padding: 0.75rem;
		border-radius: 8px;
		margin-bottom: 1rem;
		font-size: 0.85rem;
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
		background: #f5f5f5;
		color: #666666;
		border: 1px solid #e5e5e5;
	}

	.modal-btn.cancel:hover {
		background: #e5e5e5;
	}

	.modal-btn.delete {
		background: #ef4444;
		color: #ffffff;
	}

	.modal-btn.delete:hover:not(:disabled) {
		background: #dc2626;
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
	}

	.modal-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}

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