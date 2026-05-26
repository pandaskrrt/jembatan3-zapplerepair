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

                allItems = allItems.filter(item => item.id !== selectedItem.id)
                
                closeDeleteModal()
                isDeleting = false

                refreshData()
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

<style>
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
    transition: all 0.2s;
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
    opacity: 0.5;
    pointer-events: none;
}

.search-clear {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #aaaaaa;
    cursor: pointer;
    font-size: 12px;
    padding: 2px;
    line-height: 1;
    transition: color 0.2s;
}

.search-clear:hover {
    color: #333333;
}

.refresh-btn {
    background: #ffffff;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 8px 12px;
    cursor: pointer;
    font-size: 16px;
    transition: all 0.2s;
    line-height: 1;
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
    white-space: nowrap;
}

.add-btn:hover {
    background: #059669;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.add-btn:active {
    transform: translateY(0);
    box-shadow: none;
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
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    font-size: 14px;
    font-weight: 500;
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
        transform: translateX(110%);
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
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: #f5f5f5;
}

.content-panel {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
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
    flex-wrap: wrap;
}

.nav-icon {
    margin-right: 4px;
    font-size: 16px;
}

.nav-item {
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 6px;
    transition: all 0.2s;
    color: #666666;
    font-size: 13px;
}

.nav-item:hover {
    background: #f0fdf4;
    color: #10b981;
}

.nav-item.active {
    color: #10b981;
    font-weight: 600;
}

.nav-separator {
    color: #cccccc;
    font-size: 12px;
}

.breadcrumb-info {
    font-size: 12px;
    color: #aaaaaa;
    white-space: nowrap;
}

/* Folders Grid */
.folders-grid {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 20px;
    padding: 24px;
    overflow-y: auto;
    align-content: start;
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
    transform: translateY(-4px);
    border-color: #10b981;
    box-shadow: 0 8px 24px rgba(16, 185, 129, 0.12);
}

.folder-card:active {
    transform: translateY(-2px);
}

.folder-icon {
    font-size: 48px;
    margin-bottom: 12px;
    line-height: 1;
}

.folder-name {
    font-weight: 600;
    margin-bottom: 6px;
    color: #333333;
    font-size: 14px;
}

.folder-count {
    font-size: 11px;
    color: #aaaaaa;
    background: #f5f5f5;
    display: inline-block;
    padding: 2px 8px;
    border-radius: 10px;
}

/* Items Grid — maksimal 4 kolom */
.items-grid {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    grid-auto-rows: max-content;
    gap: 20px;
    padding: 24px;
    overflow-y: auto;
    align-content: start;
}

/* Item Card */
.item-card {
    background: #ffffff;
    border: 1px solid #e0e0e0;
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.2s;
    position: relative;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
}

.item-card:hover {
    transform: translateY(-4px);
    border-color: #10b981;
    box-shadow: 0 8px 24px rgba(16, 185, 129, 0.12);
}

.item-card:active {
    transform: translateY(-2px);
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
    font-size: 13px;
    backdrop-filter: blur(4px);
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
}

.action-btn.edit:hover {
    background: #10b981;
    color: #ffffff;
    border-color: #10b981;
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.action-btn.delete:hover {
    background: #ef4444;
    color: #ffffff;
    border-color: #ef4444;
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
}

.item-image {
    height: 160px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f9fafb;
    overflow: hidden;
    flex-shrink: 0;
    border-bottom: 1px solid #f0f0f0;
}

.item-image img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    transition: transform 0.3s ease;
}

.item-card:hover .item-image img {
    transform: scale(1.04);
}

.no-image {
    font-size: 40px;
    opacity: 0.2;
}

.item-info {
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
}

.item-badges {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
}

.badge {
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.2px;
    white-space: nowrap;
}

.badge.cat {
    background: #f0f0f0;
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
    color: #b45309;
}

.badge.stock.out {
    background: #fef2f2;
    color: #dc2626;
}

.item-name {
    font-size: 13px;
    font-weight: 600;
    margin: 0;
    color: #222222;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.item-prices {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.price-idr {
    font-size: 12px;
    color: #059669;
    font-weight: 600;
}

.price-cost {
    font-size: 11px;
    color: #aaaaaa;
    font-weight: 500;
}

.item-serial {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 10px;
    padding-top: 6px;
    border-top: 1px solid #f0f0f0;
    margin-top: auto;
}

