<script lang="ts">
	import { goto, invalidate } from '$app/navigation'
	import { onMount, onDestroy } from 'svelte'
	import { browser } from '$app/environment'
	import TandaTangan from '$lib/components/TandaTangan.svelte'
	import { generateSuratJalanPDF, type SuratJalanData } from '$lib/utils/suratJalan'

	let { data }: { data: any } = $props()

	let permanentLocations = $derived(data?.permanentLocations || [])
	let itemsByLocation = $derived(data?.itemsByLocation || [])
	let stats = $derived(data?.stats || {})
	let userRole = $derived(data?.userRole || '')

	let selectedLocationId: number | null = $state(null)
	let locationFilter = $state<'all' | 'luar' | 'china-sg'>('all')

	let filteredLocations = $derived(
		locationFilter === 'all'
			? permanentLocations
			: permanentLocations.filter((l: any) =>
				locationFilter === 'luar'
					? l.name === 'Barang Luar'
					: l.name === 'Barang China' || l.name === 'Barang Singapore'
			)
	)
	let filteredItemsByLocation = $derived(itemsByLocation.filter((loc: any) => filteredLocations.some((l: any) => l.id === loc.id)))
	let searchTerm = $state('')
	let allItems = $derived(filteredItemsByLocation.flatMap((loc: any) => loc.items))

	let displayedItems = $derived(selectedLocationId !== null
		? filteredItemsByLocation.find((loc: any) => loc.id === selectedLocationId)?.items || []
		: searchTerm
			? allItems.filter((item: any) =>
				item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
				item.id?.toString().includes(searchTerm.toLowerCase()) ||
				item.category?.toLowerCase().includes(searchTerm.toLowerCase())
			)
			: allItems
	)

	let isSearchActive = $derived(searchTerm.trim().length > 0)

	// Delete modal
	let selectedItem: any | null = $state(null)
	let showDeleteModal = $state(false)
	let isDeleting = $state(false)

	// Move modal
	let showMoveModal = $state(false)
	let moveTargetItem: any | null = $state(null)
	let isMoving = $state(false)

	// Return modal
	let showReturnModal = $state(false)
	let returnTargetItem: any | null = $state(null)
	let isReturning = $state(false)

	// Toast
	let showSuccessMessage = $state(false)
	let showErrorMessage = $state(false)
	let messageText = $state('')

	let refreshInterval: number | null = $state(null)

