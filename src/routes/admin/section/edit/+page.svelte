<script lang="ts">
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import type { PageProps } from './$types'
	import { onMount } from 'svelte'

	let { data }: PageProps = $props()

	let isSubmitting = $state(false)
	let showSuccess = $state(false)
	let errorMessage = $state<string | null>(null)

	let form = data?.form
	let section = data?.section
	let cabinets = data?.cabinets || []

	let sectionId = $page.url.searchParams.get('id')

	let isDropdownOpen = $state(false)
	let searchTerm = $state('')
	let selectedCabinet = $state<{ id: number; name: string; maxSlots: number } | null>(null)
	let dropdownRef = $state<HTMLDivElement>()

	onMount(() => {
		if (form?.data?.cabinetId) {
			const cabinet = cabinets.find((c) => c.id === form.data.cabinetId)
			if (cabinet) {
				selectedCabinet = cabinet
				searchTerm = `${cabinet.name} (ID: ${cabinet.id})`
			}
		}
	})

	let filteredCabinets = $derived(() => {
		if (!searchTerm) return cabinets
		return cabinets.filter(
			(cabinet) =>
				cabinet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				cabinet.id.toString().includes(searchTerm)
		)
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

	function selectCabinet(cabinet: { id: number; name: string; maxSlots: number }) {
		selectedCabinet = cabinet
		searchTerm = `${cabinet.name} (ID: ${cabinet.id})`
		isDropdownOpen = false
	}

	function stopPropagation(e: Event) {
		e.stopPropagation()
	}

	async function goBack() {
		await goto('/admin/section')
	}

	async function handleSubmit(e: Event) {
		const formElement = e.target as HTMLFormElement
		if (!formElement) return

		e.preventDefault()

		if (!selectedCabinet) {
			errorMessage = 'Please select a cabinet!'
			return
		}

		isSubmitting = true
		errorMessage = null

		try {
			const formData = new FormData(formElement)
			formData.set('cabinetId', selectedCabinet.id.toString())

			const response = await fetch(`/admin/section/edit?id=${sectionId}`, {
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

	function getTypeColor(type: string) {
		switch (type) {
			case 'display':
				return '#10b981'
			case 'storage':
				return '#f59e0b'
			default:
				return '#3b82f6'
		}
	}

	function getTypeBg(type: string) {
		switch (type) {
			case 'display':
				return '#f0fdf4'
			case 'storage':
				return '#fffbeb'
			default:
				return '#eff6ff'
		}
	}
</script>

<svelte:head>
	<title>Admin - Edit Section</title>
</svelte:head>

<div class="page">
	<!-- Header -->
	<div class="header">
		<button class="back-button" onclick={goBack} disabled={isSubmitting}>
			<span class="back-icon">←</span>
			<span>Back to Sections</span>
		</button>
		<h1 class="page-title">Edit Section</h1>
		<p class="page-subtitle">Update section #{section?.id} - {section?.name}</p>
	</div>

	<!-- Info Card -->
	<div class="info-card">
		<div class="info-icon">ℹ️</div>
		<div class="info-content">
			<h4 class="info-title">Editing Section #{section?.id}</h4>
			<p class="info-text">
				You are editing section <strong>"{section?.name}"</strong>. Changes will be applied
				immediately after saving.
			</p>
		</div>
	</div>

	<!-- Form Card -->
	<div class="form-card">
		<form method="POST" action={`/admin/section/edit?id=${sectionId}`} onsubmit={handleSubmit}>
			<!-- Success Message -->
			{#if showSuccess}
				<div class="success-message">
					<span class="success-icon">✅</span>
					<span>Section updated successfully! Redirecting...</span>
				</div>
			{/if}

			<!-- Error Message -->
			{#if errorMessage}
				<div class="error-message">
					<span class="error-icon">⚠️</span>
					<span>{errorMessage}</span>
				</div>
			{/if}

			<!-- Hidden ID Field -->
			<input type="hidden" name="id" value={sectionId || ''} />

			<!-- Section ID (readonly) -->
			<div class="form-group">
				<label for="section-id" class="form-label">Section ID</label>
				<div class="input-wrapper">
					<span class="input-icon">#️⃣</span>
					<input
						type="text"
						id="section-id"
						class="form-input"
						value={section?.id || ''}
						readonly
						disabled
					/>
				</div>
				<span class="hint-text">Section ID cannot be changed</span>
			</div>

			<!-- Name Field -->
			<div class="form-group">
				<label for="name" class="form-label">
					Section Name <span class="required">*</span>
				</label>
				<div class="input-wrapper">
					<span class="input-icon">📁</span>
					<input
						type="text"
						id="name"
						name="name"
						class="form-input"
						class:error={form?.errors?.name}
						placeholder="e.g., Electronics, Furniture, Tools"
						value={form?.data?.name || ''}
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
					<span class="input-icon">🏷️</span>
					<input
						type="text"
						id="type"
						name="type"
						class="form-input"
						class:error={form?.errors?.type}
						placeholder="e.g., display, storage, archive, retail"
						value={form?.data?.type || ''}
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
				<label for="cabinet" class="form-label">
					Cabinet <span class="required">*</span>
				</label>

				<input type="hidden" name="cabinetId" value={selectedCabinet?.id || ''} />

				<div class="custom-dropdown" bind:this={dropdownRef}>
					<div
						class="dropdown-trigger"
						class:error={form?.errors?.cabinetId && !selectedCabinet}
						onclick={() => !isSubmitting && !showSuccess && (isDropdownOpen = !isDropdownOpen)}
					>
						<span class="trigger-icon">📦</span>
						{#if selectedCabinet}
							<span class="trigger-text">
								#{selectedCabinet.id} - {selectedCabinet.name} ({selectedCabinet.maxSlots} slots)
							</span>
						{:else}
							<span class="trigger-text placeholder">Select a cabinet</span>
						{/if}
						<span class="trigger-arrow">{isDropdownOpen ? '▲' : '▼'}</span>
					</div>

					{#if isDropdownOpen}
						<div class="dropdown-menu" onclick={stopPropagation}>
							<div class="dropdown-search">
								<span class="search-icon">🔍</span>
								<input
									type="text"
									class="search-input"
									placeholder="Search cabinets..."
									bind:value={searchTerm}
									onclick={stopPropagation}
								/>
								{#if searchTerm}
									<button class="clear-search" onclick={() => (searchTerm = '')}> ✕ </button>
								{/if}
							</div>

							<div class="dropdown-options">
								{#if filteredCabinets().length === 0}
									<div class="dropdown-empty">No cabinets found</div>
								{:else}
									{#each filteredCabinets() as cabinet}
										<div
											class="dropdown-option"
											class:selected={selectedCabinet?.id === cabinet.id}
											onclick={() => selectCabinet(cabinet)}
										>
											<span class="option-id">#{cabinet.id}</span>
											<span class="option-name">{cabinet.name}</span>
											<span class="option-slots">{cabinet.maxSlots} slots</span>
											{#if selectedCabinet?.id === cabinet.id}
												<span class="option-check">✓</span>
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
						<span>Updating...</span>
					{:else if showSuccess}
						<span>✅ Updated!</span>
					{:else}
						<span class="btn-icon">✏️</span>
						<span>Update Section</span>
					{/if}
				</button>
			</div>
		</form>
	</div>

	<!-- Preview Card -->
	<div class="preview-section">
		<h2 class="preview-title">Preview</h2>
		<div class="preview-card">
			<div class="preview-header">
				<span class="preview-badge">ID: #{section?.id}</span>
			</div>
			<div class="preview-body">
				<div
					class="preview-type-badge"
					style="background: {getTypeBg(form?.data?.type || section?.type)}; color: {getTypeColor(
						form?.data?.type || section?.type
					)}"
				>
					{form?.data?.type || section?.type || 'type'}
				</div>
				<div class="preview-name">
					{form?.data?.name || section?.name || 'Section Name'}
				</div>
				<div class="preview-details">
					<div class="preview-row">
						<span>Cabinet:</span>
						<span>
							{#if selectedCabinet}
								#{selectedCabinet.id}: {selectedCabinet.name}
							{:else if section?.cabinet}
								#{section.cabinet.id}: {section.cabinet.name}
							{:else}
								Not selected
							{/if}
						</span>
					</div>
				</div>
			</div>
			<div class="preview-footer">
				<span>Status: {isSubmitting ? 'Saving...' : 'Ready'}</span>
			</div>
		</div>
		<p class="preview-note">Real-time preview of your section</p>
	</div>
</div>

<style>
	.page {
		padding: 2rem;
		max-width: 800px;
		margin: 0 auto;
		background: #f5f5f5;
		min-height: 100vh;
	}

	.header {
		margin-bottom: 2rem;
	}

	.back-button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: #ffffff;
		border: 1px solid #e5e5e5;
		border-radius: 8px;
		color: #666666;
		font-family: 'Inter', sans-serif;
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.2s ease;
		margin-bottom: 1.5rem;
	}

	.back-button:hover:not(:disabled) {
		background: #f5f5f5;
		border-color: #d1d5db;
		transform: translateX(-4px);
	}

	.back-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.back-icon {
		font-size: 1.1rem;
	}

	.page-title {
		font-family: 'Inter', sans-serif;
		font-size: 2rem;
		font-weight: 600;
		color: #333333;
		margin: 0 0 0.5rem 0;
	}

	.page-subtitle {
		color: #666666;
		font-size: 1rem;
	}

	.info-card {
		display: flex;
		gap: 1rem;
		padding: 1rem;
		background: #eff6ff;
		border: 1px solid #3b82f6;
		border-radius: 8px;
		margin-bottom: 2rem;
	}

	.info-icon {
		font-size: 1.5rem;
	}

	.info-title {
		font-family: 'Inter', sans-serif;
		font-size: 0.9rem;
		font-weight: 600;
		color: #1e40af;
		margin: 0 0 0.25rem 0;
	}

	.info-text {
		color: #1e3a8a;
		font-size: 0.85rem;
		line-height: 1.5;
		margin: 0;
	}

	.info-text strong {
		color: #10b981;
	}

	/* Form Card */
	.form-card {
		background: #ffffff;
		border: 1px solid #e5e5e5;
		border-radius: 12px;
		padding: 2rem;
		margin-bottom: 2rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	}

	.success-message {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background: #f0fdf4;
		border: 1px solid #10b981;
		border-radius: 8px;
		color: #059669;
		margin-bottom: 1.5rem;
	}

	.error-message {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background: #fef2f2;
		border: 1px solid #ef4444;
		border-radius: 8px;
		color: #dc2626;
		margin-bottom: 1.5rem;
	}

	.success-icon,
	.error-icon {
		font-size: 1.2rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-label {
		display: block;
		font-family: 'Inter', sans-serif;
		font-size: 0.95rem;
		font-weight: 500;
		color: #333333;
		margin-bottom: 0.5rem;
	}

	.required {
		color: #ef4444;
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
		color: #999999;
		font-size: 1.1rem;
		z-index: 1;
	}

	.form-input {
		width: 100%;
		padding: 0.75rem 1rem 0.75rem 2.5rem;
		background: #ffffff;
		border: 1px solid #e5e5e5;
		border-radius: 8px;
		color: #333333;
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
		opacity: 0.5;
		cursor: not-allowed;
		background: #f9fafb;
	}

	.form-input[readonly] {
		background: #f9fafb;
		cursor: not-allowed;
	}

	.form-input::placeholder {
		color: #cccccc;
	}

	.error-text {
		display: block;
		color: #ef4444;
		font-size: 0.85rem;
		margin-top: 0.5rem;
	}

	.hint-text {
		display: block;
		color: #999999;
		font-size: 0.8rem;
		margin-top: 0.5rem;
	}

	.custom-dropdown {
		position: relative;
		width: 100%;
	}

	.dropdown-trigger {
		display: flex;
		align-items: center;
		padding: 0.75rem 1rem;
		background: #ffffff;
		border: 1px solid #e5e5e5;
		border-radius: 8px;
		color: #333333;
		font-family: 'Inter', sans-serif;
		font-size: 0.95rem;
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
		font-size: 1.1rem;
		color: #666666;
	}

	.trigger-text {
		flex: 1;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.trigger-text.placeholder {
		color: #999999;
	}

	.trigger-arrow {
		color: #10b981;
		font-size: 0.8rem;
		margin-left: auto;
	}

	.dropdown-menu {
		position: absolute;
		top: calc(100% + 8px);
		left: 0;
		right: 0;
		background: #ffffff;
		border: 1px solid #e5e5e5;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		z-index: 100;
		overflow: hidden;
	}

	.dropdown-search {
		position: relative;
		padding: 0.75rem;
		border-bottom: 1px solid #f0f0f0;
	}

	.search-input {
		width: 100%;
		padding: 0.6rem 1rem 0.6rem 2.3rem;
		background: #ffffff;
		border: 1px solid #e5e5e5;
		border-radius: 6px;
		color: #333333;
		font-family: 'Inter', sans-serif;
		font-size: 0.85rem;
	}

	.search-input:focus {
		outline: none;
		border-color: #10b981;
	}

	.clear-search {
		position: absolute;
		right: 1.3rem;
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		color: #999999;
		cursor: pointer;
		font-size: 0.9rem;
	}

	.clear-search:hover {
		color: #333333;
	}

	.dropdown-options {
		max-height: 250px;
		overflow-y: auto;
		padding: 0.25rem;
	}

	.dropdown-options::-webkit-scrollbar {
		width: 6px;
	}

	.dropdown-options::-webkit-scrollbar-track {
		background: #f5f5f5;
	}

	.dropdown-options::-webkit-scrollbar-thumb {
		background: #cccccc;
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
		margin: 0.25rem;
	}

	.dropdown-option:hover {
		background: #f5f5f5;
	}

	.dropdown-option.selected {
		background: #f0fdf4;
	}

	.option-id {
		font-family: monospace;
		font-size: 0.8rem;
		color: #10b981;
		min-width: 45px;
	}

	.option-name {
		flex: 1;
		color: #333333;
		font-size: 0.85rem;
	}

	.option-slots {
		font-size: 0.75rem;
		color: #999999;
		margin-right: 0.5rem;
	}

	.option-check {
		color: #10b981;
		font-weight: bold;
	}

	.dropdown-empty {
		padding: 2rem;
		text-align: center;
		color: #999999;
		font-style: italic;
	}

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
		box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
	}

	.btn-secondary {
		background: #ffffff;
		border: 1px solid #e5e5e5;
		color: #666666;
	}

	.btn-secondary:hover:not(:disabled) {
		background: #f5f5f5;
		border-color: #d1d5db;
		transform: translateY(-1px);
	}

	.btn-primary:disabled,
	.btn-secondary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}

	.btn-icon {
		font-size: 1.1rem;
	}

	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: #ffffff;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.preview-section {
		margin-top: 2rem;
	}

	.preview-title {
		font-family: 'Inter', sans-serif;
		font-size: 1rem;
		font-weight: 500;
		color: #666666;
		margin-bottom: 1rem;
	}

	.preview-card {
		background: #ffffff;
		border: 1px solid #e5e5e5;
		border-radius: 12px;
		overflow: hidden;
		max-width: 300px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	}

	.preview-header {
		padding: 0.75rem;
		background: #f9fafb;
		border-bottom: 1px solid #f0f0f0;
	}

	.preview-badge {
		background: #f5f5f5;
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		font-size: 0.75rem;
		color: #666666;
	}

	.preview-body {
		padding: 1rem;
	}

	.preview-type-badge {
		display: inline-block;
		padding: 0.2rem 0.75rem;
		border-radius: 20px;
		font-size: 0.7rem;
		margin-bottom: 0.75rem;
	}

	.preview-name {
		font-family: 'Inter', sans-serif;
		font-size: 1rem;
		font-weight: 600;
		color: #333333;
		margin-bottom: 0.75rem;
	}

	.preview-details {
		background: #f9fafb;
		border-radius: 8px;
		padding: 0.75rem;
	}

	.preview-row {
		display: flex;
		justify-content: space-between;
		font-size: 0.8rem;
		color: #666666;
	}

	.preview-footer {
		padding: 0.75rem;
		background: #f9fafb;
		border-top: 1px solid #f0f0f0;
		font-size: 0.75rem;
		color: #999999;
	}

	.preview-note {
		color: #999999;
		font-size: 0.75rem;
		margin-top: 0.5rem;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.page {
			padding: 1rem;
		}

		.form-card {
			padding: 1.5rem;
		}

		.form-actions {
			flex-direction: column;
		}

		.preview-card {
			max-width: 100%;
		}

		.dropdown-option {
			flex-wrap: wrap;
		}
	}
</style>
