<script lang="ts">
	import { onMount } from 'svelte';

	interface Serial {
		id: number;
		serialNumber: string | null;
		grade: string | null;
		spec: string | null;
		stock: number;
		status: string;
		isPlaceholder: boolean;
		isDisplay: boolean;
		images: { id: number; url: string; isMain: boolean; sortOrder: number }[];
	}

	interface SerialForm {
		serialNumber: string;
		grade: string;
		spec: string;
		stock: number;
		status: string;
		isPlaceholder: boolean;
	}

	let { itemId, initialSerials = [] }: { itemId: number; initialSerials: Serial[] } = $props();

	let serials = $state<Serial[]>(initialSerials);
	let isLoading = $state(false);
	let showCreateModal = $state(false);
	let editingSerial: Serial | null = $state(null);
	let uploadingSerialId: number | null = $state(null);
	let errorMessage = $state<string | null>(null);

	let form: SerialForm = $state({
		serialNumber: '',
		grade: 'A',
		spec: '',
		stock: 1,
		status: 'AVAILABLE',
		isPlaceholder: false
	});

	const GRADES = ['A', 'B', 'C', 'Refurbished', 'Grade A+', 'Grade A', 'Grade B+', 'Grade B', 'Grade C'];

	async function fetchSerials() {
		try {
			const res = await fetch(`/api/admin/items/${itemId}/serials`);
			if (res.ok) {
				const { data } = await res.json();
				serials = data;
			}
		} catch (e) {
			console.error('Failed to fetch serials:', e);
		}
	}

	onMount(() => {
		fetchSerials();
	});

	function openCreateModal() {
		form = { serialNumber: '', grade: 'A', spec: '', stock: 1, status: 'AVAILABLE', isPlaceholder: false };
		editingSerial = null;
		showCreateModal = true;
	}

	function openEditModal(serial: Serial) {
		editingSerial = serial;
		form = {
			serialNumber: serial.serialNumber || '',
			grade: serial.grade || 'A',
			spec: serial.spec || '',
			stock: serial.stock || 1,
			status: serial.status || 'AVAILABLE',
			isPlaceholder: serial.isPlaceholder
		};
		showCreateModal = true;
	}

	function closeModal() {
		showCreateModal = false;
		editingSerial = null;
		errorMessage = null;
	}

	async function handleSubmit() {
		if (!form.serialNumber.trim() && !form.isPlaceholder) {
			errorMessage = 'Serial number required unless placeholder';
			return;
		}

		isLoading = true;
		errorMessage = null;

		try {
			const url = editingSerial
				? `/api/admin/serials/${editingSerial.id}`
				: `/api/admin/items/${itemId}/serials`;
			const method = editingSerial ? 'PATCH' : 'POST';

			const res = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(form)
			});

			if (!res.ok) {
				const { error } = await res.json();
				throw new Error(error || 'Failed to save');
			}

			await fetchSerials();
			closeModal();
		} catch (e: any) {
			errorMessage = e.message;
		} finally {
			isLoading = false;
		}
	}

	async function deleteSerial(id: number) {
		if (!confirm('Delete this serial?')) return;
		await fetch(`/api/admin/serials/${id}`, { method: 'DELETE' });
		await fetchSerials();
	}

	async function toggleDisplay(id: number, current: boolean) {
		await fetch(`/api/admin/serials/${id}/display`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ isDisplay: !current })
		});
		await fetchSerials();
	}

	async function handleImageUpload(serialId: number, files: FileList | null) {
		if (!files || files.length === 0) return;
		uploadingSerialId = serialId;
		const formData = new FormData();
		Array.from(files).forEach(f => formData.append('images', f));

		const res = await fetch(`/api/admin/serials/${serialId}/images`, {
			method: 'POST',
			body: formData
		});

		if (res.ok) {
			await fetchSerials();
		}
		uploadingSerialId = null;
	}

	async function setMainImage(serialId: number, imageId: number) {
		await fetch(`/api/admin/serials/${serialId}/images/${imageId}`, { method: 'PATCH' });
		await fetchSerials();
	}

	async function deleteImage(imageId: number) {
		if (!confirm('Delete this image?')) return;
		await fetch(`/api/admin/serials/${serials.find(s => s.images.some(i => i.id === imageId))?.id}/images/${imageId}`, { method: 'DELETE' });
		await fetchSerials();
	}

	async function reorderImages(serialId: number, imageOrders: { id: number; sortOrder: number }[]) {
		await fetch(`/api/admin/serials/${serialId}/images`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ imageOrders })
		});
		await fetchSerials();
	}

	// Quick-update a single field (grade / status / spec) on a serial card
	async function updateField(serialId: number, field: string, value: string) {
		try {
			await fetch(`/api/admin/serials/${serialId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ [field]: value })
			});
			await fetchSerials();
		} catch (e) {
			console.error('Failed to update field:', e);
		}
	}
</script>

<div class="serial-management">
	<div class="section-header">
		<h3>Serial Numbers & Specs</h3>
		<button class="btn-primary btn-sm" onclick={openCreateModal} disabled={isLoading}>
			+ Add Serial
		</button>
	</div>

	{#if serials.length === 0}
		<div class="empty-serials">
			<p>No serial numbers yet. Click "Add Serial" to create.</p>
		</div>
	{:else}
		<div class="serials-grid">
			{#each serials as serial}
				<div class="serial-card">
					<div class="serial-header">
						<div class="serial-main">
							<span class="serial-number">{serial.serialNumber || '<i>placeholder</i>'}</span>
							<span class="serial-grade">{serial.grade}</span>
							{#if serial.isPlaceholder}
								<span class="badge placeholder">Placeholder</span>
							{/if}
							{#if serial.isDisplay}
								<span class="badge display">Display</span>
							{/if}
						</div>
						<div class="serial-actions">
							<button class="icon-btn" onclick={toggleDisplay.bind(null, serial.id, serial.isDisplay)} title={serial.isDisplay ? 'Unset display' : 'Set as display'}>
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
							</button>
							<button class="icon-btn" onclick={openEditModal.bind(null, serial)} title="Edit">
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
							</button>
							<button class="icon-btn danger" onclick={deleteSerial.bind(null, serial.id)} title="Delete">
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
							</button>
						</div>
					</div>

					<div class="serial-fields">
						<div class="field-row">
							<label>Grade</label>
							<select bind:value={serial.grade} onchange={(e) => updateField(serial.id, 'grade', (e.target as HTMLSelectElement).value)} disabled={isLoading}>
								{#each GRADES as g}
									<option value={g}>{g}</option>
								{/each}
							</select>
						</div>
						<div class="field-row">
							<label>Stock</label>
							<select value={serial.status} onchange={(e) => updateField(serial.id, 'status', (e.target as HTMLSelectElement).value)} disabled={isLoading}><option value="AVAILABLE">Tersedia</option><option value="SOLD">Terjual</option><option value="USED">Terpakai</option></select>
						</div>
					</div>

					<div class="field-full">
						<label>Spec (Quill HTML)</label>
						<textarea bind:value={serial.spec} oninput={(e) => updateField(serial.id, 'spec', (e.target as HTMLTextAreaElement).value)} rows="3" disabled={isLoading} placeholder="Specifications in HTML..."></textarea>
					</div>

					<div class="images-section">
						<div class="images-header">
							<label>Images</label>
							<input type="file" accept="image/*" multiple onchange={(e) => handleImageUpload(serial.id, (e.target as HTMLInputElement).files)} disabled={uploadingSerialId === serial.id || isLoading} />
						</div>
						{#if serial.images.length > 0}
							<div class="images-gallery">
								{#each serial.images as img}
									<div class="image-thumb" class:main={img.isMain}>
										<img src={img.url} alt="" />
										{#if !img.isMain}
											<button class="set-main" onclick={setMainImage.bind(null, serial.id, img.id)} title="Set as main">★</button>
										{/if}
										<button class="delete-img" onclick={deleteImage.bind(null, img.id)} title="Delete">×</button>
									</div>
								{/each}
							</div>
						{:else}
							<p class="no-images">No images uploaded</p>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Create/Edit Modal -->
	{#if showCreateModal}
		<div class="modal-overlay" onclick={closeModal}>
			<div class="modal" onclick={e => e.stopPropagation()}>
				<h3>{editingSerial ? 'Edit Serial' : 'Add Serial'}</h3>
				{#if errorMessage}<div class="error">{errorMessage}</div>{/if}
				<div class="form-group">
					<label>Serial Number <span class="req">*</span></label>
					<input bind:value={form.serialNumber} placeholder="e.g. IP14PM-001" />
					<small>Leave empty for placeholder (auto-generate)</small>
				</div>
				<div class="form-row">
					<div class="form-group">
						<label>Grade</label>
						<select bind:value={form.grade}>
							{#each GRADES as g}<option value={g}>{g}</option>{/each}
						</select>
					</div>
					<div class="form-group">
						<label>Stock</label>
						<input type="number" bind:value={form.stock} min="0" max="1" />
					</div>
				</div>
				<div class="form-group">
					<label>Placeholder</label>
					<label class="checkbox-inline">
						<input type="checkbox" bind:value={form.isPlaceholder} />
						<span>Auto-generate SN</span>
					</label>
				</div>
				<div class="form-group">
					<label>Spec (HTML)</label>
					<textarea bind:value={form.spec} rows="4" placeholder="HTML specs..."></textarea>
				</div>
				<div class="modal-actions">
					<button class="btn-secondary" onclick={closeModal} disabled={isLoading}>Cancel</button>
					<button class="btn-primary" onclick={handleSubmit} disabled={isLoading}>
						{isLoading ? 'Saving...' : (editingSerial ? 'Update' : 'Create')}
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.serial-management { margin-top: 2rem; }
	.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
	.section-header h3 { margin: 0; font-size: 1.1rem; }
	.btn-primary { background: #2563eb; color: white; padding: 0.5rem 1rem; border: none; border-radius: 6px; cursor: pointer; }
	.btn-primary:hover { background: #1d4ed8; }
	.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
	.btn-secondary { background: #f1f5f9; color: #475569; padding: 0.5rem 1rem; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer; }
	.btn-sm { padding: 0.375rem 0.75rem; font-size: 0.875rem; }
	.empty-serials { padding: 2rem; text-align: center; color: #64748b; }
	.serials-grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); }
	.serial-card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 1rem; background: white; }
	.serial-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; }
	.serial-main { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
	.serial-number { font-family: monospace; font-weight: 600; color: #0f172a; }
	.serial-grade { background: #f1f5f9; padding: 0.125rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
	.badge { font-size: 0.65rem; padding: 0.125rem 0.375rem; border-radius: 9999px; font-weight: 600; }
	.badge.placeholder { background: #fef3c7; color: #92400e; }
	.badge.display { background: #dbeafe; color: #1e40af; }
	.serial-actions { display: flex; gap: 0.25rem; }
	.icon-btn { background: #f1f5f9; border: 1px solid #e2e8f0; padding: 0.375rem; border-radius: 6px; cursor: pointer; color: #475569; }
	.icon-btn:hover { background: #e2e8f0; }
	.icon-btn.danger:hover { background: #fef2f2; border-color: #fecaca; color: #dc2626; }
	.serial-fields { display: flex; flex-direction: column; gap: 0.75rem; }
	.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
	.field-full { display: flex; flex-direction: column; gap: 0.25rem; }
	.field-full label, .field-row label { font-size: 0.75rem; font-weight: 500; color: #475569; }
	.field-full input, .field-row input, .field-full select, .field-row select, .field-full textarea {
		padding: 0.5rem; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.875rem; background: white;
	}
	.field-full input:disabled, .field-row input:disabled, .field-full select:disabled, .field-row select:disabled, .field-full textarea:disabled { opacity: 0.6; }
	.images-section { border-top: 1px solid #f1f5f9; padding-top: 0.75rem; }
	.images-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
	.images-header label { font-weight: 500; font-size: 0.875rem; }
	.images-gallery { display: flex; gap: 0.5rem; flex-wrap: wrap; }
	.image-thumb { position: relative; width: 80px; height: 80px; border-radius: 8px; overflow: hidden; border: 2px solid transparent; }
	.image-thumb img { width: 100%; height: 100%; object-fit: cover; }
	.image-thumb.main { border-color: #2563eb; }
	.image-thumb button { position: absolute; width: 24px; height: 24px; border-radius: 4px; border: none; background: rgba(0,0,0,0.6); color: white; font-size: 12px; cursor: pointer; }
	.image-thumb .set-main { top: 4px; right: 4px; }
	.image-thumb .delete-img { bottom: 4px; right: 4px; background: rgba(220,38,38,0.9); }
	.no-images { font-size: 0.8rem; color: #94a3b8; }
	.modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; }
	.modal { background: white; border-radius: 12px; padding: 1.5rem; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; }
	.modal h3 { margin: 0 0 1rem; }
	.error { background: #fef2f2; color: #dc2626; padding: 0.5rem; border-radius: 6px; margin-bottom: 1rem; font-size: 0.875rem; }
	.form-group { margin-bottom: 1rem; }
	.form-group label { display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem; }
	.req { color: #dc2626; }
	.form-group input, .form-group select, .form-group textarea { width: 100%; padding: 0.5rem; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.875rem; }
	.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
	.checkbox-inline { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #475569; cursor: pointer; }
	.modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }
</style>