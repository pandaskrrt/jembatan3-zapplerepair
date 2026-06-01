<script lang="ts">
	import { goto } from '$app/navigation'
	import { onMount } from 'svelte'

	let { data } = $props()
	let sections = data?.sections || []
	let item = data?.item

	let isSubmitting = $state(false)
	let showSuccess = $state(false)
	let errorMessage = $state<string | null>(null)

	let imagePreview = $state<string | null>(
		item?.imageUrl ? (item.imageUrl.startsWith('/') ? item.imageUrl : `/${item.imageUrl}`) : null
	)
	let imageFile = $state<File | null>(null)
	let videoFile = $state<File | null>(null)
	let videoName = $state<string | null>(item?.videoUrl ? item.videoUrl.split('/').pop() : null)

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

	async function goBack() {
		await goto('/admin/stock')
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
			const response = await fetch(`/admin/stock/edit?id=${item?.id}`, {
				method: 'POST',
				body: formData,
				redirect: 'manual'
			})

			if (response.type === 'opaqueredirect' || response.status === 303 || response.status === 0) {
				showSuccess = true
				setTimeout(() => {
					goto('/admin/stock?success=true')
				}, 1500)
				return
			}

			if (response.ok) {
				showSuccess = true
				setTimeout(() => {
					goto('/admin/stock?success=true')
				}, 1500)
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

	function formatPrice(amount: number): string {
		return new Intl.NumberFormat('id-ID').format(amount || 0)
	}
</script>

<svelte:head>
	<title>Admin - Edit Item #{item?.id}</title>
</svelte:head>

<div class="page">
	<!-- Header -->
	<div class="header">
		<button class="back-button" onclick={goBack} disabled={isSubmitting || showSuccess}>
			<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
				<line x1="19" y1="12" x2="5" y2="12"></line>
				<polyline points="12 19 5 12 12 5"></polyline>
			</svg>
			<span>Back to Stock</span>
		</button>
		<h1 class="page-title">Edit Item</h1>
		<p class="page-subtitle">Editing: #{item?.id} - {item?.name}</p>
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
						<span>Item updated successfully! Redirecting...</span>
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
								bind:value={formName}
								required
								disabled={isSubmitting || showSuccess}
							/>
						</div>
					</div>

					<!-- Stock & Location Row -->
					<div class="form-group">
						<label class="form-label">Stock</label>
						<div class="input-wrapper">
							<span class="input-icon">
								<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
									<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
								</svg>
							</span>
							<input
								type="number"
								class="form-input"
								bind:value={formStock}
								disabled={isSubmitting || showSuccess}
								min="0"
								placeholder="0"
							/>
						</div>
					</div>

					<div class="form-group">
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
								bind:value={formLocation}
								required
								disabled={isSubmitting || showSuccess}
								placeholder="e.g., Cabinet A - Shelf 1"
							/>
						</div>
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
							<input
								type="text"
								class="form-input"
								bind:value={formCategory}
								required
								disabled={isSubmitting || showSuccess}
								placeholder="e.g., Electronics, Furniture"
							/>
						</div>
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
								bind:value={formSubCategory}
								required
								disabled={isSubmitting || showSuccess}
								placeholder="e.g., Laptop, Mouse"
							/>
						</div>
					</div>

					<!-- Serial Number -->
					<div class="form-group full-width">
						<label class="form-label">Serial Number</label>
						<div class="input-wrapper">
							<span class="input-icon">
								<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<circle cx="12" cy="12" r="2"></circle>
									<path d="M16.24 7.76a6 6 0 0 1 0 8.48"></path>
									<path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
									<path d="M7.76 16.24a6 6 0 0 1 0-8.48"></path>
									<path d="M4.93 19.07a10 10 0 0 1 0-14.14"></path>
								</svg>
							</span>
							<input
								type="text"
								class="form-input"
								bind:value={formSerialNumber}
								disabled={isSubmitting || showSuccess}
								placeholder="Unique serial number"
							/>
						</div>
						<span class="hint-text">Must be unique if provided</span>
					</div>

					<!-- Section Dropdown -->
					<div class="form-group full-width">
						<label class="form-label">
							Section <span class="required">*</span>
						</label>
						<div class="custom-dropdown" bind:this={dropdownRef}>
							<div
								class="dropdown-trigger"
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
						<span class="hint-text">Choose which section this item belongs to</span>
					</div>

					<!-- Price Section -->
					<div class="form-group full-width">
						<label class="form-label">Selling Price <span class="required">*</span></label>
						<div class="price-row">
							<div class="price-input-wrapper">
								<span class="currency-label">IDR</span>
								<input
									type="number"
									class="form-input price-input"
									bind:value={formPriceIdr}
									required
									disabled={isSubmitting || showSuccess}
									placeholder="Amount"
									min="0"
								/>
							</div>
							<input
								type="text"
								class="form-input price-note"
								bind:value={formPriceNoteIdr}
								required
								disabled={isSubmitting || showSuccess}
								placeholder="Note (e.g., Retail, Wholesale)"
							/>
						</div>
					</div>

					<!-- Cost Price Section -->
					<div class="form-group full-width">
						<label class="form-label">Cost Price <span class="optional">(Optional)</span></label>
						<div class="price-row">
							<div class="price-input-wrapper">
								<span class="currency-label">IDR</span>
								<input
									type="number"
									class="form-input price-input"
									bind:value={formCostPrice}
									disabled={isSubmitting || showSuccess}
									placeholder="Amount"
									min="0"
								/>
							</div>
							<input
								type="text"
								class="form-input price-note"
								bind:value={formCostNote}
								disabled={isSubmitting || showSuccess}
								placeholder="Note (e.g., Supplier A, Wholesale)"
							/>
						</div>
					</div>

					<!-- Video URL -->
					<div class="form-group full-width">
						<label class="form-label">Video URL</label>
						<div class="input-wrapper">
							<span class="input-icon">
								<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<rect x="2" y="4" width="20" height="16" rx="2"></rect>
									<polygon points="10 8 16 12 10 16 10 8"></polygon>
								</svg>
							</span>
							<input
								type="url"
								class="form-input"
								bind:value={formVideoUrl}
								disabled={isSubmitting || showSuccess}
								placeholder="https://youtube.com/watch?v=..."
							/>
						</div>
						<span class="hint-text">Link to showcase video of the item</span>
					</div>

					<!-- QR Custom URL -->
					<div class="form-group full-width">
						<label class="form-label">QR Code Custom URL</label>
						<div class="input-wrapper">
							<span class="input-icon">
								<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<rect x="3" y="3" width="7" height="7"></rect>
									<rect x="14" y="3" width="7" height="7"></rect>
									<rect x="3" y="14" width="7" height="7"></rect>
									<rect x="14" y="14" width="7" height="7"></rect>
								</svg>
							</span>
							<input
								type="url"
								class="form-input"
								bind:value={formQrCustomUrl}
								disabled={isSubmitting || showSuccess}
								placeholder="https://example.com/custom-link"
							/>
						</div>
						<span class="hint-text">Custom URL for QR code. If empty, QR will link to this item's detail page.</span>
					</div>

					<!-- Video Upload -->
					<div class="form-group full-width">
						<label class="form-label">Upload Video <span class="optional">(Optional)</span></label>
						{#if videoName || formVideoUrl}
							<div class="video-current">
								<span>🎬 {videoName || (formVideoUrl ? 'Current video' : 'No video')}</span>
								{#if item?.videoUrl && !videoFile}<span class="current-badge">Current</span>{/if}
								{#if videoFile}<span class="new-badge">New</span>{/if}
								<button type="button" class="remove-video-btn" onclick={removeVideo}>Remove</button>
							</div>
						{/if}
						<div class="video-upload-area">
							<div class="upload-placeholder">
								<svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
									<rect x="2" y="4" width="20" height="16" rx="2"></rect>
									<polygon points="10 8 16 12 10 16 10 8"></polygon>
								</svg>
								<span>{videoName ? 'Click to replace video' : 'Click or drag video here'}</span>
								<small>MP4, WEBM up to 100MB</small>
							</div>
							<input
								type="file"
								accept="video/mp4,video/webm"
								onchange={handleVideoChange}
								class="video-input"
								disabled={isSubmitting || showSuccess}
							/>
						</div>
						<span class="hint-text">Leave empty to keep current video</span>
					</div>

					<!-- Image Upload -->
					<div class="form-group full-width">
						<label class="form-label">Item Image <span class="optional">(Optional)</span></label>
						<div class="image-upload-area" class:has-image={!!imagePreview}>
							{#if imagePreview}
								<img src={imagePreview} alt="Preview" class="image-preview" />
								<button type="button" class="remove-image" onclick={removeImage}>✕</button>
							{:else}
								<div class="upload-placeholder">
									<svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
										<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
										<circle cx="8.5" cy="8.5" r="1.5"></circle>
										<polyline points="21 15 16 10 5 21"></polyline>
									</svg>
									<span>Click or drag image here</span>
									<small>PNG, JPG, WEBP up to 5MB</small>
								</div>
							{/if}
							<input
								type="file"
								accept="image/jpeg,image/png,image/webp,image/jpg"
								onchange={handleImageChange}
								class="image-input"
								disabled={isSubmitting || showSuccess}
							/>
						</div>
						<span class="hint-text">Leave empty to keep current image</span>
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
							<span>Saving...</span>
						{:else if showSuccess}
							<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
								<polyline points="20 6 9 17 4 12"></polyline>
							</svg>
							<span>Saved!</span>
						{:else}
							<span class="btn-icon">
								<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
									<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
									<polyline points="17 21 17 13 7 13 7 21"></polyline>
									<polyline points="7 3 7 8 15 8"></polyline>
								</svg>
							</span>
							<span>Save Changes</span>
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
					<span class="preview-badge">Editing Item</span>
				</div>
				<div class="preview-body">
					<div class="preview-image">
						{#if imagePreview}
							<img src={imagePreview} alt="Preview" />
						{:else}
							<div class="preview-no-image">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
									<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
									<circle cx="8.5" cy="8.5" r="1.5"></circle>
									<polyline points="21 15 16 10 5 21"></polyline>
								</svg>
							</div>
						{/if}
					</div>
					<div class="preview-info">
						<div class="preview-badges">
							<span class="preview-category">{formCategory || 'Category'}</span>
							<span class="preview-sub">{formSubCategory || 'Sub'}</span>
						</div>
						<div class="preview-name">{formName || 'Item Name'}</div>
						<div class="preview-details">
							<div class="preview-row">
								<span class="lbl">Stock:</span>
								<span class="val">{formStock || 0}</span>
							</div>
							<div class="preview-row">
								<span class="lbl">Location:</span>
								<span class="val">{formLocation || '—'}</span>
							</div>
							<div class="preview-row">
								<span class="lbl">Section:</span>
								<span class="val">{selectedSection?.name || '—'}</span>
							</div>
							<div class="preview-row">
								<span class="lbl">Price:</span>
								<span class="val price">Rp {formatPrice(Number(formPriceIdr || 0))}</span>
							</div>
							{#if formCostPrice && formCostPrice > 0}
								<div class="preview-row">
									<span class="lbl">Cost:</span>
									<span class="val">Rp {formatPrice(Number(formCostPrice))}</span>
								</div>
							{/if}
							{#if formSerialNumber}
								<div class="preview-row">
									<span class="lbl">SN:</span>
									<span class="val mono">{formSerialNumber}</span>
								</div>
							{/if}
						</div>
					</div>
				</div>
				<div class="preview-footer">
					<div class="status-indicator">
						<span class="dot"></span>
						<span>Ready to save</span>
					</div>
				</div>
			</div>
			<p class="preview-note">Preview updates as you edit the form</p>
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

	.form-input:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.form-input::placeholder {
		color: #52525b;
	}

	/* Price Row */
	.price-row {
		display: flex;
		gap: 0.75rem;
	}

	.price-input-wrapper {
		flex: 1;
		position: relative;
	}

	.currency-label {
		position: absolute;
		left: 1rem;
		top: 50%;
		transform: translateY(-50%);
		font-size: 0.8rem;
		font-weight: 600;
		color: #10b981;
		z-index: 1;
	}

	.price-input {
		padding-left: 3.5rem;
	}

	.price-note {
		flex: 1.5;
		padding: 0.7rem 1rem;
	}

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

	.hint-text {
		display: block;
		color: #71717a;
		font-size: 0.75rem;
		margin-top: 0.4rem;
	}

	/* Video Upload */
	.video-current {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.6rem 1rem;
		background: rgba(245, 158, 11, 0.1);
		border: 1px solid rgba(245, 158, 11, 0.2);
		border-radius: 8px;
		margin-bottom: 0.75rem;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.current-badge {
		background: rgba(245, 158, 11, 0.2);
		color: #f59e0b;
		font-size: 0.65rem;
		padding: 0.15rem 0.5rem;
		border-radius: 20px;
	}

	.new-badge {
		background: rgba(16, 185, 129, 0.2);
		color: #10b981;
		font-size: 0.65rem;
		padding: 0.15rem 0.5rem;
		border-radius: 20px;
	}

	.remove-video-btn {
		background: rgba(239, 68, 68, 0.15);
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: 6px;
		color: #ef4444;
		cursor: pointer;
		font-size: 0.75rem;
		padding: 0.25rem 0.75rem;
		transition: all 0.2s;
	}

	.remove-video-btn:hover {
		background: rgba(239, 68, 68, 0.25);
	}

	/* Image Upload */
	.image-upload-area,
	.video-upload-area {
		position: relative;
		width: 100%;
		min-height: 160px;
		background: rgba(20, 20, 22, 0.6);
		border: 1px dashed rgba(255, 255, 255, 0.15);
		border-radius: 10px;
		overflow: hidden;
		cursor: pointer;
		transition: all 0.2s;
	}

	.image-upload-area:hover,
	.video-upload-area:hover {
		border-color: #10b981;
		background: rgba(20, 20, 22, 0.8);
	}

	.image-upload-area.has-image {
		border-color: #10b981;
		border-style: solid;
	}

	.upload-placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		text-align: center;
		gap: 0.5rem;
	}

	.upload-icon {
		width: 2rem;
		height: 2rem;
		color: #71717a;
	}

	.upload-placeholder span {
		color: #a1a1a5;
		font-size: 0.85rem;
	}

	.upload-placeholder small {
		color: #52525b;
		font-size: 0.7rem;
	}

	.image-preview {
		width: 100%;
		height: 160px;
		object-fit: contain;
		background: rgba(0, 0, 0, 0.3);
	}

	.remove-image {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		width: 28px;
		height: 28px;
		background: rgba(0, 0, 0, 0.7);
		border: none;
		border-radius: 50%;
		color: white;
		cursor: pointer;
		font-size: 0.8rem;
		transition: all 0.2s;
	}

	.remove-image:hover {
		background: #ef4444;
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

	.preview-image {
		width: 80px;
		height: 80px;
		background: rgba(255, 255, 255, 0.03);
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
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #52525b;
	}

	.preview-no-image svg {
		width: 2rem;
		height: 2rem;
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

	.preview-row .val.mono {
		font-family: monospace;
		font-size: 0.65rem;
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
		.price-row {
			flex-direction: column;
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