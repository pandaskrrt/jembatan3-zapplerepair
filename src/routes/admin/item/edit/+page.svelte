<script lang="ts">
	import { goto } from '$app/navigation'
	import { onMount } from 'svelte'

	let { data } = $props()
	let sections = data?.sections || []
	let item = data?.item

	let isSubmitting = $state(false)
	let errorMessage = $state<string | null>(null)

	let isDropdownOpen = $state(false)
	let searchTerm = $state('')
	let selectedSection = $state<any>(sections.find((s: any) => s.id === item?.sectionId) ?? null)
	let dropdownRef = $state<HTMLDivElement>()
	let formIsCustomer = $state(item?.isCustomer || false)

	let displaySerial = $derived(item?.serials?.find((s: any) => s.isDisplay))
	let serials = $derived(item?.serials || [])

	let isInPaten = $derived(item?.section?.isProtected || item?.section?.cabinet?.isProtected)

	let filteredSections = $derived(() => {
		let list = sections
		if (isInPaten && !formIsCustomer) list = sections.filter((s: any) => s.isProtected || s.cabinet?.isProtected)
		if (!searchTerm) return list
		return list.filter(
			(s: any) =>
				s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				s.cabinet?.name?.toLowerCase().includes(searchTerm.toLowerCase())
		)
	})

	function handleClickOutside(event: MouseEvent) {
		if (dropdownRef && !dropdownRef.contains(event.target as Node)) isDropdownOpen = false
	}
	onMount(() => {
		document.addEventListener('click', handleClickOutside)
		return () => document.removeEventListener('click', handleClickOutside)
	})

	function selectSection(section: any) {
		selectedSection = section
		searchTerm = ''
		isDropdownOpen = false
	}
	function stopPropagation(e: Event) {
		e.stopPropagation()
	}

	async function handleSubmit(e: Event) {
		e.preventDefault()
		if (!selectedSection) { errorMessage = 'Please select a section!'; return }
		isSubmitting = true
		errorMessage = null
		const fd = new FormData()
		fd.append('name', (document.querySelector('[name=name]') as HTMLInputElement).value)
		fd.append('location', (document.querySelector('[name=location]') as HTMLInputElement).value)
		fd.append('category', (document.querySelector('[name=category]') as HTMLInputElement).value)
		fd.append('subCategory', (document.querySelector('[name=subCategory]') as HTMLInputElement).value)
		fd.append('isCustomer', String(formIsCustomer))
		fd.append('sectionId', selectedSection.id.toString())
		try {
			const r = await fetch(`/admin/item/edit?id=${item?.id}`, { method: 'POST', body: fd, redirect: 'manual' })
			if (r.type === 'opaqueredirect' || r.status === 303 || r.status === 0) { await goto('/admin/item?success=true'); return }
			const txt = await r.text()
			try { const j = JSON.parse(txt); errorMessage = j.message || j.data?.message } catch { errorMessage = txt }
		} catch { errorMessage = 'Network error!' }
		isSubmitting = false
	}
</script>

<svelte:head>
	<title>Admin - Edit Item #{item?.id}</title>
</svelte:head>

