<script lang="ts">
	import { goto } from '$app/navigation'
	import { onMount } from 'svelte'

	let { data } = $props()
	let form = data?.form
	let sections = data?.sections || []

	let isSubmitting = $state(false)
	let showSuccess = $state(false)
	let errorMessage = $state<string | null>(null)

	// State untuk form values
	let nameValue = $state(form?.data?.name || '')
	let locationValue = $state(form?.data?.location || '')
	let categoryValue = $state(form?.data?.category || '')
	let subCategoryValue = $state(form?.data?.subCategory || '')
	let isCustomer = $state(form?.data?.isCustomer || false)

	// State untuk custom dropdown section
	let isDropdownOpen = $state(false)
	let searchTerm = $state('')
	let selectedSection = $state<any>(null)
	let dropdownRef = $state<HTMLDivElement>()

	// Filter sections berdasarkan search
	let filteredSections = $derived(() => {
		if (!searchTerm) return sections
		return sections.filter(
			(section) =>
				section.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				section.cabinet?.name.toLowerCase().includes(searchTerm.toLowerCase())
		)
	})

	// Set selected section dari form data jika ada
	onMount(() => {
		if (form?.data?.sectionId) {
			const section = sections.find((s) => s.id === form.data.sectionId)
			if (section) {
				selectedSection = section
			}
		}
	})

	function handleClickOutside(event: MouseEvent) {
		if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
			isDropdownOpen = false
		}
	}

	onMount(() => {
		document.addEventListener('click', handleClickOutside)
		return () => document.removeEventListener('click', handleClickOutside)
	})

	function selectSection(section: any) {
		selectedSection = section
		searchTerm = ''
		isDropdownOpen = false
		if (errorMessage?.includes('section')) {
			errorMessage = null
		}
	}

	function stopPropagation(e: Event) {
		e.stopPropagation()
	}

	async function goBack() {
		await goto('/admin/item')
	}

	async function handleSubmit(e: Event) {
		e.preventDefault()

		if (!selectedSection) {
			errorMessage = 'Please select a section!'
			return
		}

		isSubmitting = true
		errorMessage = null

		const formData = new FormData()
		formData.append('name', nameValue)
		formData.append('location', locationValue)
		formData.append('category', categoryValue)
		formData.append('subCategory', subCategoryValue)
		formData.append('isCustomer', String(isCustomer))

		formData.append('sectionId', selectedSection.id.toString())

		try {
			const response = await fetch('/admin/item/create', {
				method: 'POST',
				body: formData,
				redirect: 'manual'
			})

			if (response.type === 'opaqueredirect' || response.status === 303 || response.status === 0) {
				showSuccess = true
				setTimeout(() => {
					goto('/admin/item?success=true')
				}, 1500)
				return
			}

			if (response.ok) {
				showSuccess = true
				setTimeout(() => {
					goto('/admin/item?success=true')
				}, 1500)
				return
			}

			const text = await response.text()
			let result
			try {
				result = JSON.parse(text)
			} catch {
				result = {}
			}

			errorMessage = result.data?.message || result.message || 'Failed to create item'
			isSubmitting = false
		} catch (error) {
			errorMessage = 'Network error! Please try again.'
			isSubmitting = false
		}
	}
</script>

<svelte:head>
	<title>Admin - Create Item</title>
</svelte:head>

