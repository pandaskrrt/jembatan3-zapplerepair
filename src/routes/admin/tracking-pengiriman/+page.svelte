<script lang="ts">
	let { data } = $props()
	let pengiriman = $state(data?.pengiriman || [])
	
	let filterStatus = $state<'all' | 'PENDING' | 'CONFIRMED'>('all')
	
	let filteredPengiriman = $derived(
		filterStatus === 'all' 
			? pengiriman 
			: pengiriman.filter((p: any) => p.status === filterStatus)
	)
	
	function getStatusBadge(status: string) {
		if (status === 'PENDING') return { text: 'Pending', class: 'pending' }
		if (status === 'CONFIRMED') return { text: 'Diterima', class: 'confirmed' }
		return { text: status, class: 'default' }
	}
	
	function formatRp(n: number | null | undefined) {
		return 'Rp ' + (n || 0).toLocaleString('id-ID')
	}
	
	function formatDate(date: string) {
		return new Date(date).toLocaleString('id-ID', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		})
	}
</script>

<svelte:head><title>Tracking Pengiriman — Admin</title></svelte:head>

<div class="page">
	<div class="header">
		<div>
			<h1>Tracking Pengiriman</h1>
			<p>Pantau status pengiriman barang ke cabang lain</p>
		</div>
	</div>

	<div class="filters">
		<button class="filter-btn" class:active={filterStatus === 'all'} onclick={() => filterStatus = 'all'}>
			Semua ({pengiriman.length})
		</button>
		<button class="filter-btn" class:active={filterStatus === 'PENDING'} onclick={() => filterStatus = 'PENDING'}>
			Pending ({pengiriman.filter((p: any) => p.status === 'PENDING').length})
		</button>
		<button class="filter-btn" class:active={filterStatus === 'CONFIRMED'} onclick={() => filterStatus = 'CONFIRMED'}>
			Diterima ({pengiriman.filter((p: any) => p.status === 'CONFIRMED').length})
		</button>
	</div>

	{#if filteredPengiriman.length === 0}
		<div class="empty">
			<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
				<path d="M20 13V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7m16 0v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5m16 0h-5l-2 2h-2l-2-2H4"/>
			</svg>
			<p>Belum ada pengiriman</p>
		</div>
	{:else}
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>Tanggal Kirim</th>
						<th>Nama Barang</th>
						<th>Serial Number</th>
						<th>Tujuan</th>
						<th>Pengirim</th>
						<th>Penerima</th>
						<th>Status</th>
						<th>Diterima Pada</th>
					</tr>
				</thead>
				<tbody>
					{#each filteredPengiriman as item}
						<tr>
							<td class="date">{formatDate(item.createdAt)}</td>
							<td><strong>{item.name}</strong></td>
							<td class="mono">{item.serialNumber || '-'}</td>
							<td>{item.note || '-'}</td>
							<td>{item.senderName || '-'}</td>
							<td>{item.receiverName || '-'}</td>
							<td>
								<span class="badge {getStatusBadge(item.status).class}">
									{getStatusBadge(item.status).text}
								</span>
							</td>
							<td class="date">
								{#if item.confirmedAt}
									{formatDate(item.confirmedAt)}
								{:else}
									<span class="text-muted">-</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<style>
	.page { padding: 2rem; max-width: 1400px; margin: 0 auto; }
	.header { margin-bottom: 1.5rem; }
	.header h1 { margin: 0; font-size: 1.5rem; font-weight: 700; color: #e3e4e6; }
	.header p { margin: 0.3rem 0 0; color: #a1a1a5; font-size: 0.9rem; }

	.filters { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
	.filter-btn { padding: 0.6rem 1.25rem; border: 1.5px solid rgba(255,255,255,0.08); border-radius: 10px; background: #161618; cursor: pointer; font-size: 0.875rem; font-weight: 600; color: #a1a1a5; transition: all 0.2s; }
	.filter-btn:hover { background: #161618; }
	.filter-btn.active { border-color: #10b981; background: rgba(16,185,129,0.12); color: #10b981; }

	.table-wrap { background: #161618; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; overflow: hidden; }
	table { width: 100%; border-collapse: collapse; }
	th { text-align: left; padding: 0.85rem 1rem; font-size: 0.75rem; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 0.03em; background: #141416; border-bottom: 1px solid rgba(255,255,255,0.08); }
	td { padding: 0.85rem 1rem; font-size: 0.85rem; color: #d4d4d8; border-bottom: 1px solid rgba(255,255,255,0.08); }
	tr:last-child td { border-bottom: none; }
	tr:hover { background: #141416; }
	
	.mono { font-family: monospace; font-size: 0.8rem; }
	.date { font-size: 0.8rem; color: #8f8f96; }
	.text-muted { color: #71717a; }
	
	.badge { 
		display: inline-block;
		padding: 0.25rem 0.65rem; 
		border-radius: 999px; 
		font-size: 0.7rem; 
		font-weight: 700; 
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}
	.badge.pending { background: #fef3c7; color: #fbbf24; }
	.badge.confirmed { background: #d1fae5; color: #065f46; }
	.badge.default { background: #e5e7eb; color: #4b5563; }

	.empty { 
		text-align: center; 
		padding: 4rem 1rem; 
		color: #71717a; 
		background: #161618; 
		border: 1px dashed rgba(255,255,255,0.08); 
		border-radius: 14px; 
	}
	.empty svg { color: #d3d1e8; }
	.empty p { margin: 0.75rem 0 0; font-size: 0.95rem; }
</style>
