<script lang="ts">
	import { goto } from '$app/navigation'
	import type { PageProps } from './$types'
	import { onMount } from 'svelte'

	let { data }: PageProps = $props()

	let isSubmitting = $state(false)
	let showSuccess = $state(false)
	let errorMessage = $state<string | null>(null)

	let form = data?.form
	let cabinets = data?.cabinets || []

	// State untuk form values
	let nameValue = $state(form?.data?.name || '')
	let typeValue = $state(form?.data?.type || '')

	// State untuk custom dropdown
	let isDropdownOpen = $state(false)
	let searchTerm = $state('')
	let selectedCabinet = $state<{ id: number; name: string; maxSlots: number } | null>(null)
	let dropdownRef = $state<HTMLDivElement>()

	// Filter cabinets berdasarkan search
	let filteredCabinets = $derived(() => {
		if (!searchTerm) return cabinets
		return cabinets.filter(
			(cabinet) =>
				cabinet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				cabinet.id.toString().includes(searchTerm)
		)
	})

	// Set selected cabinet dari form data jika ada
	onMount(() => {
		if (form?.data?.cabinetId) {
			const cabinet = cabinets.find((c) => c.id === form.data.cabinetId)
			if (cabinet) {
				selectedCabinet = cabinet
			}
		}
	})

	// Close dropdown when clicking outside
	function handleClickOutside(event: MouseEvent) {
		if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
			isDropdownOpen = false
		}
	}

	onMount(() => {
		document.addEventListener('click', handleClickOutside)
		return () => document.removeEventListener('click', handleClickOutside)
	})

	function selectCabinet(cabinet: { id: number; name: string; maxSlots: number }) {
		selectedCabinet = cabinet
		searchTerm = ''
		isDropdownOpen = false
	}

	function stopPropagation(e: Event) {
		e.stopPropagation()
	}

	async function goBack() {
		await goto('/admin/section')
	}

	async function handleSubmit(e: Event) {
		e.preventDefault()

		if (!selectedCabinet) {
			errorMessage = 'Please select a cabinet!'
			return
		}

		isSubmitting = true
		errorMessage = null

		try {
			const formData = new FormData()
			formData.append('name', nameValue)
			formData.append('type', typeValue)
			formData.append('cabinetId', selectedCabinet.id.toString())

			const response = await fetch('/admin/section/create', {
				method: 'POST',
				body: formData
			})

			const result = await response.json()

			if (response.ok) {
				showSuccess = true
				setTimeout(() => {
					goto('/admin/section')
				}, 1500)
			} else {
				errorMessage = result.message || 'Something went wrong!'
				isSubmitting = false
			}
		} catch (error) {
			console.error('Submit error:', error)
			errorMessage = 'Network error! Please try again.'
			isSubmitting = false
		}
	}

	// Helper warna untuk real-time preview badge
	function getTypeColor(type: string) {
		switch (type.toLowerCase()) {
			case 'display': return '#10b981'
			case 'storage': return '#f59e0b'
			default: return '#3b82f6'
		}
	}

	function getTypeBg(type: string) {
		switch (type.toLowerCase()) {
			case 'display': return 'rgba(16, 185, 129, 0.1)'
			case 'storage': return 'rgba(245, 158, 11, 0.1)'
			default: return 'rgba(59, 130, 246, 0.1)'
		}
	}
</script>

<svelte:head>
	<title>Admin - Create Section</title>
</svelte:head>

