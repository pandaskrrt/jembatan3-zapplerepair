<script lang="ts">
	import { goto, invalidate } from '$app/navigation'
	import { onMount, onDestroy } from 'svelte'
	import { browser } from '$app/environment'

	let { data } = $props()

	// Data dari server
	let cabinets = $state(data?.cabinets || [])
	let allItems = $state(data?.items || [])
	let sections = $state(data?.sections || [])
	let userRole = $state(data?.userRole || '')
	let stats = $state(data?.stats || { totalItems: 0, lockedSections: 0, itemsInLockedSections: 0, categories: 0 })

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

	// Helper function untuk mendapatkan nama cabinet dari item
	function getCabinetName(item: any): string {
		// Coba dari item.cabinetName dulu
		if (item.cabinetName) return item.cabinetName
		// Cari dari cabinets berdasarkan cabinetId
		if (item.cabinetId) {
			const cabinet = cabinets.find(c => c.id === item.cabinetId)
			if (cabinet) return cabinet.name
		}
		// Cari dari section
		if (item.sectionId) {
			const section = sections.find(s => s.id === item.sectionId)
			if (section && section.cabinetId) {
				const cabinet = cabinets.find(c => c.id === section.cabinetId)
				if (cabinet) return cabinet.name
			}
		}
		return 'Unknown Cabinet'
	}

	// Helper function untuk mendapatkan nama section dari item
	function getSectionNameFromItem(item: any): string {
		// Coba dari item.sectionName dulu
		if (item.sectionName) return item.sectionName
		// Cari dari sections berdasarkan sectionId
		if (item.sectionId) {
			const section = sections.find(s => s.id === item.sectionId)
			if (section) return section.name
		}
		return 'Unknown Section'
	}

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
			
			// Auto-refresh setiap 10 detik jika tab aktif
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
				window.history.replaceState({}, '', '/admin/stock')
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

	// Cek apakah item berada di section yang terkunci
	function isItemLocked(item: any): boolean {
		if (item.section?.isLocked === true) return true
		if (item.sectionId) {
			const section = sections.find(s => s.id === item.sectionId)
			return section?.isLocked === true
		}
		return false
	}

	function getLockMessage(item: any): string {
		if (!isItemLocked(item)) return ''
		let section = item.section
		if (!section && item.sectionId) {
			section = sections.find(s => s.id === item.sectionId)
		}
		if (section) {
			return `Item berada di section "${section.name}" yang sedang dalam proses audit. Terkunci ${section.lockRemainingHours || 0}j ${section.lockRemainingMinutes || 0}m lagi.`
		}
		return 'Item berada di section yang sedang dalam proses audit.'
	}

	// Get items based on selection - SHOW ALL ITEMS when no selection
	let displayedItems = $derived(() => {
		// If search is active, return all items (search will handle filtering)
		if (searchTerm.trim()) {
			return allItems
		}
		
		// If section is selected
		if (selectedSectionId !== null) {
			return allItems.filter((item) => item.sectionId === selectedSectionId)
		} 
		
		// If cabinet is selected
		if (selectedCabinetId !== null) {
			// Cari semua section dalam cabinet ini
			const cabinetSections = sections.filter((s) => s.cabinetId === selectedCabinetId)
			const sectionIds = cabinetSections.map((s: any) => s.id)
			return allItems.filter((item) => sectionIds.includes(item.sectionId))
		}
		
		// No selection - SHOW ALL ITEMS
		return allItems
	})

	// Filtered items by search
	let searchedItems = $derived(() => {
		let items = displayedItems()
		
		if (!searchTerm.trim()) return items
		
		const term = searchTerm.toLowerCase().trim()
		return items.filter(
			(item) =>
				(item.name && item.name.toLowerCase().includes(term)) ||
				(item.id && item.id.toString().includes(term)) ||
				(item.category && item.category.toLowerCase().includes(term)) ||
				(item.sku && item.sku.toLowerCase().includes(term)) ||
				(item.serialNumber && item.serialNumber.toLowerCase().includes(term))
		)
	})

	let isSearchActive = $derived(() => searchTerm.trim().length > 0)

	// Navigation functions
	function selectCabinet(cabinetId: number | null) {
		selectedCabinetId = cabinetId
		selectedSectionId = null
		searchTerm = ''
	}

	function selectSection(sectionId: number | null) {
		selectedSectionId = sectionId
		if (sectionId !== null) {
			// Set cabinet berdasarkan section yang dipilih
			const section = sections.find(s => s.id === sectionId)
			if (section) {
				selectedCabinetId = section.cabinetId
			}
		}
		searchTerm = ''
	}

	function getSectionName(sectionId: number | null) {
		if (!sectionId) return 'Unknown'
		const section = sections.find((s) => s.id === sectionId)
		return section?.name || 'Unknown'
	}

	function getCabinetNameById(cabinetId: number | null) {
		if (!cabinetId) return null
		const cabinet = cabinets.find((c) => c.id === cabinetId)
		return cabinet?.name || null
	}

	function getStockBadge(stock: number) {
		if (stock === 0) return { text: 'Out of Stock', class: 'out' }
		if (stock < 5) return { text: 'Low Stock', class: 'low' }
		return { text: 'In Stock', class: 'in' }
	}

	function clearFilters() {
		selectedCabinetId = null
		selectedSectionId = null
		searchTerm = ''
	}

	let currentPath = $derived(() => {
		if (selectedSectionId !== null) {
			const section = sections.find(s => s.id === selectedSectionId)
			const cabinetName = section ? getCabinetNameById(section.cabinetId) : null
			return { cabinet: cabinetName, section: section?.name }
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

	async function navigateToEdit(itemId: number, item: any) {
		if (isItemLocked(item)) {
			showNotification('error', getLockMessage(item))
			return
		}
		await goto(`/admin/item/edit?id=${itemId}`)
	}

	// Delete functions
	function openDeleteModal(item: any) {
		if (isItemLocked(item) && userRole !== 'SUPER_ADMIN') {
			showNotification('error', getLockMessage(item))
			return
		}
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

			const response = await fetch('/admin/stock', {
				method: 'POST',
				body: formData
			})

			const result = await response.json()

			if (response.ok && result.type !== 'failure') {
				showNotification('success', 'Item deleted successfully')
				allItems = allItems.filter(item => item.id !== selectedItem.id)
				closeDeleteModal()
				isDeleting = false
				refreshData()
			} else {
				const message = result.message || 'Failed to delete item'
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
	<title>Admin - Stock Management</title>
</svelte:head>

<div class="page">
	{#if showSuccessMessage}
		<div class="notification success">
			<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
			<span>{messageText}</span>
		</div>
	{/if}

	{#if showErrorMessage}
		<div class="notification error">
			<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
			<span>{messageText}</span>
		</div>
	{/if}

	<div class="header">
		<div class="header-left">
			<h1 class="page-title">Stock Management</h1>
			<p class="page-subtitle">Monitor, inspect, and manage warehouse assets</p>
		</div>
		<div class="header-right">
			<div class="search-box">
				<svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
				<input type="text" class="search-input" placeholder="Search by SKU, Name..." bind:value={searchTerm} />
				{#if searchTerm}
					<button class="clear-search" onclick={() => searchTerm = ''}>✕</button>
				{/if}
			</div>
			<button class="btn-add" onclick={navigateToAdd}>
				<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
				<span>Add Item</span>
			</button>
			<button class="btn-refresh" onclick={refreshData} title="Refresh">
				<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
			</button>
		</div>
	</div>

	<div class="stats-banner">
		<div class="stat-card">
			<div class="stat-icon purple">
				<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
			</div>
			<div class="stat-info">
				<span class="stat-value">{allItems.length}</span>
				<span class="stat-label">Total Items</span>
			</div>
		</div>
		<div class="stat-card">
			<div class="stat-icon red">
				<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
			</div>
			<div class="stat-info">
				<span class="stat-value text-red">{sections.filter(s => s.isLocked).length}</span>
				<span class="stat-label">Locked Sections</span>
			</div>
		</div>
		<div class="stat-card">
			<div class="stat-icon amber">
				<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
			</div>
			<div class="stat-info">
				<span class="stat-value text-amber">
					{allItems.filter(item => {
						const section = sections.find(s => s.id === item.sectionId)
						return section?.isLocked === true
					}).length}
				</span>
				<span class="stat-label">Items in Locked Sections</span>
			</div>
		</div>
	</div>

	<div class="navigation-breadcrumb">
		<button 
			class="crumb-btn" 
			class:active={selectedCabinetId === null && selectedSectionId === null} 
			onclick={() => { 
				selectedCabinetId = null; 
				selectedSectionId = null; 
				searchTerm = '';
			}}
		>
			 All Cabinets
		</button>
		{#if currentPath().cabinet}
			<span class="separator">/</span>
			<button 
				class="crumb-btn" 
				class:active={selectedSectionId === null && selectedCabinetId !== null} 
				onclick={() => { 
					selectedSectionId = null;
					searchTerm = '';
				}}
			>
				 {currentPath().cabinet}
			</button>
		{/if}
		{#if currentPath().section}
			<span class="separator">/</span>
			<button class="crumb-btn active" disabled>
				{currentPath().section}
			</button>
		{/if}

		{#if selectedCabinetId !== null || selectedSectionId !== null || isSearchActive()}
			<button class="btn-clear-filters" onclick={clearFilters}>
				Reset Filter
			</button>
		{/if}
	</div>

	<div class="workspace-grid">
		<div class="shelf-sidebar">
			<h3 class="sidebar-title">Warehouse Structure</h3>
			<div class="cabinet-tree">
				{#each cabinets as cabinet}
					<div class="cabinet-node-group">
						<button 
							class="cabinet-node-trigger" 
							class:selected={selectedCabinetId == cabinet.id}
							onclick={() => selectCabinet(cabinet.id)}
						>
							<svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect></svg>
							<span class="node-text">{cabinet.name}</span>
							<span class="item-count">
								{allItems.filter(item => {
									const section = sections.find(s => s.id === item.sectionId)
									return section?.cabinetId === cabinet.id
								}).length} items
							</span>
						</button>

						{#if selectedCabinetId == cabinet.id}
							<div class="section-sub-tree">
								{#each sections.filter(s => s.cabinetId == cabinet.id) as section}
									<button 
										class="section-node-trigger" 
										class:selected={selectedSectionId == section.id}
										onclick={() => selectSection(section.id)}
									>
										<span class="node-text">{section.name}</span>
										<span class="item-count-small">
											{allItems.filter(item => item.sectionId === section.id).length} items
										</span>
										{#if section.isLocked}
											<svg class="icon-xs icon-lock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
										{/if}
									</button>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<div class="main-content-stream">
			{#if searchedItems().length === 0}
				<div class="empty-state-card">
					<div class="empty-icon-wrapper">
						<svg class="large-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
					</div>
					<h3>No Items Found</h3>
					<p>No inventory items match the current filtration schema or keywords.</p>
					<button class="btn-secondary" onclick={clearFilters}>Reset Structural Filters</button>
				</div>
			{:else}
				<div class="items-grid-container">
					{#each searchedItems() as item}
						{@const locked = isItemLocked(item)}
						{@const priceInfo = getPriceIdr(item)}
						{@const stockBadge = getStockBadge(item.stock || 0)}
						{@const cabinetName = getCabinetName(item)}
						{@const sectionName = getSectionNameFromItem(item)}
						<div class="stock-item-card" class:card-locked={locked}>
							<div class="card-meta-header">
								<span class="sku-badge">{item.sku || item.serialNumber || 'NO-SKU'}</span>
								{#if locked}
									<span class="lock-pill-badge">
										<svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
										<span>AUDIT LOCKED</span>
									</span>
								{:else}
									<span class="status-pill-badge {stockBadge.class}">{stockBadge.text}</span>
								{/if}
							</div>

							<div class="card-body-core">
								<h4 class="item-display-name">{item.name || 'Unnamed Item'}</h4>
								<p class="category-meta-text">{item.category || 'Uncategorized'}</p>

								<div class="stock-metric-row">
									<div class="metric-block">
										<span class="lbl">Stock</span>
										<span class="val high-contrast">{item.stock || 0}</span>
									</div>
									<div class="metric-block">
										<span class="lbl">Unit</span>
										<span class="val">{item.unit || 'pcs'}</span>
									</div>
								</div>

								<div class="price-info">
									<div class="price-idr">🇮🇩 {priceInfo.formatted}</div>
									{#if getCostPrice(item).amount > 0}
										<div class="price-cost">🏭 Cost: {getCostPrice(item).formatted}</div>
									{/if}
								</div>

								<div class="structural-meta-footprint">
									<div class="footprint-row">
										<svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect></svg>
										<span>Cab: {cabinetName}</span>
									</div>
									<div class="footprint-row">
										<svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
										<span>Sec: {sectionName}</span>
									</div>
								</div>
								
								{#if locked}
									<div class="lock-info">
										<span>🔒 Section "{sectionName}" sedang diaudit</span>
										<small>Sisa: {item.section?.lockRemainingHours || 0}j {item.section?.lockRemainingMinutes || 0}m</small>
									</div>
								{/if}
							</div>

							<div class="card-actions-system-bar">
								<button 
									class="action-icon-btn edit-trigger" 
									disabled={locked && userRole !== 'SUPER_ADMIN'} 
									onclick={() => navigateToEdit(item.id, item)}
									title={locked ? "Locked under auditing" : "Edit Item Data"}
								>
									<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"></path></svg>
									<span>Edit</span>
								</button>
								<button 
									class="action-icon-btn delete-trigger" 
									disabled={locked && userRole !== 'SUPER_ADMIN'} 
									onclick={() => openDeleteModal(item)}
									title={locked ? "Locked under auditing" : "Delete Item"}
								>
									<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
								</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>

{#if showDeleteModal && selectedItem}
	<div class="modal-backdrop" role="dialog" aria-modal="true">
		<div class="modal-window-box">
			<div class="modal-icon-header alert-red">
				<svg class="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
			</div>
			<h3 class="modal-title-text">Destructive Deletion</h3>
			<p class="modal-description-text">
				Are you completely sure you want to drop item <strong>"{selectedItem.name}"</strong> [SKU: {selectedItem.sku || selectedItem.serialNumber || 'N/A'}] from system stock records? This operational mutation cannot be rolled back.
			</p>
			{#if selectedItem && isItemLocked(selectedItem)}
				<div class="modal-warning">
					🔒 Item berada di section yang sedang diaudit. Tidak dapat dihapus.
				</div>
			{/if}
			<div class="modal-actions-bar">
				<button class="btn-modal-secondary" disabled={isDeleting} onclick={closeDeleteModal}>
					Abort operation
				</button>
				<button class="btn-modal-destructive" disabled={isDeleting || (selectedItem && isItemLocked(selectedItem) && userRole !== 'SUPER_ADMIN')} onclick={handleDelete}>
					{#if isDeleting}
						<span class="spinner-micro"></span>
						<span>Dropping...</span>
					{:else}
						<span>Confirm Drop</span>
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Core & Reset Utilities */
	.icon-sm { width: 1rem; height: 1rem; }
	.icon-xs { width: 0.85rem; height: 0.85rem; }
	.text-red { color: #ef4444 !important; }
	.text-amber { color: #f59e0b !important; }

	.page {
		padding: 2rem;
		max-width: 1400px;
		margin: 0 auto;
		font-family: 'Inter', sans-serif;
		color: #e3e4e6;
		min-height: 100vh;
		background-color: #0b0b0c;
	}

	/* Toast Notification Banner System */
	.notification {
		position: fixed;
		top: 1.5rem;
		right: 1.5rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 1.25rem;
		border-radius: 8px;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
		z-index: 1000;
		animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
		font-size: 0.9rem;
		font-weight: 500;
	}

	.notification.success { background: #10b981; color: #ffffff; }
	.notification.error { background: #ef4444; color: #ffffff; }

	@keyframes slideIn {
		from { transform: translateY(-20px); opacity: 0; }
		to { transform: translateY(0); opacity: 1; }
	}

	/* Structural Management Header */
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.page-title {
		font-size: 2rem;
		font-weight: 600;
		color: #ffffff;
		margin: 0 0 0.35rem 0;
	}

	.page-subtitle {
		color: #a1a1a5;
		font-size: 0.95rem;
		margin: 0;
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	/* Custom Search Console Control */
	.search-box {
		position: relative;
		display: flex;
		align-items: center;
	}

	.search-icon {
		position: absolute;
		left: 0.75rem;
		color: #71717a;
		width: 1.1rem;
		height: 1.1rem;
	}

	.search-input {
		background: rgba(20, 20, 22, 0.8);
		border: 1px solid rgba(255, 255, 255, 0.08);
		color: #ffffff;
		padding: 0.6rem 2.2rem 0.6rem 2.2rem;
		border-radius: 8px;
		outline: none;
		font-size: 0.9rem;
		width: 240px;
		transition: all 0.2s ease;
	}

	.search-input:focus {
		border-color: #10b981;
		box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1);
	}

	.clear-search {
		position: absolute;
		right: 0.75rem;
		background: none;
		border: none;
		color: #71717a;
		cursor: pointer;
		font-size: 0.8rem;
	}

	.clear-search:hover { color: #ffffff; }

	.btn-add, .btn-refresh {
		background: #10b981;
		color: #ffffff;
		border: none;
		padding: 0.6rem 1.25rem;
		border-radius: 8px;
		font-weight: 500;
		font-size: 0.9rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-refresh {
		background: rgba(20, 20, 22, 0.8);
		border: 1px solid rgba(255, 255, 255, 0.08);
		padding: 0.6rem;
	}

	.btn-add:hover {
		background: #059669;
		transform: translateY(-1px);
	}

	.btn-refresh:hover {
		background: rgba(30, 30, 34, 0.9);
		border-color: rgba(16, 185, 129, 0.3);
	}

	/* Statistics Analytics Panel Metrics */
	.stats-banner {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.5rem;
		margin-bottom: 2rem;
	}

	.stat-card {
		background: rgba(20, 20, 22, 0.6);
		border: 1px solid rgba(255, 255, 255, 0.06);
		padding: 1.25rem;
		border-radius: 12px;
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.stat-icon {
		padding: 0.75rem;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.stat-icon.purple { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
	.stat-icon.red { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
	.stat-icon.amber { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }

	.stat-info { display: flex; flex-direction: column; }
	.stat-value { font-size: 1.5rem; font-weight: 600; color: #ffffff; }
	.stat-label { font-size: 0.8rem; color: #71717a; margin-top: 0.15rem; }

	/* Breadcrumb Management System */
	.navigation-breadcrumb {
		background: rgba(20, 20, 22, 0.3);
		border: 1px solid rgba(255, 255, 255, 0.04);
		padding: 0.6rem 1rem;
		border-radius: 8px;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
	}

	.crumb-btn {
		background: transparent;
		border: none;
		color: #71717a;
		cursor: pointer;
		padding: 0.15rem 0.4rem;
		border-radius: 4px;
		transition: all 0.2s;
	}

	.crumb-btn:hover:not(:disabled) { background: rgba(255, 255, 255, 0.05); color: #ffffff; }
	.crumb-btn.active { color: #10b981; font-weight: 500; }
	.separator { color: #3f3f46; }

	.btn-clear-filters {
		margin-left: auto;
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.2);
		color: #ef4444;
		padding: 0.25rem 0.6rem;
		border-radius: 6px;
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.2s;
	}
	.btn-clear-filters:hover { background: rgba(239, 68, 68, 0.2); }

	/* Workspace Core Layout Grid */
	.workspace-grid {
		display: grid;
		grid-template-columns: 280px 1fr;
		gap: 2rem;
		align-items: start;
	}

	/* Sidebar Tree Design */
	.shelf-sidebar {
		background: rgba(20, 20, 22, 0.4);
		border: 1px solid rgba(255, 255, 255, 0.04);
		padding: 1.25rem;
		border-radius: 12px;
		position: sticky;
		top: 2rem;
	}

	.sidebar-title {
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #71717a;
		margin: 0 0 1rem 0;
	}

	.cabinet-tree {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.cabinet-node-group {
		display: flex;
		flex-direction: column;
	}

	.cabinet-node-trigger {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		background: transparent;
		border: 1px solid transparent;
		padding: 0.6rem 0.75rem;
		border-radius: 8px;
		color: #a1a1a5;
		cursor: pointer;
		text-align: left;
		font-size: 0.9rem;
		transition: all 0.2s;
	}

	.cabinet-node-trigger:hover {
		background: rgba(255, 255, 255, 0.03);
		color: #ffffff;
	}

	.cabinet-node-trigger.selected {
		background: rgba(16, 185, 129, 0.08);
		border-color: rgba(16, 185, 129, 0.2);
		color: #10b981;
		font-weight: 500;
	}

	.item-count {
		margin-left: auto;
		font-size: 0.7rem;
		color: #71717a;
	}

	.section-sub-tree {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding-left: 1.5rem;
		margin-top: 0.25rem;
		border-left: 1px solid rgba(255, 255, 255, 0.06);
	}

	.section-node-trigger {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		background: transparent;
		border: none;
		padding: 0.4rem 0.5rem;
		border-radius: 6px;
		color: #71717a;
		cursor: pointer;
		text-align: left;
		font-size: 0.85rem;
		transition: all 0.15s;
	}

	.section-node-trigger:hover {
		color: #ffffff;
	}

	.section-node-trigger.selected {
		color: #10b981;
		font-weight: 500;
	}

	.item-count-small {
		margin-left: auto;
		font-size: 0.65rem;
		color: #71717a;
	}

	.icon-lock { color: #ef4444; margin-left: auto; }

	/* Main Stream Interface Layout */
	.items-grid-container {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 1.5rem;
	}

	/* Card Component Blueprint */
	.stock-item-card {
		background: rgba(20, 20, 22, 0.6);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 12px;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		transition: all 0.2s ease;
	}

	.stock-item-card:hover {
		transform: translateY(-2px);
		border-color: rgba(255, 255, 255, 0.12);
		box-shadow: 0 10px 20px rgba(0,0,0,0.2);
	}

	.stock-item-card.card-locked {
		background: rgba(20, 20, 22, 0.3);
		border-color: rgba(239, 68, 68, 0.15);
	}

	.card-meta-header {
		padding: 1rem 1.25rem 0.5rem 1.25rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.sku-badge {
		background: rgba(255, 255, 255, 0.05);
		color: #a1a1a5;
		font-family: monospace;
		padding: 0.2rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
	}

	.status-pill-badge, .lock-pill-badge {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.02em;
	}

	.status-pill-badge.in { color: #10b981; }
	.status-pill-badge.low { color: #f59e0b; }
	.status-pill-badge.out { color: #ef4444; }
	.lock-pill-badge { color: #ef4444; }

	.card-body-core {
		padding: 0.5rem 1.25rem 1.25rem 1.25rem;
		flex-grow: 1;
	}

	.item-display-name {
		font-size: 1.1rem;
		font-weight: 600;
		color: #ffffff;
		margin: 0 0 0.25rem 0;
	}

	.category-meta-text {
		font-size: 0.8rem;
		color: #71717a;
		margin: 0 0 1rem 0;
	}

	.stock-metric-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		background: rgba(0, 0, 0, 0.2);
		padding: 0.75rem;
		border-radius: 8px;
		margin-bottom: 1rem;
	}

	.metric-block { display: flex; flex-direction: column; }
	.metric-block .lbl { font-size: 0.7rem; color: #71717a; text-transform: uppercase; }
	.metric-block .val { font-size: 1.1rem; font-weight: 600; color: #a1a1a5; margin-top: 0.15rem; }
	.metric-block .val.high-contrast { color: #ffffff; }

	.price-info {
		margin-bottom: 1rem;
	}

	.price-idr {
		font-size: 0.9rem;
		color: #10b981;
		font-weight: 600;
	}

	.price-cost {
		font-size: 0.75rem;
		color: #71717a;
		margin-top: 0.25rem;
	}

	.structural-meta-footprint {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		border-top: 1px solid rgba(255, 255, 255, 0.04);
		padding-top: 0.85rem;
	}

	.footprint-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8rem;
		color: #71717a;
	}

	.lock-info {
		margin-top: 0.75rem;
		padding: 0.5rem;
		background: rgba(239, 68, 68, 0.1);
		border-radius: 6px;
		font-size: 0.7rem;
		color: #ef4444;
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.lock-info small {
		font-family: monospace;
		font-size: 0.65rem;
	}

	.card-actions-system-bar {
		display: flex;
		border-top: 1px solid rgba(255, 255, 255, 0.05);
		background: rgba(0, 0, 0, 0.1);
	}

	.action-icon-btn {
		flex: 1;
		background: transparent;
		border: none;
		padding: 0.75rem;
		color: #71717a;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		font-size: 0.85rem;
		font-weight: 500;
		transition: all 0.2s;
	}

	.action-icon-btn:hover:not(:disabled) { color: #ffffff; background: rgba(255, 255, 255, 0.02); }
	.action-icon-btn.edit-trigger:hover:not(:disabled) { color: #10b981; }
	.action-icon-btn.delete-trigger { flex-grow: 0; width: 50px; border-left: 1px solid rgba(255, 255, 255, 0.05); }
	.action-icon-btn.delete-trigger:hover:not(:disabled) { color: #ef4444; }

	.action-icon-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	/* Empty State View Design */
	.empty-state-card {
		background: rgba(20, 20, 22, 0.4);
		border: 1px solid rgba(255, 255, 255, 0.04);
		border-radius: 16px;
		padding: 4rem 2rem;
		text-align: center;
		max-width: 480px;
		margin: 4rem auto;
	}

	.empty-icon-wrapper {
		color: #3f3f46;
		margin-bottom: 1.5rem;
	}
	.large-icon { width: 3.5rem; height: 3.5rem; }

	.empty-state-card h3 { font-size: 1.25rem; font-weight: 600; color: #ffffff; margin: 0 0 0.5rem 0; }
	.empty-state-card p { color: #71717a; font-size: 0.9rem; margin: 0 0 1.5rem 0; line-height: 1.5; }
	.btn-secondary {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.08);
		color: #ffffff;
		padding: 0.5rem 1rem;
		border-radius: 8px;
		font-size: 0.85rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}
	.btn-secondary:hover { background: rgba(255, 255, 255, 0.1); }

	/* Modal Engineering Layout */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.8);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 2000;
		padding: 1.5rem;
	}

	.modal-window-box {
		background: #141416;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 16px;
		width: 100%;
		max-width: 440px;
		padding: 1.5rem;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
		animation: modalScaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
	}

	@keyframes modalScaleUp {
		from { transform: scale(0.95); opacity: 0; }
		to { transform: scale(1); opacity: 1; }
	}

	.modal-icon-header {
		width: 3rem;
		height: 3rem;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 1.25rem;
	}
	.modal-icon-header.alert-red { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
	.alert-icon { width: 1.5rem; height: 1.5rem; }

	.modal-title-text { font-size: 1.25rem; font-weight: 600; color: #ffffff; margin: 0 0 0.5rem 0; }
	.modal-description-text { font-size: 0.9rem; color: #a1a1a5; line-height: 1.5; margin: 0 0 1.75rem 0; }

	.modal-warning {
		background: rgba(239, 68, 68, 0.1);
		color: #ef4444;
		padding: 0.75rem;
		border-radius: 8px;
		margin-bottom: 1.25rem;
		font-size: 0.8rem;
	}

	.modal-actions-bar { display: flex; gap: 0.75rem; }
	
	.btn-modal-secondary, .btn-modal-destructive {
		flex: 1; padding: 0.65rem; border-radius: 8px; font-size: 0.9rem; font-weight: 500; cursor: pointer; border: none; transition: all 0.2s;
	}

	.btn-modal-secondary { background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); color: #a1a1a5; }
	.btn-modal-secondary:hover:not(:disabled) { background: rgba(255, 255, 255, 0.08); color: #ffffff; }

	.btn-modal-destructive { background: #ef4444; color: #ffffff; display: flex; align-items: center; justify-content: center; gap: 0.4rem; }
	.btn-modal-destructive:hover:not(:disabled) { background: #dc2626; }
	.btn-modal-destructive:disabled { opacity: 0.5; cursor: not-allowed; }

	.spinner-micro {
		width: 14px;
		height: 14px;
		border: 2px solid rgba(255,255,255,0.3);
		border-radius: 50%;
		border-top-color: #ffffff;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin { to { transform: rotate(360deg); } }

	/* Responsive Media Queries Framework */
	@media (max-width: 1024px) {
		.workspace-grid { grid-template-columns: 1fr; gap: 1.5rem; }
		.shelf-sidebar { position: static; }
	}

	@media (max-width: 768px) {
		.header { flex-direction: column; align-items: stretch; gap: 1rem; }
		.header-right { flex-direction: column; align-items: stretch; }
		.search-input { width: auto; }
		.stats-banner { grid-template-columns: 1fr; gap: 1rem; }
		.items-grid-container { grid-template-columns: 1fr; }
		.navigation-breadcrumb { flex-wrap: wrap; }
		.btn-clear-filters { margin-left: 0; margin-top: 0.5rem; }
	}
</style>