// Flow 1: Kirim & Pindah
let showKirimModal = $state(false)
let showConfirmKirim = $state(false)
let showPindahModal = $state(false)
let kirimItem: any | null = $state(null)
let kirimSelectedSerialId = $state<number | null>(null)
let kirimTujuan = $state('')
let pindahItem: any | null = $state(null)
let pindahSelectedSerialId = $state<number | null>(null)
let pindahTargetSectionId = $state<number | null>(null)
let kirimHargaModal = $state('')
let kirimHargaJual = $state('')
let pindahHargaModal = $state('')
let pindahHargaJual = $state('')
let modalLoading = $state(false)
let modalError = $state('')
let senderName = $state(data?.user?.name || data?.user?.username || 'Admin')
let senderSignature = $state('')
let pdfPreviewUrl = $state('')

	function getLocationBadge(locationName: string) {
		if (locationName.includes('Luar')) return { text: 'Luar', class: 'amber' }
		if (locationName.includes('China')) return { text: 'China', class: 'red' }
		if (locationName.includes('Singapore')) return { text: 'Singapore', class: 'blue' }
		return { text: locationName, class: 'default' }
	}

	function getStockBadge(stock: number) {
		if (stock === 0) return { text: 'Out', class: 'out' }
		if (stock < 5) return { text: 'Low', class: 'low' }
		return { text: 'In', class: 'in' }
	}

	function getImageUrl(imageUrl: string) {
		if (!imageUrl) return null
		if (imageUrl.startsWith('/')) return imageUrl
		return `/${imageUrl}`
	}

	async function refreshData() {
		await invalidate('permanent:data')
	}

	function handleVisibilityChange() {
		if (browser && document.visibilityState === 'visible') {
			refreshData()
		}
	}

	onMount(() => {
		refreshData()

		if (browser) {
			const params = new URLSearchParams(window.location.search)
			const locId = params.get('locationId')
			if (locId) {
				const id = Number(locId)
				if (!isNaN(id) && permanentLocations.some((l: any) => l.id === id)) {
					selectedLocationId = id
				}
			}
			const filter = params.get('filter')
			if (filter === 'luar' || filter === 'china-sg') locationFilter = filter
		}

		if (browser) {
			document.addEventListener('visibilitychange', handleVisibilityChange)
			refreshInterval = window.setInterval(() => {
				if (document.visibilityState === 'visible') {
					refreshData()
				}
			}, 10000)
		}
	})

	onDestroy(() => {
		if (browser) {
			document.removeEventListener('visibilitychange', handleVisibilityChange)
		}
		if (refreshInterval !== null) clearInterval(refreshInterval)
	})

	function selectLocation(locationId: number) {
		selectedLocationId = locationId
	}

	function clearSearch() {
		searchTerm = ''
	}

	function showNotification(type: 'success' | 'error', message: string) {
		showSuccessMessage = type === 'success'
		showErrorMessage = type === 'error'
		messageText = message
		setTimeout(() => {
			showSuccessMessage = false
			showErrorMessage = false
		}, 5000)
	}

	async function navigateToEdit(itemId: number) {
		await goto(`/admin/item/edit?id=${itemId}`)
	}

	function openDeleteModal(item: any) {
		selectedItem = item
		showDeleteModal = true
	}

	function closeDeleteModal() {
		selectedItem = null
		showDeleteModal = false
	}

	async function handleDelete() {
		if (!selectedItem) return
		isDeleting = true
		try {
			const formData = new FormData()
			formData.append('id', selectedItem.id.toString())
			const response = await fetch('/admin/item?/delete', { method: 'POST', body: formData })
			const text = await response.text()
			let result
			try { result = JSON.parse(text) } catch { result = { type: 'success' } }
			if (response.ok && result.type !== 'failure') {
				showNotification('success', 'Item deleted successfully')
				await refreshData()
				closeDeleteModal()
			} else {
				showNotification('error', result.message || result.data?.message || 'Gagal menghapus item')
			}
		} catch {
			showNotification('error', 'Network error! Please try again.')
		} finally {
			isDeleting = false
		}
	}

	function openMoveModal(item: any) {
		moveTargetItem = item
		showMoveModal = true
	}

	function closeMoveModal() {
		moveTargetItem = null
		showMoveModal = false
	}

	async function moveToPermanent(locationId: number) {
		if (!moveTargetItem) return
		isMoving = true
		try {
			const response = await fetch(`/api/items/${moveTargetItem.id}/move-to-permanent`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ targetSectionId: locationId })
			})
			const result = await response.json()
			if (response.ok && result.success) {
				showNotification('success', `Item berhasil dipindahkan!`)
				await refreshData()
				closeMoveModal()
			} else {
				showNotification('error', result.detail || result.error || 'Gagal memindahkan item')
			}
		} catch {
			showNotification('error', 'Network error!')
		} finally {
			isMoving = false
		}
	}

	function openReturnModal(item: any) {
		returnTargetItem = item
		showReturnModal = true
	}

	function closeReturnModal() {
		returnTargetItem = null
		showReturnModal = false
	}

	async function openKirim(item: any) {
		kirimItem = item
		kirimTujuan = 'Jembatan 3'
		kirimHargaModal = ''
		kirimHargaJual = ''
		kirimSelectedSerialId = null
		modalError = ''
		senderSignature = ''
		showKirimModal = true
		showConfirmKirim = false
	}

	function openPindah(item: any) {
		pindahItem = item
		pindahHargaModal = ''
		pindahHargaJual = ''
		pindahSelectedSerialId = null
		modalError = ''
		showPindahModal = true
	}

	function parsePrice(v: string): number { return Number(String(v).replace(/\./g, '')) || 0 }
	function onPriceInput(e: Event) {
		const input = e.target as HTMLInputElement
		return parseInt(input.value.replace(/[^0-9]/g, '')) || 0
	}
	function formatPriceNum(n: number): string { return n === 0 ? '' : n.toLocaleString('id-ID') }

	function proceedToConfirmKirim() {
		if (!kirimTujuan) { modalError = 'Pilih tujuan kirim'; return }
		if (!kirimSelectedSerialId) { modalError = 'Pilih serial'; return }
		if (!kirimHargaModal || parsePrice(kirimHargaModal) <= 0) { modalError = 'Isi Harga Modal terlebih dahulu'; return }
		if (!kirimHargaJual || parsePrice(kirimHargaJual) <= 0) { modalError = 'Isi Harga Jual terlebih dahulu'; return }
		modalError = ''
		
		// Generate PDF Preview
		const selectedSerial = kirimItem?.serials.find((s: any) => s.id === kirimSelectedSerialId)
		if (!selectedSerial || !kirimItem) return
		
		const pdfData: SuratJalanData = {
			nomorSurat: `ROXY-${Date.now()}`,
			tanggal: new Date().toLocaleDateString('id-ID'),
			pengirim: {
				nama: senderName,
				cabang: 'Roxy'
			},
			penerima: {
				nama: '-',
				cabang: kirimTujuan
			},
			barang: {
				nama: kirimItem.name,
				serialNumber: selectedSerial.serialNumber,
				qty: 1,
				hargaModal: parsePrice(kirimHargaModal),
				hargaJual: parsePrice(kirimHargaJual)
			},
			catatan: `Pengiriman barang dari Roxy ke ${kirimTujuan}`,
			senderName: senderName,
			receiverName: '-'
		}
		
		const pdf = generateSuratJalanPDF(pdfData)
		pdfPreviewUrl = pdf.output('dataurlstring')
		
		showConfirmKirim = true
	}
	
	// Update PDF ketika user TTD
	$effect(() => {
		if (senderSignature && pdfPreviewUrl && kirimItem) {
			updatePDFWithSignatureKirim()
		}
	})
	
	function updatePDFWithSignatureKirim() {
		if (!kirimItem) return
		
		const selectedSerial = kirimItem?.serials.find((s: any) => s.id === kirimSelectedSerialId)
		if (!selectedSerial) return
		
		const pdfData: SuratJalanData = {
			nomorSurat: `ROXY-${Date.now()}`,
			tanggal: new Date().toLocaleDateString('id-ID'),
			pengirim: {
				nama: senderName,
				cabang: 'Roxy'
			},
			penerima: {
				nama: '-',
				cabang: kirimTujuan
			},
			barang: {
				nama: kirimItem.name,
				serialNumber: selectedSerial.serialNumber,
				qty: 1,
				hargaModal: parsePrice(kirimHargaModal),
				hargaJual: parsePrice(kirimHargaJual)
			},
			catatan: `Pengiriman barang dari Roxy ke ${kirimTujuan}`,
			senderName: senderName,
			receiverName: '-'
		}
		
		const pdf = generateSuratJalanPDF(pdfData)
		
		// Embed signature
		if (senderSignature) {
			embedSignatureToPDF(pdf, senderSignature, 'sender', senderName)
		}
		
		pdfPreviewUrl = pdf.output('dataurlstring')
	}

	async function handleKirim() {
		if (!senderSignature) { modalError = 'Tanda tangan pengirim wajib diisi'; return }
		modalLoading = true
		modalError = ''
		try {
			// Generate PDF final dengan TTD pengirim
			const selectedSerial = kirimItem?.serials.find((s: any) => s.id === kirimSelectedSerialId)
			if (!selectedSerial || !kirimItem) return
			
			const pdfData: SuratJalanData = {
				nomorSurat: `ROXY-${Date.now()}`,
				tanggal: new Date().toLocaleDateString('id-ID'),
				pengirim: {
					nama: senderName,
					cabang: 'Roxy'
				},
				penerima: {
					nama: '-',
					cabang: kirimTujuan
				},
				barang: {
					nama: kirimItem.name,
					serialNumber: selectedSerial.serialNumber,
					qty: 1,
					hargaModal: parsePrice(kirimHargaModal),
					hargaJual: parsePrice(kirimHargaJual)
				},
				catatan: `Pengiriman barang dari Roxy ke ${kirimTujuan}`,
				senderName: senderName,
				receiverName: '-'
			}
			
			const pdf = generateSuratJalanPDF(pdfData)
			embedSignatureToPDF(pdf, senderSignature, 'sender', senderName)
			const pdfBase64 = pdf.output('dataurlstring')
			
			const res = await fetch('/api/barang-luar/kirim', {
				method: 'POST', headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					serialId: kirimSelectedSerialId,
					tujuan: kirimTujuan,
					modal: parsePrice(kirimHargaModal),
					jual: parsePrice(kirimHargaJual),
					senderName,
					senderSignature,
					pdfDocument: pdfBase64
				})
			})
			const d = await res.json()
			if (!res.ok) { modalError = d.error || 'Gagal kirim'; return }
			showKirimModal = false
			showConfirmKirim = false
			showNotification('success', d.message || 'Berhasil dikirim')
			await refreshData()
		} catch { modalError = 'Network error' }
		finally { modalLoading = false }
	}

	async function handlePindah() {
		if (!pindahTargetSectionId) { modalError = 'Pilih tujuan section'; return }
		if (!pindahSelectedSerialId) { modalError = 'Pilih serial'; return }
		if (!pindahHargaModal || parsePrice(pindahHargaModal) <= 0) { modalError = 'Isi Harga Modal terlebih dahulu'; return }
		if (!pindahHargaJual || parsePrice(pindahHargaJual) <= 0) { modalError = 'Isi Harga Jual terlebih dahulu'; return }
		modalLoading = true
		modalError = ''
		try {
			const res = await fetch('/api/barang-luar/pindah', {
				method: 'POST', headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					serialId: pindahSelectedSerialId,
					targetSectionId: pindahTargetSectionId,
					modal: parsePrice(pindahHargaModal),
					jual: parsePrice(pindahHargaJual)
				})
			})
			const d = await res.json()
			if (!res.ok) { modalError = d.error || 'Gagal pindah'; return }
			showPindahModal = false
			showNotification('success', d.message || 'Berhasil dipindah')
			await refreshData()
		} catch { modalError = 'Network error' }
		finally { modalLoading = false }
	}

	async function returnToOrigin(itemId: number) {
		if (!returnTargetItem) return
		isReturning = true
		try {
			const response = await fetch(`/api/items/${itemId}/return-to-origin`, { method: 'POST' })
			const result = await response.json()
			if (response.ok && result.success) {
				showNotification('success', 'Barang customer berhasil dikembalikan!')
				await refreshData()
				closeReturnModal()
			} else {
				showNotification('error', result.detail || result.error || 'Gagal mengembalikan item')
			}
		} catch {
			showNotification('error', 'Network error!')
		} finally {
			isReturning = false
		}
	}