<div class="page">
	<!-- Header -->
	<div class="header">
		<button class="back-button" onclick={goBack} disabled={isSubmitting}>
			<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
				<line x1="19" y1="12" x2="5" y2="12"></line>
				<polyline points="12 19 5 12 12 5"></polyline>
			</svg>
			<span>Back to Sections</span>
		</button>
		<h1 class="page-title">Create New Section</h1>
		<p class="page-subtitle">Add a new section to a cabinet</p>
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
						<span>Section created successfully! Redirecting...</span>
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

				<!-- Name Field -->
				<div class="form-group">
					<label for="name" class="form-label">
						Section Name <span class="required">*</span>
					</label>
					<div class="input-wrapper">
						<span class="input-icon">
							<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
							</svg>
						</span>
						<input
							type="text"
							id="name"
							name="name"
							class="form-input"
							class:error={form?.errors?.name}
							placeholder="e.g., Electronics, Furniture, Tools"
							bind:value={nameValue}
							required
							disabled={isSubmitting || showSuccess}
						/>
					</div>
					{#if form?.errors?.name}
						<span class="error-text">{form.errors.name[0]}</span>
					{/if}
					<span class="hint-text">Give your section a descriptive name</span>
				</div>

				<!-- Type Field -->
				<div class="form-group">
					<label for="type" class="form-label">
						Section Type <span class="required">*</span>
					</label>
					<div class="input-wrapper">
						<span class="input-icon">
							<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
								<line x1="7" y1="7" x2="7.01" y2="7"></line>
							</svg>
						</span>
						<input
							type="text"
							id="type"
							name="type"
							class="form-input"
							class:error={form?.errors?.type}
							placeholder="e.g., display, storage, archive"
							bind:value={typeValue}
							required
							disabled={isSubmitting || showSuccess}
						/>
					</div>
					{#if form?.errors?.type}
						<span class="error-text">{form.errors.type[0]}</span>
					{/if}
					<span class="hint-text">Enter the type of section (display, storage, archive, etc.)</span>
				</div>

				<!-- Cabinet Field - Custom Searchable Dropdown -->
				<div class="form-group">
					<label class="form-label">
						Cabinet <span class="required">*</span>
					</label>

					<!-- Custom Dropdown -->
					<div class="custom-dropdown" bind:this={dropdownRef}>
						<!-- Dropdown Trigger -->
						<div
							class="dropdown-trigger"
							class:error={form?.errors?.cabinetId && !selectedCabinet}
							role="button"
							tabindex="0"
							onclick={(e) => {
								e.preventDefault()
								e.stopPropagation()
								if (!isSubmitting && !showSuccess) {
									isDropdownOpen = !isDropdownOpen
								}
							}}
							onkeydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									isDropdownOpen = !isDropdownOpen
								}
							}}
						>
							<span class="trigger-icon">
								<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<polyline points="21 8 21 21 3 21 3 8"></polyline>
									<rect x="1" y="3" width="22" height="5"></rect>
									<line x1="10" y1="12" x2="14" y2="12"></line>
								</svg>
							</span>
							{#if selectedCabinet}
								<span class="trigger-text">
									#{selectedCabinet.id} - {selectedCabinet.name} ({selectedCabinet.maxSlots} slots)
								</span>
							{:else}
								<span class="trigger-text placeholder">Select a cabinet</span>
							{/if}
							<span class="trigger-arrow">
								<svg class="icon-xs" class:rotated={isDropdownOpen} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
									<polyline points="6 9 12 15 18 9"></polyline>
								</svg>
							</span>
						</div>

						<!-- Dropdown Menu -->
						{#if isDropdownOpen}
							<div class="dropdown-menu" role="none" onclick={stopPropagation}>
								<!-- Search Input -->
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
										placeholder="Search cabinets..."
										bind:value={searchTerm}
										onclick={stopPropagation}
										onkeydown={(e) => e.stopPropagation()}
									/>
									{#if searchTerm}
										<button
											class="clear-search"
											type="button"
											onclick={(e) => {
												e.stopPropagation()
												searchTerm = ''
											}}
										>
											✕
										</button>
									{/if}
								</div>

								<!-- Options List -->
								<div class="dropdown-options">
									{#if filteredCabinets().length === 0}
										<div class="dropdown-empty">No cabinets found</div>
									{:else}
										{#each filteredCabinets() as cabinet}
											<div
												class="dropdown-option"
												class:selected={selectedCabinet?.id === cabinet.id}
												role="button"
												tabindex="0"
												onclick={() => selectCabinet(cabinet)}
												onkeydown={(e) => {
													if (e.key === 'Enter') selectCabinet(cabinet)
												}}
											>
												<span class="option-id">#{cabinet.id}</span>
												<span class="option-name">{cabinet.name}</span>
												<span class="option-slots">{cabinet.maxSlots} slots</span>
												{#if selectedCabinet?.id === cabinet.id}
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

					{#if form?.errors?.cabinetId && !selectedCabinet}
						<span class="error-text">{form.errors.cabinetId[0]}</span>
					{/if}
					<span class="hint-text">Search and select a cabinet for this section</span>
				</div>

				<!-- Form Actions -->
				<div class="form-actions">
					<button
						type="button"
						class="btn-secondary"
						onclick={goBack}
						disabled={isSubmitting || showSuccess}
					>
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
							<span>Create Section</span>
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
					<span class="preview-badge">New Section</span>
				</div>
				<div class="preview-body">
					<div 
						class="preview-type-badge"
						style="background: {getTypeBg(typeValue || 'default')}; color: {getTypeColor(typeValue || 'default')}"
					>
						{typeValue || 'type'}
					</div>
					<div class="preview-name">
						{nameValue || 'Section Name'}
					</div>
					<div class="preview-details">
						<div class="preview-row">
							<span class="lbl">Cabinet:</span>
							<span class="val">
								{#if selectedCabinet}
									#{selectedCabinet.id}: {selectedCabinet.name}
								{:else}
									<span class="not-selected">Not selected</span>
								{/if}
							</span>
						</div>
					</div>
				</div>
				<div class="preview-footer">
					<div class="status-indicator">
						<span class="dot"></span>
						<span>Status: Ready</span>
					</div>
				</div>
			</div>
			<p class="preview-note">Real-time preview of how the card looks in admin list.</p>
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

	/* Main Layout Split System */
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

	/* Form Structure */
	.form-group {
		margin-bottom: 1.75rem;
	}

	.form-label {
		display: block;
		font-family: 'Inter', sans-serif;
		font-size: 0.9rem;
		font-weight: 500;
		color: #ffffff;
		margin-bottom: 0.5rem;
	}

	.required {
		color: #ef4444;
		margin-left: 0.15rem;
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
		padding: 0.75rem 1rem 0.75rem 2.5rem;
		background: rgba(20, 20, 22, 0.9);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 8px;
		color: #ffffff;
		font-family: 'Inter', sans-serif;
		font-size: 0.95rem;
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
		background: rgba(255, 255, 255, 0.01);
	}

	.form-input::placeholder {
		color: #52525b;
	}

	/* Custom Dropdown Styling (Dark Theme) */
	.custom-dropdown {
		position: relative;
		width: 100%;
	}

	.dropdown-trigger {
		display: flex;
		align-items: center;
		padding: 0.75rem 1rem;
		background: rgba(20, 20, 22, 0.9);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 8px;
		color: #ffffff;
		font-family: 'Inter', sans-serif;
		font-size: 0.95rem;
		cursor: pointer;
		transition: all 0.2s ease;
		gap: 0.75rem;
		user-select: none;
		outline: none;
	}

	.dropdown-trigger:hover, .dropdown-trigger:focus-visible {
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
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.trigger-text.placeholder {
		color: #52525b;
	}

	.trigger-arrow {
		color: #10b981;
		display: flex;
		align-items: center;
		transition: transform 0.2s ease;
	}

	.trigger-arrow :global(svg.rotated) {
		transform: rotate(180deg);
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
		display: flex;
		align-items: center;
	}

	.dropdown-search .search-icon {
		position: absolute;
		left: 1.25rem;
		color: #52525b;
		display: flex;
		align-items: center;
	}

	.search-input {
		width: 100%;
		padding: 0.6rem 1rem 0.6rem 2.2rem;
		background: rgba(20, 20, 22, 0.8);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 6px;
		color: #ffffff;
		font-family: 'Inter', sans-serif;
		font-size: 0.85rem;
	}

	.search-input:focus {
		outline: none;
		border-color: #10b981;
	}

	.clear-search {
		position: absolute;
		right: 1.25rem;
		background: none;
		border: none;
		color: #71717a;
		cursor: pointer;
		font-size: 0.85rem;
		padding: 0.25rem;
	}

	.clear-search:hover {
		color: #ffffff;
	}

	.dropdown-options {
		max-height: 220px;
		overflow-y: auto;
		padding: 0.25rem;
	}

	.dropdown-options::-webkit-scrollbar {
		width: 6px;
	}

	.dropdown-options::-webkit-scrollbar-track {
		background: transparent;
	}

	.dropdown-options::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.1);
		border-radius: 3px;
	}

	.dropdown-option {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.6rem 0.75rem;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s ease;
		margin: 0.15rem;
		outline: none;
	}

	.dropdown-option:hover, .dropdown-option:focus-visible {
		background: rgba(255, 255, 255, 0.04);
	}

	.dropdown-option.selected {
		background: rgba(16, 185, 129, 0.08);
	}

	.option-id {
		font-family: monospace;
		font-size: 0.8rem;
		color: #10b981;
		background: rgba(16, 185, 129, 0.1);
		padding: 0.15rem 0.4rem;
		border-radius: 4px;
		min-width: 42px;
		text-align: center;
	}

	.option-name {
		flex: 1;
		color: #e3e4e6;
		font-size: 0.85rem;
	}

	.option-slots {
		font-size: 0.75rem;
		color: #71717a;
		margin-right: 0.25rem;
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
		font-style: italic;
		font-size: 0.9rem;
	}

	.error-text {
		display: block;
		color: #ef4444;
		font-size: 0.85rem;
		margin-top: 0.4rem;
	}

	.hint-text {
		display: block;
		color: #71717a;
		font-size: 0.8rem;
		margin-top: 0.4rem;
	}

	/* Actions buttons */
	.form-actions {
		display: flex;
		gap: 1rem;
		margin-top: 2.5rem;
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
		font-size: 0.95rem;
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
		border-color: rgba(255, 255, 255, 0.2);
		color: #ffffff;
	}

	.btn-primary:disabled,
	.btn-secondary:disabled {
		opacity: 0.4;
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}

	.btn-icon {
		display: flex;
		align-items: center;
	}

	/* Micro Loading Animation Spinner */
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

	/* Real-Time Live Preview Module */
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
		background: rgba(59, 130, 246, 0.1);
		border: 1px solid rgba(59, 130, 246, 0.2);
		padding: 0.2rem 0.6rem;
		border-radius: 20px;
		font-size: 0.75rem;
		color: #3b82f6;
	}

	.preview-body {
		padding: 1.25rem;
	}

	.preview-type-badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		font-size: 0.75rem;
		font-weight: 500;
		margin-bottom: 0.75rem;
		text-transform: capitalize;
		transition: all 0.2s ease;
	}

	.preview-name {
		font-family: 'Inter', sans-serif;
		font-size: 1.15rem;
		font-weight: 600;
		color: #ffffff;
		margin-bottom: 1rem;
		word-break: break-word;
	}

	.preview-details {
		background: rgba(255, 255, 255, 0.02);
		border-radius: 8px;
		padding: 0.75rem;
	}

	.preview-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.85rem;
	}

	.preview-row .lbl {
		color: #71717a;
	}

	.preview-row .val {
		color: #e3e4e6;
		font-weight: 500;
	}

	.preview-row .not-selected {
		color: #52525b;
		font-style: italic;
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
		font-size: 0.75rem;
		color: #71717a;
	}

	.status-indicator .dot {
		width: 6px;
		height: 6px;
		background: #10b981;
		border-radius: 50%;
		box-shadow: 0 0 8px #10b981;
	}

	.preview-note {
		color: #52525b;
		font-size: 0.75rem;
		margin-top: 0.75rem;
		text-align: center;
	}

	/* Responsive Media System */
	@media (max-width: 900px) {
		.main-layout {
			grid-template-columns: 1fr;
		}

		.preview-section {
			position: static;
		}
	}

	@media (max-width: 600px) {
		.page {
			padding: 1rem;
		}

		.form-card {
			padding: 1.25rem;
		}

		.form-actions {
			flex-direction: column;
		}
	}
</style>