<div class="page">
	<!-- Header -->
	<div class="header">
		<button class="back-button" onclick={goBack} disabled={isSubmitting || showSuccess}>
			<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
				<line x1="19" y1="12" x2="5" y2="12"></line>
				<polyline points="12 19 5 12 12 5"></polyline>
			</svg>
			<span>Back to Items</span>
		</button>
		<h1 class="page-title">Create New Item</h1>
		<p class="page-subtitle">Add a new stock item to your inventory</p>
	</div>

	<div class="main-layout">
		<!-- Form Card -->
		<div class="form-card">
			<form onsubmit={handleSubmit}>
				<!-- Success Message -->
				{#if showSuccess}
					<div class="success-message">
						<svg class="icon success-color" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
							<polyline points="22 4 12 14.01 9 11.01"></polyline>
						</svg>
						<span>Item created successfully! Redirecting...</span>
					</div>
				{/if}

				<!-- Error Message -->
				{#if errorMessage}
					<div class="error-message">
						<svg class="icon error-color" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
							<line x1="12" y1="9" x2="12" y2="13"></line>
							<line x1="12" y1="17" x2="12.01" y2="17"></line>
						</svg>
						<span>{errorMessage}</span>
					</div>
				{/if}

				<div class="form-grid">
					<!-- Item Name -->
					<div class="form-group full-width">
						<label class="form-label">
							Item Name <span class="required">*</span>
						</label>
						<div class="input-wrapper">
							<span class="input-icon">
								<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
								</svg>
							</span>
							<input
								type="text"
								class="form-input"
								placeholder="e.g., Laptop ASUS ROG, Mouse Logitech"
								bind:value={nameValue}
								required
								disabled={isSubmitting || showSuccess}
							/>
						</div>
						{#if form?.errors?.name}
							<span class="error-text">{form.errors.name[0]}</span>
						{/if}
					</div>

					<div class="form-group full-width">
						<label class="form-label">Location <span class="required">*</span></label>
						<div class="input-wrapper">
							<span class="input-icon">
								<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
									<circle cx="12" cy="10" r="3"></circle>
								</svg>
							</span>
							<input
								type="text"
								class="form-input"
								bind:value={locationValue}
								required
								disabled={isSubmitting || showSuccess}
								placeholder="e.g., Cabinet A - Shelf 1"
							/>
						</div>
						{#if form?.errors?.location}
							<span class="error-text">{form.errors.location[0]}</span>
						{/if}
					</div>

					<!-- Category & Sub Category Row -->
					<div class="form-group">
						<label class="form-label">Category <span class="required">*</span></label>
						<div class="input-wrapper">
							<span class="input-icon">
								<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
									<line x1="7" y1="7" x2="7.01" y2="7"></line>
								</svg>
							</span>
							<select
								class="form-input form-select"
								bind:value={categoryValue}
								required
								disabled={isSubmitting || showSuccess}
							>
								<option value="">Select category...</option>
								<option value="ReadySale">Ready Sale</option>
								<option value="NoReadySale">No Ready Sale</option>
								<option value="Accessories">Accessories</option>
								<option value="Sparepart">Sparepart</option>
							</select>
						</div>
						{#if form?.errors?.category}
							<span class="error-text">{form.errors.category[0]}</span>
						{/if}
					</div>

					<div class="form-group">
						<label class="form-label">Sub Category <span class="required">*</span></label>
						<div class="input-wrapper">
							<span class="input-icon">
								<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
									<line x1="7" y1="7" x2="7.01" y2="7"></line>
								</svg>
							</span>
							<input
								type="text"
								class="form-input"
								bind:value={subCategoryValue}
								required
								disabled={isSubmitting || showSuccess}
								placeholder="e.g., Laptop, Mouse"
							/>
						</div>
						{#if form?.errors?.subCategory}
							<span class="error-text">{form.errors.subCategory[0]}</span>
						{/if}
					</div>

					<!-- Section Dropdown -->
					<div class="form-group full-width">
						<label class="form-label">
							Section <span class="required">*</span>
						</label>
						<div class="custom-dropdown" bind:this={dropdownRef}>
							<div
								class="dropdown-trigger"
								class:error={form?.errors?.sectionId && !selectedSection}
								role="button"
								tabindex="0"
								onclick={(e) => {
									e.preventDefault()
									e.stopPropagation()
									if (!isSubmitting && !showSuccess) {
										isDropdownOpen = !isDropdownOpen
									}
								}}
							>
								<span class="trigger-icon">
									<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
									</svg>
								</span>
								{#if selectedSection}
									<span class="trigger-text">
										{selectedSection.name} <span class="trigger-cabinet">({selectedSection.cabinet?.name})</span>
									</span>
								{:else}
									<span class="trigger-text placeholder">Select a section</span>
								{/if}
								<span class="trigger-arrow">
									<svg class="icon-xs" class:rotated={isDropdownOpen} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
										<polyline points="6 9 12 15 18 9"></polyline>
									</svg>
								</span>
							</div>

							{#if isDropdownOpen}
								<div class="dropdown-menu" role="none" onclick={stopPropagation}>
									<div class="dropdown-search">
										<span class="search-icon">
											<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
												<circle cx="11" cy="11" r="8"></circle>
												<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
											</svg>
										</span>
										<input
											type="text"
											class="search-input"
											placeholder="Search sections..."
											bind:value={searchTerm}
											onclick={stopPropagation}
											onkeydown={(e) => e.stopPropagation()}
										/>
										{#if searchTerm}
											<button class="clear-search" type="button" onclick={() => searchTerm = ''}>✕</button>
										{/if}
									</div>
									<div class="dropdown-options">
										{#if filteredSections().length === 0}
											<div class="dropdown-empty">No sections found</div>
										{:else}
											{#each filteredSections() as section}
												<div
													class="dropdown-option"
													class:selected={selectedSection?.id === section.id}
													role="button"
													tabindex="0"
													onclick={() => selectSection(section)}
												>
													<span class="option-name">{section.name}</span>
													<span class="option-cabinet">{section.cabinet?.name}</span>
													{#if selectedSection?.id === section.id}
														<span class="option-check">
															<svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
																<polyline points="20 6 9 17 4 12"></polyline>
															</svg>
														</span>
													{/if}
												</div>
											{/each}
										{/if}
									</div>
								</div>
							{/if}
						</div>
						{#if form?.errors?.sectionId && !selectedSection}
							<span class="error-text">{form.errors.sectionId[0]}</span>
						{/if}
						<span class="hint-text">Choose which section this item belongs to</span>
					</div>

					<!-- Barang Customer -->
					<div class="form-group full-width checkbox-group">
						<label class="checkbox-label">
							<input type="checkbox" name="isCustomer" value="true" bind:checked={isCustomer} class="checkbox-input" />
							<span class="checkbox-custom"></span>
							<div class="checkbox-text">
								<span class="checkbox-title">Barang Customer</span>
								<span class="checkbox-desc">Centang jika barang ini milik customer (titipan), bukan barang toko</span>
							</div>
						</label>
					</div>

				</div>

				<!-- Form Actions -->
				<div class="form-actions">
					<button type="button" class="btn-secondary" onclick={goBack} disabled={isSubmitting || showSuccess}>
						Cancel
					</button>
					<button type="submit" class="btn-primary" disabled={isSubmitting || showSuccess}>
						{#if isSubmitting}
							<span class="spinner"></span>
							<span>Creating...</span>
						{:else if showSuccess}
							<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
								<polyline points="20 6 9 17 4 12"></polyline>
							</svg>
							<span>Created!</span>
						{:else}
							<span class="btn-icon">
								<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
									<line x1="12" y1="5" x2="12" y2="19"></line>
									<line x1="5" y1="12" x2="19" y2="12"></line>
								</svg>
							</span>
							<span>Create Item</span>
						{/if}
					</button>
				</div>
			</form>
		</div>

		<!-- Preview Card -->
		<div class="preview-section">
			<h2 class="preview-title">Live Preview</h2>
			<div class="preview-card">
				<div class="preview-header">
					<span class="preview-badge">New Item</span>
				</div>
				<div class="preview-body">
					<div class="preview-info">
						<div class="preview-badges">
							<span class="preview-category">{categoryValue || 'Category'}</span>
							<span class="preview-sub">{subCategoryValue || 'Sub'}</span>
						</div>
						<div class="preview-name">{nameValue || 'Item Name'}</div>
						<div class="preview-details">
							<div class="preview-row">
								<span class="lbl">Location:</span>
								<span class="val">{locationValue || '—'}</span>
							</div>
							<div class="preview-row">
								<span class="lbl">Section:</span>
								<span class="val">{selectedSection?.name || '—'}</span>
							</div>
						</div>
					</div>
				</div>
				<div class="preview-footer">
					<div class="status-indicator">
						<span class="dot"></span>
						<span>Ready to add</span>
					</div>
				</div>
			</div>
			<p class="preview-note">Real-time preview updates as you fill out the form</p>
		</div>
	</div>
</div>

<style>
	/* UTILS */
	.icon { width: 1.25rem; height: 1.25rem; }
	.icon-sm { width: 1rem; height: 1rem; }
	.icon-xs { width: 0.85rem; height: 0.85rem; }
	.success-color { color: #10b981; }
	.error-color { color: #ef4444; }

	.page {
		padding: 2rem;
		max-width: 1100px;
		margin: 0 auto;
		background: transparent;
		min-height: 100vh;
		color: #e3e4e6;
	}

	/* Header */
	.header {
		margin-bottom: 2.5rem;
	}

	.back-button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 8px;
		color: #a1a1a5;
		font-family: 'Inter', sans-serif;
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.2s ease;
		margin-bottom: 1.5rem;
	}

	.back-button:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.2);
		color: #ffffff;
		transform: translateX(-4px);
	}

	.back-button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.page-title {
		font-family: 'Inter', sans-serif;
		font-size: 2rem;
		font-weight: 600;
		color: #ffffff;
		margin: 0 0 0.35rem 0;
	}

	.page-subtitle {
		color: #a1a1a5;
		font-size: 0.95rem;
	}

	/* Main Layout */
	.main-layout {
		display: grid;
		grid-template-columns: 1fr 340px;
		gap: 2rem;
		align-items: start;
	}

	/* Form Card */
	.form-card {
		background: rgba(20, 20, 22, 0.8);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 12px;
		padding: 2rem;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
		backdrop-filter: blur(10px);
	}

	/* Messages */
	.success-message,
	.error-message {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		border-radius: 8px;
		font-size: 0.95rem;
		margin-bottom: 1.5rem;
	}

	.success-message {
		background: rgba(16, 185, 129, 0.1);
		border: 1px solid #10b981;
		color: #ffffff;
	}

	.error-message {
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid #ef4444;
		color: #ffffff;
	}

	/* Form Grid */
	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.25rem;
	}

	.form-group {
		margin-bottom: 0;
	}

	.form-group.full-width {
		grid-column: span 2;
	}

	.form-label {
		display: block;
		font-family: 'Inter', sans-serif;
		font-size: 0.85rem;
		font-weight: 500;
		color: #ffffff;
		margin-bottom: 0.5rem;
	}

	.required {
		color: #ef4444;
		margin-left: 0.15rem;
	}

	.optional {
		color: #71717a;
		font-size: 0.75rem;
		font-weight: normal;
		margin-left: 0.25rem;
	}

	.input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	.input-icon {
		position: absolute;
		left: 1rem;
		color: #71717a;
		display: flex;
		align-items: center;
		z-index: 1;
	}

	.form-input {
		width: 100%;
		padding: 0.7rem 1rem 0.7rem 2.5rem;
		background: rgba(20, 20, 22, 0.9);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 8px;
		color: #ffffff;
		font-family: 'Inter', sans-serif;
		font-size: 0.9rem;
		transition: all 0.2s ease;
	}

	.form-input:focus {
		outline: none;
		border-color: #10b981;
		box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1);
	}

	.form-input.error {
		border-color: #ef4444;
	}

	.form-input:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.form-input::placeholder {
		color: #52525b;
	}

	.form-select {
		appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2310b981' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 12px center;
		padding-right: 2.4rem;
		cursor: pointer;
	}
	.form-select option { background: #141416; color: #ffffff; }

	/* Checkbox barang customer */
	.checkbox-group { margin-top: 0.25rem; }
	.checkbox-label {
		display: flex;
		align-items: flex-start;
		gap: 0.7rem;
		cursor: pointer;
		padding: 0.85rem 1rem;
		background: rgba(16,185,129,0.05);
		border: 1px solid rgba(16,185,129,0.15);
		border-radius: 10px;
		user-select: none;
		transition: border-color 0.15s ease;
	}
	.checkbox-label:hover { border-color: rgba(16,185,129,0.35); }
	.checkbox-input { position: absolute; opacity: 0; width: 0; height: 0; }
	.checkbox-custom {
		width: 19px; height: 19px; border: 1.5px solid rgba(255,255,255,0.2); border-radius: 5px;
		background: #141416; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
		transition: all 0.15s ease; margin-top: 0.1rem;
	}
	.checkbox-custom::after {
		content: ''; width: 10px; height: 10px; border-radius: 2px; background: #10b981;
		transform: scale(0); transition: transform 0.15s ease;
	}
	.checkbox-input:checked + .checkbox-custom { border-color: #10b981; }
	.checkbox-input:checked + .checkbox-custom::after { transform: scale(1); }
	.checkbox-text { display: flex; flex-direction: column; gap: 0.15rem; }
	.checkbox-title { font-size: 0.875rem; font-weight: 600; color: #ffffff; }
	.checkbox-desc { font-size: 0.75rem; color: #a1a1a5; }

	/* Custom Dropdown */
	.custom-dropdown {
		position: relative;
		width: 100%;
	}

	.dropdown-trigger {
		display: flex;
		align-items: center;
		padding: 0.7rem 1rem;
		background: rgba(20, 20, 22, 0.9);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 8px;
		color: #ffffff;
		font-family: 'Inter', sans-serif;
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.2s ease;
		gap: 0.75rem;
	}

	.dropdown-trigger:hover {
		border-color: #10b981;
	}

	.dropdown-trigger.error {
		border-color: #ef4444;
	}

	.trigger-icon {
		color: #71717a;
		display: flex;
		align-items: center;
	}

	.trigger-text {
		flex: 1;
	}

	.trigger-text.placeholder {
		color: #52525b;
	}

	.trigger-cabinet {
		font-size: 0.75rem;
		color: #71717a;
	}

	.trigger-arrow {
		color: #10b981;
		display: flex;
		align-items: center;
	}

	.dropdown-menu {
		position: absolute;
		top: calc(100% + 8px);
		left: 0;
		right: 0;
		background: #141416;
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 8px;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
		z-index: 100;
		overflow: hidden;
	}

	.dropdown-search {
		position: relative;
		padding: 0.75rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	}

	.dropdown-search .search-icon {
		position: absolute;
		left: 1.25rem;
		top: 50%;
		transform: translateY(-50%);
		color: #52525b;
	}

	.search-input {
		width: 100%;
		padding: 0.6rem 1rem 0.6rem 2.2rem;
		background: rgba(20, 20, 22, 0.8);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 6px;
		color: #ffffff;
		font-size: 0.85rem;
	}

	.search-input:focus {
		outline: none;
		border-color: #10b981;
	}

	.clear-search {
		position: absolute;
		right: 1rem;
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		color: #71717a;
		cursor: pointer;
	}

	.dropdown-options {
		max-height: 220px;
		overflow-y: auto;
		padding: 0.25rem;
	}

	.dropdown-option {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.6rem 0.75rem;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.dropdown-option:hover {
		background: rgba(255, 255, 255, 0.04);
	}

	.dropdown-option.selected {
		background: rgba(16, 185, 129, 0.08);
	}

	.option-name {
		flex: 1;
		color: #e3e4e6;
		font-size: 0.85rem;
	}

	.option-cabinet {
		font-size: 0.75rem;
		color: #71717a;
	}

	.option-check {
		color: #10b981;
		display: flex;
		align-items: center;
	}

	.dropdown-empty {
		padding: 2rem;
		text-align: center;
		color: #52525b;
		font-size: 0.85rem;
	}

	.error-text {
		display: block;
		color: #ef4444;
		font-size: 0.8rem;
		margin-top: 0.4rem;
	}

	.hint-text {
		display: block;
		color: #71717a;
		font-size: 0.75rem;
		margin-top: 0.4rem;
	}

	/* Form Actions */
	.form-actions {
		display: flex;
		gap: 1rem;
		margin-top: 2rem;
	}

	.btn-primary,
	.btn-secondary {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		font-family: 'Inter', sans-serif;
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		border: none;
		flex: 1;
	}

	.btn-primary {
		background: #10b981;
		color: #ffffff;
	}

	.btn-primary:hover:not(:disabled) {
		background: #059669;
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
	}

	.btn-secondary {
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.08);
		color: #a1a1a5;
	}

	.btn-secondary:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.08);
		color: #ffffff;
	}

	.btn-primary:disabled,
	.btn-secondary:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.2);
		border-top-color: #ffffff;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	/* Preview Section */
	.preview-section {
		position: sticky;
		top: 2rem;
	}

	.preview-title {
		font-family: 'Inter', sans-serif;
		font-size: 0.85rem;
		font-weight: 600;
		color: #71717a;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: 1rem;
	}

	.preview-card {
		background: rgba(20, 20, 22, 0.8);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
	}

	.preview-header {
		padding: 0.75rem 1rem;
		background: rgba(255, 255, 255, 0.01);
		border-bottom: 1px solid rgba(255, 255, 255, 0.04);
	}

	.preview-badge {
		background: rgba(16, 185, 129, 0.1);
		border: 1px solid rgba(16, 185, 129, 0.2);
		padding: 0.2rem 0.6rem;
		border-radius: 20px;
		font-size: 0.7rem;
		color: #10b981;
	}

	.preview-body {
		padding: 1rem;
		display: flex;
		gap: 1rem;
	}

	.preview-info {
		flex: 1;
	}

	.preview-badges {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.preview-category,
	.preview-sub {
		font-size: 0.65rem;
		padding: 0.15rem 0.5rem;
		border-radius: 4px;
		background: rgba(255, 255, 255, 0.05);
		color: #a1a1a5;
	}

	.preview-sub {
		background: rgba(16, 185, 129, 0.1);
		color: #10b981;
	}

	.preview-name {
		font-size: 0.95rem;
		font-weight: 600;
		color: #ffffff;
		margin-bottom: 0.75rem;
	}

	.preview-details {
		background: rgba(255, 255, 255, 0.02);
		border-radius: 6px;
		padding: 0.5rem;
	}

	.preview-row {
		display: flex;
		justify-content: space-between;
		font-size: 0.7rem;
		padding: 0.2rem 0;
	}

	.preview-row .lbl {
		color: #71717a;
	}

	.preview-row .val {
		color: #e3e4e6;
	}

	.preview-row .val.price {
		color: #10b981;
		font-weight: 500;
	}

	.preview-footer {
		padding: 0.75rem 1rem;
		background: rgba(255, 255, 255, 0.01);
		border-top: 1px solid rgba(255, 255, 255, 0.04);
	}

	.status-indicator {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.7rem;
		color: #71717a;
	}

	.status-indicator .dot {
		width: 6px;
		height: 6px;
		background: #10b981;
		border-radius: 50%;
		box-shadow: 0 0 6px #10b981;
	}

	.preview-note {
		color: #52525b;
		font-size: 0.7rem;
		margin-top: 0.75rem;
		text-align: center;
	}

	/* Responsive */
	@media (max-width: 900px) {
		.main-layout {
			grid-template-columns: 1fr;
		}
		.preview-section {
			position: static;
		}
	}

	@media (max-width: 700px) {
		.page {
			padding: 1rem;
		}
		.form-card {
			padding: 1.25rem;
		}
		.form-grid {
			grid-template-columns: 1fr;
		}
		.form-group.full-width {
			grid-column: span 1;
		}
		.form-actions {
			flex-direction: column;
		}
		.preview-body {
			flex-direction: column;
			align-items: center;
			text-align: center;
		}
		.preview-badges {
			justify-content: center;
		}
	}
</style>