<script lang="ts">
    import { goto } from '$app/navigation';
    import type { PageProps } from './$types';
    import { onMount } from 'svelte';
    
    let { data }: PageProps = $props();
    
    let isSubmitting = $state(false);
    let showSuccess = $state(false);
    let errorMessage = $state<string | null>(null);
    
    let form = data?.form;
    let cabinets = data?.cabinets || [];

    // State untuk custom dropdown
    let isDropdownOpen = $state(false);
    let searchTerm = $state('');
    let selectedCabinet = $state<{ id: number; name: string; maxSlots: number } | null>(null);
    let dropdownRef = $state<HTMLDivElement>();

    // Filter cabinets berdasarkan search
    let filteredCabinets = $derived(() => {
        if (!searchTerm) return cabinets;
        return cabinets.filter(cabinet => 
            cabinet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cabinet.id.toString().includes(searchTerm)
        );
    });

    // Set selected cabinet dari form data jika ada
    onMount(() => {
        if (form?.data?.cabinetId) {
            const cabinet = cabinets.find(c => c.id === form.data.cabinetId);
            if (cabinet) {
                selectedCabinet = cabinet;
            }
        }
    });

    // Close dropdown when clicking outside
    function handleClickOutside(event: MouseEvent) {
        if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
            isDropdownOpen = false;
        }
    }

    onMount(() => {
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    });

    function selectCabinet(cabinet: { id: number; name: string; maxSlots: number }) {
        selectedCabinet = cabinet;
        searchTerm = '';
        isDropdownOpen = false;
    }

    function clearCabinet() {
        selectedCabinet = null;
        searchTerm = '';
    }

    // Prevent dropdown from closing when clicking inside
    function stopPropagation(e: Event) {
        e.stopPropagation();
    }

    async function goBack() {
        await goto('/admin/section');
    }

    async function handleSubmit(e: Event) {
        const formElement = e.target as HTMLFormElement;
        if (!formElement) return;
        
        e.preventDefault();
        
        // Validasi cabinet harus dipilih
        if (!selectedCabinet) {
            errorMessage = 'Please select a cabinet!';
            return;
        }
        
        isSubmitting = true;
        errorMessage = null;
        
        try {
            const formData = new FormData(formElement);
            
            // Set cabinetId dari selectedCabinet
            formData.set('cabinetId', selectedCabinet.id.toString());
            
            // Hapus layout dari formData jika ada
            formData.delete('layout');
            
            const response = await fetch('/admin/section/create', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (response.ok) {
                showSuccess = true;
                setTimeout(() => {
                    goto('/admin/section');
                }, 1500);
            } else {
                errorMessage = result.message || 'Something went wrong!';
                isSubmitting = false;
            }
        } catch (error) {
            console.error('Submit error:', error);
            errorMessage = 'Network error! Please try again.';
            isSubmitting = false;
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
            <span class="back-icon">←</span>
            <span>Back to Sections</span>
        </button>
        <h1 class="page-title">Create New Section</h1>
        <p class="page-subtitle">Add a new section to a cabinet</p>
    </div>

    <!-- Form Card -->
    <div class="form-card">
        <form method="POST" action="/admin/section/create" onsubmit={handleSubmit}>
            <!-- Success Message -->
            {#if showSuccess}
                <div class="success-message">
                    <span class="success-icon">✅</span>
                    <span>Section created successfully! Redirecting...</span>
                </div>
            {/if}

            <!-- Error Message -->
            {#if errorMessage}
                <div class="error-message">
                    <span class="error-icon">⚠️</span>
                    <span>{errorMessage}</span>
                </div>
            {/if}

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
                        placeholder="e.g., Starter Evolution, Legendary Birds"
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
                        placeholder="e.g., display, storage, archive, featured"
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
                
                <!-- Hidden input untuk mengirim cabinetId -->
                <input type="hidden" name="cabinetId" value={selectedCabinet?.id || ''} />
                
                <!-- Custom Dropdown -->
                <div class="custom-dropdown" bind:this={dropdownRef}>
                    <!-- Dropdown Trigger -->
                    <div 
                        class="dropdown-trigger glass-effect"
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

                    <!-- Dropdown Menu -->
                    {#if isDropdownOpen}
                        <div class="dropdown-menu glass-effect" onclick={stopPropagation}>
                            <!-- Search Input -->
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
                                    <button 
                                        class="clear-search"
                                        onclick={() => searchTerm = ''}
                                    >
                                        ✕
                                    </button>
                                {/if}
                            </div>

                            <!-- Options List -->
                            <div class="dropdown-options">
                                {#if filteredCabinets().length === 0}
                                    <div class="dropdown-empty">
                                        No cabinets found
                                    </div>
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
                <button 
                    type="submit" 
                    class="btn-primary" 
                    disabled={isSubmitting || showSuccess}
                >
                    {#if isSubmitting}
                        <span class="spinner"></span>
                        <span>Creating...</span>
                    {:else if showSuccess}
                        <span>✅ Created!</span>
                    {:else}
                        <span class="btn-icon">➕</span>
                        <span>Create Section</span>
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
                <span class="preview-badge">New</span>
            </div>
            <div class="preview-body">
                <div class="preview-type-badge">
                    {form?.data?.type || 'type'}
                </div>
                <div class="preview-name">
                    {form?.data?.name || 'Section Name'}
                </div>
                <div class="preview-details">
                    <div class="preview-row">
                        <span>Cabinet:</span>
                        <span>
                            {#if selectedCabinet}
                                #{selectedCabinet.id}: {selectedCabinet.name}
                            {:else}
                                Not selected
                            {/if}
                        </span>
                    </div>
                </div>
            </div>
            <div class="preview-footer">
                <span>Status: Ready</span>
            </div>
        </div>
        <p class="preview-note">Real-time preview of your section</p>
    </div>
</div>

<style>
    /* (Styling sama persis seperti sebelumnya, tidak berubah) */
    .page {
        padding: 2rem;
        max-width: 800px;
        margin: 0 auto;
    }

    /* Header */
    .header {
        margin-bottom: 2rem;
    }

    .back-button {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        color: #ffffff;
        font-family: 'Poppins', sans-serif;
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.2s ease;
        margin-bottom: 1.5rem;
    }

    .back-button:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.2);
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
        font-family: 'Poppins', sans-serif;
        font-size: 2rem;
        font-weight: 600;
        color: #ffffff;
        margin: 0 0 0.5rem 0;
    }

    .page-subtitle {
        color: rgba(255, 255, 255, 0.6);
        font-size: 1rem;
    }

    /* Form Card */
    .form-card {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 20px;
        padding: 2rem;
        margin-bottom: 2rem;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
    }

    /* Messages */
    .success-message {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem;
        background: rgba(0, 255, 0, 0.1);
        border: 1px solid rgba(0, 255, 0, 0.2);
        border-radius: 10px;
        color: #00ff00;
        margin-bottom: 1.5rem;
    }

    .error-message {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem;
        background: rgba(255, 0, 0, 0.1);
        border: 1px solid rgba(255, 0, 0, 0.2);
        border-radius: 10px;
        color: #ff6b6b;
        margin-bottom: 1.5rem;
    }

    .success-icon, .error-icon {
        font-size: 1.2rem;
    }

    /* Form Group */
    .form-group {
        margin-bottom: 1.5rem;
    }

    .form-label {
        display: block;
        font-family: 'Poppins', sans-serif;
        font-size: 0.95rem;
        font-weight: 500;
        color: #ffffff;
        margin-bottom: 0.5rem;
    }

    .required {
        color: #ff6b6b;
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
        color: rgba(255, 255, 255, 0.4);
        font-size: 1.1rem;
        z-index: 1;
    }

    .form-input {
        width: 100%;
        padding: 0.9rem 1rem 0.9rem 2.8rem;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        color: #ffffff;
        font-family: 'Poppins', sans-serif;
        font-size: 1rem;
        transition: all 0.2s ease;
    }

    .form-input:focus {
        outline: none;
        border-color: rgba(255, 255, 255, 0.3);
        background: rgba(255, 255, 255, 0.05);
        box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.05);
    }

    .form-input.error {
        border-color: #ff6b6b;
    }

    .form-input:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .form-input::placeholder {
        color: rgba(255, 255, 255, 0.2);
    }

    /* Custom Dropdown - Glassmorphism */
    .custom-dropdown {
        position: relative;
        width: 100%;
    }

    .glass-effect {
        background: rgba(20, 20, 30, 0.7);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }

    .dropdown-trigger {
        display: flex;
        align-items: center;
        padding: 0.9rem 1rem;
        background: rgba(20, 20, 30, 0.7);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        color: #ffffff;
        font-family: 'Poppins', sans-serif;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.2s ease;
        gap: 0.75rem;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }

    .dropdown-trigger:hover {
        background: rgba(30, 30, 40, 0.8);
        border-color: rgba(255, 255, 255, 0.2);
    }

    .dropdown-trigger.error {
        border-color: #ff6b6b;
    }

    .trigger-icon {
        font-size: 1.2rem;
        color: rgba(255, 255, 255, 0.6);
    }

    .trigger-text {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .trigger-text.placeholder {
        color: rgba(255, 255, 255, 0.4);
    }

    .trigger-arrow {
        color: #00ff00;
        font-size: 0.9rem;
        margin-left: auto;
    }

    .dropdown-menu {
        position: absolute;
        top: calc(100% + 8px);
        left: 0;
        right: 0;
        background: rgba(20, 20, 30, 0.9);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        z-index: 100;
        overflow: hidden;
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
        font-size: 0.9rem;
        z-index: 1;
    }

    .search-input {
        width: 100%;
        padding: 0.7rem 1rem 0.7rem 2.5rem;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        color: #ffffff;
        font-family: 'Poppins', sans-serif;
        font-size: 0.9rem;
        transition: all 0.2s ease;
    }

    .search-input:focus {
        outline: none;
        border-color: #00ff00;
        background: rgba(0, 0, 0, 0.4);
    }

    .search-input::placeholder {
        color: rgba(255, 255, 255, 0.3);
    }

    .clear-search {
        position: absolute;
        right: 1.5rem;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.4);
        font-size: 0.9rem;
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 50%;
        transition: all 0.2s ease;
        z-index: 2;
    }

    .clear-search:hover {
        color: #ffffff;
        background: rgba(255, 255, 255, 0.1);
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
        background: rgba(255, 255, 255, 0.02);
    }

    .dropdown-options::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
    }

    .dropdown-option {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        margin: 0.25rem;
    }

    .dropdown-option:hover {
        background: rgba(255, 255, 255, 0.1);
    }

    .dropdown-option.selected {
        background: rgba(0, 255, 0, 0.15);
        border-left: 3px solid #00ff00;
    }

    .option-id {
        font-family: 'Orbitron', sans-serif;
        font-size: 0.85rem;
        color: #00ff00;
        min-width: 45px;
    }

    .option-name {
        flex: 1;
        color: #ffffff;
        font-size: 0.95rem;
    }

    .option-slots {
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.5);
        margin-right: 0.5rem;
    }

    .option-check {
        color: #00ff00;
        font-weight: bold;
    }

    .dropdown-empty {
        padding: 2rem;
        text-align: center;
        color: rgba(255, 255, 255, 0.5);
        font-style: italic;
    }

    .error-text {
        display: block;
        color: #ff6b6b;
        font-size: 0.85rem;
        margin-top: 0.5rem;
    }

    .hint-text {
        display: block;
        color: rgba(255, 255, 255, 0.4);
        font-size: 0.8rem;
        margin-top: 0.5rem;
    }

    /* Form Actions */
    .form-actions {
        display: flex;
        gap: 1rem;
        margin-top: 2rem;
    }

    .btn-primary, .btn-secondary {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.9rem 1.5rem;
        border-radius: 12px;
        font-family: 'Poppins', sans-serif;
        font-size: 0.95rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        border: none;
        flex: 1;
    }

    .btn-primary {
        background: #ffffff;
        color: #000000;
    }

    .btn-primary:hover:not(:disabled) {
        background: #e0e0e0;
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(255, 255, 255, 0.2);
    }

    .btn-secondary {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #ffffff;
    }

    .btn-secondary:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.1);
        transform: translateY(-2px);
    }

    .btn-primary:disabled, .btn-secondary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .btn-icon {
        font-size: 1.1rem;
    }

    /* Spinner */
    .spinner {
        width: 18px;
        height: 18px;
        border: 2px solid rgba(0, 0, 0, 0.3);
        border-top-color: #000000;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    /* Preview Section */
    .preview-section {
        margin-top: 2rem;
    }

    .preview-title {
        font-family: 'Poppins', sans-serif;
        font-size: 1.1rem;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.7);
        margin-bottom: 1rem;
    }

    .preview-card {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        overflow: hidden;
        max-width: 300px;
    }

    .preview-header {
        padding: 0.75rem;
        background: rgba(255, 255, 255, 0.03);
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .preview-badge {
        background: rgba(255, 255, 255, 0.1);
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.8rem;
        color: #ffffff;
    }

    .preview-body {
        padding: 1.25rem;
    }

    .preview-type-badge {
        display: inline-block;
        padding: 0.2rem 1rem;
        border-radius: 20px;
        font-size: 0.75rem;
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
        margin-bottom: 0.75rem;
    }

    .preview-name {
        font-family: 'Poppins', sans-serif;
        font-size: 1.2rem;
        font-weight: 600;
        color: #ffffff;
        margin-bottom: 0.75rem;
    }

    .preview-details {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 8px;
        padding: 0.75rem;
    }

    .preview-row {
        display: flex;
        justify-content: space-between;
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.7);
    }

    .preview-row:not(:last-child) {
        margin-bottom: 0.5rem;
    }

    .preview-footer {
        padding: 0.75rem;
        background: rgba(255, 255, 255, 0.02);
        border-top: 1px solid rgba(255, 255, 255, 0.05);
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.4);
    }

    .preview-note {
        color: rgba(255, 255, 255, 0.3);
        font-size: 0.8rem;
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
    }
</style>