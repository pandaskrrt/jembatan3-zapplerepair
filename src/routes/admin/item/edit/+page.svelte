<script lang="ts">
	import { goto } from '$app/navigation'
	import { onMount } from 'svelte'

	let { data } = $props()
	let sections = data?.sections || []
	let item = data?.item

	let isSubmitting = $state(false)
	let imagePreview = $state<string | null>(
		item?.imageUrl ? (item.imageUrl.startsWith('/') ? item.imageUrl : `/${item.imageUrl}`) : null
	)
	let imageFile = $state<File | null>(null)
	let videoFile = $state<File | null>(null)
	let videoName = $state<string | null>(item?.videoUrl ? item.videoUrl.split('/').pop() : null)
	let errorMessage = $state<string | null>(null)
	let successMessage = $state<string | null>(null)

	// State untuk custom dropdown section
	let isDropdownOpen = $state(false)
	let searchTerm = $state('')
	let selectedSection = $state<any>(sections.find((s: any) => s.id === item?.sectionId) ?? null)
	let dropdownRef = $state<HTMLDivElement>()

	// Filter sections berdasarkan search
	let filteredSections = $derived(() => {
		if (!searchTerm) return sections
		return sections.filter(
			(section: any) =>
				section.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				section.cabinet?.name?.toLowerCase().includes(searchTerm.toLowerCase())
		)
	})

	// Form fields state
	let formName = $state(item?.name || '')
	let formStock = $state(item?.stock ?? 0)
	let formLocation = $state(item?.location || '')
	let formCategory = $state(item?.category || '')
	let formSubCategory = $state(item?.subCategory || '')
	let formSerialNumber = $state(item?.serialNumber || '')
	let formVideoUrl = $state(item?.videoUrl || '')
	let formQrCustomUrl = $state(item?.qrCustomUrl || '')

	// Harga jual IDR
	let formPriceIdr = $state(item?.price?.amount || 0)
	let formPriceNoteIdr = $state(item?.price?.priceNote || '')

	// Harga modal IDR (Cost Price)
	let formCostPrice = $state(item?.costPrice?.amount || 0)
	let formCostNote = $state(item?.costPrice?.note || '')

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

	function handleVideoChange(e: Event) {
		const input = e.target as HTMLInputElement
		if (input.files && input.files[0]) {
			videoFile = input.files[0]
			videoName = input.files[0].name
			errorMessage = null
		}
	}

	function removeVideo() {
		videoFile = null
		videoName = null
	}

	async function handleSubmit(e: Event) {
		e.preventDefault()

		if (!selectedSection) {
			errorMessage = 'Please select a section!'
			return
		}

		isSubmitting = true
		errorMessage = null
		successMessage = null

		const formData = new FormData()

		formData.append('name', formName)
		formData.append('stock', formStock.toString())
		formData.append('location', formLocation)
		formData.append('category', formCategory)
		formData.append('subCategory', formSubCategory)
		formData.append('serialNumber', formSerialNumber)
		formData.append('videoUrl', formVideoUrl)
		formData.append('qrCustomUrl', formQrCustomUrl)
		formData.append('priceIdr', formPriceIdr.toString())
		formData.append('priceNoteIdr', formPriceNoteIdr)
		formData.append('costPrice', formCostPrice.toString())
		formData.append('costNote', formCostNote)
		formData.append('sectionId', selectedSection.id.toString())

		if (imageFile) formData.append('file', imageFile)
		if (videoFile) formData.append('videoFile', videoFile)

		try {
			const response = await fetch(`/admin/item/edit?id=${item?.id}`, {
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
			let result: any
			try {
				result = JSON.parse(text)
			} catch {
				result = {}
			}

			errorMessage = result?.data?.message || result?.message || 'Failed to update item'
			isSubmitting = false
		} catch (error) {
			errorMessage = 'Network error! Please try again.'
			isSubmitting = false
		}
	}
</script>

<svelte:head>
	<title>Admin - Edit Item #{item?.id}</title>
</svelte:head>

<div class="page">
	<div class="header">
		<button class="back-btn" onclick={() => goto('/admin/item')} disabled={isSubmitting}>
			← Back to Items
		</button>
		<h1 class="page-title">Edit Item</h1>
		<p class="page-subtitle">Editing: #{item?.id} - {item?.name}</p>
	</div>

	<div class="form-card">
		<form onsubmit={handleSubmit}>
			{#if errorMessage}<div class="alert error-message">⚠️ {errorMessage}</div>{/if}
			{#if successMessage}<div class="alert success-message">✅ {successMessage}</div>{/if}

			<!-- Item Name -->
			<div class="form-group">
				<label>📝 Item Name *</label>
				<input type="text" bind:value={formName} required disabled={isSubmitting} />
			</div>

			<!-- Stock & Location -->
			<div class="form-row">
				<div class="form-group half">
					<label>📦 Stock</label>
					<input type="number" bind:value={formStock} disabled={isSubmitting} min="0" />
				</div>
				<div class="form-group half">
					<label>📍 Location *</label>
					<input type="text" bind:value={formLocation} required disabled={isSubmitting} />
				</div>
			</div>

			<!-- Category & Sub Category -->
			<div class="form-row">
				<div class="form-group half">
					<label>🏷️ Category *</label>
					<input type="text" bind:value={formCategory} required disabled={isSubmitting} />
				</div>
				<div class="form-group half">
					<label>⚡ Sub Category *</label>
					<input type="text" bind:value={formSubCategory} required disabled={isSubmitting} />
				</div>
			</div>

			<!-- Serial Number -->
			<div class="form-group">
				<label>🔢 Serial Number (Optional)</label>
				<input
					type="text"
					bind:value={formSerialNumber}
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
						onclick={() => !isSubmitting && (isDropdownOpen = !isDropdownOpen)}
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
								bind:value={formPriceIdr}
								required
								disabled={isSubmitting}
							/>
						</div>
						<div class="form-group">
							<label>Catatan Harga *</label><input
								type="text"
								bind:value={formPriceNoteIdr}
								required
								disabled={isSubmitting}
								placeholder="Retail, Wholesale, Discount"
							/>
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
								bind:value={formCostPrice}
								disabled={isSubmitting}
								min="0"
								placeholder="Harga beli dari supplier"
							/>
						</div>
						<div class="form-group">
							<label>Catatan Modal</label><input
								type="text"
								bind:value={formCostNote}
								disabled={isSubmitting}
								placeholder="e.g., Supplier A, Grosir"
							/>
						</div>
					</div>
				</div>
			</div>

			<!-- Video URL -->
			<div class="form-group">
				<label>🎥 Video URL (Optional)</label>
				<input
					type="url"
					bind:value={formVideoUrl}
					disabled={isSubmitting}
					placeholder="https://youtube.com/watch?v=..."
				/>
			</div>

			<!-- QR Custom URL -->
			<div class="form-group">
				<label>📱 QR Code Custom URL (Optional)</label>
				<input type="url" bind:value={formQrCustomUrl} disabled={isSubmitting} />
			</div>

			<!-- Video Upload -->
			<div class="form-group">
				<label>🎬 Upload Video <span class="optional-badge">Optional</span></label>
				{#if videoName}
					<div class="video-current">
						<span>🎬 {videoName}</span>
						{#if item?.videoUrl && !videoFile}<span class="current-badge">Current</span>{:else}<span
								class="new-badge">New</span
							>{/if}
						<button type="button" class="remove-video-btn" onclick={removeVideo}>✕ Remove</button>
					</div>
				{/if}
				<div class="video-upload-area">
					<div class="upload-placeholder">
						🎥 {videoName ? 'Click to replace video' : 'Click or drag video here'}
						<small>MP4, WEBM up to 100MB</small>
					</div>
					<input
						type="file"
						accept="video/mp4,video/webm"
						onchange={handleVideoChange}
						class="video-input"
						disabled={isSubmitting}
					/>
				</div>
			</div>

			<!-- Image Upload -->
			<div class="form-group">
				<label
					>🖼️ Item Image <span class="optional-badge">Optional – keeps current if empty</span
					></label
				>
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
						disabled={isSubmitting}
					/>
				</div>
				<span class="hint">Leave empty to keep current image</span>
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
					{#if isSubmitting}<span class="spinner"></span>Saving Changes...{:else}💾 Save Changes{/if}
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
				{#if imagePreview}<img src={imagePreview} alt="Preview" />{:else}<div
						class="preview-no-image"
					>
						📦<small>No image</small>
					</div>{/if}
			</div>
			<div class="preview-info">
				<h3>{formName || 'Item Name'}</h3>
				<div class="preview-badges">
					<span class="preview-category">{formCategory || 'Category'}</span>
					<span class="preview-sub">{formSubCategory || 'Sub Category'}</span>
				</div>
				<div class="preview-prices">
					<div class="price-display">
						🇮🇩 Harga Jual: Rp {Number(formPriceIdr || 0).toLocaleString('id-ID')} ({formPriceNoteIdr ||
							'Note'})
					</div>
					{#if formCostPrice > 0}<div class="cost-display">
							🏭 Harga Modal: Rp {Number(formCostPrice || 0).toLocaleString('id-ID')}
							{#if formCostNote}({formCostNote}){/if}
						</div>{/if}
				</div>
				<div class="preview-details">
					<div>📦 Stock: <span class:low-stock={Number(formStock) < 5}>{formStock}</span></div>
					<div>📍 Location: {formLocation || 'Not set'}</div>
					<div>🔢 SN: {formSerialNumber || '-'}</div>
					{#if selectedSection}<div>
							📁 Section: {selectedSection.name} ({selectedSection.cabinet?.name})
						</div>{/if}
					{#if videoName || formVideoUrl}<div>
							🎥 Video: {videoName ? 'Uploaded' : formVideoUrl ? 'Linked' : '-'}
						</div>{/if}
				</div>
			</div>
		</div>
		<p class="preview-note">Preview updates as you edit the form</p>
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
		background: #fff;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		padding: 0.5rem 1rem;
		color: #666;
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
		color: #333;
		margin: 0 0 0.25rem;
	}
	.page-subtitle {
		color: #666;
		font-size: 0.95rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.form-card {
		background: #fff;
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
		color: #333;
		font-weight: 500;
		font-size: 0.9rem;
		flex-wrap: wrap;
	}
	.required {
		color: #ef4444;
		margin-left: 0.25rem;
	}
	.optional-badge {
		font-size: 0.7rem;
		color: #999;
		font-weight: 400;
		background: #f5f5f5;
		padding: 0.15rem 0.5rem;
		border-radius: 20px;
	}
	input {
		width: 100%;
		padding: 0.75rem 1rem;
		background: #fff;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		color: #333;
		font-size: 0.95rem;
		transition: all 0.2s;
		box-sizing: border-box;
	}
	input:focus {
		outline: none;
		border-color: #10b981;
		box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1);
	}
	input::placeholder {
		color: #ccc;
	}
	.hint {
		display: block;
		color: #999;
		font-size: 0.75rem;
		margin-top: 0.25rem;
	}
	.alert {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
	}
	.error-message {
		background: #fef2f2;
		border: 1px solid #ef4444;
		color: #dc2626;
	}
	.success-message {
		background: #f0fdf4;
		border: 1px solid #10b981;
		color: #059669;
	}
	.price-section {
		margin: 1.5rem 0;
		padding: 1.5rem;
		background: #f9fafb;
		border-radius: 12px;
		border: 1px solid #e0e0e0;
	}
	.price-header {
		font-size: 1.1rem;
		font-weight: 600;
		color: #333;
		margin-bottom: 1.5rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid #e0e0e0;
	}
	.price-card {
		background: #fff;
		border-radius: 10px;
		overflow: hidden;
		border: 1px solid #e0e0e0;
	}
	.price-card.idr .price-card-header {
		background: #f0fdf4;
		border-bottom-color: #10b981;
	}
	.price-card-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border-bottom: 2px solid;
		font-weight: 600;
		color: #333;
	}
	.price-card-body {
		padding: 1rem;
	}
	.cost-section {
		margin: 1.5rem 0;
		padding: 1.5rem;
		background: #f0fdf4;
		border-radius: 12px;
		border: 1px solid #10b981;
	}
	.cost-header {
		font-size: 1.1rem;
		font-weight: 600;
		color: #059669;
		margin-bottom: 1.5rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid #10b981;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.cost-card {
		background: #fff;
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
		font-weight: 600;
		color: #059669;
	}
	.cost-card-body {
		padding: 1rem;
	}
	.custom-dropdown {
		position: relative;
		width: 100%;
	}
	.dropdown-trigger {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background: #fff;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s;
	}
	.dropdown-trigger:hover {
		border-color: #10b981;
	}
	.trigger-cabinet {
		font-size: 0.8rem;
		color: #888;
		margin-left: 0.25rem;
	}
	.trigger-arrow {
		color: #10b981;
		margin-left: auto;
	}
	.dropdown-menu {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: #fff;
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
	.dropdown-search input {
		padding-left: 2rem;
	}
	.clear-search {
		position: absolute;
		right: 1.5rem;
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		color: #999;
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
		color: #333;
	}
	.option-cabinet {
		font-size: 0.75rem;
		color: #888;
		display: block;
	}
	.option-check {
		color: #10b981;
		font-weight: bold;
		margin-left: 0.5rem;
	}
	.option-id {
		font-size: 0.7rem;
		color: #999;
		font-family: monospace;
		margin-right: 0.5rem;
	}
	.dropdown-empty {
		text-align: center;
		padding: 2rem;
		color: #999;
	}
	.video-current {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		background: #fffbeb;
		border: 1px solid #f59e0b;
		border-radius: 8px;
		margin-bottom: 0.75rem;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.current-badge {
		background: #fffbeb;
		color: #d97706;
		font-size: 0.65rem;
		padding: 0.15rem 0.5rem;
		border-radius: 20px;
	}
	.new-badge {
		background: #f0fdf4;
		color: #059669;
		font-size: 0.65rem;
		padding: 0.15rem 0.5rem;
		border-radius: 20px;
	}
	.remove-video-btn {
		background: #fef2f2;
		border: 1px solid #ef4444;
		border-radius: 6px;
		color: #dc2626;
		cursor: pointer;
		font-size: 0.8rem;
		padding: 0.35rem 0.75rem;
	}
	.video-upload-area {
		position: relative;
		width: 100%;
		min-height: 100px;
		background: #f9fafb;
		border: 2px dashed #e0e0e0;
		border-radius: 8px;
		cursor: pointer;
	}
	.video-upload-area:hover {
		border-color: #f59e0b;
	}
	.image-upload-area {
		position: relative;
		width: 100%;
		min-height: 200px;
		background: #f9fafb;
		border: 2px dashed #e0e0e0;
		border-radius: 8px;
		cursor: pointer;
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
		color: #999;
		pointer-events: none;
	}
	.upload-placeholder .upload-icon {
		font-size: 2.5rem;
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
		z-index: 10;
	}
	.image-overlay {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 0.5rem;
		background: rgba(0, 0, 0, 0.5);
		text-align: center;
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.7);
		pointer-events: none;
	}
	.image-input,
	.video-input {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
		cursor: pointer;
	}
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
		color: #fff;
	}
	.btn-primary:hover:not(:disabled) {
		background: #059669;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
	}
	.btn-secondary {
		background: #fff;
		border: 1px solid #e0e0e0;
		color: #666;
	}
	.btn-secondary:hover:not(:disabled) {
		background: #f5f5f5;
	}
	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: #fff;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		display: inline-block;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	.preview-section {
		margin-top: 2rem;
	}
	.preview-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}
	.preview-header h2 {
		font-size: 1rem;
		color: #666;
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
		background: #fff;
		border: 1px solid #e0e0e0;
		border-radius: 12px;
		padding: 1.25rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	}
	.preview-image {
		width: 120px;
		height: 120px;
		background: #f9fafb;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		flex-shrink: 0;
	}
	.preview-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.preview-no-image {
		text-align: center;
		color: #999;
	}
	.preview-info {
		flex: 1;
	}
	.preview-info h3 {
		font-size: 1.1rem;
		font-weight: 600;
		color: #333;
		margin: 0 0 0.5rem;
	}
	.preview-badges {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
		flex-wrap: wrap;
	}
	.preview-category,
	.preview-sub {
		padding: 0.2rem 0.75rem;
		background: #f5f5f5;
		border-radius: 20px;
		font-size: 0.7rem;
		color: #666;
	}
	.preview-sub {
		background: #f0fdf4;
		color: #059669;
	}
	.preview-prices {
		margin-bottom: 0.75rem;
	}
	.price-display {
		font-size: 0.85rem;
		color: #059669;
		font-weight: 500;
	}
	.cost-display {
		font-size: 0.8rem;
		color: #10b981;
		margin-top: 0.25rem;
	}
	.preview-details {
		background: #f9fafb;
		border-radius: 8px;
		padding: 0.5rem;
		font-size: 0.75rem;
	}
	.preview-details div {
		display: flex;
		justify-content: space-between;
		padding: 0.25rem;
		color: #333;
	}
	.preview-details .low-stock {
		color: #d97706;
	}
	.preview-note {
		text-align: center;
		font-size: 0.75rem;
		color: #999;
		margin-top: 0.75rem;
	}
	@media (max-width: 768px) {
		.page {
			padding: 1rem;
		}
		.form-row {
			flex-direction: column;
			gap: 0;
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
