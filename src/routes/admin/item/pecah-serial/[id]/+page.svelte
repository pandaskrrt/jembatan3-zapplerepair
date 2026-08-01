<script lang="ts">
	import { goto } from '$app/navigation'

	let { data } = $props()
	let serial = data?.serial
	let cabinets = data?.cabinets || []

	let destType = $state<'section' | 'kirim'>('section')
	let targetMode = $state<'existing' | 'new'>('existing')
	let showCreateCabinet = $state(false)
	let newCabinetName = $state('')
	let newCabinetSection = $state('')
	let showCreateSection = $state(false)
	let newSectionName = $state('')
	let targetCabinetId = $state<number | null>(null)
	let targetSectionId = $state<number | null>(null)
	let searchTerm = $state('')
	let selectedItem: any = $state(null)

	let isSubmitting = $state(false)
	let errorMessage = $state<string | null>(null)

	// Form untuk part
	let partName = $state('')
	let partCategory = $state('Sparepart')
	let partSubCategory = $state('')
	let partSerialNumber = $state('')
	let partModal = $state('')
	let partJual = $state('')
	let partQty = $state(1)
	let serialCheck = $state<{ checking: boolean; exists: boolean; itemName?: string | null }>({ checking: false, exists: false })
	let serialDebounce: ReturnType<typeof setTimeout> | null = null

	let targetSections = $derived(
		targetCabinetId ? cabinets.find((c: any) => c.id === targetCabinetId)?.sections || [] : []
	)

	let sectionItems = $derived(
		targetSectionId ? targetSections.find((s: any) => s.id === targetSectionId)?.items || [] : []
	)

	let filteredItems = $derived(
		searchTerm
			? sectionItems.filter((i: any) => i.name.toLowerCase().includes(searchTerm.toLowerCase()))
			: sectionItems
	)

	async function checkSerialUsed(sn: string) {
		if (!sn.trim()) { serialCheck = { checking: false, exists: false }; return }
		serialCheck = { ...serialCheck, checking: true }
		try {
			const res = await fetch(`/admin/item/check-serial?serial=${encodeURIComponent(sn.trim())}`)
			const d = await res.json()
			serialCheck = { checking: false, exists: d.exists, itemName: d.itemName }
		} catch { serialCheck = { checking: false, exists: false } }
	}

	function onSerialInput(e: Event) {
		const input = e.target as HTMLInputElement
		partSerialNumber = input.value
		if (serialDebounce) clearTimeout(serialDebounce)
		serialDebounce = setTimeout(() => checkSerialUsed(input.value), 500)
	}

	function parseNum(v: string): number {
		return Number(String(v).replace(/\./g, '')) || 0
	}

	function onPriceInput(e: Event) {
		const input = e.target as HTMLInputElement
		return parseInt(input.value.replace(/[^0-9]/g, '')) || 0
	}

	async function createCabinet() {
		if (!newCabinetName.trim()) { errorMessage = 'Nama cabinet wajib'; return }
		errorMessage = null
		try {
			const res = await fetch('/api/cabinet', {
				method: 'POST', headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: newCabinetName, sectionName: newCabinetSection, sectionType: partCategory })
			})
			const d = await res.json()
			if (!res.ok) { errorMessage = d.error; return }
			cabinets = [...cabinets, {
				id: d.data.cabinet.id, name: d.data.cabinet.name,
				sections: d.data.section ? [{ id: d.data.section.id, name: d.data.section.name, type: d.data.section.type, items: [] }] : []
			}]
			targetCabinetId = d.data.cabinet.id
			targetSectionId = d.data.section?.id || null
			showCreateCabinet = false; newCabinetName = ''; newCabinetSection = ''
		} catch { errorMessage = 'Gagal membuat cabinet' }
	}

	async function createSection() {
		if (!targetCabinetId || !newSectionName.trim()) { errorMessage = 'Nama section wajib'; return }
		errorMessage = null
		try {
			const res = await fetch('/api/section', {
				method: 'POST', headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ cabinetId: targetCabinetId, name: newSectionName, type: partCategory })
			})
			const d = await res.json()
			if (!res.ok) { errorMessage = d.error; return }
			targetSections.push({ id: d.data.id, name: d.data.name, type: d.data.type, items: [] })
			targetSectionId = d.data.id
			showCreateSection = false; newSectionName = ''
		} catch { errorMessage = 'Gagal membuat section' }
	}

	function selectItem(item: any) {
		selectedItem = item
		partName = item.name
		partSerialNumber = ''
		partModal = ''
		partJual = ''
		errorMessage = null
	}

	function resetSelection() {
		selectedItem = null
		partName = ''
		partSerialNumber = ''
		partModal = ''
		partJual = ''
	}

	async function handleSubmit(e: Event) {
		e.preventDefault()
		errorMessage = null

		if (destType === 'section') {
			if (!targetCabinetId) { errorMessage = 'Pilih Cabinet tujuan'; return }
			if (!targetSectionId) { errorMessage = 'Pilih Section tujuan'; return }
			if (targetMode === 'existing' && !selectedItem) { errorMessage = 'Pilih item tujuan dari daftar di kanan'; return }
			if (targetMode === 'new' && !partName.trim()) { errorMessage = 'Isi Nama Item Baru'; return }
			if (!partSerialNumber.trim()) { errorMessage = 'Isi Serial Number part'; return }
			if (serialCheck.exists) { errorMessage = 'Serial number sudah pernah dipakai! Ganti dengan yang baru.'; return }
			if (!partModal || parseNum(partModal) <= 0) { errorMessage = 'Isi Harga Modal'; return }
			if (!partJual || parseNum(partJual) <= 0) { errorMessage = 'Isi Harga Jual'; return }
		} else {
			if (!partName.trim()) { errorMessage = 'Isi Nama Part'; return }
			if (!partSerialNumber.trim()) { errorMessage = 'Isi Serial Number part'; return }
			if (serialCheck.exists) { errorMessage = 'Serial number sudah pernah dipakai! Ganti dengan yang baru.'; return }
			if (!partModal || parseNum(partModal) <= 0) { errorMessage = 'Isi Harga Modal'; return }
			if (!partJual || parseNum(partJual) <= 0) { errorMessage = 'Isi Harga Jual'; return }
		}

		isSubmitting = true
		try {
			const res = await fetch('/api/items/pecah', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					serialId: serial.id,
					destType,
					targetSectionId: destType === 'section' ? Number(targetSectionId) : null,
					parts: [{
						name: destType === 'section' && targetMode === 'existing' ? selectedItem.name : partName.trim(),
						category: destType === 'section' && targetMode === 'existing' ? selectedItem.category : (destType === 'section' ? partCategory : 'Accessories'),
						subCategory: partSubCategory.trim() || undefined,
						qty: partQty,
						modal: parseNum(partModal),
						jual: parseNum(partJual),
						serialNumber: partSerialNumber.trim(),
						existingItemId: destType === 'section' && targetMode === 'existing' ? selectedItem.id : null
					}]
				})
			})

			const result = await res.json()
			if (!res.ok) {
				errorMessage = result.error || 'Gagal memecah item'
				isSubmitting = false
				return
			}

			const created = result.data?.newItems?.[0]
			const isMerged = created?.mergedToExisting
			const destLabel = destType === 'kirim' ? 'kirim' : (isMerged ? 'existing' : 'new')
			await goto(`/admin/item?pecah_success=true&dest=${destLabel}&itemId=${created?.newItemId || ''}`)
		} catch (err) {
			errorMessage = 'Network error'
			isSubmitting = false
		}
	}
