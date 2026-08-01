<script lang="ts">
	import TandaTangan from '$lib/components/TandaTangan.svelte'
	import { generateSuratJalanPDF, embedSignatureToPDF, type SuratJalanData } from '$lib/utils/suratJalan'
	let { data } = $props()
	let incoming = $state(data?.incoming || [])
	let eksekusi = $state(data?.eksekusi || [])
	let confirmed = $state(data?.confirmed || [])
	let cabinets = $state(data?.cabinets || [])

	let selectedIncoming: any = null
	let showModal = $state(false)
	let showConfirmModal = $state(false)
	let targetCabinetId = $state<number | null>(null)
	let targetSectionId = $state<number | null>(null)
	let targetItemId = $state<number | null>(null)
	let newItemName = $state('')
	let newItemCategory = $state('Sparepart')
	let newItemSubCategory = $state('')
	let isConfirming = $state(false)
	let errorMsg = $state('')
	let tab = $state<'pending' | 'eksekusi' | 'confirmed'>('pending')
	let receiverName = $state(data?.user?.username || 'Admin')
	let receiverSignature = $state('')
	let pdfPreviewUrl = $state('')
	let lastSignedSignature = $state('')
	let creating = $state(false)
	let newCabinetName = $state('')
	let newCabinetSectionName = $state('')
	let newSectionName = $state('')
	let showInvoiceModal = $state(false)
	let invoicePreviewUrl = $state('')
	let showSignOnlyModal = $state(false)
	let signOnlyItem: any = null
	let signOnlySignature = $state('')
	let signOnlyPdfPreviewUrl = $state('')
	let lastSignOnlySignature = $state('')
	let isSigningOnly = $state(false)
	let signOnlyError = $state('')

	let targetSections = $derived(
		targetCabinetId ? cabinets.find((c: any) => c.id === targetCabinetId)?.sections || [] : []
	)
	let sectionItems = $derived(
		targetSectionId ? targetSections.find((s: any) => s.id === targetSectionId)?.items || [] : []
	)

	function openConfirm(item: any) {
		selectedIncoming = item
		showModal = true
		showConfirmModal = false
		targetCabinetId = null
		targetSectionId = null
		targetItemId = null
		newItemName = item.name
		newItemCategory = 'Sparepart'
		newItemSubCategory = ''
		newCabinetName = ''
		newCabinetSectionName = ''
		newSectionName = ''
		receiverSignature = item.receiverSignature || ''
		receiverName = item.receiverName || receiverName
		lastSignedSignature = item.receiverSignature || ''
		pdfPreviewUrl = ''
		errorMsg = ''
	}

	// Handler saat pilihan cabinet berubah: reset section & item turunan + form create
	function onCabinetChange() {
		targetSectionId = null
		targetItemId = null
		newCabinetName = ''
		newCabinetSectionName = ''
		newSectionName = ''
	}

	// Handler saat pilihan section berubah: reset item turunan + form create section
	function onSectionChange() {
		targetItemId = null
		newSectionName = ''
	}

	// Buat cabinet baru (+ section pertama opsional) langsung dari modal
	async function createCabinet() {
		if (!newCabinetName.trim()) { errorMsg = 'Nama cabinet wajib diisi'; return }
		creating = true
		errorMsg = ''
		try {
			const res = await fetch('/api/cabinet', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: newCabinetName.trim(),
					sectionName: newCabinetSectionName.trim(),
					sectionType: 'Storage'
				})
			})
			const d = await res.json()
			if (!res.ok) { errorMsg = d.error || 'Gagal buat cabinet'; return }

			// Masukkan cabinet baru (dengan section-nya) ke list lokal agar derived state langsung kebaca
			const newCab = {
				...d.data.cabinet,
				sections: d.data.section ? [{ ...d.data.section, items: [] }] : []
			}
			cabinets = [...cabinets, newCab]
			targetCabinetId = newCab.id
			targetItemId = null
			if (d.data.section) {
				targetSectionId = d.data.section.id
			}
			errorMsg = ''
		} catch {
			errorMsg = 'Network error saat membuat cabinet'
		} finally {
			creating = false
		}
	}

	// Buat section baru di dalam cabinet yang sudah dipilih, langsung dari modal
	async function createSection() {
		if (!targetCabinetId || targetCabinetId === 0) { errorMsg = 'Pilih cabinet dulu'; return }
		if (!newSectionName.trim()) { errorMsg = 'Nama section wajib diisi'; return }
		creating = true
		errorMsg = ''
		try {
			const res = await fetch('/api/section', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					cabinetId: targetCabinetId,
					name: newSectionName.trim(),
					type: 'Storage'
				})
			})
			const d = await res.json()
			if (!res.ok) { errorMsg = d.error || 'Gagal buat section'; return }

			// Update list lokal agar derived targetSections langsung kebaca
			cabinets = cabinets.map((c: any) =>
				c.id === targetCabinetId
					? { ...c, sections: [...(c.sections || []), { ...d.data, items: [] }] }
					: c
			)
			targetSectionId = d.data.id
			targetItemId = null
			errorMsg = ''
		} catch {
			errorMsg = 'Network error saat membuat section'
		} finally {
			creating = false
		}
	}

	function formatRp(n: number | null | undefined) {
		return 'Rp ' + (n || 0).toLocaleString('id-ID')
	}

	function fmt(d: string | Date | null | undefined): string {
		if (!d) return '-'
		return new Date(d).toLocaleString('id-ID')
	}

	// Timeline riwayat pergerakan barang: dibuat → TTD → dipindah ke stock
	function timelineEvents(item: any) {
		const events: { icon: string; label: string; time: string; by: string }[] = []
		events.push({ icon: '📦', label: 'Dibuat', time: fmt(item.createdAt), by: item.senderName ? 'oleh ' + item.senderName : '' })
		if (item.receiverSignature || item.signedAt) {
			events.push({ icon: '✍️', label: 'TTD Penerima', time: fmt(item.signedAt || item.updatedAt), by: item.receiverName ? 'oleh ' + item.receiverName : '' })
		}
		if (item.confirmedAt) {
			events.push({ icon: '🚚', label: 'Dipindah ke Stock', time: fmt(item.confirmedAt), by: item.confirmedByName ? 'oleh ' + item.confirmedByName : '' })
		}
		return events
	}

	// Cek apakah string adalah data URL PDF yang valid (bukan placeholder/palsu)
	function isValidPdfDataUrl(url: string | null | undefined): boolean {
		if (!url || typeof url !== 'string') return false
		if (!url.startsWith('data:application/pdf')) return false
		try {
			const b64 = url.split(',')[1] || ''
			const bytes = atob(b64)
			return bytes.includes('%PDF')
		} catch {
			return false
		}
	}

	// Cek apakah string adalah data URL gambar PNG/JPEG yang valid untuk TTD
	function isValidImageData(url: string | null | undefined): boolean {
		if (!url || typeof url !== 'string') return false
		return url.startsWith('data:image/png') || url.startsWith('data:image/jpeg')
	}

	// Buat data surat jalan dari item untuk regenerate PDF
	function buildSuratJalanData(item: any, receiverName: string): SuratJalanData {
		return {
			nomorSurat: `INCOMING-${item.id}`,
			tanggal: new Date(item.createdAt).toLocaleDateString('id-ID'),
			pengirim: {
				nama: item.senderName || '-',
				cabang: item.source || 'Unknown'
			},
			penerima: {
				nama: item.receiverName || receiverName,
				cabang: 'Jembatan 3'
			},
			barang: {
				nama: item.name,
				serialNumber: item.serialNumber || '-',
				qty: item.quantity,
				hargaModal: item.costPrice,
				hargaJual: item.sellPrice
			},
			catatan: item.note || 'Penerimaan barang dari cabang lain',
			senderName: item.senderName || '-',
			receiverName: item.receiverName || receiverName
		}
	}

	// Lihat invoice / surat jalan (PDF dari pengirim jika valid, kalau tidak generate ulang + embed TTD)
	function viewInvoice(item: any) {
		if (!item) return
		const existingPdf = item.pdfDocumentFinal || item.pdfDocument
		if (existingPdf && isValidPdfDataUrl(existingPdf)) {
			invoicePreviewUrl = existingPdf
		} else {
			const pdf = generateSuratJalanPDF(buildSuratJalanData(item, receiverName))
			if (item.senderSignature && isValidImageData(item.senderSignature)) {
				embedSignatureToPDF(pdf, item.senderSignature, 'sender', item.senderName || '-')
			}
			if (item.receiverSignature && isValidImageData(item.receiverSignature)) {
				embedSignatureToPDF(pdf, item.receiverSignature, 'receiver', item.receiverName || receiverName)
			}
			invoicePreviewUrl = pdf.output('dataurlstring')
		}
		showInvoiceModal = true
	}

	// Buka modal TTD saja — tanda tangan tanpa pindahkan ke stock
	function openSignOnly(item: any) {
		if (!item) return
		signOnlyItem = item
		signOnlySignature = ''
		signOnlyPdfPreviewUrl = ''
		lastSignOnlySignature = ''
		signOnlyError = ''

		const existingPdf = item.pdfDocumentFinal || item.pdfDocument
		if (existingPdf && isValidPdfDataUrl(existingPdf)) {
			signOnlyPdfPreviewUrl = existingPdf
		} else {
			const pdf = generateSuratJalanPDF(buildSuratJalanData(item, receiverName))
			if (item.senderSignature && isValidImageData(item.senderSignature)) {
				embedSignatureToPDF(pdf, item.senderSignature, 'sender', item.senderName || '-')
			}
			signOnlyPdfPreviewUrl = pdf.output('dataurlstring')
		}

		showSignOnlyModal = true
	}

	// Preview live TTD penerima di modal TTD saja
	$effect(() => {
		if (signOnlySignature && signOnlyPdfPreviewUrl && signOnlyItem && signOnlySignature !== lastSignOnlySignature) {
			lastSignOnlySignature = signOnlySignature
			const pdf = generateSuratJalanPDF(buildSuratJalanData(signOnlyItem, receiverName))
			if (signOnlyItem.senderSignature && isValidImageData(signOnlyItem.senderSignature)) {
				embedSignatureToPDF(pdf, signOnlyItem.senderSignature, 'sender', signOnlyItem.senderName || '-')
			}
			if (signOnlySignature) {
				embedSignatureToPDF(pdf, signOnlySignature, 'receiver', receiverName)
			}
			signOnlyPdfPreviewUrl = pdf.output('dataurlstring')
		}
	})

	// Simpan TTD saja (tanpa ubah status — barang tetap Pending)
	async function confirmSignOnly() {
		if (!signOnlyItem) return
		if (!signOnlySignature) { signOnlyError = 'Tanda tangan penerima wajib diisi'; return }

		isSigningOnly = true
		signOnlyError = ''
		try {
			const pdf = generateSuratJalanPDF(buildSuratJalanData(signOnlyItem, receiverName))
			if (signOnlyItem.senderSignature && isValidImageData(signOnlyItem.senderSignature)) {
				embedSignatureToPDF(pdf, signOnlyItem.senderSignature, 'sender', signOnlyItem.senderName || '-')
			}
			embedSignatureToPDF(pdf, signOnlySignature, 'receiver', receiverName)
			const pdfFinal = pdf.output('dataurlstring')

			const res = await fetch('/api/incoming/sign-only', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					incomingId: signOnlyItem.id,
					receiverName,
					receiverSignature: signOnlySignature,
					pdfDocumentFinal: pdfFinal
				})
			})
			const d = await res.json()
			if (!res.ok) { signOnlyError = d.error || 'Gagal simpan tanda tangan'; return }

			// Update state lokal: pindah dari tab Pending ke tab Eksekusi
			const updatedItem = { ...signOnlyItem, status: 'EKSEKUSI', signedAt: new Date(), receiverName, receiverSignature: signOnlySignature, pdfDocumentFinal: pdfFinal }
			incoming = incoming.filter((it: any) => it.id !== signOnlyItem.id)
			eksekusi = [updatedItem, ...eksekusi.filter((it: any) => it.id !== signOnlyItem.id)]
			showSignOnlyModal = false
		} catch {
			signOnlyError = 'Network error'
		} finally {
			isSigningOnly = false
		}
	}

	function proceedToSignature() {
		if (!selectedIncoming) return
		if (!targetSectionId) { errorMsg = 'Pilih section tujuan'; return }
		errorMsg = ''

		// Sudah ditandatangani sebelumnya (status EKSEKUSI) → langsung konfirmasi tanpa TTD ulang
		if (selectedIncoming.receiverSignature) {
			receiverSignature = selectedIncoming.receiverSignature
			receiverName = selectedIncoming.receiverName || receiverName
			confirmItem()
			return
		}
		
		// gunakan PDF dari Roxy jika ada & valid, kalau tidak generate ulang (embed TTD pengirim)
		if (selectedIncoming.pdfDocument && isValidPdfDataUrl(selectedIncoming.pdfDocument)) {
			pdfPreviewUrl = selectedIncoming.pdfDocument
		} else {
			const pdf = generateSuratJalanPDF(buildSuratJalanData(selectedIncoming, receiverName))
			if (selectedIncoming.senderSignature && isValidImageData(selectedIncoming.senderSignature)) {
				embedSignatureToPDF(pdf, selectedIncoming.senderSignature, 'sender', selectedIncoming.senderName || '-')
			}
			pdfPreviewUrl = pdf.output('dataurlstring')
		}
		
		showConfirmModal = true
	}
	
	// Regenerate preview hanya saat signature penerima benar-benar berubah (guard infinite loop)
	$effect(() => {
		if (receiverSignature && pdfPreviewUrl && selectedIncoming && receiverSignature !== lastSignedSignature) {
			lastSignedSignature = receiverSignature
			updatePDFWithReceiverSignature()
		}
	})
	
	async function updatePDFWithReceiverSignature() {
		if (!selectedIncoming) return
		
		const pdf = generateSuratJalanPDF(buildSuratJalanData(selectedIncoming, receiverName))
		
		if (selectedIncoming.senderSignature) {
			embedSignatureToPDF(pdf, selectedIncoming.senderSignature, 'sender', selectedIncoming.senderName || '-')
		}
		if (receiverSignature) {
			embedSignatureToPDF(pdf, receiverSignature, 'receiver', receiverName)
		}
		
		pdfPreviewUrl = pdf.output('dataurlstring')
	}

	async function confirmItem() {
		if (!selectedIncoming) return
		if (!receiverSignature && !selectedIncoming.receiverSignature) { errorMsg = 'Tanda tangan penerima wajib diisi'; return }
		if (!receiverSignature) receiverSignature = selectedIncoming.receiverSignature

		isConfirming = true
		errorMsg = ''
		try {
			// Pakai PDF final yang sudah ada (sudah berisi TTD) jika valid, kalau tidak generate ulang
			let pdfFinal = selectedIncoming.pdfDocumentFinal || selectedIncoming.pdfDocument || ''
			if (!pdfFinal || !isValidPdfDataUrl(pdfFinal)) {
				const pdf = generateSuratJalanPDF(buildSuratJalanData(selectedIncoming, receiverName))
				if (selectedIncoming.senderSignature && isValidImageData(selectedIncoming.senderSignature)) {
					embedSignatureToPDF(pdf, selectedIncoming.senderSignature, 'sender', selectedIncoming.senderName || '-')
				}
				embedSignatureToPDF(pdf, receiverSignature, 'receiver', receiverName)
				pdfFinal = pdf.output('dataurlstring')
			}
			
			const res = await fetch('/api/incoming/confirm', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					incomingId: selectedIncoming.id,
					sectionId: targetSectionId,
					existingItemId: targetItemId,
					newItemName,
					newItemCategory,
					newItemSubCategory,
					receiverName,
					receiverSignature,
					pdfDocumentFinal: pdfFinal
				})
			})
			const d = await res.json()
			if (!res.ok) { errorMsg = d.error || 'Gagal konfirmasi'; return }
			showModal = false
			showConfirmModal = false
			window.location.reload()
		} catch {
			errorMsg = 'Network error'
		} finally {
			isConfirming = false
		}
	}