<div class="page">
	<!-- Header -->
	<div class="header">
		<button class="back-btn" onclick={() => goto('/admin/item')} aria-label="Back to items">
			<svg viewBox="0 0 20 20" fill="currentColor" width="18"><path fill-rule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"/></svg>
			Back
		</button>
		<div class="header-text">
			<h1>Edit Item</h1>
			<p>Update the details for this item</p>
		</div>
		<span class="id-badge">#{item?.id} · {item?.name}</span>
	</div>

	<!-- Dashboard grid: left full-height card, right two stacked cards -->
	<div class="dashboard">
		<!-- Left: form -->
		<form class="card left-card" onsubmit={handleSubmit}>
			<div class="card-header">
				<div class="dot"></div>
				<div>
					<h2>Item Information</h2>
					<p>Basic details that identify this item</p>
				</div>
			</div>

			<div class="card-body left-card-body">
				{#if errorMessage}
					<div class="alert">
						<svg viewBox="0 0 20 20" fill="currentColor" width="16"><path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 8a1 1 0 100-2 1 1 0 000 2z"/></svg>
						{errorMessage}
					</div>
				{/if}

				<div class="form-stack">
					<div class="field">
						<label for="name">Nama Barang</label>
						<input id="name" name="name" value={item?.name || ''} required />
					</div>
					<div class="field">
						<label for="location">Location</label>
						<input id="location" name="location" value={item?.location || ''} required />
					</div>
					<div class="field two-up">
						<div>
							<label for="category">Category</label>
							<select id="category" name="category" required>
								<option value="" disabled selected={!item?.category}>Select category...</option>
								<option value="ReadySale" selected={item?.category === 'ReadySale'}>Ready Sale</option>
								<option value="NoReadySale" selected={item?.category === 'NoReadySale'}>No Ready Sale</option>
								<option value="Accessories" selected={item?.category === 'Accessories'}>Accessories</option>
								<option value="Sparepart" selected={item?.category === 'Sparepart'}>Sparepart</option>
							</select>
						</div>
						<div>
							<label for="subCategory">Sub Category</label>
							<input id="subCategory" name="subCategory" value={item?.subCategory || ''} required />
						</div>
					</div>
					<div class="field">
						<label for="stock">Stock</label>
						<input id="stock" type="number" value={serials.length} disabled />
						<small>Otomatis dari jumlah serial</small>
					</div>
				</div>

				<!-- Spacer pushes actions to bottom of the full-height card -->
				<div class="spacer"></div>

				<div class="form-actions">
					<button type="button" class="btn-secondary" onclick={() => goto('/admin/item')} disabled={isSubmitting}>Cancel</button>
					<button type="submit" class="btn-primary" disabled={isSubmitting}>
						{#if isSubmitting}<span class="spinner"></span>{/if}
						{isSubmitting ? 'Saving...' : 'Save Changes'}
					</button>
				</div>
			</div>
		</form>

		<!-- Right: two stacked cards -->
		<div class="right-col">
			<!-- Section & ownership -->
			<div class="card right-card-top">
				<div class="card-header">
					<div class="dot"></div>
					<div>
						<h2>Section &amp; Ownership</h2>
						<p>Where this item lives and who it belongs to</p>
					</div>
				</div>

				<div class="card-body">
					<div class="field">
						<label for="section-trigger">Section</label>
						<div class="custom-select" bind:this={dropdownRef}>
							<button
								id="section-trigger"
								type="button"
								class="select-trigger"
								onclick={() => { if (!isSubmitting) isDropdownOpen = !isDropdownOpen }}
							>
								<span class:placeholder={!selectedSection}>
									{selectedSection ? selectedSection.name + (selectedSection.cabinet ? ' (' + selectedSection.cabinet.name + ')' : '') : 'Select section...'}
								</span>
								<svg class="chevron" class:open={isDropdownOpen} viewBox="0 0 20 20" fill="currentColor" width="16"><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"/></svg>
							</button>
							{#if isDropdownOpen}
								<div class="select-menu" onclick={stopPropagation}>
									<input type="text" placeholder="Search section..." bind:value={searchTerm} onclick={stopPropagation} />
									<div class="select-options">
										{#each filteredSections() as section}
											<div class="select-option" class:selected={selectedSection?.id === section.id} onclick={() => selectSection(section)}>
												<span>{section.name}</span>
												<span class="cabinet-name">{section.cabinet?.name}</span>
											</div>
										{:else}
											<div class="select-empty">No sections found</div>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					</div>

					<label class="checkbox-row">
						<input type="checkbox" bind:checked={formIsCustomer} />
						<span class="checkbox-box">
							<svg viewBox="0 0 16 16" fill="none" width="11"><path d="M13.5 4L6 11.5L2.5 8" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
						</span>
						<span class="checkbox-text">Barang Customer (titipan)</span>
					</label>

					{#if formIsCustomer && item?.originSectionName}
						<div class="info-banner">
							<svg viewBox="0 0 20 20" fill="currentColor" width="16"><path fill-rule="evenodd" d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9zm1-4a1 1 0 100 2 1 1 0 000-2z"/></svg>
							Asal: {item.originSectionName}
						</div>
					{/if}
					{#if isInPaten}
						<div class="info-banner warning">
							<svg viewBox="0 0 20 20" fill="currentColor" width="16"><path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 8a1 1 0 100-2 1 1 0 000 2z"/></svg>
							Barang sedang di {item?.section?.cabinet?.name || item?.section?.name} (Lokasi Paten)
						</div>
					{/if}
				</div>
			</div>

			<!-- Serial numbers: fills remaining height, internal scroll -->
			<div class="card right-card-bottom">
				<div class="card-header">
					<div class="dot"></div>
					<div>
						<h2>Serial Numbers</h2>
						<p>{serials.length} serial{serials.length === 1 ? '' : 's'} registered</p>
					</div>
					{#if displaySerial}
						<span class="display-badge">★ {displaySerial.serialNumber}</span>
					{/if}
				</div>

				<div class="card-body serial-card-body">
					{#if serials.length > 0}
						<div class="serial-list">
							{#each serials as serial}
								<div class="serial-item" class:is-display={serial.isDisplay}>
									{#if serial.images?.length > 0}
										<img src={serial.images.find((i: any) => i.isMain)?.url || serial.images[0].url} alt="" class="s-img" />
									{:else}
										<div class="s-img s-img-placeholder">
											<svg viewBox="0 0 20 20" fill="currentColor" width="16"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-3 3 5z"/></svg>
										</div>
									{/if}
									<div class="s-info">
										<span class="s-sn">{serial.serialNumber || '<placeholder>'}</span>
										{#if serial.grade}<span class="s-grade">{serial.grade}</span>{/if}
										{#if serial.price > 0}<span class="s-price">Rp {serial.price.toLocaleString('id-ID')}</span>{/if}
										{#if serial.isDisplay}<span class="badge dp">★ Display</span>{/if}
									</div>
									<a href="/admin/item/pecah-serial/{serial.id}" class="pecah-link" data-sveltekit-reload>
										<svg viewBox="0 0 20 20" fill="currentColor" width="14"><path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/><path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/></svg>
										Pecah
									</a>
								</div>
							{/each}
						</div>
					{:else}
						<div class="empty-serials">
							<svg viewBox="0 0 20 20" fill="currentColor" width="24"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-3 3 5z"/></svg>
							<p>Belum ada serial number</p>
						</div>
					{/if}
				</div>
				<a href={`/admin/serials/${item?.id}`} class="serial-link" data-sveltekit-reload>
					Manage All Serials
					<svg viewBox="0 0 20 20" fill="currentColor" width="14"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"/></svg>
				</a>
			</div>
		</div>
	</div>
</div>

<style>
	* { box-sizing: border-box; }

	:global(body) {
		font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
		background: #0b0b0c;
	}

	.page {
		background: #0b0b0c;
		height: 100vh;
		padding: 1.5rem 1.75rem;
		display: flex;
		flex-direction: column;
		justify-content: center;
		overflow: hidden;
	}

	/* Header */
	.header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.25rem; flex-shrink: 0; max-width: 1080px; width: 100%; margin-left: auto; margin-right: auto; }
	.header-text { flex: 1; }
	.header-text h1 { margin: 0; font-size: 1.35rem; font-weight: 700; color: #ffffff; letter-spacing: -0.01em; }
	.header-text p { margin: 0.15rem 0 0; font-size: 0.85rem; color: #a1a1a5; }
	.back-btn {
		background: #161618; border: 1px solid rgba(255,255,255,0.12); color: #10b981; cursor: pointer;
		font-size: 0.85rem; font-weight: 600; padding: 0.5rem 0.75rem; border-radius: 8px;
		display: flex; align-items: center; gap: 0.3rem; transition: all 0.15s ease;
	}
	.back-btn:hover { background: #1f1f22; border-color: rgba(16,185,129,0.4); }
	.id-badge {
		background: rgba(16,185,129,0.12); color: #10b981; padding: 0.35rem 0.7rem; border-radius: 999px;
		font-size: 0.75rem; font-weight: 600; white-space: nowrap;
	}

	/* Alert */
	.alert {
		background: rgba(239,68,68,0.12); color: #f87171; padding: 0.7rem 0.9rem; border-radius: 10px;
		margin: 0 auto 1.25rem; font-size: 0.85rem; display: flex; align-items: center; gap: 0.5rem;
		border: 1px solid rgba(239,68,68,0.3); max-width: 460px; width: 100%;
	}

	/* Dashboard split */
	.dashboard {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.25rem;
		max-width: 1080px;
		width: 100%;
		margin: 0 auto;
		align-items: start;
	}
	.left-card { display: flex; flex-direction: column; margin-bottom: 0; }
	.left-card-body { display: flex; flex-direction: column; padding: 2.25rem 2.5rem; }
	.spacer { min-height: 1.75rem; }
	.right-col { display: flex; flex-direction: column; gap: 1.25rem; }
	.right-card-top { margin-bottom: 0; }
	.right-card-bottom {
		margin-bottom: 0; display: flex; flex-direction: column; max-height: 340px;
	}
	.serial-card-body { flex: 1; min-height: 0; overflow-y: auto; }
	.right-card-bottom .serial-link { margin: 0 1.5rem 1.5rem; flex-shrink: 0; }

	/* Card */
	.card {
		background: #161618; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px;
		margin-bottom: 1.25rem;
		box-shadow: 0 1px 2px rgba(0,0,0,0.2), 0 8px 24px -12px rgba(16,185,129,0.08);
	}
	.card-header { border-radius: 16px 16px 0 0; }
	.right-card-bottom { border-radius: 16px; }
	.right-card-bottom .serial-card-body { border-radius: 0; }
	.card-header {
		display: flex; align-items: flex-start; gap: 0.7rem; padding: 1.5rem 2rem;
		border-bottom: 1px solid rgba(255,255,255,0.08);
	}
	.card-header .dot {
		width: 8px; height: 8px; border-radius: 50%; background: #10b981;
		margin-top: 0.5rem; flex-shrink: 0;
	}
	.card-header h2 { margin: 0; font-size: 1.05rem; font-weight: 700; color: #ffffff; }
	.card-header p { margin: 0.2rem 0 0; font-size: 0.85rem; color: #a1a1a5; }
	.card-header > div:not(.dot) { flex: 1; }
	.card-body { padding: 1.5rem; border-radius: 0 0 16px 16px; }

	/* Form */
	.form-stack { display: flex; flex-direction: column; gap: 1.4rem; max-width: 460px; width: 100%; margin: 0 auto; }
	.field.two-up { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
	.field label {
		display: block; font-size: 0.85rem; font-weight: 600; color: #a1a1a5;
		margin-bottom: 0.5rem;
	}
	.field input {
		width: 100%; padding: 0.85rem 1rem; border: 1.5px solid rgba(255,255,255,0.12); border-radius: 10px;
		font-size: 1rem; color: #ffffff; transition: border-color 0.15s ease, box-shadow 0.15s ease;
		background: #141416;
	}
	.field input:focus {
		outline: none; border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.15);
	}
	.field input:disabled { background: #1f1f22; color: #71717a; }
	.field input::placeholder { color: #52525b; }
	.field select {
		width: 100%; padding: 0.85rem 1rem; border: 1.5px solid rgba(255,255,255,0.12); border-radius: 10px;
		font-size: 1rem; color: #ffffff; transition: border-color 0.15s ease, box-shadow 0.15s ease;
		background: #141416; cursor: pointer;
	}
	.field select:focus {
		outline: none; border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.15);
	}
	.field select option { background: #141416; color: #ffffff; }
	.field small { display: block; font-size: 0.72rem; color: #71717a; margin-top: 0.3rem; }

	/* Custom select */
	.custom-select { position: relative; }
	.select-trigger {
		width: 100%; padding: 0.6rem 0.75rem; border: 1.5px solid rgba(255,255,255,0.12); border-radius: 9px;
		background: #141416; font-size: 0.875rem; cursor: pointer; text-align: left; color: #ffffff;
		display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;
		transition: border-color 0.15s ease;
	}
	.select-trigger:hover { border-color: rgba(16,185,129,0.4); }
	.select-trigger .placeholder { color: #52525b; }
	.chevron { color: #71717a; flex-shrink: 0; transition: transform 0.15s ease; }
	.chevron.open { transform: rotate(180deg); color: #10b981; }
	.select-menu {
		position: absolute; top: calc(100% + 6px); left: 0; right: 0; background: #1f1f22;
		border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; z-index: 50;
		box-shadow: 0 12px 32px -8px rgba(0,0,0,0.5); overflow: hidden;
	}
	.select-menu input {
		width: 100%; padding: 0.65rem 0.9rem; border: none; border-bottom: 1px solid rgba(255,255,255,0.08);
		font-size: 0.85rem; outline: none; background: #141416; color: #ffffff;
	}
	.select-options { max-height: 200px; overflow-y: auto; padding: 0.35rem; }
	.select-option {
		padding: 0.55rem 0.65rem; cursor: pointer; display: flex; justify-content: space-between;
		align-items: center; font-size: 0.85rem; border-radius: 8px; color: #e3e4e6;
	}
	.select-option:hover { background: rgba(255,255,255,0.06); }
	.select-option.selected { background: rgba(16,185,129,0.12); color: #10b981; font-weight: 600; }
	.select-empty { padding: 1rem; text-align: center; font-size: 0.82rem; color: #71717a; }
	.cabinet-name { font-size: 0.72rem; color: #71717a; }

	/* Checkbox */
	.checkbox-row {
		display: flex; align-items: center; gap: 0.6rem; cursor: pointer; font-size: 0.875rem;
		margin-top: 1.25rem; user-select: none;
	}
	.checkbox-row input { position: absolute; opacity: 0; width: 0; height: 0; }
	.checkbox-box {
		width: 19px; height: 19px; border: 1.5px solid rgba(255,255,255,0.2); border-radius: 5px;
		display: flex; align-items: center; justify-content: center; flex-shrink: 0;
		transition: all 0.15s ease; background: #141416;
	}
	.checkbox-row input:checked + .checkbox-box { background: #10b981; border-color: #10b981; }
	.checkbox-text { color: #e3e4e6; font-weight: 500; }

	.info-banner {
		background: rgba(16,185,129,0.1); color: #10b981; padding: 0.6rem 0.8rem; border-radius: 9px;
		font-size: 0.82rem; margin-top: 0.6rem; display: flex; align-items: center; gap: 0.45rem;
		border: 1px solid rgba(16,185,129,0.2);
	}
	.info-banner.warning { background: rgba(245,158,11,0.1); color: #fbbf24; border-color: rgba(245,158,11,0.25); }

	/* Actions */
	.form-actions { display: flex; justify-content: flex-end; gap: 0.7rem; max-width: 460px; width: 100%; margin: 0 auto; }
	.btn-primary {
		background: #10b981; color: white; padding: 0.8rem 1.6rem; border: none; border-radius: 10px;
		font-size: 0.9rem; font-weight: 600; cursor: pointer; display: flex; align-items: center;
		gap: 0.5rem; transition: background 0.15s ease; box-shadow: 0 4px 12px -2px rgba(16,185,129,0.35);
	}
	.btn-primary:hover:not(:disabled) { background: #059669; }
	.btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
	.btn-secondary {
		background: #141416; color: #a1a1a5; padding: 0.8rem 1.4rem; border: 1.5px solid rgba(255,255,255,0.12);
		border-radius: 10px; font-size: 0.9rem; font-weight: 600; cursor: pointer;
		transition: all 0.15s ease;
	}
	.btn-secondary:hover:not(:disabled) { background: #1f1f22; color: #ffffff; }
	.spinner {
		width: 13px; height: 13px; border: 2px solid rgba(255,255,255,0.4);
		border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite;
	}
	@keyframes spin { to { transform: rotate(360deg); } }

	/* Serials */
	.display-badge {
		background: rgba(16,185,129,0.12); color: #10b981; padding: 0.3rem 0.65rem; border-radius: 999px;
		font-size: 0.72rem; font-weight: 700; white-space: nowrap; align-self: flex-start;
		border: 1px solid rgba(16,185,129,0.25);
	}
	.serial-list { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem; }
	.serial-item {
		display: flex; align-items: center; gap: 0.65rem; padding: 0.6rem 0.7rem;
		background: #141416; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px;
		transition: border-color 0.15s ease;
	}
	.serial-item.is-display { border-color: rgba(16,185,129,0.4); background: rgba(16,185,129,0.06); }
	.s-img { width: 36px; height: 36px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
	.s-img-placeholder { background: rgba(16,185,129,0.1); color: #10b981; display: flex; align-items: center; justify-content: center; }
	.s-info { display: flex; flex: 1; align-items: center; gap: 0.45rem; flex-wrap: wrap; }
	.s-sn { font-family: 'SF Mono', 'Roboto Mono', monospace; font-weight: 600; font-size: 0.8rem; color: #ffffff; }
	.s-grade { background: rgba(255,255,255,0.08); padding: 0.12rem 0.4rem; border-radius: 5px; font-size: 0.68rem; font-weight: 600; color: #a1a1a5; }
	.s-price { font-size: 0.78rem; color: #34d399; font-weight: 600; }
	.badge.dp { background: rgba(16,185,129,0.12); color: #10b981; font-size: 0.65rem; padding: 0.12rem 0.4rem; border-radius: 999px; font-weight: 700; }

	.empty-serials {
		text-align: center; color: #71717a; font-size: 0.85rem; padding: 1.5rem 0.5rem;
		display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
	}
	.empty-serials p { margin: 0; }

	.serial-link {
		display: flex; align-items: center; justify-content: center; gap: 0.4rem;
		padding: 0.6rem; background: #10b981; color: white; border-radius: 9px;
		font-weight: 600; font-size: 0.85rem; text-decoration: none; transition: background 0.15s ease;
	}
	.serial-link:hover { background: #059669; }
	.pecah-link {
		display: inline-flex; align-items: center; gap: 0.25rem;
		padding: 0.25rem 0.5rem; background: rgba(245,158,11,0.1); color: #fbbf24;
		border-radius: 6px; font-size: 0.7rem; font-weight: 600;
		text-decoration: none; margin-left: auto; flex-shrink: 0;
		transition: background 0.15s ease;
	}
	.pecah-link:hover { background: rgba(245,158,11,0.2); }

	/* Responsive */
	@media (max-width: 1280px) {
		.page { padding: 1.25rem 1.25rem; }
		.dashboard { gap: 1rem; }
		.left-card-body { padding: 1.75rem; }
		.form-stack { max-width: none; }
		.form-actions { max-width: none; }
		.alert { max-width: none; }
	}
	@media (max-width: 900px) {
		.page { height: auto; min-height: 100vh; overflow: visible; }
		.dashboard { grid-template-columns: 1fr; }
		.left-card { height: auto; }
		.left-card-body { overflow-y: visible; }
		.field.two-up { grid-template-columns: 1fr; }
		.header { flex-wrap: wrap; }
		.id-badge { order: 3; width: 100%; }
	}
</style>