</script>

<svelte:head>
	<title>Barang Luar / China / Singapore</title>
</svelte:head>

<div class="page-container">
	<div class="header">
		<div class="header-left">
			<h1 class="title">Master Data: Lokasi Tetap</h1>
			<div class="subtitle">Barang Luar • Barang China • Barang Singapore</div>
		</div>
		<div class="header-right">
			<a href={selectedLocationId ? `/admin/item/create?sectionId=${selectedLocationId}` : '/admin/item/create'} class="add-btn" data-sveltekit-reload>
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
				<span>Tambah Barang</span>
			</a>
			<div class="search-box">
				<span class="search-icon">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.604 10.604Z" /></svg>
				</span>
				<input type="text" placeholder="Search items..." bind:value={searchTerm} class="search-input" />
				{#if searchTerm}
					<button class="search-clear" onclick={clearSearch}>
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
					</button>
				{/if}
			</div>
		</div>
	</div>

	<div class="stats-banner">
		{#each filteredLocations as loc}
			<div class="stat-card" class:active={selectedLocationId === loc.id} onclick={() => selectLocation(loc.id)}>
				<div class="stat-icon {loc.name.includes('Luar') ? 'amber' : loc.name.includes('China') ? 'red' : 'blue'}">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
				</div>
				<div>
					<span class="stat-label">{loc.name}</span>
					<span class="stat-value">{stats.itemsPerLocation?.[loc.name] || 0} items</span>
				</div>
			</div>
		{/each}
		<div class="stat-card total" class:active={selectedLocationId === null} onclick={() => { selectedLocationId = null }}>
			<div class="stat-icon purple">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg>
			</div>
			<div>
				<span class="stat-label">Total Semua</span>
				<span class="stat-value">{stats.totalItems} items</span>
			</div>
		</div>
	</div>

	{#if showSuccessMessage}
		<div class="toast success">
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="toast-svg"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
			<span>{messageText}</span>
		</div>
	{/if}
	{#if showErrorMessage}
		<div class="toast error">
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="toast-svg"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
			<span>{messageText}</span>
		</div>
	{/if}

	<div class="breadcrumb">
		<div class="breadcrumb-path">
			<span class="nav-icon">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-19.5 0A2.25 2.25 0 0 0 4.5 15h15a2.25 2.25 0 0 0 2.25-2.25m-19.5 0v3.159c0 .538.214 1.055.595 1.436L4 17.5m17.75-4.75V15.91c0 .53-.213 1.037-.592 1.415L20 17.5M8.5 9.75V6a2.25 2.25 0 0 1 2.25-2.25h2.5A2.25 2.25 0 0 1 15.5 6v3.75M9 15v.008H9V15Zm3 0v.008h-.008V15H12Zm3 0v.008h-.008V15H15Z" /></svg>
			</span>
			<span class="nav-item" class:active={selectedLocationId === null} onclick={() => { selectedLocationId = null }}>Semua Lokasi</span>
			{#if selectedLocationId !== null}
				<span class="nav-separator">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
				</span>
				<span class="nav-item active">{filteredLocations.find((l: any) => l.id === selectedLocationId)?.name}</span>
			{/if}
		</div>
		<div class="breadcrumb-info">{displayedItems.length} items</div>
	</div>

	{#if displayedItems.length === 0}
		<div class="empty-state">
			<div class="empty-icon-box">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg>
			</div>
			<h3>Belum Ada Barang</h3>
			<p>Belum ada barang di lokasi ini.</p>
		</div>
	{:else}
		<div class="items-grid">
			{#each displayedItems as item}
				<div class="item-card">
					<div class="item-actions">
						<button class="action-btn edit" onclick={() => navigateToEdit(item.id)} title="Edit">
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg>
						</button>
						<button class="action-btn history" onclick={() => goto('/admin/item/' + item.id + '/history')} title="History">
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
						</button>
						<button class="action-btn delete" onclick={() => openDeleteModal(item)} title="Hapus">
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
						</button>
						<button class="action-btn move" onclick={() => openMoveModal(item)} title="Pindahkan ke lokasi paten">
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>
						</button>
						{#if item.isCustomer && item.originSectionName}
							<button class="action-btn return" onclick={() => openReturnModal(item)} title="Kembalikan ke asal">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" /></svg>
							</button>
						{/if}
					</div>
					<div class="item-image">
						{#if item.imageUrl}
							<img src={getImageUrl(item.imageUrl)} alt={item.name} />
						{:else}
							<div class="no-image-placeholder">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg>
							</div>
						{/if}
					</div>
					<div class="item-info">
						<div class="item-badges">
							<span class="badge cat">{item.category}</span>
							<span class="badge sub">{item.subCategory}</span>
							<span class="badge stock {getStockBadge(item.stock).class}">{getStockBadge(item.stock).text}</span>
							{#if item.isCustomer}
								<span class="badge customer">Customer</span>
							{/if}
							<span class="badge location {getLocationBadge(item.permanentLocation?.name || '').class}">{item.permanentLocation?.name}</span>
						</div>
						<h4 class="item-name">{item.name}</h4>
						<div class="item-prices">
							<div class="price-idr">{item.price?.amount ? `Rp ${item.price.amount.toLocaleString('id-ID')}` : ''}</div>
						</div>
						<div class="item-serial">
							<span class="serial-label">SN:</span>
							<span class="serial-value">{item.serialNumber || '-'}</span>
						</div>
						<div class="item-location">
							<span class="loc-txt">{item.location || '-'}</span>
							<span class="qty-txt">Qty: {item.stock}</span>
						</div>
						{#if item.isCustomer && item.originSectionName}
							<div class="origin-info">Asal: {item.originSectionName}</div>
						{/if}
						<div class="item-actions-row">
							<button class="btn-kirim" onclick={() => openKirim(item)}>Kirim</button>
							<button class="btn-pindah" onclick={() => openPindah(item)}>Pindah</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Delete Modal -->
{#if showDeleteModal && selectedItem}
	<div class="modal-overlay" onclick={closeDeleteModal}>
		<div class="modal" onclick={(e) => e.stopPropagation()}>
			<button class="modal-close" onclick={closeDeleteModal}>
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
			</button>
			<div class="modal-icon">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
			</div>
			<h3>Hapus Item</h3>
			<p>Yakin ingin menghapus <strong>"{selectedItem.name}"</strong>?</p>
			<div class="modal-actions">
				<button class="btn-cancel" onclick={closeDeleteModal} disabled={isDeleting}>Batal</button>
				<button class="btn-delete" onclick={handleDelete} disabled={isDeleting}>
					{#if isDeleting}<span class="spinner"></span>{/if}Hapus
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Move Modal -->
{#if showMoveModal && moveTargetItem}
	<div class="modal-overlay" onclick={closeMoveModal}>
		<div class="modal" onclick={(e) => e.stopPropagation()}>
			<button class="modal-close" onclick={closeMoveModal}>
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
			</button>
			<div class="modal-icon move-icon">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>
			</div>
			<h3>Pindahkan Item</h3>
			<p>Pilih lokasi paten untuk <strong>"{moveTargetItem.name}"</strong></p>
			<div class="permanent-location-list">
				{#each filteredLocations as loc}
					<button class="location-option" onclick={() => moveToPermanent(loc.id)} disabled={isMoving}>
						<span class="location-icon">
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
						</span>
						<div class="location-info">
							<span class="location-name">{loc.name}</span>
							<span class="location-desc">
								{#if moveTargetItem?.isCustomer}
									Barang customer — bisa dikembalikan kapan saja
								{:else}
									Barang non-customer — final, tidak bisa dikembalikan
								{/if}
							</span>
						</div>
						{#if isMoving}<span class="spinner"></span>{/if}
					</button>
				{/each}
			</div>
			<div class="modal-actions">
				<button class="btn-cancel" onclick={closeMoveModal} disabled={isMoving}>Batal</button>
			</div>
		</div>
	</div>
{/if}

<!-- Return Modal -->
{#if showReturnModal && returnTargetItem}
	<div class="modal-overlay" onclick={closeReturnModal}>
		<div class="modal" onclick={(e) => e.stopPropagation()}>
			<button class="modal-close" onclick={closeReturnModal}>
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
			</button>
			<div class="modal-icon return-icon">
				<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" /></svg>
			</div>
			<h3>Kembalikan ke Lokasi Asal</h3>
			<p>Kembalikan <strong>"{returnTargetItem.name}"</strong> ke <strong>{returnTargetItem.originSectionName || 'section asal'}</strong>?</p>
			<div class="modal-actions">
				<button class="btn-cancel" onclick={closeReturnModal} disabled={isReturning}>Batal</button>
				<button class="btn-return" onclick={() => returnToOrigin(returnTargetItem.id)} disabled={isReturning}>
					{#if isReturning}<span class="spinner"></span>{/if}Kembalikan
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- KIRIM MODAL -->
{#if showKirimModal && kirimItem}
<div class="modal-overlay" onclick={() => showKirimModal = false}><div class="modal" onclick={e => e.stopPropagation()}>
  <h3>Kirim Barang - {kirimItem.name}</h3>
  <p>Pilih serial untuk dikirim:</p>
  <div style="max-height:160px;overflow-y:auto;margin-bottom:0.75rem;">
    {#each kirimItem.serials || [] as s}
      <label style="display:flex;align-items:center;gap:0.5rem;padding:5px 8px;border:1px solid #e2e8f0;border-radius:6px;margin-bottom:3px;cursor:pointer;">
        <input type="radio" name="kirimSerial" checked={kirimSelectedSerialId === s.id} onchange={() => kirimSelectedSerialId = s.id} />
        <span style="font-family:monospace;font-size:0.8rem;">{s.serialNumber}</span>
        <span style="font-size:0.7rem;color:#64748b;margin-left:auto;">{s.category}</span>
      </label>
    {/each}
  </div>
  <p style="font-size:0.8rem;font-weight:600;color:#334155;margin-bottom:0.4rem;">Tujuan Kirim</p>
  <select bind:value={kirimTujuan} style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:6px;margin-bottom:0.75rem;box-sizing:border-box;font-size:0.8rem;">
    <option value="" disabled>-- Pilih Cabang --</option>
    <option value="Jembatan 3">Jembatan 3</option>
  </select>
  <p style="font-size:0.8rem;font-weight:600;color:#334155;margin-bottom:0.4rem;">Konfirmasi Harga</p>
  <div style="display:flex;gap:0.5rem;margin-bottom:0.5rem;">
    <div style="flex:1;">
      <label style="font-size:0.7rem;color:#64748b;">Harga Modal</label>
      <input type="text" inputmode="numeric" value={kirimHargaModal} oninput={(e) => kirimHargaModal = formatPriceNum(onPriceInput(e))} placeholder="0" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:6px;box-sizing:border-box;font-size:0.8rem;" />
    </div>
    <div style="flex:1;">
      <label style="font-size:0.7rem;color:#64748b;">Harga Jual</label>
      <input type="text" inputmode="numeric" value={kirimHargaJual} oninput={(e) => kirimHargaJual = formatPriceNum(onPriceInput(e))} placeholder="0" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:6px;box-sizing:border-box;font-size:0.8rem;" />
    </div>
  </div>
  <div class="modal-actions">
    <button class="btn-cancel" onclick={() => showKirimModal = false}>Batal</button>
    <button class="btn-delete" onclick={proceedToConfirmKirim} disabled={!kirimSelectedSerialId}>Lanjut</button>
  </div>
</div></div>
{/if}

{#if showConfirmKirim && kirimItem}
<div class="modal-overlay" onclick={() => showConfirmKirim = false}><div class="modal-pdf" onclick={e => e.stopPropagation()}>
  <div class="modal-header-pdf">
    <h3>Konfirmasi Pengiriman & Tanda Tangan</h3>
    <button class="modal-close-pdf" onclick={() => showConfirmKirim = false}>✕</button>
  </div>
  <div class="modal-body-split">
    <!-- Left: PDF Preview -->
    <div class="pdf-preview-section">
      <h4>Preview Surat Jalan</h4>
      {#if pdfPreviewUrl}
        <iframe src={pdfPreviewUrl} title="Preview Surat Jalan" class="pdf-iframe"></iframe>
      {:else}
        <p class="pdf-loading">Memuat preview...</p>
      {/if}
    </div>
    
    <!-- Right: Form TTD -->
    <div class="ttd-section">
      <div class="info-box">
        <p><strong>Anda akan menjadi pengirim barang ini.</strong></p>
        <p>Nama Pengirim: <strong>{senderName}</strong></p>
        <p>Tujuan: <strong>{kirimTujuan}</strong></p>
      </div>
      <p style="font-size:0.8rem;font-weight:600;color:#334155;margin-bottom:0.4rem;">Tanda Tangan Pengirim:</p>
      <TandaTangan bind:signatureData={senderSignature} width={350} height={150} />
      {#if modalError}<p style="color:#dc2626;font-size:0.8rem;margin-top:0.5rem;">{modalError}</p>{/if}
      <div class="modal-actions">
        <button class="btn-cancel" onclick={() => showConfirmKirim = false} disabled={modalLoading}>Kembali</button>
        <button class="btn-delete" onclick={handleKirim} disabled={modalLoading || !senderSignature}>
          {modalLoading ? 'Mengirim...' : 'Kirim Sekarang'}
        </button>
      </div>
    </div>
  </div>
</div></div>
{/if}

<!-- PINDAH MODAL -->
{#if showPindahModal && pindahItem}
<div class="modal-overlay" onclick={() => showPindahModal = false}><div class="modal" onclick={e => e.stopPropagation()}>
  <h3>Pindah ke Gudang - {pindahItem.name}</h3>
  <p>Pilih serial untuk dipindah:</p>
  <div style="max-height:160px;overflow-y:auto;margin-bottom:0.75rem;">
    {#each pindahItem.serials || [] as s}
      <label style="display:flex;align-items:center;gap:0.5rem;padding:5px 8px;border:1px solid #e2e8f0;border-radius:6px;margin-bottom:3px;cursor:pointer;">
        <input type="radio" name="pindahSerial" checked={pindahSelectedSerialId === s.id} onchange={() => pindahSelectedSerialId = s.id} />
        <span style="font-family:monospace;font-size:0.8rem;">{s.serialNumber}</span>
        <span style="font-size:0.7rem;color:#64748b;margin-left:auto;">{s.category}</span>
      </label>
    {/each}
  </div>
  <p>Tujuan section:</p>
  <select bind:value={pindahTargetSectionId} style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:6px;margin-bottom:0.75rem;box-sizing:border-box;font-size:0.8rem;">
    <option value={null} disabled>Pilih Section</option>
    {#each data.normalSections || [] as sec}
      <option value={sec.id}>{sec.name}</option>
    {/each}
  </select>
  <p style="font-size:0.8rem;font-weight:600;color:#334155;margin-bottom:0.4rem;">Konfirmasi Harga</p>
  <div style="display:flex;gap:0.5rem;margin-bottom:0.5rem;">
    <div style="flex:1;">
      <label style="font-size:0.7rem;color:#64748b;">Harga Modal</label>
      <input type="text" inputmode="numeric" value={pindahHargaModal} oninput={(e) => pindahHargaModal = formatPriceNum(onPriceInput(e))} placeholder="0" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:6px;box-sizing:border-box;font-size:0.8rem;" />
    </div>
    <div style="flex:1;">
      <label style="font-size:0.7rem;color:#64748b;">Harga Jual</label>
      <input type="text" inputmode="numeric" value={pindahHargaJual} oninput={(e) => pindahHargaJual = formatPriceNum(onPriceInput(e))} placeholder="0" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:6px;box-sizing:border-box;font-size:0.8rem;" />
    </div>
  </div>
  <div class="modal-actions">
    <button class="btn-cancel" onclick={() => showPindahModal = false}>Batal</button>
    <button class="btn-return" onclick={handlePindah} disabled={!pindahSelectedSerialId || !pindahTargetSectionId}>Pindah</button>
  </div>
</div></div>
{/if}

<style>


	:global(body) { font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
	.page-container { min-height: 100vh; background: #0b0b0c; }
	.header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; background: #161618; border-bottom: 1px solid rgba(255,255,255,0.08); }
	.header-right { display: flex; align-items: center; gap: 0.75rem; }
	.add-btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 8px; font-size: 0.875rem; font-weight: 500; cursor: pointer; text-decoration: none; }
	.add-btn:hover { background: #3b82f6; }
	.title { font-size: 1.25rem; font-weight: 700; margin: 0; color: #e3e4e6; letter-spacing: -0.02em; }
	.subtitle { font-size: 0.775rem; color: #8f8f96; margin-top: 2px; }
	.search-box { position: relative; }
	.search-input { padding: 0.5rem 2.25rem 0.5rem 2.25rem; background: rgba(255,255,255,0.04); border: 1px solid transparent; border-radius: 8px; color: #e3e4e6; width: 260px; font-size: 0.875rem; transition: all 0.2s; }
	.search-input:focus { outline: none; background: #161618; border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.1); }
	.search-icon { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: #71717a; pointer-events: none; display: flex; }
	.search-icon svg { width: 16px; height: 16px; }
	.search-clear { position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); background: none; border: none; color: #71717a; cursor: pointer; padding: 0; display: flex; }
	.search-clear svg { width: 14px; height: 14px; }
	.stats-banner { display: flex; gap: 1rem; padding: 1rem 1.5rem; background: #161618; border-bottom: 1px solid rgba(255,255,255,0.08); overflow-x: auto; }
	.stat-card { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; background: #0b0b0c; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); cursor: pointer; transition: all 0.2s; min-width: 180px; }
	.stat-card:hover { border-color: rgba(255,255,255,0.08); }
	.stat-card.active { border-color: #10b981; background: rgba(16,185,129,0.12); }
	.stat-card.total { background: #faf5ff; border-color: #d8b4fe; }
	.stat-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
	.stat-icon svg { width: 18px; height: 18px; }
	.stat-icon.amber { background: #fef3c7; color: #d97706; }
	.stat-icon.red { background: #fee2e2; color: #dc2626; }
	.stat-icon.blue { background: #dbeafe; color: #3b82f6; }
	.stat-icon.purple { background: #f3e8ff; color: #7c3aed; }
	.stat-label { font-size: 0.7rem; font-weight: 500; color: #8f8f96; display: block; }
	.stat-value { font-size: 1rem; font-weight: 700; color: #e3e4e6; display: block; }
	.breadcrumb { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1.5rem; background: #161618; border-bottom: 1px solid rgba(255,255,255,0.08); }
	.breadcrumb-path { display: flex; align-items: center; gap: 0.25rem; font-size: 0.875rem; }
	.nav-icon { color: #8f8f96; display: flex; align-items: center; margin-right: 0.25rem; }
	.nav-icon svg { width: 18px; height: 18px; }
	.nav-item { cursor: pointer; padding: 0.25rem 0.5rem; border-radius: 6px; transition: all 0.2s; color: #8f8f96; font-weight: 500; }
	.nav-item:hover { background: rgba(255,255,255,0.04); color: #e3e4e6; }
	.nav-item.active { color: #10b981; background: rgba(16,185,129,0.12); font-weight: 600; }
	.nav-separator { color: #71717a; display: flex; align-items: center; }
	.nav-separator svg { width: 12px; height: 12px; }
	.breadcrumb-info { font-size: 0.75rem; font-weight: 600; color: #71717a; }

	.items-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1.25rem; padding: 1.5rem; }
	.item-card { background: #161618; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; overflow: hidden; transition: all 0.25s; position: relative; }
	.item-card:hover { transform: translateY(-3px); border-color: #10b981; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.4); }
	.item-image { height: 110px; background: #0b0b0c; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid rgba(255,255,255,0.04); }
	.item-image img { width: 100%; height: 100%; object-fit: cover; }
	.no-image-placeholder { color: rgba(255,255,255,0.08); }
	.no-image-placeholder svg { width: 32px; height: 32px; }
	.item-info { padding: 1rem; display: flex; flex-direction: column; gap: 8px; }
	.item-badges { display: flex; gap: 4px; flex-wrap: wrap; }
	.badge { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; line-height: 1; }
	.badge.cat { background: rgba(255,255,255,0.04); color: #a1a1a5; }
	.badge.sub { background: #eff6ff; color: #3b82f6; }
	.badge.stock.in { background: rgba(16,185,129,0.15); color: #34d399; }
	.badge.stock.low { background: #fef7e0; color: #fbbf24; }
	.badge.stock.out { background: #fce8e6; color: #f87171; }
	.badge.customer { background: #f3e8ff; color: #7c3aed; }
	.badge.location.amber { background: #fef3c7; color: #fbbf24; }
	.badge.location.red { background: #fee2e2; color: #f87171; }
	.badge.location.blue { background: #dbeafe; color: #1d4ed8; }
	.item-name { font-size: 0.875rem; font-weight: 600; color: #e3e4e6; margin: 0; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
	.item-actions-row { display: flex; gap: 6px; margin-top: 8px; padding-top: 8px; border-top: 1px dashed rgba(255,255,255,0.08); }
	.item-prices { display: flex; flex-direction: column; gap: 2px; }
	.price-idr { font-size: 0.875rem; color: #10b981; font-weight: 700; }
	.item-serial { display: flex; justify-content: space-between; font-size: 11px; padding-top: 8px; border-top: 1px dashed rgba(255,255,255,0.08); margin-top: auto; }
	.serial-label { color: #71717a; }
	.serial-value { font-family: monospace; color: #a1a1a5; font-weight: 600; }
	.item-location { display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #8f8f96; }
	.loc-txt { max-width: 70%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.qty-txt { font-weight: 600; color: #d4d4d8; }
	.origin-info { padding: 4px 8px; background: #eff6ff; border-radius: 6px; font-size: 10px; color: #3b82f6; font-weight: 500; margin-top: 4px; }

	.item-actions { position: absolute; top: 8px; right: 8px; display: flex; gap: 4px; opacity: 0; transition: opacity 0.2s ease; z-index: 10; }
	.item-card:hover .item-actions { opacity: 1; }
	.action-btn { width: 28px; height: 28px; background: #161618; border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; cursor: pointer; color: #a1a1a5; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 3px rgba(0,0,0,0.05); transition: all 0.15s ease; }
	.action-btn svg { width: 13px; height: 13px; }
	.action-btn.edit:hover:not(:disabled) { background: #10b981; color: white; border-color: #10b981; }
	.action-btn.history:hover:not(:disabled) { background: #3b82f6; color: white; border-color: #3b82f6; }
	.action-btn.delete:hover:not(:disabled) { background: #ef4444; color: white; border-color: #ef4444; }
	.action-btn.move:hover:not(:disabled) { background: #8b5cf6; color: white; border-color: #8b5cf6; }
	.action-btn.return:hover:not(:disabled) { background: #f59e0b; color: white; border-color: #f59e0b; }
	.action-btn:disabled { opacity: 0.4; cursor: not-allowed; }

	.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; text-align: center; background: #161618; margin: 1.5rem; border-radius: 12px; border: 1px dashed rgba(255,255,255,0.08); }
	.empty-icon-box { width: 56px; height: 56px; background: rgba(255,255,255,0.04); color: #71717a; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; }
	.empty-icon-box svg { width: 28px; height: 28px; }
	.empty-state h3 { font-size: 1.125rem; font-weight: 600; margin: 0 0 0.5rem 0; color: #e3e4e6; }
	.empty-state p { font-size: 0.875rem; color: #8f8f96; margin: 0; }

	.toast { position: fixed; top: 1.5rem; right: 1.5rem; padding: 0.875rem 1.25rem; border-radius: 10px; z-index: 1000; background: #161618; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); font-size: 0.875rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; animation: slideIn 0.25s; }
	.toast-svg { width: 18px; height: 18px; }
	.toast.success { border-left: 4px solid #10b981; color: #065f46; }
	.toast.error { border-left: 4px solid #ef4444; color: #991b1b; }
	@keyframes slideIn { from { transform: translateY(-1rem); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

	.modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 1rem; }
	.modal { background: #161618; border-radius: 16px; width: 100%; max-width: 440px; padding: 1.5rem; position: relative; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); text-align: center; animation: modalZoom 0.2s; }
	@keyframes modalZoom { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
	.modal-close { position: absolute; top: 1rem; right: 1rem; background: none; border: none; color: #71717a; cursor: pointer; padding: 4px; border-radius: 6px; display: flex; }
	.modal-close svg { width: 18px; height: 18px; }
	.modal-close:hover { background: rgba(255,255,255,0.04); color: #a1a1a5; }
	.modal-icon { width: 48px; height: 48px; background: #fee2e2; color: #ef4444; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem auto; }
	.modal-icon svg { width: 24px; height: 24px; }
	.modal-icon.move-icon { background: #f3e8ff; color: #7c3aed; }
	.modal-icon.return-icon { background: #fef3c7; color: #d97706; }
	.modal h3 { font-size: 1.125rem; font-weight: 700; color: #e3e4e6; margin: 0 0 0.5rem 0; }
	.modal p { font-size: 0.875rem; color: #8f8f96; margin: 0 0 1.25rem 0; line-height: 1.5; }
	.modal-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
	.btn-cancel, .btn-delete, .btn-return { padding: 0.625rem; border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 0.375rem; }
	.btn-cancel { background: #161618; border: 1px solid rgba(255,255,255,0.08); color: #a1a1a5; }
	.btn-cancel:hover:not(:disabled) { background: rgba(255,255,255,0.04); color: #e3e4e6; }
	.btn-delete { background: #ef4444; border: 1px solid #ef4444; color: white; }
	.btn-delete:hover:not(:disabled) { background: #dc2626; border-color: #dc2626; }
	.btn-return { background: #f59e0b; border: 1px solid #f59e0b; color: white; }
	.btn-return:hover:not(:disabled) { background: #d97706; border-color: #d97706; }
	.btn-cancel:disabled, .btn-delete:disabled, .btn-return:disabled { opacity: 0.5; cursor: not-allowed; }
	.spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-radius: 50%; border-top-color: white; animation: spin 0.8s linear infinite; }
	@keyframes spin { to { transform: rotate(360deg); } }

	.permanent-location-list { display: flex; flex-direction: column; gap: 0.75rem; margin: 1rem 0; text-align: left; }
	.location-option { display: flex; align-items: center; gap: 0.75rem; padding: 1rem; background: #0b0b0c; border: 2px solid rgba(255,255,255,0.08); border-radius: 12px; cursor: pointer; transition: all 0.2s; width: 100%; text-align: left; font: inherit; }
	.location-option:hover:not(:disabled) { border-color: #c084fc; background: #faf5ff; }
	.location-option:disabled { opacity: 0.5; cursor: not-allowed; }
	.location-icon { width: 40px; height: 40px; background: rgba(255,255,255,0.04); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #7c3aed; flex-shrink: 0; }
	.location-icon svg { width: 20px; height: 20px; }
	.location-info { display: flex; flex-direction: column; gap: 2px; flex: 1; }
	.location-name { font-weight: 600; font-size: 0.9rem; color: #e3e4e6; }
	.location-desc { font-size: 0.7rem; color: #8f8f96; }

	@media (max-width: 768px) {
		.header { flex-direction: column; gap: 1rem; align-items: stretch; }
		.search-input { width: 100%; }
		.stats-banner { overflow-x: auto; padding: 0.75rem 1rem; }
		.stat-card { min-width: 140px; }
		.item-actions { opacity: 1; }
		.items-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 0.75rem; padding: 1rem; }
	}

	/* Flow 1: Kirim & Pindah */
	.flow1-actions { display: flex; flex-direction: column; gap: 4px; margin-top: 8px; padding-top: 8px; border-top: 1px dashed rgba(255,255,255,0.08); }
	.serial-row { display: flex; align-items: center; gap: 6px; }
	.serial-tag { font-family: monospace; font-size: 0.7rem; color: #a1a1a5; background: rgba(255,255,255,0.04); padding: 2px 6px; border-radius: 4px; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
	.btn-kirim, .btn-pindah { padding: 3px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 600; cursor: pointer; border: none; transition: all 0.15s; white-space: nowrap; }
	.btn-kirim { background: #fef3c7; color: #fbbf24; }
	.btn-kirim:hover { background: rgba(245,158,11,0.3); }
	.btn-pindah { background: #dbeafe; color: #1e40af; }
	.btn-pindah:hover { background: #bfdbfe; }
	.info-box { background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.3); border-radius: 8px; padding: 1rem; margin-bottom: 1rem; text-align: left; }
	.info-box p { margin: 0.25rem 0; font-size: 0.85rem; color: #7dd3fc; }
	
	/* PDF Preview Modal */
	.modal-pdf { background: #161618; border-radius: 16px; width: 90vw; max-width: 1100px; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column; }
	.modal-header-pdf { padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center; }
	.modal-header-pdf h3 { margin: 0; font-size: 1.05rem; font-weight: 700; color: #e3e4e6; }
	.modal-close-pdf { background: none; border: none; color: #71717a; cursor: pointer; font-size: 1.1rem; }
	.modal-body-split { display: flex; flex: 1; overflow: hidden; }
	.pdf-preview-section { flex: 1; padding: 1.5rem; border-right: 1px solid rgba(255,255,255,0.08); overflow-y: auto; background: #141416; }
	.pdf-preview-section h4 { margin: 0 0 1rem; font-size: 0.9rem; font-weight: 600; color: #d4d4d8; }
	.pdf-iframe { width: 100%; height: 600px; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; background: #161618; }
	.pdf-loading { text-align: center; padding: 2rem; color: #71717a; }
	.ttd-section { width: 400px; padding: 1.5rem; display: flex; flex-direction: column; overflow-y: auto; }
	
	@media (max-width: 900px) {
		.modal-body-split { flex-direction: column; }
		.pdf-preview-section { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.08); }
		.ttd-section { width: 100%; }
		.pdf-iframe { height: 400px; }
	}
</style>
