<script lang="ts">
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    let { data } = $props();
    let sections = data?.sections || [];
    let card = data?.card;

    let isSubmitting = $state(false);
    let imagePreview = $state<string | null>(card?.imageUrl ? `/${card.imageUrl}`.replace('//', '/') : null);
    let imageFile = $state<File | null>(null);
    let videoFile = $state<File | null>(null);
    let videoName = $state<string | null>(card?.videoUrl ? card.videoUrl.split('/').pop() : null);
    let errorMessage = $state<string | null>(null);
    let successMessage = $state<string | null>(null);

    // State untuk custom dropdown section
    let isDropdownOpen = $state(false);
    let searchTerm = $state('');
    let selectedSection = $state<any>(
        sections.find((s: any) => s.id === card?.sectionId) ?? null
    );
    let dropdownRef = $state<HTMLDivElement>();

    // Filter sections berdasarkan search
    let filteredSections = $derived(() => {
        if (!searchTerm) return sections;
        return sections.filter((section: any) =>
            section.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            section.cabinet?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    // Form fields state (untuk live preview)
    let formName = $state(card?.name || '');
    let formStock = $state(card?.stock ?? 0);
    let formLocation = $state(card?.location || '');
    let formCategory = $state(card?.category || '');
    let formSubCategory = $state(card?.subCategory || '');
    let formVideoUrl = $state(card?.videoUrl || '');
    let formQrCustomUrl = $state(card?.qrCustomUrl || '');
    let formPriceIdr = $state(card?.prices?.find((p: any) => p.currency === 'IDR')?.amount || 0);
    let formPriceNoteIdr = $state(card?.prices?.find((p: any) => p.currency === 'IDR')?.priceNote || '');
    let formPriceSgd = $state(card?.prices?.find((p: any) => p.currency === 'SGD')?.amount || 0);
    let formPriceNoteSgd = $state(card?.prices?.find((p: any) => p.currency === 'SGD')?.priceNote || '');

    function handleClickOutside(event: MouseEvent) {
        if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
            isDropdownOpen = false;
        }
    }

    onMount(() => {
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    });

    function selectSection(section: any) {
        selectedSection = section;
        searchTerm = '';
        isDropdownOpen = false;
    }

    function stopPropagation(e: Event) {
        e.stopPropagation();
    }

    function handleImageChange(e: Event) {
        const input = e.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            imageFile = input.files[0];
            imagePreview = URL.createObjectURL(imageFile);
            errorMessage = null;
        }
    }

    function handleVideoChange(e: Event) {
        const input = e.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            videoFile = input.files[0];
            videoName = input.files[0].name;
            errorMessage = null;
        }
    }

    function removeVideo() {
        videoFile = null;
        videoName = null;
    }

    function getImageUrl(url: string) {
        if (!url) return null;
        if (url.startsWith('/')) return url;
        return `/${url}`;
    }

    async function handleSubmit(e: Event) {
        e.preventDefault();

        if (!selectedSection) {
            errorMessage = 'Please select a section!';
            return;
        }

        isSubmitting = true;
        errorMessage = null;
        successMessage = null;

        const formElement = e.target as HTMLFormElement;
        const formData = new FormData(formElement);

        formData.set('sectionId', selectedSection.id.toString());

        if (imageFile) {
            formData.set('file', imageFile);
        }
        if (videoFile) {
            formData.set('videoFile', videoFile);
        }

        try {
            const response = await fetch(`/admin/card/edit?id=${card?.id}`, {
                method: 'POST',
                body: formData,
                redirect: 'manual'
            });

            if (response.type === 'opaqueredirect' || response.status === 303 || response.status === 0) {
                await goto('/admin/card?success=true');
                return;
            }

            if (response.ok) {
                await goto('/admin/card?success=true');
                return;
            }

            const text = await response.text();
            let result: any;
            try {
                result = JSON.parse(text);
            } catch {
                result = {};
            }

            errorMessage = result?.data?.message || result?.message || 'Failed to update card';
            isSubmitting = false;
        } catch (error) {
            errorMessage = 'Network error! Please try again.';
            isSubmitting = false;
        }
    }
