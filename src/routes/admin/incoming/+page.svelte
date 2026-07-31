<script lang="ts">
	import { goto } from '$app/navigation'
	let { data } = $props()
	let incoming = $state(data?.incoming || [])
	let confirmed = $state(data?.confirmed || [])
	let cabinets = $state(data?.cabinets || [])

	let selectedIncoming: any = null
	let showModal = $state(false)
	let targetCabinetId = $state<number | null>(null)
	let targetSectionId = $state<number | null>(null)
	let targetItemId = $state<number | null>(null)
	let newItemName = $state('')
	let newItemCategory = $state('Sparepart')
	let newItemSubCategory = $state('')
	let isConfirming = $state(false)
	let errorMsg = $state('')
	let tab = $state<'pending' | 'confirmed'>('pending')

	let targetSections = $derived(
		targetCabinetId ? cabinets.find((c: any) => c.id === targetCabinetId)?.sections || [] : []
	)
	let sectionItems = $derived(
		targetSectionId ? targetSections.find((s: any) => s.id === targetSectionId)?.items || [] : []
	)

	function openConfirm(item: any) {
		selectedIncoming = item
		showModal = true
		targetCabinetId = null
		targetSectionId = null
		targetItemId = null
		newItemName = ''
		newItemCategory = 'Sparepart'
		newItemSubCategory = ''
		errorMsg = ''
	}

	function formatRp(n: number | null | undefined) {
		return 'Rp ' + (n || 0).toLocaleString('id-ID')
	}

	async function confirmItem() {
		if (!selectedIncoming) return
		if (!targetSectionId) { errorMsg = 'Pilih section tujuan'; return }

		isConfirming = true
		errorMsg = ''
		try {
			const res = await fetch('/api/incoming/confirm', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					incomingId: selectedIncoming.id,
					sectionId: targetSectionId,
					existingItemId: targetItemId,
					newItemName,
					newItemCategory,
					newItemSubCategory
				})
			})
			const d = await res.json()
			if (!res.ok) { errorMsg = d.error || 'Gagal konfirmasi'; return }
			showModal = false
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
			<div class="table-wrap">
				<table>
					<thead>
						<tr>
							<th>Nama Barang</th>
							<th>Serial</th>
							<th>Qty</th>
							<th>Harga Modal</th>
							<th>Harga Jual</th>
							<th>Sumber</th>
							<th>Tanggal</th>
							<th>Aksi</th>
						</tr>
					</thead>
					<tbody>
						{#each incoming as item}
							<tr>
								<td><strong>{item.name}</strong></td>
								<td class="mono">{item.serialNumber || '-'}</td>
								<td>{item.quantity}</td>
								<td>{formatRp(item.costPrice)}</td>
								<td>{formatRp(item.sellPrice)}</td>
								<td><span class="badge">{item.source}</span></td>
								<td>{new Date(item.createdAt).toLocaleString('id-ID')}</td>
								<td>
									<button class="btn-confirm" onclick={() => openConfirm(item)}>Konfirmasi</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	{:else}
		{#if confirmed.length === 0}
			<div class="empty">
				<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 13V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7m16 0v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5m16 0h-5l-2 2h-2l-2-2H4"/></svg>
				<p>Belum ada barang yang dikonfirmasi</p>
			</div>
		{:else}
			<div class="table-wrap">
				<table>
					<thead>
						<tr>
							<th>Nama Barang</th>
							<th>Serial</th>
							<th>Qty</th>
							<th>Sumber</th>
							<th>Dikonfirmasi</th>
						</tr>
					</thead>
					<tbody>
						{#each confirmed as item}
							<tr>
								<td><strong>{item.name}</strong></td>
								<td class="mono">{item.serialNumber || '-'}</td>
								<td>{item.quantity}</td>
								<td><span class="badge">{item.source}</span></td>
								<td>{item.confirmedAt ? new Date(item.confirmedAt).toLocaleString('id-ID') : '-'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	{/if}
</div>

{#if showModal}
	<div class="modal-overlay" onclick={() => showModal = false}>
		<div class="modal" onclick={e => e.stopPropagation()}>
			<div class="modal-head">
				<h3>Konfirmasi Barang Masuk</h3>
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
					<select bind:value={targetCabinetId} onchange={() => { targetSectionId = null; targetItemId = null }}>
						<option value={null} disabled>-- Pilih Cabinet --</option>
						{#each cabinets as cab}
							<option value={cab.id}>{cab.name}</option>
						{/each}
					</select>
				</div>

				{#if targetCabinetId}
					<div class="form-group">
						<label>Section Tujuan</label>
						<select bind:value={targetSectionId} onchange={() => targetItemId = null}>
							<option value={null} disabled>-- Pilih Section --</option>
							{#each targetSections as sec}
								<option value={sec.id}>{sec.name}</option>
							{/each}
						</select>
					</div>
				{/if}

				{#if targetSectionId}
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
				<button class="btn-primary" onclick={confirmItem} disabled={isConfirming || !targetSectionId}>
					{isConfirming ? 'Memproses...' : 'Konfirmasi Masuk'}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.page { padding: 2rem; max-width: 1100px; margin: 0 auto; }
	.header { margin-bottom: 1.5rem; }
	.header h1 { margin: 0; font-size: 1.5rem; font-weight: 700; color: #1e1b3a; }
	.header p { margin: 0.3rem 0 0; color: #7c7a94; font-size: 0.9rem; }

	.tabs { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
	.tab-btn { padding: 0.6rem 1.25rem; border: 1.5px solid #e5e3f0; border-radius: 10px; background: white; cursor: pointer; font-size: 0.875rem; font-weight: 600; color: #7c7a94; }
	.tab-btn.active { border-color: #4f46e5; background: #ece9fc; color: #4338ca; }

	.table-wrap { background: white; border: 1px solid #ecebf5; border-radius: 14px; overflow: hidden; }
	table { width: 100%; border-collapse: collapse; }
	th { text-align: left; padding: 0.85rem 1rem; font-size: 0.75rem; font-weight: 700; color: #a8a6bd; text-transform: uppercase; letter-spacing: 0.03em; background: #fafafd; border-bottom: 1px solid #f1f0f8; }
	td { padding: 0.85rem 1rem; font-size: 0.85rem; color: #334155; border-bottom: 1px solid #f1f0f8; }
	tr:last-child td { border-bottom: none; }
	.mono { font-family: monospace; }
	.badge { background: #ece9fc; color: #4338ca; font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.55rem; border-radius: 999px; }
	.btn-confirm { padding: 0.4rem 0.9rem; background: #10b981; color: white; border: none; border-radius: 8px; font-size: 0.78rem; font-weight: 600; cursor: pointer; }
	.btn-confirm:hover { background: #059669; }

	.empty { text-align: center; padding: 4rem 1rem; color: #a8a6bd; background: white; border: 1px dashed #e0defa; border-radius: 14px; }
	.empty svg { color: #d3d1e8; }
	.empty p { margin: 0.75rem 0 0; }

	.modal-overlay { position: fixed; inset: 0; background: rgba(15,13,35,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
	.modal { background: white; border-radius: 16px; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; }
	.modal-head { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f0f8; }
	.modal-head h3 { margin: 0; font-size: 1.05rem; font-weight: 700; color: #1e1b3a; }
	.modal-close { background: none; border: none; color: #a8a6bd; cursor: pointer; font-size: 1.1rem; }
	.modal-body { padding: 1.5rem; }
	.modal-foot { display: flex; justify-content: flex-end; gap: 0.65rem; padding: 1.1rem 1.5rem; border-top: 1px solid #f1f0f8; }

	.item-summary { background: #fafafd; border: 1px solid #ecebf5; border-radius: 10px; padding: 0.85rem 1rem; margin-bottom: 1.25rem; display: flex; flex-direction: column; gap: 0.25rem; }
	.item-summary .prices { display: flex; gap: 1rem; font-size: 0.8rem; color: #64748b; }

	.form-group { margin-bottom: 1rem; }
	.form-group label { display: block; font-size: 0.78rem; font-weight: 600; color: #64748b; margin-bottom: 0.35rem; }
	.form-group input, .form-group select { width: 100%; padding: 0.6rem 0.75rem; border: 1.5px solid #e5e3f0; border-radius: 9px; font-size: 0.875rem; color: #211f3d; box-sizing: border-box; }
	.form-group input:focus, .form-group select:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }
	.form-row { display: flex; gap: 1rem; }

	.error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; padding: 0.65rem 0.85rem; border-radius: 8px; font-size: 0.82rem; margin-top: 0.5rem; }

	.btn-primary { background: #4f46e5; color: white; padding: 0.65rem 1.25rem; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; font-size: 0.875rem; }
	.btn-primary:hover:not(:disabled) { background: #4338ca; }
	.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
	.btn-secondary { background: white; color: #4b4a63; padding: 0.65rem 1.2rem; border: 1.5px solid #e5e3f0; border-radius: 10px; font-weight: 600; cursor: pointer; font-size: 0.875rem; }
	.btn-secondary:hover { background: #f6f5fb; }
</style>
