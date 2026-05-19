<script lang="ts">
	import { goto } from '$app/navigation'
	import { onMount } from 'svelte'

	let { data } = $props()
	let form = data?.form
	let sections = data?.sections || []

	let isSubmitting = $state(false)
	let imagePreview = $state<string | null>(null)
	let imageFile = $state<File | null>(null)
	let errorMessage = $state<string | null>(null)

	// State untuk form values
	let nameValue = $state(form?.data?.name || '')
	let stockValue = $state(form?.data?.stock ?? 0)
	let locationValue = $state(form?.data?.location || '')
	let categoryValue = $state(form?.data?.category || '')
	let subCategoryValue = $state(form?.data?.subCategory || '')
	let serialNumberValue = $state(form?.data?.serialNumber || '')
	let priceIdrValue = $state(form?.data?.priceIdr || '')
	let priceNoteIdrValue = $state(form?.data?.priceNoteIdr || '')
	let costPriceValue = $state(form?.data?.costPrice || '')
	let costNoteValue = $state(form?.data?.costNote || '')
	let videoUrlValue = $state(form?.data?.videoUrl || '')
	let qrCustomUrlValue = $state(form?.data?.qrCustomUrl || '')

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

	function handleImageChange(e: Event) {
		const input = e.target as HTMLInputElement
		if (input.files && input.files[0]) {
			imageFile = input.files[0]
			imagePreview = URL.createObjectURL(imageFile)
			errorMessage = null
		}
	}

	function removeImage() {
		imagePreview = null
		imageFile = null
		const fileInput = document.querySelector('.image-input') as HTMLInputElement
		if (fileInput) fileInput.value = ''
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
		formData.append('stock', stockValue.toString())
		formData.append('location', locationValue)
		formData.append('category', categoryValue)
		formData.append('subCategory', subCategoryValue)
		formData.append('serialNumber', serialNumberValue)
		formData.append('priceIdr', priceIdrValue.toString())
		formData.append('priceNoteIdr', priceNoteIdrValue)
		formData.append('costPrice', costPriceValue.toString())
		formData.append('costNote', costNoteValue)
		formData.append('videoUrl', videoUrlValue)
		formData.append('qrCustomUrl', qrCustomUrlValue)

		if (imageFile) {
			formData.append('file', imageFile)
		}

		formData.append('sectionId', selectedSection.id.toString())

		try {
			const response = await fetch('/admin/item/create', {
				method: 'POST',
				body: formData,
				redirect: 'manual'
			})

			if (response.type === 'opaqueredirect' || response.status === 303 || response.status === 0) {
				await goto('/admin/item?success=true')
				return
			}

			if (response.ok) {
				await goto('/admin/item?success=true')
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
	<div class="header">
		<button class="back-btn" onclick={() => goto('/admin/item')} disabled={isSubmitting}>
			← Back to Items
		</button>
		<h1 class="page-title">Create New Item</h1>
		<p class="page-subtitle">Add a new stock item to your inventory</p>
	</div>

	<div class="form-card">
		<form onsubmit={handleSubmit}>
			{#if errorMessage}
				<div class="error-message">⚠️ {errorMessage}</div>
			{/if}
			{#if form?.message}
				<div class="error-message">⚠️ {form.message}</div>
			{/if}

			<!-- Item Name -->
			<div class="form-group">
				<label>📝 Item Name *</label>
				<input
					type="text"
					bind:value={nameValue}
					required
					disabled={isSubmitting}
					placeholder="e.g., Laptop ASUS ROG, Mouse Logitech"
				/>
				{#if form?.errors?.name}<span class="error">{form.errors.name[0]}</span>{/if}
			</div>

			<!-- Stock & Location -->
			<div class="form-row">
				<div class="form-group half">
					<label>📦 Stock</label>
					<input type="number" bind:value={stockValue} disabled={isSubmitting} min="0" />
				</div>
				<div class="form-group half">
					<label>📍 Location *</label>
					<input
						type="text"
						bind:value={locationValue}
						required
						disabled={isSubmitting}
						placeholder="e.g., Cabinet A - Shelf 1"
					/>
					{#if form?.errors?.location}<span class="error">{form.errors.location[0]}</span>{/if}
				</div>
			</div>

			<!-- Category & Sub Category -->
			<div class="form-row">
				<div class="form-group half">
					<label>🏷️ Category *</label>
					<input
						type="text"
						bind:value={categoryValue}
						required
						disabled={isSubmitting}
						placeholder="e.g., Electronics, Furniture"
					/>
					{#if form?.errors?.category}<span class="error">{form.errors.category[0]}</span>{/if}
				</div>
				<div class="form-group half">
					<label>⚡ Sub Category *</label>
					<input
						type="text"
						bind:value={subCategoryValue}
						required
						disabled={isSubmitting}
						placeholder="e.g., Laptop, Mouse"
					/>
					{#if form?.errors?.subCategory}<span class="error">{form.errors.subCategory[0]}</span
						>{/if}
				</div>
			</div>

			<!-- Serial Number -->
			<div class="form-group">
				<label>🔢 Serial Number (Optional)</label>
				<input
					type="text"
					bind:value={serialNumberValue}
					disabled={isSubmitting}
					placeholder="Unique serial number"
				/>
				<span class="hint">Must be unique if provided</span>
			</div>

			<!-- Section Dropdown -->
			<div class="form-group">
				<label>🗂️ Section *</label>
				<div class="custom-dropdown" bind:this={dropdownRef}>
					<div
						class="dropdown-trigger"
						class:error={!selectedSection && form?.errors?.sectionId}
						onclick={(e) => {
							e.preventDefault()
							e.stopPropagation()
							if (!isSubmitting) isDropdownOpen = !isDropdownOpen
						}}
					>
						📁
						{#if selectedSection}
							<strong>{selectedSection.name}</strong>
							<span class="trigger-cabinet">({selectedSection.cabinet?.name})</span>
						{:else}
							<span class="placeholder">Select a section</span>
						{/if}
						<span class="trigger-arrow">{isDropdownOpen ? '▲' : '▼'}</span>
					</div>
					{#if isDropdownOpen}
						<div class="dropdown-menu" onclick={stopPropagation}>
							<div class="dropdown-search">
								🔍
								<input
									type="text"
									placeholder="Search sections..."
									bind:value={searchTerm}
									onclick={stopPropagation}
									onkeydown={(e) => e.stopPropagation()}
								/>
								{#if searchTerm}<button
										type="button"
										class="clear-search"
										onclick={() => (searchTerm = '')}>✕</button
									>{/if}
							</div>
							<div class="dropdown-options">
								{#if filteredSections().length === 0}
									<div class="dropdown-empty">📭 No sections found</div>
								{:else}
									{#each filteredSections() as section}
										<div
											class="dropdown-option"
											class:selected={selectedSection?.id === section.id}
											onclick={() => selectSection(section)}
										>
											<div>
												<span class="option-name">{section.name}</span><span class="option-cabinet"
													>{section.cabinet?.name}</span
												>
											</div>
											<div>
												<span class="option-id">ID: {section.id}</span
												>{#if selectedSection?.id === section.id}<span class="option-check">✓</span
													>{/if}
											</div>
										</div>
									{/each}
								{/if}
							</div>
						</div>
					{/if}
				</div>
				{#if form?.errors?.sectionId && !selectedSection}<span class="error"
						>{form.errors.sectionId[0]}</span
					>{/if}
				<span class="hint">Choose which section this item belongs to</span>
			</div>

			<!-- PRICE SECTION - Harga Jual IDR -->
			<div class="price-section">
				<div class="price-header">💰 Harga Jual (Retail Price)</div>
				<div class="price-card idr">
					<div class="price-card-header">🇮🇩 Indonesian Rupiah (IDR)</div>
					<div class="price-card-body">
						<div class="form-group">
							<label>Harga Jual *</label><input
								type="number"
								bind:value={priceIdrValue}
								required
								disabled={isSubmitting}
								placeholder="50000"
							/>{#if form?.errors?.priceIdr}<span class="error">{form.errors.priceIdr[0]}</span
								>{/if}
						</div>
						<div class="form-group">
							<label>Catatan Harga *</label><input
								type="text"
								bind:value={priceNoteIdrValue}
								required
								disabled={isSubmitting}
								placeholder="Retail, Wholesale"
							/>{#if form?.errors?.priceNoteIdr}<span class="error"
									>{form.errors.priceNoteIdr[0]}</span
								>{/if}
						</div>
					</div>
				</div>
			</div>

			<!-- COST PRICE SECTION - Harga Modal IDR -->
			<div class="cost-section">
				<div class="cost-header">
					🏭 Harga Modal (Cost Price) <span class="optional-badge">Optional</span>
				</div>
				<div class="cost-card">
					<div class="cost-card-header">🇮🇩 Indonesian Rupiah (IDR) - Harga Modal</div>
					<div class="cost-card-body">
						<div class="form-group">
							<label>Harga Modal</label><input
								type="number"
								bind:value={costPriceValue}
								disabled={isSubmitting}
								min="0"
								placeholder="Harga beli dari supplier"
							/>{#if form?.errors?.costPrice}<span class="error">{form.errors.costPrice[0]}</span
								>{/if}
						</div>
						<div class="form-group">
							<label>Catatan Modal</label><input
								type="text"
								bind:value={costNoteValue}
								disabled={isSubmitting}
								placeholder="e.g., Supplier A, Grosir"
							/>{#if form?.errors?.costNote}<span class="error">{form.errors.costNote[0]}</span
								>{/if}
						</div>
					</div>
				</div>
			</div>

			<!-- Video URL -->
			<div class="form-group">
				<label>🎥 Video URL (Optional)</label>
				<input
					type="url"
					bind:value={videoUrlValue}
					disabled={isSubmitting}
					placeholder="https://youtube.com/watch?v=..."
				/>
				{#if form?.errors?.videoUrl}<span class="error">{form.errors.videoUrl[0]}</span>{/if}
				<span class="hint">Link to showcase video of the item</span>
			</div>

			<!-- QR Custom URL -->
			<div class="form-group">
				<label>📱 QR Code Custom URL (Optional)</label>
				<input
					type="url"
					bind:value={qrCustomUrlValue}
					disabled={isSubmitting}
					placeholder="https://example.com/custom-link"
				/>
				{#if form?.errors?.qrCustomUrl}<span class="error">{form.errors.qrCustomUrl[0]}</span>{/if}
				<span class="hint"
					>Custom URL for QR code. If empty, QR will link to this item's detail page.</span
				>
			</div>

			<!-- Image Upload -->
			<div class="form-group">
				<label>🖼️ Item Image <span class="optional-label">(Optional)</span></label>
				<div class="image-upload-area" class:has-image={!!imagePreview}>
					{#if imagePreview}
						<img src={imagePreview} alt="Preview" class="image-preview" />
						<button type="button" class="remove-image" onclick={removeImage}>✕</button>
						<div class="image-overlay">Click or drag to change</div>
					{:else}
						<div class="upload-placeholder">
							📦 Click or drag image here (Optional) <small>PNG, JPG, WEBP up to 5MB</small>
						</div>
					{/if}
					<input
						type="file"
						accept="image/jpeg,image/png,image/webp,image/jpg"
						onchange={handleImageChange}
						class="image-input"
					/>
				</div>
				<span class="hint">Image is optional. You can add it later.</span>
			</div>

			<!-- Form Actions -->
			<div class="form-actions">
				<button
					type="button"
					class="btn-secondary"
					onclick={() => goto('/admin/item')}
					disabled={isSubmitting}>✕ Cancel</button
				>
				<button type="submit" class="btn-primary" disabled={isSubmitting}>
					{#if isSubmitting}<span class="spinner"></span>Creating Item...{:else}➕ Create Item{/if}
				</button>
			</div>
		</form>
	</div>

	<!-- Live Preview -->
	<div class="preview-section">
		<div class="preview-header">
			<h2>Live Preview</h2>
			<span class="preview-badge">Real-time</span>
		</div>
		<div class="preview-card">
			<div class="preview-image">
				{#if imagePreview}<img src={imagePreview} alt="Item preview" />{:else}<div
						class="preview-no-image"
					>
						📦<small>No image</small>
					</div>{/if}
			</div>
			<div class="preview-info">
				<h3>{nameValue || 'Item Name'}</h3>
				<div class="preview-badges">
					<span class="preview-category">{categoryValue || 'Category'}</span>
					<span class="preview-sub">{subCategoryValue || 'Sub Category'}</span>
				</div>
				<div class="preview-prices">
					<div class="preview-price idr">
						🇮🇩 Harga Jual: Rp {Number(priceIdrValue || 0).toLocaleString('id-ID')} ({priceNoteIdrValue ||
							'Note'})
					</div>
					{#if costPriceValue && costPriceValue > 0}<div class="preview-price cost">
							🏭 Harga Modal: Rp {Number(costPriceValue || 0).toLocaleString('id-ID')}
							{#if costNoteValue}({costNoteValue}){/if}
						</div>{/if}
				</div>
				<div class="preview-details">
					<div>
						📦 Stock: <span class:low-stock={(stockValue || 0) < 5}>{stockValue || 0}</span>
					</div>
					<div>📍 Location: {locationValue || 'Not set'}</div>
					<div>🔢 SN: {serialNumberValue || '-'}</div>
					<div>📱 QR: {qrCustomUrlValue ? 'Custom URL' : 'Auto (Item Page)'}</div>
					{#if selectedSection}<div>
							📁 Section: {selectedSection.name} ({selectedSection.cabinet?.name})
						</div>{/if}
				</div>
			</div>
		</div>
		<p class="preview-note">Preview updates as you fill out the form</p>
	</div>
</div>

<style>
	.page {
		padding: 2rem;
		max-width: 1000px;
		margin: 0 auto;
		background: #f5f5f5;
		min-height: 100vh;
	}

	.header {
		margin-bottom: 2rem;
	}

	.back-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: #ffffff;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		padding: 0.5rem 1rem;
		color: #666666;
		cursor: pointer;
		margin-bottom: 1rem;
		transition: all 0.2s;
	}

	.back-btn:hover:not(:disabled) {
		background: #f5f5f5;
		border-color: #10b981;
		transform: translateX(-4px);
	}

	.page-title {
		font-size: 2rem;
		font-weight: 600;
		color: #333333;
		margin: 0 0 0.25rem;
	}

	.page-subtitle {
		color: #666666;
		font-size: 0.95rem;
	}

	.form-card {
		background: #ffffff;
		border: 1px solid #e0e0e0;
		border-radius: 12px;
		padding: 2rem;
		margin-bottom: 2rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	}

	.form-row {
		display: flex;
		gap: 1.5rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
		flex: 1;
	}

	.form-group.half {
		flex: 1;
	}

	label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
		color: #333333;
		font-weight: 500;
		font-size: 0.9rem;
	}

	.label-icon {
		font-size: 1rem;
	}

	.required {
		color: #ef4444;
		margin-left: 0.25rem;
	}

	.optional-label {
		color: #999999;
		font-size: 0.75rem;
		font-weight: normal;
		margin-left: 0.25rem;
	}

	input,
	select {
		width: 100%;
		padding: 0.75rem 1rem;
		background: #ffffff;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		color: #333333;
		font-size: 0.95rem;
		transition: all 0.2s;
	}

	input:focus,
	select:focus {
		outline: none;
		border-color: #10b981;
		box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1);
	}

	input::placeholder {
		color: #cccccc;
	}

	.error {
		display: block;
		color: #ef4444;
		font-size: 0.8rem;
		margin-top: 0.25rem;
	}

	.hint {
		display: block;
		color: #999999;
		font-size: 0.75rem;
		margin-top: 0.25rem;
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

	/* Price Section */
	.price-section {
		margin: 1.5rem 0;
		padding: 1.5rem;
		background: #f9fafb;
		border-radius: 12px;
		border: 1px solid #e0e0e0;
	}

	.price-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid #e0e0e0;
	}

	.price-header-icon {
		font-size: 1.5rem;
	}

	.price-title {
		font-size: 1.1rem;
		font-weight: 600;
		color: #333333;
		margin: 0;
	}

	.price-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
	}

	.price-card {
		background: #ffffff;
		border-radius: 10px;
		overflow: hidden;
		border: 1px solid #e0e0e0;
	}

	.price-card.idr .price-card-header {
		background: #f0fdf4;
		border-bottom-color: #10b981;
	}

	.price-card.sgd .price-card-header {
		background: #fffbeb;
		border-bottom-color: #f59e0b;
	}

	.price-card-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border-bottom: 2px solid;
	}

	.currency-flag {
		font-size: 1.5rem;
	}

	.currency-name {
		font-weight: 600;
		color: #333333;
	}

	.price-card-body {
		padding: 1rem;
	}

	/* Cost Section */
	.cost-section {
		margin: 1.5rem 0;
		padding: 1.5rem;
		background: #f0fdf4;
		border-radius: 12px;
		border: 1px solid #10b981;
	}

	.cost-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid #10b981;
	}

	.cost-header-icon {
		font-size: 1.5rem;
	}

	.cost-title {
		font-size: 1.1rem;
		font-weight: 600;
		color: #059669;
		margin: 0;
	}

	.cost-card {
		background: #ffffff;
		border-radius: 10px;
		overflow: hidden;
		border: 1px solid #10b981;
	}

	.cost-card-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background: #f0fdf4;
		border-bottom: 1px solid #10b981;
	}

	.optional-badge {
		font-size: 0.7rem;
		padding: 0.2rem 0.5rem;
		background: #e5e5e5;
		border-radius: 20px;
		color: #666666;
		margin-left: auto;
	}

	.cost-card-body {
		padding: 1rem;
	}

	/* Custom Dropdown */
	.custom-dropdown {
		position: relative;
		width: 100%;
	}

	.dropdown-trigger {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background: #ffffff;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.dropdown-trigger:hover {
		border-color: #10b981;
	}

	.dropdown-trigger.error {
		border-color: #ef4444;
	}

	.trigger-icon {
		font-size: 1.2rem;
	}

	.trigger-text {
		flex: 1;
		color: #333333;
	}

	.trigger-text.placeholder {
		color: #999999;
	}

	.trigger-cabinet {
		font-size: 0.8rem;
		color: #888888;
	}

	.trigger-arrow {
		color: #10b981;
	}

	.dropdown-menu {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: #ffffff;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		z-index: 100;
		margin-top: 5px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.dropdown-search {
		position: relative;
		padding: 0.75rem;
		border-bottom: 1px solid #f0f0f0;
	}

	.search-input {
		width: 100%;
		padding: 0.5rem 1rem 0.5rem 2.3rem;
		background: #ffffff;
		border: 1px solid #e0e0e0;
		border-radius: 6px;
		color: #333333;
	}

	.clear-search {
		position: absolute;
		right: 1.5rem;
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		color: #999999;
		cursor: pointer;
	}

	.dropdown-options {
		max-height: 250px;
		overflow-y: auto;
	}

	.dropdown-option {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.dropdown-option:hover {
		background: #f5f5f5;
	}

	.dropdown-option.selected {
		background: #f0fdf4;
	}

	.option-name {
		font-weight: 500;
		color: #333333;
	}

	.option-cabinet {
		font-size: 0.75rem;
		color: #888888;
		display: block;
	}

	.option-check {
		color: #10b981;
		font-weight: bold;
	}

	.dropdown-empty {
		text-align: center;
		padding: 2rem;
		color: #999999;
	}

	/* Image Upload */
	.image-upload-area {
		position: relative;
		width: 100%;
		min-height: 200px;
		background: #f9fafb;
		border: 2px dashed #e0e0e0;
		border-radius: 10px;
		overflow: hidden;
		cursor: pointer;
		transition: all 0.2s;
	}

	.image-upload-area:hover {
		border-color: #10b981;
	}

	.image-upload-area.has-image {
		border-color: #10b981;
	}

	.upload-placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		text-align: center;
	}

	.upload-icon {
		font-size: 3rem;
		margin-bottom: 0.5rem;
	}

	.image-preview {
		width: 100%;
		height: 200px;
		object-fit: contain;
	}

	.remove-image {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		width: 32px;
		height: 32px;
		background: rgba(0, 0, 0, 0.7);
		border: none;
		border-radius: 50%;
		color: white;
		cursor: pointer;
	}

	.image-input {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
		cursor: pointer;
	}

	/* Form Actions */
	.form-actions {
		display: flex;
		gap: 1rem;
		margin-top: 2rem;
	}

	.btn-primary,
	.btn-secondary {
		flex: 1;
		padding: 0.75rem;
		border-radius: 8px;
		font-size: 0.95rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		border: none;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.btn-primary {
		background: #10b981;
		color: #ffffff;
	}

	.btn-primary:hover:not(:disabled) {
		background: #059669;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
	}

	.btn-secondary {
		background: #ffffff;
		border: 1px solid #e0e0e0;
		color: #666666;
	}

	.btn-secondary:hover:not(:disabled) {
		background: #f5f5f5;
		border-color: #d1d5db;
	}

	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
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

	/* Preview Section */
	.preview-section {
		margin-top: 2rem;
	}

	.preview-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.preview-title {
		font-size: 1rem;
		color: #666666;
		margin: 0;
	}

	.preview-badge {
		font-size: 0.7rem;
		padding: 0.25rem 0.75rem;
		background: #f0fdf4;
		border: 1px solid #10b981;
		border-radius: 20px;
		color: #059669;
	}

	.preview-card {
		display: flex;
		gap: 1.25rem;
		background: #ffffff;
		border: 1px solid #e0e0e0;
		border-radius: 12px;
		padding: 1.25rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	}

	.preview-image {
		width: 120px;
		height: 120px;
		background: #f9fafb;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.preview-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.preview-no-image {
		text-align: center;
		color: #999999;
	}

	.preview-info {
		flex: 1;
	}

	.preview-name {
		font-size: 1.1rem;
		font-weight: 600;
		color: #333333;
		margin: 0 0 0.5rem;
	}

	.preview-badges {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.preview-category,
	.preview-sub {
		padding: 0.2rem 0.75rem;
		background: #f5f5f5;
		border-radius: 20px;
		font-size: 0.7rem;
		color: #666666;
	}

	.preview-sub {
		background: #f0fdf4;
		color: #059669;
	}

	.preview-prices {
		margin-bottom: 0.75rem;
	}

	.preview-price {
		font-size: 0.85rem;
		padding: 0.25rem 0;
	}

	.preview-price.idr .amount {
		color: #059669;
	}

	.preview-price.sgd .amount {
		color: #d97706;
	}

	.preview-price.cost .amount {
		color: #10b981;
	}

	.preview-price .currency {
		font-weight: 500;
		margin-right: 0.5rem;
		color: #666666;
	}

	.preview-price .amount {
		font-weight: 600;
		margin-right: 0.25rem;
	}

	.preview-price .note {
		font-size: 0.7rem;
		color: #999999;
	}

	.preview-details {
		background: #f9fafb;
		border-radius: 8px;
		padding: 0.5rem;
	}

	.preview-detail {
		display: flex;
		justify-content: space-between;
		font-size: 0.75rem;
		padding: 0.25rem;
	}

	.detail-label {
		color: #888888;
	}

	.detail-value.low-stock {
		color: #d97706;
	}

	.preview-cabinet {
		font-size: 0.7rem;
		color: #888888;
	}

	.preview-note {
		text-align: center;
		font-size: 0.75rem;
		color: #999999;
		margin-top: 0.75rem;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.page {
			padding: 1rem;
		}
		.form-row {
			flex-direction: column;
			gap: 0;
		}
		.price-grid {
			grid-template-columns: 1fr;
		}
		.preview-card {
			flex-direction: column;
			align-items: center;
			text-align: center;
		}
		.preview-badges {
			justify-content: center;
		}
		.form-actions {
			flex-direction: column;
		}
	}
</style>