</script>

<svelte:head>
    <title>Admin - Edit Card #{card?.id}</title>
</svelte:head>

<div class="page">
    <div class="header">
        <button class="back-btn" onclick={() => goto('/admin/card')} disabled={isSubmitting}>
            <span class="back-icon">←</span>
            <span>Back to Cards</span>
        </button>
        <h1 class="page-title">Edit Card</h1>
        <p class="page-subtitle">
            Editing: <span class="card-id-badge">#{card?.id}</span>
            <strong>{card?.name}</strong>
        </p>
    </div>

    <div class="form-card">
        <form onsubmit={handleSubmit} enctype="multipart/form-data">
            <!-- Error / Success Message -->
            {#if errorMessage}
                <div class="alert error-message">
                    <span class="alert-icon">⚠️</span>
                    <span>{errorMessage}</span>
                </div>
            {/if}
            {#if successMessage}
                <div class="alert success-message">
                    <span class="alert-icon">✅</span>
                    <span>{successMessage}</span>
                </div>
            {/if}

            <!-- Card Name -->
            <div class="form-group">
                <label>
                    <span class="label-icon">📝</span>
                    Card Name <span class="required">*</span>
                </label>
                <input
                    type="text"
                    name="name"
                    bind:value={formName}
                    required
                    disabled={isSubmitting}
                    placeholder="e.g., Pikachu VMAX, Charizard VSTAR"
                />
            </div>

            <!-- Stock & Location Row -->
            <div class="form-row">
                <div class="form-group half">
                    <label>
                        <span class="label-icon">📦</span>
                        Stock
                    </label>
                    <input
                        type="number"
                        name="stock"
                        bind:value={formStock}
                        disabled={isSubmitting}
                        min="0"
                    />
                </div>

                <div class="form-group half">
                    <label>
                        <span class="label-icon">📍</span>
                        Location <span class="required">*</span>
                    </label>
                    <input
                        type="text"
                        name="location"
                        bind:value={formLocation}
                        required
                        disabled={isSubmitting}
                        placeholder="e.g., Cabinet A - Rak 1"
                    />
                </div>
            </div>

            <!-- Category & Sub Category Row -->
            <div class="form-row">
                <div class="form-group half">
                    <label>
                        <span class="label-icon">🏷️</span>
                        Category <span class="required">*</span>
                    </label>
                    <input
                        type="text"
                        name="category"
                        bind:value={formCategory}
                        required
                        disabled={isSubmitting}
                        placeholder="e.g., VMAX, VSTAR, GX, EX"
                    />
                </div>

                <div class="form-group half">
                    <label>
                        <span class="label-icon">⚡</span>
                        Sub Category <span class="required">*</span>
                    </label>
                    <input
                        type="text"
                        name="subCategory"
                        bind:value={formSubCategory}
                        required
                        disabled={isSubmitting}
                        placeholder="e.g., Electric, Fire, Water"
                    />
                </div>
            </div>

            <!-- Section Dropdown -->
            <div class="form-group">
                <label>
                    <span class="label-icon">🗂️</span>
                    Section <span class="required">*</span>
                </label>

                <input type="hidden" name="sectionId" value={selectedSection?.id || ''} />

                <div class="custom-dropdown" bind:this={dropdownRef}>
                    <div
                        class="dropdown-trigger"
                        onclick={() => !isSubmitting && (isDropdownOpen = !isDropdownOpen)}
                    >
                        <span class="trigger-icon">📁</span>
                        {#if selectedSection}
                            <span class="trigger-text">
                                <strong>{selectedSection.name}</strong>
                                <span class="trigger-cabinet">({selectedSection.cabinet?.name})</span>
                            </span>
                        {:else}
                            <span class="trigger-text placeholder">Select a section</span>
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
                                    placeholder="Search sections..."
                                    bind:value={searchTerm}
                                    onclick={stopPropagation}
                                />
                                {#if searchTerm}
                                    <button type="button" class="clear-search" onclick={() => searchTerm = ''}>
                                        ✕
                                    </button>
                                {/if}
                            </div>

                            <div class="dropdown-options">
                                {#if filteredSections().length === 0}
                                    <div class="dropdown-empty">
                                        <span>📭</span>
                                        <p>No sections found</p>
                                    </div>
                                {:else}
                                    {#each filteredSections() as section}
                                        <div
                                            class="dropdown-option"
                                            class:selected={selectedSection?.id === section.id}
                                            onclick={() => selectSection(section)}
                                        >
                                            <div class="option-info">
                                                <span class="option-name">{section.name}</span>
                                                <span class="option-cabinet">{section.cabinet?.name}</span>
                                            </div>
                                            <div class="option-meta">
                                                <span class="option-id">ID: {section.id}</span>
                                                {#if selectedSection?.id === section.id}
                                                    <span class="option-check">✓</span>
                                                {/if}
                                            </div>
                                        </div>
                                    {/each}
                                {/if}
                            </div>
                        </div>
                    {/if}
                </div>
                <span class="hint">Choose which section this card belongs to</span>
            </div>

            <!-- PRICE SECTION -->
            <div class="price-section">
                <div class="price-header">
                    <span class="price-header-icon">💰</span>
                    <h3 class="price-title">Pricing per Market</h3>
                </div>

                <div class="price-grid">
                    <!-- IDR Price -->
                    <div class="price-card idr">
                        <div class="price-card-header">
                            <span class="currency-flag">🇮🇩</span>
                            <span class="currency-name">Indonesian Rupiah (IDR)</span>
                        </div>
                        <div class="price-card-body">
                            <div class="form-group">
                                <label>Price <span class="required">*</span></label>
                                <input
                                    type="number"
                                    name="priceIdr"
                                    bind:value={formPriceIdr}
                                    required
                                    disabled={isSubmitting}
                                    placeholder="50000"
                                />
                            </div>
                            <div class="form-group">
                                <label>Price Note <span class="required">*</span></label>
                                <input
                                    type="text"
                                    name="priceNoteIdr"
                                    bind:value={formPriceNoteIdr}
                                    required
                                    disabled={isSubmitting}
                                    placeholder="Near Mint, Lightly Played, Damaged"
                                />
                            </div>
                        </div>
                    </div>

                    <!-- SGD Price -->
                    <div class="price-card sgd">
                        <div class="price-card-header">
                            <span class="currency-flag">🇸🇬</span>
                            <span class="currency-name">Singapore Dollar (SGD)</span>
                        </div>
                        <div class="price-card-body">
                            <div class="form-group">
                                <label>Price <span class="required">*</span></label>
                                <input
                                    type="number"
                                    name="priceSgd"
                                    bind:value={formPriceSgd}
                                    required
                                    disabled={isSubmitting}
                                    placeholder="5"
                                />
                            </div>
                            <div class="form-group">
                                <label>Price Note <span class="required">*</span></label>
                                <input
                                    type="text"
                                    name="priceNoteSgd"
                                    bind:value={formPriceNoteSgd}
                                    required
                                    disabled={isSubmitting}
                                    placeholder="Near Mint, Lightly Played, Damaged"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Video URL -->
            <div class="form-group">
                <label>
                    <span class="label-icon">🎥</span>
                    Video URL (Optional)
                </label>
                <input
                    type="url"
                    name="videoUrl"
                    bind:value={formVideoUrl}
                    disabled={isSubmitting}
                    placeholder="https://youtube.com/watch?v=..."
                />
                <span class="hint">External video link (YouTube, etc.)</span>
            </div>

            <!-- QR Custom URL -->
            <div class="form-group">
                <label>
                    <span class="label-icon">📱</span>
                    QR Code Custom URL (Optional)
                </label>
                <input
                    type="url"
                    name="qrCustomUrl"
                    bind:value={formQrCustomUrl}
                    disabled={isSubmitting}
                    placeholder="https://example.com/your-custom-link"
                />
                <span class="hint">
                    Custom URL for QR code. If empty, QR will link to this card's detail page.
                </span>
            </div>

            <!-- Video Upload -->
            <div class="form-group">
                <label>
                    <span class="label-icon">🎬</span>
                    Upload Video <span class="optional-badge">Optional - Overrides video URL</span>
                </label>

                {#if videoName}
                    <div class="video-current">
                        <div class="video-info">
                            <span class="video-icon">🎬</span>
                            <span class="video-name">{videoName}</span>
                            {#if card?.videoUrl && !videoFile}
                                <span class="current-badge">Current</span>
                            {:else}
                                <span class="new-badge">New</span>
                            {/if}
                        </div>
                        <button type="button" class="remove-video-btn" onclick={removeVideo} disabled={isSubmitting}>
                            ✕ Remove
                        </button>
                    </div>
                {/if}

                <div class="video-upload-area" class:has-video={!!videoName}>
                    <div class="upload-placeholder">
                        <span class="upload-icon">🎥</span>
                        <p>{videoName ? 'Click to replace video' : 'Click or drag video here'}</p>
                        <small>MP4, WEBM up to 100MB</small>
                    </div>
                    <input
                        type="file"
                        name="videoFile"
                        accept="video/mp4,video/webm"
                        onchange={handleVideoChange}
                        class="video-input"
                        disabled={isSubmitting}
                    />
                </div>
                <span class="hint">Upload a video file (will replace video URL if set)</span>
            </div>

            <!-- Image Upload -->
            <div class="form-group">
                <label>
                    <span class="label-icon">🖼️</span>
                    Card Image
                    <span class="optional-badge">Optional – keeps current if empty</span>
                </label>
                <div class="image-upload-area" class:has-image={!!imagePreview}>
                    {#if imagePreview}
                        <img src={imagePreview} alt="Preview" class="image-preview"/>
                        <button
                            type="button"
                            class="remove-image"
                            onclick={() => {
                                imagePreview = null;
                                imageFile = null;
                            }}
                        >
                            ✕
                        </button>
                        <div class="image-overlay">
                            <span>Click or drag to change</span>
                        </div>
                    {:else}
                        <div class="upload-placeholder">
                            <span class="upload-icon">🖼️</span>
                            <p>Click or drag image here</p>
                            <small>PNG, JPG, WEBP up to 5MB</small>
                        </div>
                    {/if}
                    <input
                        type="file"
                        name="file"
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
                    onclick={() => goto('/admin/card')}
                    disabled={isSubmitting}
                >
                    <span class="btn-icon">✕</span>
                    <span>Cancel</span>
                </button>
                <button type="submit" class="btn-primary" disabled={isSubmitting}>
                    {#if isSubmitting}
                        <span class="spinner"></span>
                        <span>Saving Changes...</span>
                    {:else}
                        <span class="btn-icon">💾</span>
                        <span>Save Changes</span>
                    {/if}
                </button>
            </div>
        </form>
    </div>

    <!-- Live Preview -->
    <div class="preview-section">
        <div class="preview-header">
            <h2 class="preview-title">Live Preview</h2>
            <span class="preview-badge">Real-time</span>
        </div>
        <div class="preview-card">
            <div class="preview-image">
                {#if imagePreview}
                    <img src={imagePreview} alt="Card preview"/>
                {:else}
                    <div class="preview-no-image">
                        <span>🃏</span>
                        <small>No image</small>
                    </div>
                {/if}
            </div>
            <div class="preview-info">
                <h3 class="preview-name">{formName || 'Card Name'}</h3>
                <div class="preview-badges">
                    <span class="preview-category">{formCategory || 'Category'}</span>
                    <span class="preview-sub">{formSubCategory || 'Sub Category'}</span>
                </div>

                <div class="preview-prices">
                    <div class="preview-price idr">
                        <span class="currency">🇮🇩 IDR</span>
                        <span class="amount">Rp {Number(formPriceIdr || 0).toLocaleString('id-ID')}</span>
                        <span class="note">({formPriceNoteIdr || 'Note'})</span>
                    </div>
                    <div class="preview-price sgd">
                        <span class="currency">🇸🇬 SGD</span>
                        <span class="amount">${Number(formPriceSgd || 0).toLocaleString()}</span>
                        <span class="note">({formPriceNoteSgd || 'Note'})</span>
                    </div>
                </div>

                <div class="preview-details">
                    <div class="preview-detail">
                        <span class="detail-label">📦 Stock:</span>
                        <span class="detail-value" class:low-stock={Number(formStock) < 5}>
                            {formStock}
                        </span>
                    </div>
                    <div class="preview-detail">
                        <span class="detail-label">📍 Location:</span>
                        <span class="detail-value">{formLocation || 'Not set'}</span>
                    </div>
                    <div class="preview-detail">
                        <span class="detail-label">📱 QR Link:</span>
                        <span class="detail-value">
                            {#if formQrCustomUrl}
                                Custom URL
                            {:else}
                                Auto (Card Page)
                            {/if}
                        </span>
                    </div>
                    {#if selectedSection}
                        <div class="preview-detail">
                            <span class="detail-label">📁 Section:</span>
                            <span class="detail-value">
                                {selectedSection.name}
                                <span class="preview-cabinet">({selectedSection.cabinet?.name})</span>
                            </span>
                        </div>
                    {/if}
                    {#if videoName || formVideoUrl}
                        <div class="preview-detail">
                            <span class="detail-label">🎥 Video:</span>
                            <span class="detail-value video-set">
                                {#if videoName}
                                    Uploaded
                                {:else if formVideoUrl}
                                    Linked
                                {:else}
                                    -
                                {/if}
                            </span>
                        </div>
                    {/if}
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
    }

    .header {
        margin-bottom: 2rem;
    }

    .back-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 0.5rem 1rem;
        color: #ffffff;
        cursor: pointer;
        margin-bottom: 1rem;
        transition: all 0.2s;
    }

    .back-btn:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.1);
        transform: translateX(-4px);
    }

    .page-title {
        font-size: 2rem;
        font-weight: 600;
        color: #ffffff;
        margin: 0 0 0.25rem;
    }

    .page-subtitle {
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.95rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .card-id-badge {
        background: rgba(255, 255, 255, 0.1);
        padding: 0.15rem 0.5rem;
        border-radius: 20px;
        font-size: 0.8rem;
        font-family: monospace;
        color: rgba(255, 255, 255, 0.5);
    }

    .form-card {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 20px;
        padding: 2rem;
        margin-bottom: 2rem;
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
        color: #ffffff;
        font-weight: 500;
        font-size: 0.9rem;
        flex-wrap: wrap;
    }

    .label-icon {
        font-size: 1rem;
    }

    .required {
        color: #ff6b6b;
        margin-left: 0.25rem;
    }

    .optional-badge {
        font-size: 0.7rem;
        color: rgba(255, 255, 255, 0.4);
        font-weight: 400;
        background: rgba(255, 255, 255, 0.05);
        padding: 0.15rem 0.5rem;
        border-radius: 20px;
    }

    input {
        width: 100%;
        padding: 0.75rem 1rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        color: #ffffff;
        font-size: 0.95rem;
        transition: all 0.2s;
        box-sizing: border-box;
    }

    input:focus {
        outline: none;
        border-color: #00ff00;
        background: rgba(255, 255, 255, 0.08);
    }

    input::placeholder {
        color: rgba(255, 255, 255, 0.3);
    }

    .hint {
        display: block;
        color: rgba(255, 255, 255, 0.4);
        font-size: 0.75rem;
        margin-top: 0.25rem;
    }

    .alert {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem;
        border-radius: 10px;
        margin-bottom: 1.5rem;
    }

    .error-message {
        background: rgba(255, 0, 0, 0.1);
        border: 1px solid #ff6b6b;
        color: #ff6b6b;
    }

    .success-message {
        background: rgba(0, 255, 0, 0.1);
        border: 1px solid #00ff00;
        color: #00ff00;
    }

    /* Price Section */
    .price-section {
        margin: 1.5rem 0;
        padding: 1.5rem;
        background: rgba(255, 255, 255, 0.02);
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .price-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .price-header-icon { font-size: 1.5rem; }

    .price-title {
        font-size: 1.1rem;
        font-weight: 600;
        color: #ffffff;
        margin: 0;
    }

    .price-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
    }

    .price-card {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .price-card.idr .price-card-header {
        background: rgba(0, 255, 0, 0.1);
        border-bottom-color: #00ff00;
    }

    .price-card.sgd .price-card-header {
        background: rgba(255, 0, 0, 0.1);
        border-bottom-color: #ff6b6b;
    }

    .price-card-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        border-bottom: 2px solid;
    }

    .currency-flag { font-size: 1.5rem; }

    .currency-name {
        font-weight: 600;
        color: #ffffff;
    }

    .price-card-body { padding: 1rem; }

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
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.2s;
    }

    .dropdown-trigger:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.2);
    }

    .trigger-icon { font-size: 1.2rem; }

    .trigger-text {
        flex: 1;
        color: #ffffff;
    }

    .trigger-text.placeholder {
        color: rgba(255, 255, 255, 0.4);
    }

    .trigger-cabinet {
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.5);
        margin-left: 0.25rem;
    }

    .trigger-arrow { color: #00ff00; }

    .dropdown-menu {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: #1a1a2a;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        z-index: 100;
        margin-top: 5px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }

    .dropdown-search {
        position: relative;
        padding: 0.75rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .search-icon {
        position: absolute;
        left: 1.5rem;
        top: 50%;
        transform: translateY(-50%);
        color: rgba(255, 255, 255, 0.4);
    }

    .search-input {
        width: 100%;
        padding: 0.5rem 1rem 0.5rem 2.3rem;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        color: #ffffff;
        box-sizing: border-box;
    }

    .clear-search {
        position: absolute;
        right: 1.5rem;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.4);
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

    .dropdown-option:hover { background: rgba(255, 255, 255, 0.05); }
    .dropdown-option.selected { background: rgba(0, 255, 0, 0.1); }

    .option-name {
        font-weight: 500;
        color: #ffffff;
    }

    .option-cabinet {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.5);
        display: block;
    }

    .option-check {
        color: #00ff00;
        font-weight: bold;
    }

    .option-id {
        font-size: 0.7rem;
        color: rgba(255, 255, 255, 0.3);
        font-family: monospace;
    }

    .dropdown-empty {
        text-align: center;
        padding: 2rem;
        color: rgba(255, 255, 255, 0.5);
    }

    /* Video Upload */
    .video-current {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem 1rem;
        background: rgba(255, 170, 0, 0.08);
        border: 1px solid rgba(255, 170, 0, 0.2);
        border-radius: 10px;
        margin-bottom: 0.75rem;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .video-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .video-icon { font-size: 1.2rem; }

    .video-name {
        font-size: 0.85rem;
        color: #ffffff;
        max-width: 300px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .current-badge, .new-badge {
        font-size: 0.65rem;
        padding: 0.15rem 0.5rem;
        border-radius: 20px;
    }

    .current-badge {
        background: rgba(255, 170, 0, 0.2);
        color: #ffaa00;
    }

    .new-badge {
        background: rgba(0, 255, 0, 0.2);
        color: #00ff00;
    }

    .remove-video-btn {
        background: rgba(255, 107, 107, 0.1);
        border: 1px solid rgba(255, 107, 107, 0.3);
        border-radius: 8px;
        color: #ff6b6b;
        cursor: pointer;
        font-size: 0.8rem;
        padding: 0.35rem 0.75rem;
        transition: all 0.2s;
    }

    .remove-video-btn:hover:not(:disabled) {
        background: rgba(255, 107, 107, 0.2);
    }

    .video-upload-area {
        position: relative;
        width: 100%;
        min-height: 100px;
        background: rgba(255, 255, 255, 0.03);
        border: 2px dashed rgba(255, 255, 255, 0.15);
        border-radius: 12px;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.2s;
        box-sizing: border-box;
    }

    .video-upload-area:hover {
        border-color: #ffaa00;
    }

    .video-upload-area.has-video {
        border-color: rgba(255, 170, 0, 0.4);
    }

    .video-input {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        cursor: pointer;
    }

    /* Image Upload */
    .image-upload-area {
        position: relative;
        width: 100%;
        min-height: 200px;
        background: rgba(255, 255, 255, 0.03);
        border: 2px dashed rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.2s;
        box-sizing: border-box;
    }

    .image-upload-area:hover { border-color: #00ff00; }
    .image-upload-area.has-image { border-color: #00ff00; }

    .upload-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        text-align: center;
        color: rgba(255, 255, 255, 0.5);
        pointer-events: none;
    }

    .upload-icon {
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
        font-size: 0.9rem;
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

    .btn-primary, .btn-secondary {
        flex: 1;
        padding: 0.85rem;
        border-radius: 10px;
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
        background: #ffffff;
        color: #000000;
    }

    .btn-primary:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 5px 20px rgba(255, 255, 255, 0.2);
    }

    .btn-secondary {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #ffffff;
    }

    .btn-secondary:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.1);
    }

    button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .spinner {
        width: 18px;
        height: 18px;
        border: 2px solid rgba(0, 0, 0, 0.3);
        border-top-color: #000;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        display: inline-block;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    /* Preview Section */
    .preview-section { margin-top: 2rem; }

    .preview-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    .preview-title {
        font-size: 1.1rem;
        color: rgba(255, 255, 255, 0.7);
        margin: 0;
    }

    .preview-badge {
        font-size: 0.7rem;
        padding: 0.25rem 0.75rem;
        background: rgba(0, 255, 0, 0.1);
        border: 1px solid rgba(0, 255, 0, 0.3);
        border-radius: 20px;
        color: #00ff00;
    }

    .preview-card {
        display: flex;
        gap: 1.25rem;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01));
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        padding: 1.25rem;
    }

    .preview-image {
        width: 120px;
        height: 120px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 12px;
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
        color: rgba(255, 255, 255, 0.4);
    }

    .preview-info { flex: 1; }

    .preview-name {
        font-size: 1.2rem;
        font-weight: 600;
        color: #ffffff;
        margin: 0 0 0.5rem;
    }

    .preview-badges {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
        flex-wrap: wrap;
    }

    .preview-category, .preview-sub {
        padding: 0.2rem 0.75rem;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        font-size: 0.7rem;
        color: #ffffff;
    }

    .preview-sub {
        background: rgba(0, 255, 0, 0.1);
        color: #00ff00;
    }

    .preview-prices { margin-bottom: 0.75rem; }

    .preview-price {
        font-size: 0.85rem;
        padding: 0.2rem 0;
        display: flex;
        align-items: baseline;
        gap: 0.4rem;
        flex-wrap: wrap;
    }

    .preview-price.idr .amount { color: #00ff00; font-weight: 600; }
    .preview-price.sgd .amount { color: #ffaa00; font-weight: 600; }

    .preview-price .currency {
        font-weight: 500;
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.8rem;
        min-width: 70px;
    }

    .preview-price .note {
        font-size: 0.7rem;
        color: rgba(255, 255, 255, 0.45);
    }

    .preview-details {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 8px;
        padding: 0.5rem;
    }

    .preview-detail {
        display: flex;
        justify-content: space-between;
        font-size: 0.75rem;
        padding: 0.25rem 0.25rem;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .detail-label { color: rgba(255, 255, 255, 0.5); }
    .detail-value { color: rgba(255, 255, 255, 0.8); }
    .detail-value.low-stock { color: #ffaa00; }
    .detail-value.video-set { color: #00ff00; }

    .preview-cabinet {
        font-size: 0.7rem;
        color: rgba(255, 255, 255, 0.5);
    }

    .preview-note {
        text-align: center;
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.3);
        margin-top: 0.75rem;
    }

    @media (max-width: 768px) {
        .page { padding: 1rem; }
        .form-row { flex-direction: column; gap: 0; }
        .price-grid { grid-template-columns: 1fr; }
        .preview-card { flex-direction: column; align-items: center; text-align: center; }
        .preview-badges { justify-content: center; }
        .form-actions { flex-direction: column; }
        .page-subtitle { flex-wrap: wrap; }
        .video-name { max-width: 150px; }
    }
</style>