<script lang="ts">
	import { goto, invalidate } from '$app/navigation'
	import { onMount, onDestroy } from 'svelte'
	import { browser } from '$app/environment'

	let { data } = $props()

	// Data dari server
	let cabinets = $state(data?.cabinets || [])
	let allItems = $state(data?.items || [])
	let sections = $state(data?.sections || [])

	// State untuk navigasi
	let selectedCabinetId = $state<number | null>(null)
	let selectedSectionId = $state<number | null>(null)

	// Search state
	let searchTerm = $state('')
	
	// Pagination state
	let currentPage = $state(1)
	let itemsPerPage = $state(20)
	let itemsPerPageOptions = [12, 20, 50, 100]

	// Delete modal state
	let selectedItem = $state<any | null>(null)
	let showDeleteModal = $state(false)
	let isDeleting = $state(false)
	let showSuccessMessage = $state(false)
	let showErrorMessage = $state(false)
	let messageText = $state('')

	// Fungsi untuk refresh data
	async function refreshData() {
		await invalidate('admin:data')
		currentPage = 1 // Reset ke halaman pertama saat refresh
	}

	// Auto-refresh ketika tab menjadi aktif
	function handleVisibilityChange() {
		if (browser && document.visibilityState === 'visible') {
			refreshData()
		}
	}

	let refreshInterval: NodeJS.Timeout

	onMount(() => {
		refreshData()

		if (browser) {
			document.addEventListener('visibilitychange', handleVisibilityChange)
			refreshInterval = setInterval(() => {
				if (document.visibilityState === 'visible') {
					refreshData()
				}
			}, 10000)
		}

		if (browser) {
			const urlParams = new URLSearchParams(window.location.search)
			if (urlParams.get('success') === 'true') {
				showNotification('success', 'Item created successfully!')
				window.history.replaceState({}, '', '/admin/item')
			}
		}
	})

	onDestroy(() => {
		if (browser) {
			document.removeEventListener('visibilitychange', handleVisibilityChange)
		}
		if (refreshInterval) clearInterval(refreshInterval)
	})

	// Helper functions
	function getPriceIdr(item: any) {
		const price = item.price
		return {
			amount: price?.amount || 0,
			priceNote: price?.priceNote || '',
			formatted: `Rp ${(price?.amount || 0).toLocaleString('id-ID')}`
		}
	}

	function getCostPrice(item: any) {
		const cost = item.costPrice
		return {
			amount: cost?.amount || 0,
			note: cost?.note || '',
			formatted: cost?.amount ? `Rp ${cost.amount.toLocaleString('id-ID')}` : null
		}
	}

	function getImageUrl(imageUrl: string) {
		if (!imageUrl) return null
		if (imageUrl.startsWith('/')) return imageUrl
		return `/${imageUrl}`
	}

	// Get items for selected section
	let displayedItems = $derived(() => {
		if (selectedSectionId !== null) {
			return allItems.filter((item) => item.sectionId === selectedSectionId)
		} else if (selectedCabinetId !== null) {
			const cabinet = cabinets.find((c) => c.id === selectedCabinetId)
			if (cabinet && cabinet.sections) {
				const sectionIds = cabinet.sections.map((s: any) => s.id)
				return allItems.filter((item) => sectionIds.includes(item.sectionId))
			}
		}
		return []
	})

	// Filtered items by search
	let searchedItems = $derived(() => {
		if (!searchTerm) return []
		const term = searchTerm.toLowerCase()
		return allItems.filter(
			(item) =>
				item.name.toLowerCase().includes(term) ||
				item.id.toString().includes(term) ||
				item.category.toLowerCase().includes(term) ||
				(item.serialNumber && item.serialNumber.toLowerCase().includes(term))
		)
	})

	let isSearchActive = $derived(() => searchTerm.trim().length > 0)
	
	// Get current items based on view mode (search or navigation)
	let currentItems = $derived(() => {
		if (isSearchActive()) {
			return searchedItems()
		} else if (selectedSectionId !== null || selectedCabinetId !== null) {
			return displayedItems()
		}
		return []
	})
	
	// Pagination calculations
	let totalPages = $derived(() => Math.ceil(currentItems().length / itemsPerPage))
	let paginatedItems = $derived(() => {
		const start = (currentPage - 1) * itemsPerPage
		const end = start + itemsPerPage
		return currentItems().slice(start, end)
	})
	
	// Reset pagination when filters change
	$effect(() => {
		currentPage = 1
	})

	function goToPage(page: number) {
		currentPage = Math.max(1, Math.min(page, totalPages()))
	}

	function changeItemsPerPage(e: Event) {
		itemsPerPage = Number((e.target as HTMLSelectElement).value)
		currentPage = 1
	}

	// Navigation functions
	function selectCabinet(cabinetId: number) {
		selectedCabinetId = cabinetId
		selectedSectionId = null
		currentPage = 1
	}

	function selectSection(sectionId: number) {
		selectedSectionId = sectionId
		currentPage = 1
	}

	function getSectionName(sectionId: number | null) {
		if (!sectionId) return 'Unknown'
		const section = sections.find((s) => s.id === sectionId)
		return section?.name || 'Unknown'
	}

	function getCabinetNameBySection(sectionId: number | null) {
		if (!sectionId) return 'Unknown'
		const section = sections.find((s) => s.id === sectionId)
		return section?.cabinet?.name || 'Unknown'
	}

	function getStockBadge(stock: number) {
		if (stock === 0) return { text: 'Out of Stock', class: 'out' }
		if (stock < 5) return { text: 'Low Stock', class: 'low' }
		return { text: 'In Stock', class: 'in' }
	}

	function clearSearch() {
		searchTerm = ''
		currentPage = 1
	}

	let currentPath = $derived(() => {
		if (selectedSectionId !== null) {
			const sectionName = getSectionName(selectedSectionId)
			const cabinetName = getCabinetNameBySection(selectedSectionId)
			return { cabinet: cabinetName, section: sectionName }
		} else if (selectedCabinetId !== null) {
			const cabinet = cabinets.find((c) => c.id === selectedCabinetId)
			return { cabinet: cabinet?.name, section: null }
		}
		return { cabinet: null, section: null }
	})

	// Navigation
	async function navigateToAdd() {
		await goto('/admin/item/create')
	}

	async function navigateToEdit(itemId: number) {
		await goto(`/admin/item/edit?id=${itemId}`)
	}

	// Delete functions
	function openDeleteModal(item: any) {
		selectedItem = item
		showDeleteModal = true
	}

	function closeDeleteModal() {
		selectedItem = null
		showDeleteModal = false
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
		if (!selectedItem) return
		isDeleting = true

		try {
			const formData = new FormData()
			formData.append('id', selectedItem.id.toString())

			const response = await fetch('/admin/item?/delete', {
				method: 'POST',
				body: formData
			})

			const text = await response.text()
			let result

			try {
				result = JSON.parse(text)
			} catch {
				result = { type: 'success' }
			}

			if (response.ok && result.type !== 'failure') {
				showNotification('success', 'Item deleted successfully')
				await refreshData()
				setTimeout(() => {
					closeDeleteModal()
					isDeleting = false
				}, 1000)
			} else {
				const message = result.data?.message || 'Failed to delete item'
				showNotification('error', message)
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
</script>

<svelte:head>
	<title>Admin - Items</title>
</svelte:head>

<div class="file-manager">
	<div class="header">
		<div class="header-left">
			<h1 class="title">Stock Items</h1>
			<div class="subtitle">File Manager - Cabinet / Section / Item</div>
		</div>
		<div class="header-right">
			<div class="search-box">
				<span class="search-icon">🔍</span>
				<input
					type="text"
					placeholder="Search items..."
					bind:value={searchTerm}
					class="search-input"
				/>
				{#if searchTerm}<button class="search-clear" onclick={clearSearch}>✕</button>{/if}
			</div>
			<button class="refresh-btn" onclick={refreshData} title="Refresh">🔄</button>
			<button class="add-btn" onclick={navigateToAdd}><span>➕</span><span>Add Item</span></button>
		</div>
	</div>

	{#if showSuccessMessage}<div class="toast success">✅ {messageText}</div>{/if}
	{#if showErrorMessage}<div class="toast error">⚠️ {messageText}</div>{/if}

	<div class="main-content">
		<div class="content-panel">
			<div class="breadcrumb">
				<div class="breadcrumb-path">
					<span class="nav-icon">🗂️</span>
					<span
						class="nav-item"
						class:active={selectedCabinetId === null && selectedSectionId === null}
						onclick={() => {
							selectedCabinetId = null
							selectedSectionId = null
						}}>All Cabinets</span
					>
					{#if currentPath().cabinet}<span class="nav-separator">›</span><span
							class="nav-item"
							onclick={() => (selectedSectionId = null)}>{currentPath().cabinet}</span
						>{/if}
					{#if currentPath().section}<span class="nav-separator">›</span><span
							class="nav-item active">{currentPath().section}</span
						>{/if}
				</div>
				<div class="breadcrumb-info">
					{#if isSearchActive()}🔍 Found {searchedItems().length} items{:else}📄 {displayedItems()
							.length} items{/if}
				</div>
			</div>

			{#if isSearchActive()}
				{#if searchedItems().length === 0}
					<div class="empty-state">
						<span class="empty-icon">🔍</span>
						<h3>No items found</h3>
						<p>No items match "{searchTerm}"</p>
						<button class="empty-btn" onclick={clearSearch}>Clear Search</button>
					</div>
				{:else}
					<!-- Items per page selector -->
					<div class="pagination-controls top">
						<div class="items-per-page">
							<span>Show:</span>
							<select bind:value={itemsPerPage} onchange={changeItemsPerPage}>
								{#each itemsPerPageOptions as option}
									<option value={option}>{option}</option>
								{/each}
							</select>
							<span>items per page</span>
						</div>
						<div class="pagination-info">
							Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, currentItems().length)} of {currentItems().length} items
						</div>
					</div>
					
					<div class="items-grid">
						{#each paginatedItems() as item}
							<div class="item-card">
								<div class="item-actions">
									<button class="action-btn edit" onclick={() => navigateToEdit(item.id)}>✏️</button
									><button class="action-btn delete" onclick={() => openDeleteModal(item)}
										>🗑️</button
									>
								</div>
								<div class="item-image">
									{#if item.imageUrl}<img
											src={getImageUrl(item.imageUrl)}
											alt={item.name}
										/>{:else}<div class="no-image">📦</div>{/if}
								</div>
								<div class="item-info">
									<div class="item-badges">
										<span class="badge cat">{item.category}</span><span class="badge sub"
											>{item.subCategory}</span
										><span class="badge stock {getStockBadge(item.stock).class}"
											>{getStockBadge(item.stock).text}</span
										>
									</div>
									<h4 class="item-name">{item.name}</h4>
									<div class="item-prices">
										<div class="price-idr">🇮🇩 {getPriceIdr(item).formatted}</div>
										{#if getCostPrice(item).amount > 0}<div class="price-cost">
												🏭 Cost: {getCostPrice(item).formatted}
											</div>{/if}
									</div>
									<div class="item-serial">
										<span class="serial-label">🔢 SN:</span><span class="serial-value"
											>{item.serialNumber || '-'}</span
										>
									</div>
									<div class="item-location">
										<span>📍 {item.location || 'No location'}</span><span
											>📦 Stock: {item.stock}</span
										>
									</div>
								</div>
							</div>
						{/each}
					</div>
					
					<!-- Pagination -->
					{#if totalPages() > 1}
						<div class="pagination">
							<button class="page-btn" onclick={() => goToPage(1)} disabled={currentPage === 1}>« First</button>
							<button class="page-btn" onclick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>‹ Prev</button>
							<span class="page-info">Page {currentPage} of {totalPages()}</span>
							<button class="page-btn" onclick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages()}>Next ›</button>
							<button class="page-btn" onclick={() => goToPage(totalPages())} disabled={currentPage === totalPages()}>Last »</button>
						</div>
					{/if}
				{/if}
			{:else if selectedSectionId !== null}
				{#if displayedItems().length === 0}
					<div class="empty-state">
						<span class="empty-icon">📭</span>
						<h3>Empty Section</h3>
						<p>No items in this section yet</p>
						<button class="empty-btn primary" onclick={navigateToAdd}>Add New Item</button>
					</div>
				{:else}
					<!-- Items per page selector -->
					<div class="pagination-controls top">
						<div class="items-per-page">
							<span>Show:</span>
							<select bind:value={itemsPerPage} onchange={changeItemsPerPage}>
								{#each itemsPerPageOptions as option}
									<option value={option}>{option}</option>
								{/each}
							</select>
							<span>items per page</span>
						</div>
						<div class="pagination-info">
							Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, currentItems().length)} of {currentItems().length} items
						</div>
					</div>
					
					<div class="items-grid">
						{#each paginatedItems() as item}
							<div class="item-card">
								<div class="item-actions">
									<button class="action-btn edit" onclick={() => navigateToEdit(item.id)}>✏️</button
									><button class="action-btn delete" onclick={() => openDeleteModal(item)}
										>🗑️</button
									>
								</div>
								<div class="item-image">
									{#if item.imageUrl}<img
											src={getImageUrl(item.imageUrl)}
											alt={item.name}
										/>{:else}<div class="no-image">📦</div>{/if}
								</div>
								<div class="item-info">
									<div class="item-badges">
										<span class="badge cat">{item.category}</span><span class="badge sub"
											>{item.subCategory}</span
										><span class="badge stock {getStockBadge(item.stock).class}"
											>{getStockBadge(item.stock).text}</span
										>
									</div>
									<h4 class="item-name">{item.name}</h4>
									<div class="item-prices">
										<div class="price-idr">🇮🇩 {getPriceIdr(item).formatted}</div>
										{#if getCostPrice(item).amount > 0}<div class="price-cost">
												🏭 Cost: {getCostPrice(item).formatted}
											</div>{/if}
									</div>
									<div class="item-serial">
										<span class="serial-label">🔢 SN:</span><span class="serial-value"
											>{item.serialNumber || '-'}</span
										>
									</div>
									<div class="item-location">
										<span>📍 {item.location || 'No location'}</span><span
											>📦 Stock: {item.stock}</span
										>
									</div>
								</div>
							</div>
						{/each}
					</div>
					
					<!-- Pagination -->
					{#if totalPages() > 1}
						<div class="pagination">
							<button class="page-btn" onclick={() => goToPage(1)} disabled={currentPage === 1}>« First</button>
							<button class="page-btn" onclick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>‹ Prev</button>
							<span class="page-info">Page {currentPage} of {totalPages()}</span>
							<button class="page-btn" onclick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages()}>Next ›</button>
							<button class="page-btn" onclick={() => goToPage(totalPages())} disabled={currentPage === totalPages()}>Last »</button>
						</div>
					{/if}
				{/if}
			{:else if selectedCabinetId !== null}
				{@const cabinet = cabinets.find((c) => c.id === selectedCabinetId)}
				{#if cabinet && cabinet.sections?.length === 0}
					<div class="empty-state">
						<span class="empty-icon">📭</span>
						<h3>Empty Cabinet</h3>
						<p>No sections in this cabinet yet</p>
					</div>
				{:else}
					<div class="folders-grid">
						{#each cabinet?.sections || [] as section}
							<div class="folder-card" onclick={() => selectSection(section.id)}>
								<div class="folder-icon">📂</div>
								<div class="folder-name">{section.name}</div>
								<div class="folder-count">{section.items?.length || 0} items</div>
							</div>
						{/each}
					</div>
				{/if}
			{:else if cabinets.length === 0}
				<div class="empty-state">
					<span class="empty-icon">📭</span>
					<h3>No Cabinets</h3>
					<p>Create a cabinet to start organizing items</p>
					<button class="empty-btn primary" onclick={navigateToAdd}>Add New Item</button>
				</div>
			{:else}
				<div class="folders-grid">
					{#each cabinets as cabinet}
						<div class="folder-card" onclick={() => selectCabinet(cabinet.id)}>
							<div class="folder-icon">📁</div>
							<div class="folder-name">{cabinet.name}</div>
							<div class="folder-count">{cabinet.sections?.length || 0} sections</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>

{#if showDeleteModal}
	<div class="modal-overlay" onclick={closeDeleteModal}>
		<div class="modal" onclick={(e) => e.stopPropagation()}>
			<button class="modal-close" onclick={closeDeleteModal}>×</button>
			<div class="modal-icon">⚠️</div>
			<h3>Delete Item</h3>
			<p>
				Are you sure you want to delete <strong>"{selectedItem?.name}"</strong>?<br />This action
				cannot be undone.
			</p>
			<div class="modal-actions">
				<button class="btn-cancel" onclick={closeDeleteModal} disabled={isDeleting}>Cancel</button>
				<button class="btn-delete" onclick={handleDelete} disabled={isDeleting}
					>{#if isDeleting}<span class="spinner"></span>{/if}Delete</button
				>
			</div>
		</div>
	</div>
{/if}

<style>
	/* ... (styles sebelumnya tetap sama, tambahkan berikut) ... */
	
	/* Pagination Controls */
	.pagination-controls {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px 20px;
		background: #ffffff;
		border-bottom: 1px solid #e0e0e0;
		flex-shrink: 0;
	}
	
	.pagination-controls.top {
		border-top: none;
	}
	
	.items-per-page {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 13px;
		color: #666666;
	}
	
	.items-per-page select {
		padding: 4px 8px;
		border: 1px solid #e0e0e0;
		border-radius: 6px;
		background: #ffffff;
		color: #333333;
		cursor: pointer;
	}
	
	.pagination-info {
		font-size: 13px;
		color: #666666;
	}
	
	.pagination {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 8px;
		padding: 16px 20px;
		background: #ffffff;
		border-top: 1px solid #e0e0e0;
		flex-shrink: 0;
	}
	
	.page-btn {
		padding: 6px 12px;
		background: #f5f5f5;
		border: 1px solid #e0e0e0;
		border-radius: 6px;
		color: #333333;
		cursor: pointer;
		font-size: 13px;
		transition: all 0.2s;
	}
	
	.page-btn:hover:not(:disabled) {
		background: #10b981;
		border-color: #10b981;
		color: #ffffff;
	}
	
	.page-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.page-info {
		padding: 6px 12px;
		font-size: 13px;
		color: #666666;
	}
	
	/* Items grid scroll improvement */
	.items-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 20px;
		padding: 24px;
		overflow-y: auto;
		flex: 1;
	}
	
	/* Main content scroll */
	.main-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		background: #f5f5f5;
	}
	
	.content-panel {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}
	
	/* Tambahan styles yang mungkin hilang */
	.file-manager {
		height: 100%;
		display: flex;
		flex-direction: column;
		background: #f5f5f5;
		color: #333333;
	}
	
	/* Make sure modal overlay is on top */
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
		z-index: 2000;
	}
</style>