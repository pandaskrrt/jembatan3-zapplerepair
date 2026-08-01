<script lang="ts">
	import { goto } from '$app/navigation'
	import TandaTangan from '$lib/components/TandaTangan.svelte'
	import { onMount } from 'svelte'
	import { generateSuratJalanPDF, embedSignatureToPDF, type SuratJalanData } from '$lib/utils/suratJalan'
	
	let { data } = $props()
	let cabinets = $state(data?.cabinets || [])
	let jenis = data?.jenis
	let label = data?.label

	let searchTerm = $state('')
	let allItems = $derived(cabinets.flatMap((c: any) => c.sections.flatMap((s: any) => s.items.map((i: any) => ({ ...i, cabinetName: c.name, sectionName: s.name })))))
	let displayedItems = $derived(
		searchTerm
			? allItems.filter((i: any) => i.name.toLowerCase().includes(searchTerm.toLowerCase()) || i.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()))
			: allItems
	)

	function formatRp(n: number | null | undefined) {
		return 'Rp ' + (n || 0).toLocaleString('id-ID')
	}

	function getStockBadge(stock: number) {
		if (stock === 0) return { text: 'Out of Stock', class: 'out' }
		if (stock < 3) return { text: `Only ${stock} Left`, class: 'low' }
		return { text: `${stock} In Stock`, class: 'in' }
	}

	function getImageUrl(url: string) {
		return url
	}

	function navigateToEdit(id: number) {
		goto(`/admin/item/edit?id=${id}`)
	}

	function clearSearch() { searchTerm = '' }

	let showKirimModal = $state(false)
	let showConfirmSend = $state(false)
	let kirimItem: any = null
	let kirimSerialId = $state<number | null>(null)
	let kirimTujuan = $state('Jembatan 3')
	let kirimHargaModal = $state('')
	let kirimHargaJual = $state('')
	let modalError = $state('')
	let isSending = $state(false)
	let senderName = $state(data?.user?.name || data?.user?.username || 'Admin')
	let senderSignature = $state('')
	let pdfPreviewUrl = $state('')

	function openKirim(item: any) {
		kirimItem = item
		kirimSerialId = null
		kirimTujuan = 'Jembatan 3'
		kirimHargaModal = ''
		kirimHargaJual = ''
		modalError = ''
		senderSignature = ''
		showKirimModal = true
		showConfirmSend = false
	}

	function parsePrice(v: string): number { return Number(String(v).replace(/\./g, '')) || 0 }
	function onPriceInput(e: Event) {
		const input = e.target as HTMLInputElement
		return parseInt(input.value.replace(/[^0-9]/g, '')) || 0
	}
	function formatPriceNum(n: number): string { return n === 0 ? '' : n.toLocaleString('id-ID') }

	function selectSerial(serial: any) {
		kirimSerialId = serial.id
		kirimHargaModal = (serial.costPrice && serial.costPrice > 0) ? serial.costPrice.toLocaleString('id-ID') : ''
		kirimHargaJual = (serial.price && serial.price > 0) ? serial.price.toLocaleString('id-ID') : ''
		modalError = ''
	}

	function proceedToConfirm() {
		if (!kirimSerialId) { modalError = 'Pilih serial'; return }
		if (!kirimHargaModal || parsePrice(kirimHargaModal) <= 0) { modalError = 'Isi Harga Modal'; return }
		if (!kirimHargaJual || parsePrice(kirimHargaJual) <= 0) { modalError = 'Isi Harga Jual'; return }
		modalError = ''
		
		// Generate PDF Preview
		const selectedSerial = kirimItem.serials.find((s: any) => s.id === kirimSerialId)
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
		pdfPreviewUrl = pdf.output('dataurlstring')
		
		showConfirmSend = true
	}
	
	// Update PDF ketika user TTD
	$effect(() => {
		if (senderSignature && pdfPreviewUrl) {
			updatePDFWithSignature()
		}
	})
	
	function updatePDFWithSignature() {
		if (!kirimItem) return
		
		const selectedSerial = kirimItem.serials.find((s: any) => s.id === kirimSerialId)
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
		isSending = true
		modalError = ''
		try {
			// Generate PDF final dengan TTD pengirim
			const selectedSerial = kirimItem.serials.find((s: any) => s.id === kirimSerialId)
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
			embedSignatureToPDF(pdf, senderSignature, 'sender', senderName)
			const pdfBase64 = pdf.output('dataurlstring')
			
			const res = await fetch('/api/barang-luar/kirim', {
				method: 'POST', headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					serialId: kirimSerialId,
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
			showConfirmSend = false
			window.location.reload()
		} catch { modalError = 'Network error' }
		finally { isSending = false }
	}
</script>

<svelte:head><title>{label} — Admin</title></svelte:head>

<div class="page">
	<div class="page-header">
		<div class="header-left">
			<h1>{label}</h1>
			<p class="subtitle">{displayedItems.length} item</p>
		</div>
		<div class="header-right">
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

	<div class="content-panel">
		<div class="breadcrumb">
			<div class="breadcrumb-path">
				<span class="nav-icon">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-19.5 0A2.25 2.25 0 0 0 4.5 15h15a2.25 2.25 0 0 0 2.25-2.25m-19.5 0v3.159c0 .538.214 1.055.595 1.436L4 17.5m17.75-4.75V15.91c0 .53-.213 1.037-.592 1.415L20 17.5M8.5 9.75V6a2.25 2.25 0 0 1 2.25-2.25h2.5A2.25 2.25 0 0 1 15.5 6v3.75M9 15v.008H9V15Zm3 0v.008h-.008V15H12Zm3 0v.008h-.008V15H15Z" /></svg>
				</span>
				<span class="nav-item">Master Data</span>
				<span class="nav-separator">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
				</span>
				<span class="nav-item active">{label}</span>
			</div>
			<div class="breadcrumb-info">{displayedItems.length} items</div>
		</div>

		{#if displayedItems.length === 0}
			<div class="empty-state">
				<div class="empty-icon">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg>
				</div>
				<p>Belum ada barang di {label}.</p>
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
						</div>
						<div class="item-image">
							{#if item.imageUrl}
								<img src={getImageUrl(item.imageUrl)} alt={item.name} />
							{:else}
								<div class="no-image-placeholder">
									<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg>
								</div>
							{/if}
						</div>
						<div class="item-info">
							<div class="item-badges">
								<span class="badge cat">{item.category}</span>
								<span class="badge sub">{item.subCategory}</span>
								<span class="badge stock {getStockBadge(item.stock).class}">{getStockBadge(item.stock).text}</span>
								<span class="badge location">{item.cabinetName}</span>
							</div>
							<h4 class="item-name">{item.name}</h4>
							<div class="item-prices">
								<div class="price-idr">{item.price?.amount ? formatRp(item.price.amount) : ''}</div>
							</div>
							<div class="item-serial">
								<span class="serial-label">SN:</span>
								<span class="serial-value">{item.serialNumber || '-'}</span>
							</div>
							<div class="item-location">
								<span class="loc-txt">{item.sectionName} / {item.location || '-'}</span>
								<span class="qty-txt">Qty: {item.stock}</span>
							</div>
							{#if jenis === 'barang-luar' && item.serials?.length > 0}
								<div class="item-actions-row">
									<button type="button" class="btn-kirim" onclick={() => openKirim(item)}>Kirim</button>
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>


{#if showKirimModal && kirimItem}
<div class="modal-overlay" onclick={() => showKirimModal = false}>
	<div class="modal" onclick={e => e.stopPropagation()}>
		<div class="modal-head">
			<h3>Kirim Barang — {kirimItem.name}</h3>
			<button class="modal-close" onclick={() => showKirimModal = false}>✕</button>
		</div>
		<div class="modal-body">
			<p class="m-label">Pilih Serial:</p>
			<div class="serial-list">
				{#each kirimItem.serials || [] as s}
					<label class="serial-opt">
						<input type="radio" checked={kirimSerialId === s.id} onchange={() => selectSerial(s)} />
						<span class="s-sn">{s.serialNumber}</span>
						<span class="s-price">{s.costPrice ? 'Modal Rp ' + s.costPrice.toLocaleString('id-ID') : ''} {s.price ? '· Jual Rp ' + s.price.toLocaleString('id-ID') : ''}</span>
						<span class="s-cat">{s.category}</span>
					</label>
				{/each}
			</div>
			<p class="m-label">Tujuan Kirim:</p>
			<select bind:value={kirimTujuan} class="m-select">
				<option value="Jembatan 3">Jembatan 3</option>
			</select>
			<div class="price-row">
				<div class="p-field">
					<label>Harga Modal</label>
					<input type="text" inputmode="numeric" value={kirimHargaModal} oninput={(e) => kirimHargaModal = formatPriceNum(onPriceInput(e))} placeholder="0" />
				</div>
				<div class="p-field">
					<label>Harga Jual</label>
					<input type="text" inputmode="numeric" value={kirimHargaJual} oninput={(e) => kirimHargaJual = formatPriceNum(onPriceInput(e))} placeholder="0" />
				</div>
			</div>
			{#if modalError}<div class="m-error">{modalError}</div>{/if}
		</div>
		<div class="modal-foot">
			<button class="btn-secondary" onclick={() => showKirimModal = false} disabled={isSending}>Batal</button>
			<button class="btn-kirim-main" onclick={proceedToConfirm} disabled={isSending || !kirimSerialId}>
				Lanjut
			</button>
		</div>
	</div>
</div>
{/if}

{#if showConfirmSend && kirimItem}
<div class="modal-overlay" onclick={() => showConfirmSend = false}>
	<div class="modal-pdf" onclick={e => e.stopPropagation()}>
		<div class="modal-head">
			<h3>Konfirmasi Pengiriman & Tanda Tangan</h3>
			<button class="modal-close" onclick={() => showConfirmSend = false}>✕</button>
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
				<p class="m-label">Tanda Tangan Pengirim:</p>
				<TandaTangan bind:signatureData={senderSignature} width={350} height={150} />
				{#if modalError}<div class="m-error">{modalError}</div>{/if}
				
				<div class="modal-foot-inline">
					<button class="btn-secondary" onclick={() => showConfirmSend = false} disabled={isSending}>Kembali</button>
					<button class="btn-kirim-main" onclick={handleKirim} disabled={isSending || !senderSignature}>
						{isSending ? 'Mengirim...' : 'Kirim Sekarang'}
					</button>
				</div>
			</div>
		</div>
	</div>
</div>
{/if}

<style>
	.page { min-height: 100vh; padding: 2rem 1.5rem; background: #0b0b0c; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
	.page-header { max-width: 1200px; margin: 0 auto 1.5rem; display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; }
	.header-left h1 { margin: 0; font-size: 1.5rem; font-weight: 700; color: #e3e4e6; letter-spacing: -0.025em; }
	.subtitle { margin: 0.25rem 0 0; color: #8f8f96; font-size: 0.875rem; }
	.header-right { display: flex; align-items: center; gap: 0.75rem; }
	.search-box { display: flex; align-items: center; gap: 0.5rem; background: #161618; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 0.5rem 0.75rem; box-shadow: 0 1px 2px rgba(0,0,0,0.3); }
	.search-icon { color: #71717a; display: flex; }
	.search-icon svg { width: 16px; height: 16px; }
	.search-input { border: none; outline: none; font-size: 0.85rem; color: #e3e4e6; width: 220px; }
	.search-input::placeholder { color: #71717a; }
	.search-clear { background: none; border: none; color: #71717a; cursor: pointer; display: flex; }

	.content-panel { max-width: 1200px; margin: 0 auto; background: #161618; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.3); }
	.breadcrumb { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.08); }
	.breadcrumb-path { display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; color: #8f8f96; }
	.nav-icon { color: #71717a; display: flex; }
	.nav-icon svg { width: 14px; height: 14px; }
	.nav-separator { color: rgba(255,255,255,0.08); display: flex; }
	.nav-separator svg { width: 12px; height: 12px; }
	.nav-item.active { color: #10b981; font-weight: 600; }
	.breadcrumb-info { font-size: 0.8rem; color: #8f8f96; }

	.empty-state { text-align: center; padding: 4rem 1rem; }
	.empty-icon { color: rgba(255,255,255,0.08); display: flex; justify-content: center; }
	.empty-icon svg { width: 40px; height: 40px; }
	.empty-state p { color: #71717a; margin: 0.75rem 0 0; font-size: 0.875rem; }

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
	.badge.location { background: #f3e8ff; color: #7c3aed; }
	.item-name { font-size: 0.875rem; font-weight: 600; color: #e3e4e6; margin: 0; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
	.item-prices { display: flex; flex-direction: column; gap: 2px; }
	.price-idr { font-size: 0.875rem; color: #10b981; font-weight: 700; }
	.item-serial { display: flex; justify-content: space-between; font-size: 11px; padding-top: 8px; border-top: 1px dashed rgba(255,255,255,0.08); margin-top: auto; }
	.serial-label { color: #71717a; }
	.serial-value { font-family: monospace; color: #a1a1a5; font-weight: 600; }
	.item-location { display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #8f8f96; }
	.loc-txt { max-width: 70%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.qty-txt { font-weight: 600; color: #d4d4d8; }

	.item-actions { position: absolute; top: 8px; right: 8px; display: flex; gap: 4px; opacity: 0; transition: opacity 0.2s ease; z-index: 10; }
	.item-card:hover .item-actions { opacity: 1; }
	.action-btn { width: 28px; height: 28px; background: #161618; border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; cursor: pointer; color: #a1a1a5; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 3px rgba(0,0,0,0.05); transition: all 0.15s ease; }
	.action-btn svg { width: 13px; height: 13px; }
	.action-btn.edit:hover:not(:disabled) { background: #10b981; color: white; border-color: #10b981; }
	.action-btn.history:hover:not(:disabled) { background: #3b82f6; color: white; border-color: #3b82f6; }
	.item-actions-row { display: flex; gap: 6px; margin-top: 8px; padding-top: 8px; border-top: 1px dashed rgba(255,255,255,0.08); }
	.btn-kirim { flex: 1; padding: 5px 0; background: #fef3c7; color: #fbbf24; border: 1px solid rgba(245,158,11,0.3); border-radius: 6px; font-size: 0.72rem; font-weight: 600; cursor: pointer; }
	.btn-kirim:hover { background: rgba(245,158,11,0.3); }

	@media (max-width: 768px) {
		.items-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 0.75rem; padding: 1rem; }
		.search-input { width: 140px; }
	}

	.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
	.modal { background: #161618; border-radius: 16px; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; }
	.modal-head { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.08); }
	.modal-head h3 { margin: 0; font-size: 1.05rem; font-weight: 700; color: #e3e4e6; }
	.modal-close { background: none; border: none; color: #71717a; cursor: pointer; font-size: 1.1rem; }
	.modal-body { padding: 1.5rem; }
	.modal-foot { display: flex; justify-content: flex-end; gap: 0.65rem; padding: 1.1rem 1.5rem; border-top: 1px solid rgba(255,255,255,0.08); }
	.m-label { font-size: 0.78rem; font-weight: 600; color: #8f8f96; margin: 0.75rem 0 0.35rem; }
	.serial-list { max-height: 150px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.3rem; margin-bottom: 0.5rem; }
	.serial-opt { display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0.6rem; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; cursor: pointer; }
	.s-sn { font-family: monospace; font-weight: 600; font-size: 0.82rem; color: #d4d4d8; }
	.s-price { font-size: 0.7rem; color: #10b981; margin-left: auto; }
	.s-cat { margin-left: auto; font-size: 0.68rem; background: rgba(255,255,255,0.04); color: #a1a1a5; padding: 0.1rem 0.4rem; border-radius: 4px; }
	.m-select { width: 100%; padding: 0.6rem 0.75rem; border: 1.5px solid rgba(255,255,255,0.08); border-radius: 9px; font-size: 0.875rem; box-sizing: border-box; }
	.price-row { display: flex; gap: 0.75rem; margin-top: 0.75rem; }
	.p-field { flex: 1; }
	.p-field label { display: block; font-size: 0.75rem; font-weight: 600; color: #8f8f96; margin-bottom: 0.3rem; }
	.p-field input { width: 100%; padding: 0.6rem 0.75rem; border: 1.5px solid rgba(255,255,255,0.08); border-radius: 9px; font-size: 0.875rem; box-sizing: border-box; }
	.m-error { background: #fef2f2; color: #f87171; border: 1px solid rgba(239,68,68,0.3); padding: 0.6rem 0.85rem; border-radius: 8px; font-size: 0.82rem; margin-top: 0.75rem; }
	.btn-secondary { background: #161618; color: #a1a1a5; padding: 0.65rem 1.2rem; border: 1.5px solid rgba(255,255,255,0.08); border-radius: 10px; font-weight: 600; cursor: pointer; font-size: 0.875rem; }
	.btn-secondary:hover { background: #161618; }
	.btn-kirim-main { background: #10b981; color: white; padding: 0.65rem 1.25rem; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; font-size: 0.875rem; }
	.btn-kirim-main:hover:not(:disabled) { background: #10b981; }
	.btn-kirim-main:disabled { opacity: 0.6; cursor: not-allowed; }
	.info-box { background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.3); border-radius: 8px; padding: 1rem; margin-bottom: 1rem; }
	.info-box p { margin: 0.25rem 0; font-size: 0.85rem; color: #7dd3fc; }
	
	/* PDF Preview Modal */
	.modal-pdf { background: #161618; border-radius: 16px; width: 90vw; max-width: 1100px; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column; }
	.modal-body-split { display: flex; flex: 1; overflow: hidden; }
	.pdf-preview-section { flex: 1; padding: 1.5rem; border-right: 1px solid rgba(255,255,255,0.08); overflow-y: auto; background: #141416; }
	.pdf-preview-section h4 { margin: 0 0 1rem; font-size: 0.9rem; font-weight: 600; color: #d4d4d8; }
	.pdf-iframe { width: 100%; height: 600px; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; background: #161618; }
	.pdf-loading { text-align: center; padding: 2rem; color: #71717a; }
	.ttd-section { width: 400px; padding: 1.5rem; display: flex; flex-direction: column; overflow-y: auto; }
	.modal-foot-inline { display: flex; justify-content: flex-end; gap: 0.65rem; margin-top: auto; padding-top: 1rem; }
	
	@media (max-width: 900px) {
		.modal-body-split { flex-direction: column; }
		.pdf-preview-section { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.08); }
		.ttd-section { width: 100%; }
		.pdf-iframe { height: 400px; }
	}
</style>
