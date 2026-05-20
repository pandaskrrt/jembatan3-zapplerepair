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

	// Navigation functions
	function selectCabinet(cabinetId: number) {
		selectedCabinetId = cabinetId
		selectedSectionId = null
	}

	function selectSection(sectionId: number) {
		selectedSectionId = sectionId
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
					<div class="items-grid">
						{#each searchedItems() as item}
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
					<div class="items-grid">
						{#each displayedItems() as item}
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

.file-manager {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #f5f5f5;
    color: #333333;
}

/* Header */
.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    background: #ffffff;
    border-bottom: 1px solid #e0e0e0;
    flex-shrink: 0;
}

.title {
    font-size: 20px;
    font-weight: 600;
    margin: 0;
    color: #333333;
}

.subtitle {
    font-size: 12px;
    color: #888888;
    margin-top: 4px;
}

.header-right {
    display: flex;
    gap: 12px;
    align-items: center;
}

.search-box {
    position: relative;
}

.search-input {
    padding: 8px 32px 8px 36px;
    background: #ffffff;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    color: #333333;
    width: 250px;
    font-size: 14px;
}

.search-input:focus {
    outline: none;
    border-color: #10b981;
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1);
}

.search-icon {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 14px;
    opacity: 0.6;
}

.search-clear {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #888;
    cursor: pointer;
}

.refresh-btn {
    background: #ffffff;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 8px 12px;
    cursor: pointer;
    font-size: 16px;
    transition: all 0.2s;
}

.refresh-btn:hover {
    background: #f5f5f5;
    border-color: #10b981;
}

.add-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: #10b981;
    border: none;
    border-radius: 8px;
    color: #ffffff;
    font-weight: 600;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
}

.add-btn:hover {
    background: #059669;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
}

/* Toast */
.toast {
    position: fixed;
    top: 80px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    z-index: 1000;
    animation: slideIn 0.3s ease;
    background: #ffffff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.toast.success {
    border: 1px solid #10b981;
    color: #059669;
}

.toast.error {
    border: 1px solid #ef4444;
    color: #dc2626;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

/* Main Content */
.main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0;
    background: #f5f5f5;
}

.content-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0;
}

/* Breadcrumb */
.breadcrumb {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px;
    background: #ffffff;
    border-bottom: 1px solid #e0e0e0;
    flex-shrink: 0;
}

.breadcrumb-path {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
}

.nav-icon {
    margin-right: 4px;
}

.nav-item {
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.2s;
    color: #666666;
}

.nav-item:hover {
    background: #f5f5f5;
}

.nav-item.active {
    color: #10b981;
    font-weight: 600;
}

.nav-separator {
    color: #cccccc;
    margin: 0 4px;
}

.breadcrumb-info {
    font-size: 12px;
    color: #888888;
}

/* Folders Grid */
.folders-grid {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 20px;
    padding: 24px;
    overflow-y: auto;
}