</script>

<svelte:head><title>Barang Masuk — Admin</title></svelte:head>

<div class="page">
	<div class="header">
		<div>
			<h1>Barang Masuk</h1>
			<p>Kelola barang yang dikirim dari cabang lain</p>
		</div>
	</div>

	<div class="tabs">
		<button class="tab-btn" class:active={tab === 'pending'} onclick={() => tab = 'pending'}>
			Pending ({incoming.length})
		</button>
		<button class="tab-btn" class:active={tab === 'eksekusi'} onclick={() => tab = 'eksekusi'}>
			Eksekusi ({eksekusi.length})
		</button>
		<button class="tab-btn" class:active={tab === 'confirmed'} onclick={() => tab = 'confirmed'}>
			Sudah Masuk ({confirmed.length})
		</button>
	</div>

	{#if tab === 'pending'}
		{#if incoming.length === 0}
			<div class="empty">
				<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 13V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7m16 0v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5m16 0h-5l-2 2h-2l-2-2H4"/></svg>
				<p>Belum ada barang masuk</p>
			</div>
		{:else}
			<div class="card-grid">
				{#each incoming as item}
					<div class="card">
						<div class="card-top">
							<div class="card-title">
								<strong>{item.name}</strong>
								<span class="mono">{item.serialNumber || '-'}</span>
							</div>
							<div class="badge-group">
								<span class="badge">{item.source}</span>
								{#if item.receiverSignature}
									<span class="badge badge-signed">✓ Sudah TTD</span>
								{/if}
							</div>
						</div>
						<div class="card-meta">
							<div class="meta-item">
								<span>Qty</span>
								<strong>{item.quantity}</strong>
							</div>
							<div class="meta-item">
								<span>Harga Modal</span>
								<strong>{formatRp(item.costPrice)}</strong>
							</div>
							<div class="meta-item">
								<span>Harga Jual</span>
								<strong>{formatRp(item.sellPrice)}</strong>
							</div>
						</div>
						<div class="card-timeline">
							{#each timelineEvents(item) as ev}
								<div class="tl-item">
									<span class="tl-dot">{ev.icon}</span>
									<div class="tl-text">
										<span class="tl-label">{ev.label}</span>
										<span class="tl-time">{ev.time}</span>
										{#if ev.by}<span class="tl-by">{ev.by}</span>{/if}
									</div>
								</div>
							{/each}
						</div>
						<div class="card-actions">
							<button class="btn-invoice" onclick={() => viewInvoice(item)}>Lihat Invoice</button>
							<button class="btn-sign" onclick={() => openSignOnly(item)}>TTD Saja</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{:else if tab === 'eksekusi'}
		{#if eksekusi.length === 0}
			<div class="empty">
				<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 13V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7m16 0v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5m16 0h-5l-2 2h-2l-2-2H4"/></svg>
				<p>Belum ada barang yang menunggu pemindahan</p>
			</div>
		{:else}
			<div class="card-grid">
				{#each eksekusi as item}
					<div class="card">
						<div class="card-top">
							<div class="card-title">
								<strong>{item.name}</strong>
								<span class="mono">{item.serialNumber || '-'}</span>
							</div>
							<div class="badge-group">
								<span class="badge">{item.source}</span>
								<span class="badge badge-eksekusi">⚡ Eksekusi</span>
								{#if item.receiverSignature}
									<span class="badge badge-signed">✓ Sudah TTD</span>
								{/if}
							</div>
						</div>
						<div class="card-meta">
							<div class="meta-item">
								<span>Qty</span>
								<strong>{item.quantity}</strong>
							</div>
							<div class="meta-item">
								<span>Harga Modal</span>
								<strong>{formatRp(item.costPrice)}</strong>
							</div>
							<div class="meta-item">
								<span>Harga Jual</span>
								<strong>{formatRp(item.sellPrice)}</strong>
							</div>
						</div>
						<div class="card-timeline">
							{#each timelineEvents(item) as ev}
								<div class="tl-item">
									<span class="tl-dot">{ev.icon}</span>
									<div class="tl-text">
										<span class="tl-label">{ev.label}</span>
										<span class="tl-time">{ev.time}</span>
										{#if ev.by}<span class="tl-by">{ev.by}</span>{/if}
									</div>
								</div>
							{/each}
						</div>
						<div class="card-actions">
							<button class="btn-invoice" onclick={() => viewInvoice(item)}>Lihat Invoice</button>
							<button class="btn-confirm" onclick={() => openConfirm(item)}>Pindahkan ke Stock</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{:else}
		{#if confirmed.length === 0}
			<div class="empty">
				<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 13V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7m16 0v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5m16 0h-5l-2 2h-2l-2-2H4"/></svg>
				<p>Belum ada barang yang dikonfirmasi</p>
			</div>
		{:else}
			<div class="card-grid">
				{#each confirmed as item}
					<div class="card">
						<div class="card-top">
							<div class="card-title">
								<strong>{item.name}</strong>
								<span class="mono">{item.serialNumber || '-'}</span>
							</div>
							<div class="badge-group">
								<span class="badge">{item.source}</span>
								{#if item.receiverSignature}
									<span class="badge badge-signed">✓ Sudah TTD</span>
								{/if}
							</div>
						</div>
						<div class="card-meta">
							<div class="meta-item">
								<span>Qty</span>
								<strong>{item.quantity}</strong>
							</div>
							<div class="meta-item">
								<span>Dikonfirmasi</span>
								<strong>{item.confirmedAt ? new Date(item.confirmedAt).toLocaleString('id-ID') : '-'}</strong>
							</div>
						</div>
						<div class="card-timeline">
							{#each timelineEvents(item) as ev}
								<div class="tl-item">
									<span class="tl-dot">{ev.icon}</span>
									<div class="tl-text">
										<span class="tl-label">{ev.label}</span>
										<span class="tl-time">{ev.time}</span>
										{#if ev.by}<span class="tl-by">{ev.by}</span>{/if}
									</div>
								</div>
							{/each}
						</div>
						<div class="card-actions">
							<button class="btn-invoice" onclick={() => viewInvoice(item)}>Lihat Invoice</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>

{#if showModal}
	<div class="modal-overlay" onclick={() => showModal = false}>
		<div class="modal" onclick={e => e.stopPropagation()}>
			<div class="modal-head">
				<h3>Pindahkan ke Stock Jembatan 3</h3>
				<button class="modal-close" onclick={() => showModal = false}>✕</button>
			</div>

			<div class="modal-body">
				<div class="item-summary">
					<strong>{selectedIncoming.name}</strong>
					<span class="mono">{selectedIncoming.serialNumber || '-'}</span>
					<div class="prices">
						<span>Modal: {formatRp(selectedIncoming.costPrice)}</span>
						<span>Jual: {formatRp(selectedIncoming.sellPrice)}</span>
						<span>Qty: {selectedIncoming.quantity}</span>
					</div>
				</div>

				<div class="form-group">
					<label>Cabinet Tujuan</label>
					<select bind:value={targetCabinetId} onchange={onCabinetChange}>
						<option value={null} disabled>-- Pilih Cabinet --</option>
						{#each cabinets as cab}
							<option value={cab.id}>{cab.name}</option>
						{/each}
						<option value={0}>+ Buat Cabinet Baru</option>
					</select>
				</div>

				{#if targetCabinetId === 0}
					<div class="create-box">
						<div class="create-box-title">Buat Cabinet Baru</div>
						<div class="form-group">
							<label>Nama Cabinet</label>
							<input type="text" bind:value={newCabinetName} placeholder="e.g. Rak Sparepart Samsung" />
						</div>
						<div class="form-group">
							<label>Nama Section Pertama (opsional)</label>
							<input type="text" bind:value={newCabinetSectionName} placeholder="e.g. Battery Samsung" />
						</div>
						<button class="btn-primary btn-sm" onclick={createCabinet} disabled={creating}>
							{creating ? 'Membuat...' : 'Buat Cabinet'}
						</button>
					</div>
				{/if}

				{#if targetCabinetId && targetCabinetId !== 0}
					<div class="form-group">
						<label>Section Tujuan</label>
						<select bind:value={targetSectionId} onchange={onSectionChange}>
							<option value={null} disabled>-- Pilih Section --</option>
							{#each targetSections as sec}
								<option value={sec.id}>{sec.name}</option>
							{/each}
							<option value={0}>+ Buat Section Baru</option>
						</select>
					</div>

					{#if targetSectionId === 0}
						<div class="create-box">
							<div class="create-box-title">Buat Section Baru</div>
							<div class="form-group">
								<label>Nama Section</label>
								<input type="text" bind:value={newSectionName} placeholder="e.g. Battery Samsung" />
							</div>
							<button class="btn-primary btn-sm" onclick={createSection} disabled={creating}>
								{creating ? 'Membuat...' : 'Buat Section'}
							</button>
						</div>
					{/if}
				{/if}

				{#if targetSectionId && targetSectionId !== 0}
					<div class="form-group">
						<label>Masuk ke Item (opsional)</label>
						<select bind:value={targetItemId}>
							<option value={null}>-- Buat Item Baru --</option>
							{#each sectionItems as it}
								<option value={it.id}>{it.name}</option>
							{/each}
						</select>
					</div>

					{#if !targetItemId}
						<div class="form-group">
							<label>Nama Item Baru</label>
							<input type="text" bind:value={newItemName} placeholder={selectedIncoming.name} />
						</div>
						<div class="form-row">
							<div class="form-group">
								<label>Kategori</label>
								<select bind:value={newItemCategory}>
									<option value="Sparepart">Sparepart</option>
									<option value="Accessories">Accessories</option>
									<option value="ReadySale">Ready Sale</option>
									<option value="NoReadySale">No Ready Sale</option>
								</select>
							</div>
							<div class="form-group">
								<label>Sub Kategori</label>
								<input type="text" bind:value={newItemSubCategory} placeholder="e.g. LCD, Battery" />
							</div>
						</div>
					{/if}
				{/if}

				{#if errorMsg}
					<div class="error">{errorMsg}</div>
				{/if}
			</div>

<div class="modal-foot">
			<button class="btn-secondary" onclick={() => showModal = false}>Batal</button>
			<button class="btn-primary" onclick={proceedToSignature} disabled={isConfirming || !targetSectionId}>
				{selectedIncoming?.receiverSignature ? 'Konfirmasi Masuk' : 'Lanjut'}
			</button>
		</div>
	</div>
</div>
{/if}

{#if showConfirmModal && selectedIncoming}
<div class="modal-overlay" onclick={() => showConfirmModal = false}>
	<div class="modal-pdf" onclick={e => e.stopPropagation()}>
		<div class="modal-head">
			<h3>Konfirmasi Penerimaan & Tanda Tangan</h3>
			<button class="modal-close" onclick={() => showConfirmModal = false}>✕</button>
		</div>
		<div class="modal-body-split">
			<div class="pdf-preview-section">
				<h4>Preview Surat Jalan</h4>
				{#if pdfPreviewUrl}
					<iframe src={pdfPreviewUrl} title="Preview Surat Jalan" class="pdf-iframe"></iframe>
				{:else}
					<p class="pdf-loading">Memuat preview...</p>
				{/if}
			</div>
			<div class="ttd-section">
				<div class="info-box">
					<p><strong>Anda akan menerima barang ini.</strong></p>
					<p>Nama Penerima: <strong>{receiverName}</strong></p>
					<p>Barang: <strong>{selectedIncoming.name}</strong></p>
					{#if selectedIncoming.senderName}
						<p>Pengirim: <strong>{selectedIncoming.senderName}</strong></p>
					{/if}
				</div>
				<div class="form-group">
					<label>Tanda Tangan Penerima:</label>
					<TandaTangan bind:signatureData={receiverSignature} width={350} height={150} />
				</div>
				{#if errorMsg}
					<div class="error">{errorMsg}</div>
				{/if}
				<div class="modal-foot-inline">
					<button class="btn-secondary" onclick={() => showConfirmModal = false} disabled={isConfirming}>Kembali</button>
					<button class="btn-primary" onclick={confirmItem} disabled={isConfirming || !receiverSignature}>
						{isConfirming ? 'Memproses...' : 'Konfirmasi Sekarang'}
					</button>
				</div>
			</div>
		</div>
	</div>
</div>
{/if}

{#if showSignOnlyModal && signOnlyItem}
<div class="modal-overlay" onclick={() => showSignOnlyModal = false}>
	<div class="modal-pdf" onclick={e => e.stopPropagation()}>
		<div class="modal-head">
			<h3>TTD Penerima — Tanpa Pindah Stock</h3>
			<button class="modal-close" onclick={() => showSignOnlyModal = false}>✕</button>
		</div>
		<div class="modal-body-split">
			<div class="pdf-preview-section">
				<h4>Preview Surat Jalan</h4>
				{#if signOnlyPdfPreviewUrl}
					<iframe src={signOnlyPdfPreviewUrl} title="Preview Surat Jalan" class="pdf-iframe"></iframe>
				{:else}
					<p class="pdf-loading">Memuat preview...</p>
				{/if}
			</div>
			<div class="ttd-section">
				<div class="info-box">
					<p><strong>Anda akan menandatangani surat jalan ini.</strong></p>
					<p>Nama Penerima: <strong>{receiverName}</strong></p>
					<p>Barang: <strong>{signOnlyItem.name}</strong></p>
					{#if signOnlyItem.senderName}
						<p>Pengirim: <strong>{signOnlyItem.senderName}</strong></p>
					{/if}
					<p class="sign-note">Setelah TTD disimpan, status barang berubah menjadi <strong>Eksekusi</strong> — siap dipindahkan ke stock.</p>
				</div>
				<div class="form-group">
					<label>Tanda Tangan Penerima:</label>
					<TandaTangan bind:signatureData={signOnlySignature} width={350} height={150} />
				</div>
				{#if signOnlyError}
					<div class="error">{signOnlyError}</div>
				{/if}
				<div class="modal-foot-inline">
					<button class="btn-secondary" onclick={() => showSignOnlyModal = false} disabled={isSigningOnly}>Batal</button>
					<button class="btn-primary" onclick={confirmSignOnly} disabled={isSigningOnly || !signOnlySignature}>
						{isSigningOnly ? 'Menyimpan...' : 'Simpan Tanda Tangan'}
					</button>
				</div>
			</div>
		</div>
	</div>
</div>
{/if}

{#if showInvoiceModal && invoicePreviewUrl}
<div class="modal-overlay" onclick={() => showInvoiceModal = false}>
	<div class="modal-invoice" onclick={e => e.stopPropagation()}>
		<div class="modal-head">
			<h3>Invoice / Surat Jalan</h3>
			<button class="modal-close" onclick={() => showInvoiceModal = false}>✕</button>
		</div>
		<iframe src={invoicePreviewUrl} title="Invoice / Surat Jalan" class="pdf-iframe"></iframe>
	</div>
</div>
{/if}

<style>
	.page { padding: 2rem; max-width: 1100px; margin: 0 auto; color: #e3e4e6; }
	.header { margin-bottom: 1.5rem; }
	.header h1 { margin: 0; font-size: 1.5rem; font-weight: 700; color: #e3e4e6; }
	.header p { margin: 0.3rem 0 0; color: #a1a1a5; font-size: 0.9rem; }

	.tabs { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
	.tab-btn { padding: 0.6rem 1.25rem; border: 1.5px solid rgba(255,255,255,0.08); border-radius: 10px; background: #161618; cursor: pointer; font-size: 0.875rem; font-weight: 600; color: #a1a1a5; }
	.tab-btn.active { border-color: #10b981; background: rgba(16,185,129,0.12); color: #10b981; }

	.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }
	.card { background: #161618; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 1.1rem 1.2rem; display: flex; flex-direction: column; gap: 0.85rem; transition: border-color 0.2s ease, transform 0.2s ease; }
	.card:hover { border-color: rgba(16,185,129,0.35); transform: translateY(-2px); }
	.card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; }
	.card-title { display: flex; flex-direction: column; gap: 0.2rem; min-width: 0; }
	.card-title strong { font-size: 0.95rem; color: #e3e4e6; }
	.card-title .mono { font-size: 0.78rem; color: #8f8f96; }
	.card-meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(90px, 1fr)); gap: 0.5rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 0.7rem 0.85rem; }
	.meta-item { display: flex; flex-direction: column; gap: 0.15rem; }
	.meta-item span { font-size: 0.68rem; color: #8f8f96; text-transform: uppercase; letter-spacing: 0.03em; }
	.meta-item strong { font-size: 0.85rem; color: #d4d4d8; }
	.card-date { font-size: 0.75rem; color: #71717a; }
	.card-timeline { display: flex; flex-direction: column; gap: 0.4rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 0.65rem 0.8rem; }
	.tl-item { display: flex; align-items: flex-start; gap: 0.5rem; }
	.tl-dot { font-size: 0.8rem; line-height: 1.3; }
	.tl-text { display: flex; flex-direction: column; gap: 0.05rem; min-width: 0; }
	.tl-label { font-size: 0.68rem; font-weight: 700; color: #d4d4d8; text-transform: uppercase; letter-spacing: 0.03em; }
	.tl-time { font-size: 0.72rem; color: #8f8f96; }
	.tl-by { font-size: 0.68rem; color: #71717a; }
	.card-actions { display: flex; gap: 0.5rem; margin-top: auto; }
	.btn-confirm { padding: 0.5rem 0.9rem; background: #10b981; color: white; border: none; border-radius: 8px; font-size: 0.78rem; font-weight: 600; cursor: pointer; flex: 1; }
	.btn-confirm:hover { background: #059669; }
	.btn-invoice { padding: 0.5rem 0.9rem; background: rgba(16,185,129,0.1); color: #10b981; border: 1.5px solid rgba(16,185,129,0.35); border-radius: 8px; font-size: 0.78rem; font-weight: 600; cursor: pointer; flex: 1; }
	.btn-invoice:hover { background: rgba(16,185,129,0.18); }
	.btn-sign { padding: 0.5rem 0.9rem; background: rgba(59,130,246,0.1); color: #60a5fa; border: 1.5px solid rgba(59,130,246,0.35); border-radius: 8px; font-size: 0.78rem; font-weight: 600; cursor: pointer; flex: 1; }
	.btn-sign:hover { background: rgba(59,130,246,0.18); }
	.card-actions { flex-wrap: wrap; }
	.mono { font-family: monospace; }
	.badge { background: rgba(16,185,129,0.12); color: #10b981; font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.55rem; border-radius: 999px; white-space: nowrap; }
	.badge-group { display: flex; gap: 0.35rem; align-items: center; flex-wrap: wrap; justify-content: flex-end; }
	.badge-signed { background: rgba(59,130,246,0.12); color: #60a5fa; border: 1px solid rgba(59,130,246,0.3); }
	.badge-eksekusi { background: rgba(245,158,11,0.12); color: #fbbf24; border: 1px solid rgba(245,158,11,0.3); }
	.sign-note { margin-top: 0.5rem; font-size: 0.75rem; color: #8f8f96; }

	.empty { text-align: center; padding: 4rem 1rem; color: #71717a; background: #161618; border: 1px dashed rgba(255,255,255,0.12); border-radius: 14px; }
	.empty svg { color: #3f3f46; }
	.empty p { margin: 0.75rem 0 0; }

	.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
	.modal { background: #161618; border-radius: 16px; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; border: 1px solid rgba(255,255,255,0.08); }
	.modal-head { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
	.modal-head h3 { margin: 0; font-size: 1.05rem; font-weight: 700; color: #e3e4e6; }
	.modal-close { background: none; border: none; color: #71717a; cursor: pointer; font-size: 1.1rem; }
	.modal-body { padding: 1.5rem; }
	.modal-foot { display: flex; justify-content: flex-end; gap: 0.65rem; padding: 1.1rem 1.5rem; border-top: 1px solid rgba(255,255,255,0.05); }

	.item-summary { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 0.85rem 1rem; margin-bottom: 1.25rem; display: flex; flex-direction: column; gap: 0.25rem; }
	.item-summary .prices { display: flex; gap: 1rem; font-size: 0.8rem; color: #8f8f96; }

	.form-group { margin-bottom: 1rem; }
	.form-group label { display: block; font-size: 0.78rem; font-weight: 600; color: #a1a1a5; margin-bottom: 0.35rem; }
	.form-group input, .form-group select { width: 100%; padding: 0.6rem 0.75rem; border: 1.5px solid rgba(255,255,255,0.1); border-radius: 9px; font-size: 0.875rem; color: #e3e4e6; background: #121214; box-sizing: border-box; }
	.form-group select option { background: #121214; color: #e3e4e6; }
	.form-group input:focus, .form-group select:focus { outline: none; border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.12); }
	.form-row { display: flex; gap: 1rem; }

	.error { background: rgba(239,68,68,0.1); color: #f87171; border: 1px solid rgba(239,68,68,0.3); padding: 0.65rem 0.85rem; border-radius: 8px; font-size: 0.82rem; margin-top: 0.5rem; }

	.btn-primary { background: #10b981; color: white; padding: 0.65rem 1.25rem; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; font-size: 0.875rem; }
	.btn-primary:hover:not(:disabled) { background: #0ea371; }
	.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
	.btn-secondary { background: #161618; color: #a1a1a5; padding: 0.65rem 1.2rem; border: 1.5px solid rgba(255,255,255,0.1); border-radius: 10px; font-weight: 600; cursor: pointer; font-size: 0.875rem; }
	.btn-secondary:hover { background: rgba(255,255,255,0.05); }
	
	.modal-pdf { background: #161618; border-radius: 16px; width: 90vw; max-width: 1100px; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column; border: 1px solid rgba(255,255,255,0.08); }
	.modal-invoice { background: #161618; border-radius: 16px; width: 90vw; max-width: 900px; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column; border: 1px solid rgba(255,255,255,0.08); }
	.modal-invoice .pdf-iframe { height: calc(90vh - 80px); }
	.modal-body-split { display: flex; flex: 1; overflow: hidden; }
	.pdf-preview-section { flex: 1; padding: 1.5rem; border-right: 1px solid rgba(255,255,255,0.08); overflow-y: auto; background: #121214; }
	.pdf-preview-section h4 { margin: 0 0 1rem; font-size: 0.9rem; font-weight: 600; color: #d4d4d8; }
	.pdf-iframe { width: 100%; height: 600px; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; background: #161618; }
	.pdf-loading { text-align: center; padding: 2rem; color: #71717a; }
	.ttd-section { width: 400px; padding: 1.5rem; display: flex; flex-direction: column; overflow-y: auto; }
	.modal-foot-inline { display: flex; justify-content: flex-end; gap: 0.65rem; margin-top: auto; padding-top: 1rem; }
	.info-box { background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.3); border-radius: 8px; padding: 1rem; margin-bottom: 1rem; }
	.info-box p { margin: 0.25rem 0; font-size: 0.85rem; color: #7dd3fc; }
	.create-box { background: rgba(16,185,129,0.06); border: 1px dashed rgba(16,185,129,0.4); border-radius: 10px; padding: 1rem; margin-bottom: 1rem; }
	.create-box-title { font-size: 0.78rem; font-weight: 700; color: #10b981; margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 0.03em; }
	.btn-sm { padding: 0.5rem 1rem; font-size: 0.8rem; border-radius: 8px; }
	
	@media (max-width: 900px) {
		.modal-body-split { flex-direction: column; }
		.pdf-preview-section { border-right: none; border-bottom: 1px solid #e5e3f0; }
		.ttd-section { width: 100%; }
		.pdf-iframe { height: 400px; }
	}
</style>
