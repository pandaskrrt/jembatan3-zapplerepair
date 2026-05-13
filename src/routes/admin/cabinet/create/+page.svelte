<script lang="ts">
    import { goto, invalidateAll } from '$app/navigation';
    import type { PageProps } from './$types';
    import { browser } from '$app/environment';
    
    let enhance: any = null;
    if (browser) {
        import('$app/forms').then((module) => {
            enhance = module.enhance;
        });
    }

    let { data }: PageProps = $props();
    let isSubmitting = $state(false);
    let showSuccess = $state(false);
    let errorMessage = $state<string | null>(null);
    let form = data?.form;

    async function goBack() {
        await goto('/admin/cabinet');
    }

    async function handleSubmit(e: Event) {
        const formElement = e.target as HTMLFormElement;
        if (!formElement) return;
        
        e.preventDefault();
        isSubmitting = true;
        errorMessage = null;
        
        try {
            const formData = new FormData(formElement);
            const response = await fetch(formElement.action, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (response.ok) {
                // 1. Invalidate data dulu
                await invalidateAll();
                
                // 2. Tunggu sebentar (opsional, untuk memastikan invalidate selesai)
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // 3. Tampilkan success
                showSuccess = true;
                
                // 4. Redirect ke halaman cabinet
                setTimeout(async () => {
                    await goto('/admin/cabinet?refresh=true');  // Tambah query param
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
    <title>Admin - Create Cabinet</title>
</svelte:head>

<div class="page">
    <!-- Header dengan tombol back -->
    <div class="header">
        <button class="back-button" onclick={goBack} disabled={isSubmitting}>
            <span class="back-icon">←</span>
            <span>Back to Cabinets</span>
        </button>
        <h1 class="page-title">Create New Cabinet</h1>
        <p class="page-subtitle">Add a new storage cabinet to your collection</p>
    </div>

    <!-- Form Card -->
    <div class="form-card">
        <form 
            method="POST" 
            action="/admin/cabinet/create"
            onsubmit={handleSubmit}
        >
            <!-- Success Message -->
            {#if showSuccess}
                <div class="success-message">
                    <span class="success-icon">✅</span>
                    <span>Cabinet created successfully! Redirecting...</span>
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
                    Cabinet Name <span class="required">*</span>
                </label>
                <div class="input-wrapper">
                    <span class="input-icon">📦</span>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        class="form-input"
                        class:error={form?.errors?.name}
                        placeholder="e.g., Pokemon Collection, Magic Cabinet"
                        value={form?.data?.name || ''}
                        required
                        disabled={isSubmitting || showSuccess}
                    />
                </div>
                {#if form?.errors?.name}
                    <span class="error-text">{form.errors.name[0]}</span>
                {/if}
                <span class="hint-text">Give your cabinet a descriptive name</span>
            </div>

            <!-- Max Slots Field -->
            <div class="form-group">
                <label for="maxSlots" class="form-label">
                    Maximum Slots <span class="required">*</span>
                </label>
                <div class="input-wrapper">
                    <span class="input-icon">⚡</span>
                    <input
                        type="number"
                        id="maxSlots"
                        name="maxSlots"
                        class="form-input"
                        class:error={form?.errors?.maxSlots}
                        placeholder="e.g., 98"
                        min="1"
                        max="999"
                        value={form?.data?.maxSlots || ''}
                        required
                        disabled={isSubmitting || showSuccess}
                    />
                </div>
                {#if form?.errors?.maxSlots}
                    <span class="error-text">{form.errors.maxSlots[0]}</span>
                {/if}
                <span class="hint-text">Maximum number of sections this cabinet can hold</span>
            </div>

            <!-- Info Card -->
            <div class="info-card">
                <div class="info-icon">ℹ️</div>
                <div class="info-content">
                    <h4 class="info-title">About Cabinet Slots</h4>
                    <p class="info-text">
                        Each cabinet can contain multiple sections. The maximum slots determine 
                        how many sections can be stored in this cabinet. You can change this later.
                    </p>
                </div>
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
                        <span>Create Cabinet</span>
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
                <div class="preview-name">
                    {form?.data?.name || 'Cabinet Name'}
                </div>
                <div class="preview-slots">
                    <span class="preview-label">Max Slots:</span>
                    <span class="preview-value">{form?.data?.maxSlots || '0'}</span>
                </div>
            </div>
            <div class="preview-footer">
                <span class="preview-id">ID: #new</span>
            </div>
        </div>
        <p class="preview-note">Real-time preview of your cabinet</p>
    </div>
</div>

<style>
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

    .form-input[type="number"]::-webkit-inner-spin-button,
    .form-input[type="number"]::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
    .form-input[type="number"] {
        -moz-appearance: textfield;
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

    /* Info Card */
    .info-card {
        display: flex;
        gap: 1rem;
        padding: 1.25rem;
        background: rgba(0, 0, 0, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        margin: 2rem 0;
    }

    .info-icon {
        font-size: 1.5rem;
    }

    .info-title {
        font-family: 'Poppins', sans-serif;
        font-size: 1rem;
        font-weight: 500;
        color: #ffffff;
        margin: 0 0 0.25rem 0;
    }

    .info-text {
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.9rem;
        line-height: 1.5;
        margin: 0;
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

    .preview-name {
        font-family: 'Poppins', sans-serif;
        font-size: 1.2rem;
        font-weight: 600;
        color: #ffffff;
        margin-bottom: 0.75rem;
    }

    .preview-slots {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.95rem;
    }

    .preview-label {
        color: rgba(255, 255, 255, 0.5);
    }

    .preview-value {
        font-family: 'Poppins', sans-serif;
        font-weight: 500;
        color: #ffffff;
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