.folder-card {
    background: #ffffff;
    border: 1px solid #e0e0e0;
    border-radius: 12px;
    padding: 28px 16px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.folder-card:hover {
    background: #ffffff;
    transform: translateY(-4px);
    border-color: #10b981;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.folder-icon {
    font-size: 48px;
    margin-bottom: 12px;
}

.folder-name {
    font-weight: 600;
    margin-bottom: 4px;
    color: #333333;
    font-size: 14px;
}

.folder-count {
    font-size: 11px;
    color: #888888;
}

/* Items Grid */
.items-grid {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
    padding: 24px;
    overflow-y: auto;
    align-content: start;
}

.item-card {
    background: #ffffff;
    border: 1px solid #e0e0e0;
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.2s;
    position: relative;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.item-card:hover {
    transform: translateY(-4px);
    border-color: #10b981;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.item-actions {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    gap: 6px;
    opacity: 0;
    transition: opacity 0.2s;
    z-index: 2;
}

.item-card:hover .item-actions {
    opacity: 1;
}

.action-btn {
    width: 30px;
    height: 30px;
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    backdrop-filter: blur(4px);
    transition: all 0.2s;
}

.action-btn.edit:hover {
    background: #10b981;
    color: #ffffff;
    border-color: #10b981;
}

.action-btn.delete:hover {
    background: #ef4444;
    color: #ffffff;
    border-color: #ef4444;
}

.item-image {
    height: 180px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f9fafb;
    overflow: hidden;
}

.item-image img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}

.no-image {
    font-size: 48px;
    opacity: 0.3;
}

.item-info {
    padding: 12px;
}

.item-badges {
    display: flex;
    gap: 6px;
    margin-bottom: 8px;
    flex-wrap: wrap;
}

.badge {
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 10px;
    font-weight: 500;
}

.badge.cat {
    background: #f5f5f5;
    color: #666666;
}

.badge.sub {
    background: #f0fdf4;
    color: #059669;
}

.badge.stock.in {
    background: #f0fdf4;
    color: #059669;
}

.badge.stock.low {
    background: #fffbeb;
    color: #d97706;
}

.badge.stock.out {
    background: #fef2f2;
    color: #dc2626;
}

.item-name {
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 8px 0;
    color: #333333;
}

.item-prices {
    margin-bottom: 8px;
}

.price-idr {
    font-size: 12px;
    color: #059669;
    font-weight: 500;
}

.price-cost {
    font-size: 11px;
    color: #10b981;
    font-weight: 500;
    margin-top: 2px;
}

.item-serial {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 10px;
    padding: 4px 0;
    border-top: 1px solid #f0f0f0;
    margin-top: 4px;
}

.serial-label {
    color: #888888;
}

.serial-value {
    font-family: monospace;
    color: #10b981;
    font-weight: 500;
}

.item-location {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: #888888;
    padding-top: 4px;
}

/* Empty State */
.empty-state {
    text-align: center;
    padding: 60px 20px;
    color: #888888;
}

.empty-icon {
    font-size: 64px;
    display: block;
    margin-bottom: 16px;
    opacity: 0.5;
}

.empty-state h3 {
    color: #333333;
    margin-bottom: 8px;
}

.empty-btn {
    margin-top: 20px;
    padding: 8px 20px;
    background: #ffffff;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    color: #666666;
    cursor: pointer;
    transition: all 0.2s;
}

.empty-btn:hover {
    background: #f5f5f5;
}

.empty-btn.primary {
    background: #10b981;
    color: #ffffff;
    border: none;
}

.empty-btn.primary:hover {
    background: #059669;
}

/* Modal */
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

.modal {
    background: #ffffff;
    border: 1px solid #e0e0e0;
    border-radius: 16px;
    padding: 24px;
    max-width: 380px;
    width: 90%;
    text-align: center;
    position: relative;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.modal-close {
    position: absolute;
    top: 12px;
    right: 12px;
    background: none;
    border: none;
    color: #888888;
    font-size: 20px;
    cursor: pointer;
}

.modal-icon {
    font-size: 48px;
    margin-bottom: 16px;
}

.modal h3 {
    color: #333333;
    margin-bottom: 8px;
}

.modal p {
    color: #666666;
    margin-bottom: 24px;
    font-size: 14px;
}

.modal-actions {
    display: flex;
    gap: 12px;
}

.btn-cancel,
.btn-delete {
    flex: 1;
    padding: 10px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
}

.btn-cancel {
    background: #f5f5f5;
    color: #666666;
    border: 1px solid #e0e0e0;
}

.btn-cancel:hover {
    background: #e5e5e5;
}

.btn-delete {
    background: #ef4444;
    color: #ffffff;
}

.btn-delete:hover {
    background: #dc2626;
}

.spinner {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
    margin-right: 6px;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* Scrollbar */
.folders-grid::-webkit-scrollbar,
.items-grid::-webkit-scrollbar {
    width: 6px;
}

.folders-grid::-webkit-scrollbar-track,
.items-grid::-webkit-scrollbar-track {
    background: #f5f5f5;
}

.folders-grid::-webkit-scrollbar-thumb,
.items-grid::-webkit-scrollbar-thumb {
    background: #cccccc;
    border-radius: 3px;
}

.folders-grid::-webkit-scrollbar-thumb:hover,
.items-grid::-webkit-scrollbar-thumb:hover {
    background: #aaaaaa;
}

/* Responsive */
@media (max-width: 768px) {
    .header {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
    }

    .header-right {
        justify-content: space-between;
    }

    .search-input {
        width: 180px;
    }

    .folders-grid {
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 12px;
        padding: 16px;
    }

    .items-grid {
        grid-template-columns: 1fr;
        padding: 16px;
    }

    .folder-card {
        padding: 20px 12px;
    }

    .folder-icon {
        font-size: 36px;
    }
}