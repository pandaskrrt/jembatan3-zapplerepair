<script lang="ts">
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import type { PageProps } from './$types'

	let { data }: PageProps = $props()

	let isSubmitting = $state(false)
	let showSuccess = $state(false)
	let errorMessage = $state<string | null>(null)

	let form = data?.form
	let cabinet = data?.cabinet

	let cabinetId = $page.url.searchParams.get('id')

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
				showSuccess = true
				setTimeout(() => {
					goto('/admin/cabinet')
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
	<title>Admin - Edit Cabinet</title>
</svelte:head>

<div class="page">
	<div class="header">
		<button class="back-button" onclick={goBack} disabled={isSubmitting}>
			<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<line x1="19" y1="12" x2="5" y2="12"></line>
				<polyline points="12 19 5 12 12 5"></polyline>
			</svg>
			<span>Back to Cabinets</span>
		</button>
		<h1 class="page-title">Edit Cabinet</h1>
		<p class="page-subtitle">Update cabinet #{cabinet?.id} - {cabinet?.name}</p>
	</div>

	<div class="form-card">
		<form method="POST" action={`/admin/cabinet/edit?id=${cabinetId}`} onsubmit={handleSubmit}>
			{#if showSuccess}
				<div class="success-message">
					<svg class="icon success-color" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
						<polyline points="22 4 12 14.01 9 11.01"></polyline>
					</svg>
					<span>Cabinet updated successfully! Redirecting...</span>
				</div>
			{/if}

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

			<input type="hidden" name="id" value={cabinetId || ''} />

			<div class="form-group">
				<label class="form-label">Cabinet ID</label>
				<div class="input-wrapper">
					<span class="input-icon">
						<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<line x1="4" y1="9" x2="20" y2="9"></line>
							<line x1="4" y1="15" x2="20" y2="15"></line>
							<line x1="10" y1="3" x2="8" y2="21"></line>
							<line x1="16" y1="3" x2="14" y2="21"></line>
						</svg>
					</span>
					<input type="text" class="form-input" value={cabinet?.id || ''} readonly disabled />
				</div>
				<span class="hint-text">Cabinet ID cannot be changed</span>
			</div>

			<div class="form-group">
				<label for="name" class="form-label">
					Cabinet Name <span class="required">*</span>
				</label>
				<div class="input-wrapper">
					<span class="input-icon">
						<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<polyline points="21 8 21 21 3 21 3 8"></polyline>
							<rect x="1" y="3" width="22" height="5"></rect>
							<line x1="10" y1="12" x2="14" y2="12"></line>
						</svg>
					</span>
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

			<div class="form-group">
				<label for="maxSlots" class="form-label">
					Maximum Slots <span class="required">*</span>
				</label>
				<div class="input-wrapper">
					<span class="input-icon">
						<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
						</svg>
					</span>
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

			<div class="info-card">
				<div class="info-icon">
					<svg class="icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="12" cy="12" r="10"></circle>
						<line x1="12" y1="16" x2="12" y2="12"></line>
						<line x1="12" y1="8" x2="12.01" y2="8"></line>
					</svg>
				</div>
				<div class="info-content">
					<h4 class="info-title">Editing Cabinet #{cabinet?.id}</h4>
					<p class="info-text">
						You are editing cabinet <strong>"{cabinet?.name}"</strong>. Changes will be applied immediately after saving.
					</p>
				</div>
			</div>

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
						<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
							<polyline points="20 6 9 17 4 12"></polyline>
						</svg>
						<span>Updated!</span>
					{:else}
						<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
							<path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"></path>
						</svg>
						<span>Update Cabinet</span>
					{/if}
				</button>
			</div>
		</form>
	</div>

	<div class="preview-section">
		<h2 class="preview-title">Preview</h2>
		<div class="preview-card">
			<div class="preview-header">
				<span class="preview-badge">ID: #{cabinet?.id}</span>
			</div>
			<div class="preview-body">
				<div class="preview-name">
					{form?.data?.name || cabinet?.name || 'Cabinet Name'}
				</div>
				<div class="preview-slots">
					<span class="preview-label">Max Slots:</span>
					<span class="preview-value">{form?.data?.maxSlots || cabinet?.maxSlots || '0'}</span>
				</div>
			</div>
			<div class="preview-footer">
				<span class="preview-id">Status: Ready to update</span>
			</div>
		</div>
		<p class="preview-note">Real-time preview of your cabinet</p>
	</div>
</div>

<style>
	/* UTILITY SVG GLOBAL */
	.icon {
		width: 1.25rem;
		height: 1.25rem;
	}
	.icon-sm {
		width: 1rem;
		height: 1rem;
	}
	.icon-lg {
		width: 1.5rem;
		height: 1.5rem;
	}

	.page {
		padding: 2rem;
		max-width: 800px;
		margin: 0 auto;
		background: transparent;
		min-height: 100vh;
		color: #e3e4e6;
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
		border-color: rgba(255, 255, 255, 0.15);
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
		margin: 0 0 0.5rem 0;
	}

	.page-subtitle {
		color: #a1a1a5;
		font-size: 1rem;
	}

	/* Form Card */
	.form-card {
		background: rgba(20, 20, 22, 0.8);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 12px;
		padding: 2rem;
		margin-bottom: 2rem;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
		backdrop-filter: blur(10px);
	}

	/* Messages */
	.success-message {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background: rgba(16, 185, 129, 0.1);
		border: 1px solid #10b981;
		border-radius: 8px;
		color: #ffffff;
		margin-bottom: 1.5rem;
	}

	.error-message {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid #ef4444;
		border-radius: 8px;
		color: #ffffff;
		margin-bottom: 1.5rem;
	}

	.success-color { color: #10b981; }
	.error-color { color: #ef4444; }

	/* Form Group */
	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-label {
		display: block;
		font-family: 'Inter', sans-serif;
		font-size: 0.95rem;
		font-weight: 500;
		color: #ffffff;
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
		color: #71717a;
		display: flex;
		align-items: center;
		z-index: 1;
	}

	.form-input {
		width: 100%;
		padding: 0.75rem 1rem 0.75rem 2.75rem;
		background: rgba(255, 255, 255, 0.03);
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
		background: rgba(255, 255, 255, 0.05);
	}

	.form-input.error {
		border-color: #ef4444;
	}

	.form-input:disabled {
		opacity: 0.4;
		cursor: not-allowed;
		background: rgba(255, 255, 255, 0.01);
	}

	.form-input[readonly] {
		background: rgba(255, 255, 255, 0.02);
		border-color: rgba(255, 255, 255, 0.05);
		color: #71717a;
		cursor: not-allowed;
	}

	.form-input::placeholder {
		color: #52525b;
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
		color: #71717a;
		font-size: 0.8rem;
		margin-top: 0.5rem;
	}

	/* Info Card */
	.info-card {
		display: flex;
		gap: 1rem;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid rgba(255, 255, 255, 0.04);
		border-radius: 8px;
		margin: 1.5rem 0;
		align-items: flex-start;
	}

	.info-icon {
		color: #a1a1a5;
		display: flex;
		align-items: center;
	}

	.info-title {
		font-family: 'Inter', sans-serif;
		font-size: 0.9rem;
		font-weight: 600;
		color: #ffffff;
		margin: 0 0 0.25rem 0;
	}

	.info-text {
		color: #a1a1a5;
		font-size: 0.85rem;
		line-height: 1.5;
		margin: 0;
	}

	.info-text strong {
		color: #10b981;
		font-weight: 600;
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
		box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
	}

	.btn-secondary {
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.08);
		color: #a1a1a5;
	}

	.btn-secondary:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.15);
		color: #ffffff;
		transform: translateY(-1px);
	}

	.btn-primary:disabled,
	.btn-secondary:disabled {
		opacity: 0.4;
		cursor: not-allowed;
		transform: none;
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
		color: #a1a1a5;
		margin-bottom: 1rem;
	}

	.preview-card {
		background: rgba(20, 20, 22, 0.8);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 12px;
		overflow: hidden;
		max-width: 300px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
		backdrop-filter: blur(10px);
	}

	.preview-header {
		padding: 0.75rem;
		background: rgba(255, 255, 255, 0.02);
		border-bottom: 1px solid rgba(255, 255, 255, 0.04);
	}

	.preview-badge {
		background: rgba(255, 255, 255, 0.05);
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		font-size: 0.75rem;
		color: #a1a1a5;
	}

	.preview-body {
		padding: 1rem;
	}

	.preview-name {
		font-family: 'Inter', sans-serif;
		font-size: 1rem;
		font-weight: 600;
		color: #ffffff;
		margin-bottom: 0.75rem;
	}

	.preview-slots {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.85rem;
	}

	.preview-label {
		color: #71717a;
	}

	.preview-value {
		font-family: 'Inter', sans-serif;
		font-weight: 500;
		color: #10b981;
	}

	.preview-footer {
		padding: 0.75rem;
		background: rgba(255, 255, 255, 0.01);
		border-top: 1px solid rgba(255, 255, 255, 0.04);
		font-size: 0.75rem;
		color: #52525b;
	}

	.preview-note {
		color: #52525b;
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