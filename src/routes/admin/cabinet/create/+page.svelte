<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation'
	import type { PageProps } from './$types'
	import { browser } from '$app/environment'

	let enhance: any = null
	if (browser) {
		import('$app/forms').then((module) => {
			enhance = module.enhance
		})
	}

	let { data }: PageProps = $props()
	let isSubmitting = $state(false)
	let showSuccess = $state(false)
	let errorMessage = $state<string | null>(null)
	let form = data?.form

	async function goBack() {
		await goto('/admin/cabinet')
	}

	async function handleSubmit(e: Event) {
		const formElement = e.target as HTMLFormElement
		if (!formElement) return

		e.preventDefault()
		isSubmitting = true
		errorMessage = null

		try {
			const formData = new FormData(formElement)
			const response = await fetch(formElement.action, {
				method: 'POST',
				body: formData
			})

			const result = await response.json()

			if (response.ok) {
				await invalidateAll()
				await new Promise((resolve) => setTimeout(resolve, 100))
				showSuccess = true

				setTimeout(async () => {
					await goto('/admin/cabinet?refresh=true')
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
		<form method="POST" action="/admin/cabinet/create" onsubmit={handleSubmit}>
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
						placeholder="e.g., Main Storage, Electronics Cabinet"
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
						placeholder="e.g., 100"
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
						Each cabinet can contain multiple sections. The maximum slots determine how many
						sections can be stored in this cabinet. You can change this later.
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
				<button type="submit" class="btn-primary" disabled={isSubmitting || showSuccess}>
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
		background: #f5f5f5;
		min-height: 100vh;
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

	/* Form Card */
	.form-card {
		background: #ffffff;
		border: 1px solid #e5e5e5;
		border-radius: 12px;
		padding: 2rem;
		margin-bottom: 2rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	}

	/* Messages */
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

	/* Form Group */
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

	.form-input::placeholder {
		color: #cccccc;
	}

	.form-input[type='number']::-webkit-inner-spin-button,
	.form-input[type='number']::-webkit-outer-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
	.form-input[type='number'] {
		-moz-appearance: textfield;
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

	/* Info Card */
	.info-card {
		display: flex;
		gap: 1rem;
		padding: 1rem;
		background: #f9fafb;
		border: 1px solid #e5e5e5;
		border-radius: 8px;
		margin: 1.5rem 0;
	}

	.info-icon {
		font-size: 1.5rem;
	}

	.info-title {
		font-family: 'Inter', sans-serif;
		font-size: 0.9rem;
		font-weight: 600;
		color: #333333;
		margin: 0 0 0.25rem 0;
	}

	.info-text {
		color: #666666;
		font-size: 0.85rem;
		line-height: 1.5;
		margin: 0;
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

	/* Spinner */
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

	.preview-name {
		font-family: 'Inter', sans-serif;
		font-size: 1rem;
		font-weight: 600;
		color: #333333;
		margin-bottom: 0.75rem;
	}

	.preview-slots {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.85rem;
	}

	.preview-label {
		color: #999999;
	}

	.preview-value {
		font-family: 'Inter', sans-serif;
		font-weight: 500;
		color: #10b981;
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
	}
</style>