.serial-label {
    color: #aaaaaa;
}

.serial-value {
    font-family: monospace;
    color: #10b981;
    font-weight: 600;
    font-size: 11px;
}

.item-location {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: #aaaaaa;
}

/* Empty State */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
    color: #aaaaaa;
    flex: 1;
}

.empty-icon {
    font-size: 64px;
    display: block;
    margin-bottom: 20px;
    opacity: 0.4;
    line-height: 1;
}

.empty-state h3 {
    color: #444444;
    margin: 0 0 8px 0;
    font-size: 18px;
    font-weight: 600;
}

.empty-state p {
    margin: 0 0 24px 0;
    font-size: 14px;
}

.empty-btn {
    padding: 10px 24px;
    background: #ffffff;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    color: #666666;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
}

.empty-btn:hover {
    background: #f5f5f5;
    border-color: #cccccc;
}

.empty-btn.primary {
    background: #10b981;
    color: #ffffff;
    border: none;
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.empty-btn.primary:hover {
    background: #059669;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
    transform: translateY(-1px);
}

/* Modal */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
}

.modal {
    background: #ffffff;
    border: 1px solid #e0e0e0;
    border-radius: 16px;
    padding: 32px 24px 24px;
    max-width: 380px;
    width: 90%;
    text-align: center;
    position: relative;
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.16);
    animation: scaleIn 0.2s ease;
}

@keyframes scaleIn {
    from { transform: scale(0.95); opacity: 0; }
    to   { transform: scale(1);    opacity: 1; }
}

.modal-close {
    position: absolute;
    top: 12px;
    right: 12px;
    background: #f5f5f5;
    border: none;
    color: #888888;
    font-size: 18px;
    cursor: pointer;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    line-height: 1;
}

.modal-close:hover {
    background: #eeeeee;
    color: #333333;
}

.modal-icon {
    font-size: 48px;
    margin-bottom: 16px;
    line-height: 1;
}

.modal h3 {
    color: #222222;
    margin: 0 0 10px 0;
    font-size: 18px;
    font-weight: 600;
}

.modal p {
    color: #666666;
    margin: 0 0 28px 0;
    font-size: 14px;
    line-height: 1.6;
}

.modal-actions {
    display: flex;
    gap: 10px;
}

.btn-cancel,
.btn-delete {
    flex: 1;
    padding: 10px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-weight: 600;
    font-size: 14px;
    transition: all 0.2s;
}

.btn-cancel {
    background: #f5f5f5;
    color: #555555;
    border: 1px solid #e0e0e0;
}

.btn-cancel:hover:not(:disabled) {
    background: #ebebeb;
}

.btn-cancel:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-delete {
    background: #ef4444;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
}

.btn-delete:hover:not(:disabled) {
    background: #dc2626;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn-delete:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

/* Spinner */
.spinner {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.35);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
    flex-shrink: 0;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

/* Scrollbar */
.folders-grid::-webkit-scrollbar,
.items-grid::-webkit-scrollbar {
    width: 5px;
}

.folders-grid::-webkit-scrollbar-track,
.items-grid::-webkit-scrollbar-track {
    background: transparent;
}

.folders-grid::-webkit-scrollbar-thumb,
.items-grid::-webkit-scrollbar-thumb {
    background: #dddddd;
    border-radius: 4px;
}

.folders-grid::-webkit-scrollbar-thumb:hover,
.items-grid::-webkit-scrollbar-thumb:hover {
    background: #bbbbbb;
}

/* Responsive */
@media (max-width: 1200px) {
    .items-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
}

@media (max-width: 900px) {
    .items-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
        padding: 16px;
    }

    .folders-grid {
        gap: 12px;
        padding: 16px;
    }
}

@media (max-width: 768px) {
    .header {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
        padding: 12px 16px;
    }

    .header-right {
        justify-content: space-between;
    }

    .search-input {
        width: 160px;
    }

    .folders-grid {
        grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    }

    .folder-card {
        padding: 20px 12px;
    }

    .folder-icon {
        font-size: 36px;
    }
}

@media (max-width: 480px) {
    .items-grid {
        grid-template-columns: 1fr;
        gap: 12px;
        padding: 12px;
    }

    .item-image {
        height: 180px;
    }
}
</style>