</script>

<svelte:head>
	<title>Pecah Serial #{serial?.id}</title>
</svelte:head>

<div class="page">
	<div class="header">
		<button class="back-btn" onclick={() => goto('/admin/item')}>
			<svg viewBox="0 0 20 20" fill="currentColor" width="18"><path fill-rule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"/></svg>
			Back
		</button>
		<div class="header-text">
			<h1>Pecah Serial</h1>
			<p>Ambil part dari serial dan tentukan tujuannya</p>
		</div>
		<span class="id-badge">Serial #{serial?.id} · {serial?.serialNumber}</span>
	</div>

	<div class="serial-info-card">
		<div><strong>Item:</strong> {serial?.item?.name}</div>
		<div><strong>Serial:</strong> {serial?.serialNumber || '-'}</div>
		<div><strong>Kategori:</strong> {serial?.category || serial?.item?.category}</div>
		<div><strong>Modal:</strong> Rp {Number(serial?.costPrice || 0).toLocaleString('id-ID')}</div>
		<div><strong>Jual:</strong> Rp {Number(serial?.price || 0).toLocaleString('id-ID')}</div>
	</div>

	{#if errorMessage}
		<div class="alert">{errorMessage}</div>
	{/if}

	<form onsubmit={handleSubmit}>
		<div class="workspace">
			<!-- KIRI: Input part -->
			<div class="left-panel">
				<div class="panel-title">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
					Detail Part
				</div>

				<div class="dest-options">
					<label class="dest-option" class:active={destType === 'section'}>
						<input type="radio" name="dest" checked={destType === 'section'} onchange={() => destType = 'section'} />
						<div>
							<strong>Pindah ke Section Lain</strong>
							<span>Pilih item di section tujuan</span>
						</div>
					</label>
					<label class="dest-option" class:active={destType === 'kirim'}>
						<input type="radio" name="dest" checked={destType === 'kirim'} onchange={() => destType = 'kirim'} />
						<div>
							<strong>Kirim ke Cabang Lain</strong>
							<span>Part masuk Barang Luar, siap kirim</span>
						</div>
					</label>
				</div>

				{#if destType === 'section'}
					<div class="mode-toggle">
						<button type="button" class="mode-btn" class:active={targetMode === 'existing'} onclick={() => targetMode = 'existing'}>Item Existing</button>
						<button type="button" class="mode-btn" class:active={targetMode === 'new'} onclick={() => targetMode = 'new'}>Item Baru</button>
					</div>

					{#if targetMode === 'existing'}
						<div class="selected-item-box" class:empty={!selectedItem}>
							{#if selectedItem}
								<div class="sel-item-head">
									<span class="sel-item-name">{selectedItem.name}</span>
									<span class="sel-item-cat">{selectedItem.category}</span>
									<button type="button" class="sel-remove" onclick={resetSelection}>✕</button>
								</div>
								<div class="sel-item-sub">{selectedItem.subCategory || '-'}</div>
							{:else}
								<div class="sel-placeholder">Pilih item tujuan di panel kanan</div>
							{/if}
						</div>
					{:else}
						<div class="part-field">
							<label>Nama Item Baru *</label>
							<input type="text" bind:value={partName} placeholder="Nama item baru" />
						</div>
						<div class="price-row">
							<div class="part-field">
								<label>Kategori</label>
								<select bind:value={partCategory}>
									<option value="Sparepart">Sparepart</option>
									<option value="Accessories">Accessories</option>
								</select>
							</div>
							<div class="part-field">
								<label>Sub Kategori</label>
								<input type="text" bind:value={partSubCategory} placeholder="e.g. LCD, Battery" />
							</div>
						</div>
					{/if}
				{:else}
					<div class="part-field">
						<label>Nama Part</label>
						<input type="text" bind:value={partName} placeholder="Nama part untuk dikirim" />
					</div>
				{/if}

				<div class="part-field">
					<label>Serial Number Part *</label>
					<input
						type="text"
						value={partSerialNumber}
						oninput={onSerialInput}
						placeholder="Masukkan serial number part"
						class:serial-error={serialCheck.exists}
						class:serial-ok={serialCheck.checking === false && serialCheck.exists === false && partSerialNumber.trim() !== ''}
					/>
					{#if serialCheck.checking}
						<span class="serial-status">Memeriksa...</span>
					{:else if serialCheck.exists}
						<span class="serial-status error">⚠ Serial sudah pernah dipakai ({serialCheck.itemName || 'item lain'})! Ganti serial baru.</span>
					{:else if partSerialNumber.trim() !== ''}
						<span class="serial-status ok">✓ Serial tersedia</span>
					{/if}
				</div>

				<div class="price-row">
					<div class="part-field">
						<label>Harga Modal *</label>
						<input type="text" inputmode="numeric" value={partModal} oninput={(e) => partModal = (onPriceInput(e) === 0 ? '' : onPriceInput(e).toLocaleString('id-ID'))} placeholder="0" />
					</div>
					<div class="part-field">
						<label>Harga Jual *</label>
						<input type="text" inputmode="numeric" value={partJual} oninput={(e) => partJual = (onPriceInput(e) === 0 ? '' : onPriceInput(e).toLocaleString('id-ID'))} placeholder="0" />
					</div>
				</div>

				<div class="part-field">
					<label>Qty</label>
					<input type="number" bind:value={partQty} min="1" />
				</div>

				<div class="submit-area">
					<button type="button" class="btn-secondary" onclick={() => goto('/admin/item')} disabled={isSubmitting}>Batal</button>
					<button type="submit" class="btn-primary" disabled={isSubmitting}>
						{isSubmitting ? 'Memproses...' : 'Pecah Item'}
					</button>
				</div>
			</div>

			<!-- KANAN: Pilih tujuan item -->
			<div class="right-panel">
				{#if destType === 'section' && targetMode === 'existing'}
					<div class="panel-title">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
						Pilih Item Tujuan
					</div>

					<div class="cabinet-row">
						<select class="nav-select" bind:value={targetCabinetId} onchange={() => { targetSectionId = null; resetSelection() }}>
							<option value={null} disabled>-- Pilih Cabinet --</option>
							{#each cabinets as cab}
								<option value={cab.id}>{cab.name}</option>
							{/each}
						</select>
						{#if targetCabinetId}
							<select class="nav-select" bind:value={targetSectionId} onchange={() => resetSelection()}>
								<option value={null} disabled>-- Pilih Section --</option>
								{#each targetSections as sec}
									<option value={sec.id}>{sec.name}</option>
								{/each}
							</select>
						{/if}
					</div>

					{#if targetSectionId}
						<div class="search-box">
							<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
							<input type="text" bind:value={searchTerm} placeholder="Cari item..." />
						</div>

						<div class="item-list">
							{#if filteredItems.length === 0}
								<div class="list-empty">
									<p>Tidak ada item di section ini</p>
									<small>Pilih bagian lain atau pilih "Kirim ke Cabang"</small>
								</div>
							{:else}
								{#each filteredItems as item}
									<div class="item-card" class:selected={selectedItem?.id === item.id} onclick={() => selectItem(item)}>
										<div class="item-card-left">
											<strong>{item.name}</strong>
											<span class="item-cat">{item.category}</span>
										</div>
										<div class="item-card-right">
											<span class="item-sub">{item.subCategory || '-'}</span>
											{#if selectedItem?.id === item.id}
												<span class="check">✓</span>
											{/if}
										</div>
									</div>
								{/each}
							{/if}
						</div>
					{:else}
						<div class="panel-empty">Pilih Cabinet & Section untuk melihat item</div>
					{/if}
				{:else if destType === 'section' && targetMode === 'new'}
					<div class="panel-title">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
						Lokasi Item Baru
					</div>

					<div class="cabinet-row">
						{#if showCreateCabinet}
							<div class="create-box">
								<input type="text" bind:value={newCabinetName} placeholder="Nama Cabinet baru" />
								<input type="text" bind:value={newCabinetSection} placeholder="Section pertama (opsional)" />
								<div class="create-actions">
									<button type="button" class="btn-sm" onclick={() => showCreateCabinet = false}>Batal</button>
									<button type="button" class="btn-sm primary" onclick={createCabinet}>Buat Cabinet</button>
								</div>
							</div>
						{:else}
							<select class="nav-select" bind:value={targetCabinetId} onchange={() => { targetSectionId = null; resetSelection() }}>
								<option value={null} disabled>-- Pilih Cabinet --</option>
								{#each cabinets as cab}
									<option value={cab.id}>{cab.name}</option>
								{/each}
							</select>
							<button type="button" class="create-link" onclick={() => { showCreateCabinet = true; showCreateSection = false }}>
								<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
								Buat Cabinet Baru
							</button>
						{/if}
					</div>

					{#if targetCabinetId}
						<div class="cabinet-row">
							{#if showCreateSection}
								<div class="create-box">
									<input type="text" bind:value={newSectionName} placeholder="Nama Section baru" />
									<div class="create-actions">
										<button type="button" class="btn-sm" onclick={() => showCreateSection = false}>Batal</button>
										<button type="button" class="btn-sm primary" onclick={createSection}>Buat Section</button>
									</div>
								</div>
							{:else}
								<select class="nav-select" bind:value={targetSectionId} onchange={() => resetSelection()}>
									<option value={null} disabled>-- Pilih Section --</option>
									{#each targetSections as sec}
										<option value={sec.id}>{sec.name}</option>
									{/each}
								</select>
								<button type="button" class="create-link" onclick={() => { showCreateSection = true; showCreateCabinet = false }}>
									<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
									Buat Section Baru
								</button>
							{/if}
						</div>
					{/if}

					{#if targetSectionId}
						<div class="info-target">
							<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
							Item baru akan dibuat di section terpilih
						</div>
					{:else}
						<div class="panel-empty">
							<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
							<p>Pilih / buat Cabinet & Section tujuan</p>
						</div>
					{/if}
				{:else}
					<div class="panel-empty kirim-info">
						<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
						<p>Part akan masuk ke <strong>Barang Luar</strong></p>
						<small>Isi detail di panel kiri, lalu klik Pecah Item</small>
					</div>
				{/if}
			</div>
		</div>
	</form>
</div>

<style>
	.page { padding: 2rem; max-width: 1200px; margin: 0 auto; }
	.header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
	.header-text { flex: 1; }
	.header-text h1 { margin: 0; font-size: 1.5rem; font-weight: 700; color: #e3e4e6; }
	.header-text p { margin: 0.25rem 0 0; font-size: 0.875rem; color: #8f8f96; }
	.back-btn { background: #161618; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 0.5rem 0.75rem; cursor: pointer; display: flex; align-items: center; gap: 0.3rem; font-size: 0.875rem; }
	.back-btn:hover { background: #0b0b0c; }
	.id-badge { background: rgba(255,255,255,0.04); color: #a1a1a5; padding: 0.35rem 0.7rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600; }

	.serial-info-card {
		display: flex; gap: 1.5rem; flex-wrap: wrap; background: #161618;
		border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1rem 1.25rem; margin-bottom: 1.5rem;
		font-size: 0.85rem; color: #d4d4d8;
	}

	.alert { background: #fef2f2; color: #f87171; padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid rgba(239,68,68,0.3); font-size: 0.875rem; }

	.workspace {
		display: grid; grid-template-columns: 380px 1fr; gap: 1.5rem; align-items: start;
	}

	.left-panel, .right-panel {
		background: #161618; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 1.5rem;
		box-shadow: 0 1px 2px rgba(0,0,0,0.3);
	}
	.right-panel { min-height: 500px; display: flex; flex-direction: column; }

	.panel-title { display: flex; align-items: center; gap: 0.5rem; font-size: 1rem; font-weight: 700; color: #e3e4e6; margin-bottom: 1.25rem; }
	.panel-title svg { color: #10b981; }

	.dest-options { display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 1.25rem; }
	.dest-option { display: flex; align-items: flex-start; gap: 0.6rem; padding: 0.85rem; border: 2px solid rgba(255,255,255,0.08); border-radius: 10px; cursor: pointer; transition: all 0.15s; }
	.dest-option:hover { border-color: #10b981; background: #f0fdf4; }
	.dest-option.active { border-color: #10b981; background: rgba(16,185,129,0.12); }
	.dest-option input { margin-top: 0.2rem; }
	.dest-option strong { display: block; font-size: 0.9rem; color: #e3e4e6; }
	.dest-option span { font-size: 0.78rem; color: #8f8f96; }

	.create-link { display: inline-flex; align-items: center; gap: 0.3rem; background: none; border: none; color: #10b981; font-size: 0.78rem; font-weight: 600; cursor: pointer; padding: 0.35rem 0; }
	.create-link:hover { color: #10b981; text-decoration: underline; }
	.create-box { display: flex; flex-direction: column; gap: 0.5rem; padding: 0.75rem; background: #f0fdf4; border: 1px solid #a7f3d0; border-radius: 8px; }
	.create-box input { padding: 0.5rem 0.75rem; border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; font-size: 0.85rem; width: 100%; box-sizing: border-box; }
	.create-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }
	.btn-sm { padding: 0.35rem 0.75rem; border-radius: 6px; font-size: 0.75rem; font-weight: 600; cursor: pointer; }
	.btn-sm.primary { background: #10b981; color: white; border: none; }
	.btn-sm:not(.primary) { background: #161618; border: 1px solid rgba(255,255,255,0.08); color: #a1a1a5; }
	.info-target { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; color: #1e40af; font-size: 0.82rem; }

	.mode-toggle { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
	.mode-btn { flex: 1; padding: 0.6rem; border: 2px solid rgba(255,255,255,0.08); border-radius: 8px; background: #161618; cursor: pointer; font-size: 0.85rem; font-weight: 600; color: #8f8f96; transition: all 0.15s; }
	.mode-btn:hover { border-color: #10b981; color: #10b981; }
	.mode-btn.active { border-color: #10b981; background: rgba(16,185,129,0.12); color: #065f46; }

	.selected-item-box { border: 2px solid #a7f3d0; background: rgba(16,185,129,0.12); border-radius: 10px; padding: 0.85rem; margin-bottom: 1rem; }
	.selected-item-box.empty { border: 2px dashed rgba(255,255,255,0.08); background: #0b0b0c; }
	.sel-item-head { display: flex; align-items: center; gap: 0.5rem; }
	.sel-item-name { font-weight: 700; color: #065f46; flex: 1; font-size: 0.9rem; }
	.sel-item-cat { background: #a7f3d0; color: #065f46; font-size: 0.65rem; font-weight: 700; padding: 0.1rem 0.5rem; border-radius: 999px; }
	.sel-remove { background: none; border: none; color: #8f8f96; cursor: pointer; font-size: 0.9rem; }
	.sel-item-sub { font-size: 0.75rem; color: #8f8f96; margin-top: 0.2rem; }
	.sel-placeholder { color: #71717a; font-size: 0.8rem; }

	.part-field { margin-bottom: 0.9rem; }
	.part-field label { display: block; font-size: 0.75rem; font-weight: 600; color: #8f8f96; text-transform: uppercase; margin-bottom: 0.3rem; }
	.part-field input, .part-field select { padding: 0.6rem 0.75rem; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; font-size: 0.875rem; width: 100%; box-sizing: border-box; }
	.part-field input.serial-error { border-color: #dc2626; background: #fef2f2; }
	.part-field input.serial-ok { border-color: #10b981; background: #f0fdf4; }
	.serial-status { font-size: 0.72rem; margin-top: 0.25rem; }
	.serial-status.error { color: #dc2626; }
	.serial-status.ok { color: #10b981; }

	.part-field input:focus, .part-field select:focus { outline: none; border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.12); }

	.price-row { display: flex; gap: 0.75rem; }

	.submit-area { display: flex; gap: 0.75rem; margin-top: 1.25rem; }
	.btn-primary { flex: 1; background: #10b981; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.9rem; }
	.btn-primary:hover:not(:disabled) { background: #10b981; }
	.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
	.btn-secondary { background: #161618; color: #a1a1a5; padding: 0.75rem 1.5rem; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.9rem; }
	.btn-secondary:hover { background: #0b0b0c; }

	.cabinet-row { display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 1rem; }
	.nav-select { padding: 0.6rem 0.75rem; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; font-size: 0.875rem; width: 100%; box-sizing: border-box; background: #161618; }

	.search-box { display: flex; align-items: center; gap: 0.5rem; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 0.5rem 0.75rem; margin-bottom: 1rem; }
	.search-box svg { color: #71717a; flex-shrink: 0; }
	.search-box input { border: none; outline: none; flex: 1; font-size: 0.875rem; }

	.item-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 0.5rem; max-height: 520px; }
	.item-card { display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border: 1.5px solid rgba(255,255,255,0.08); border-radius: 10px; cursor: pointer; transition: all 0.15s; }
	.item-card:hover { border-color: #10b981; background: #f0fdf4; }
	.item-card.selected { border-color: #10b981; background: rgba(16,185,129,0.12); }
	.item-card-left { display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; }
	.item-card-left strong { font-size: 0.9rem; color: #e3e4e6; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.item-cat { font-size: 0.65rem; font-weight: 700; background: rgba(255,255,255,0.04); color: #a1a1a5; padding: 0.1rem 0.45rem; border-radius: 999px; width: max-content; }
	.item-card-right { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }
	.item-sub { font-size: 0.72rem; color: #71717a; }
	.check { color: #10b981; font-weight: 700; }

	.list-empty { text-align: center; padding: 3rem 1rem; color: #71717a; }
	.list-empty p { margin: 0 0 0.25rem; font-weight: 600; }
	.list-empty small { font-size: 0.78rem; }
	.panel-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem; padding: 4rem 1rem; color: #71717a; text-align: center; }
	.panel-empty.kirim-info svg { color: rgba(255,255,255,0.08); }
	.panel-empty p { margin: 0; font-size: 0.9rem; }
	.panel-empty small { font-size: 0.78rem; }
	.panel-empty.kirim-info strong { color: #a1a1a5; }

	@media (max-width: 900px) {
		.workspace { grid-template-columns: 1fr; }
		.right-panel { min-height: 300px; }
	}
</style>
