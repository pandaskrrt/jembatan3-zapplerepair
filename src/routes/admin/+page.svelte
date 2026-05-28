<script lang="ts">
	import { goto } from '$app/navigation'
	import { onDestroy, onMount } from 'svelte'
	import { invalidateAll } from '$app/navigation'
	import SignaturePad from 'signature_pad'
	import { browser } from '$app/environment'

	let { data } = $props()
	let reports = $derived(data?.reports || [])
	let selectedReport: any = null
	let showSignatureModal = $state(false)
	let showPreviewModal = $state(false)
	let previewReportId: string | null = null
	let signaturePad: any = null
	let canvasEl: HTMLCanvasElement | null = null
	let isSaving = $state(false)
	let toast: { msg: string; type: 'success' | 'error' } | null = null
	let toastTimer: ReturnType<typeof setTimeout>
	let refreshInterval: ReturnType<typeof setInterval>

	function showToast(msg: string, type: 'success' | 'error' = 'success') {
		clearTimeout(toastTimer)
		toast = { msg, type }
		toastTimer = setTimeout(() => (toast = null), 3500)
	}

	async function refreshData() {
		await invalidateAll()
	}

	function openPreview(reportId: string) {
		previewReportId = reportId
		showPreviewModal = true
	}

	function closePreview() {
		showPreviewModal = false
		previewReportId = null
	}

	function openSignatureModal(report: any) {
		selectedReport = report
		showSignatureModal = true

		setTimeout(() => {
			if (canvasEl) {
				initSignaturePad(canvasEl)
			}
		}, 100)
	}

	function initSignaturePad(canvas: HTMLCanvasElement) {
		const container = canvas.parentElement
		if (container) {
			const rect = container.getBoundingClientRect()
			canvas.width = rect.width - 32
			canvas.height = 200
		} else {
			canvas.width = 500
			canvas.height = 200
		}

		signaturePad = new SignaturePad(canvas, {
			backgroundColor: '#ffffff',
			penColor: '#000000',
			velocityFilterWeight: 0.7,
			minWidth: 1,
			maxWidth: 2.5,
			throttle: 16,
			minDistance: 5,
			dotSize: 2
		})
	}

	function clearCanvas() {
		if (signaturePad) {
			signaturePad.clear()
		}
	}

	async function saveSignature() {
		if (!signaturePad || signaturePad.isEmpty()) {
			showToast('Silakan tanda tangan terlebih dahulu', 'error')
			return
		}

		if (isSaving) return

		isSaving = true

		try {
			const signatureData = signaturePad.toDataURL('image/png')

			const res = await fetch('/api/admin/sign-report', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					reportId: selectedReport.id,
					signature: signatureData
				})
			})

			const result = await res.json()

			if (result.success) {
				showToast(result.message, 'success')
				showSignatureModal = false
				await refreshData()
				setTimeout(() => refreshData(), 500)
			} else {
				showToast(result.message || 'Gagal menyimpan tanda tangan', 'error')
			}
		} catch (error) {
			console.error('Error saving signature:', error)
			showToast('Terjadi kesalahan', 'error')
		} finally {
			isSaving = false
		}
	}

	function formatDate(date: string | Date) {
		if (!date) return '—'
		return new Date(date).toLocaleDateString('id-ID', {
			day: 'numeric',
			month: 'long',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		})
	}

	function getStatusBadge(status: string) {
		if (status === 'PENDING_SIGN') {
			return { class: 'pending', icon: 'clock', text: 'Menunggu Tanda Tangan' }
		}
		if (status === 'PARTIALLY_SIGNED') {
			return { class: 'partial', icon: 'refresh-cw', text: 'Sebagian Ditandatangani' }
		}
		if (status === 'COMPLETED') {
			return { class: 'completed', icon: 'check-circle', text: 'Selesai' }
		}
		return { class: 'draft', icon: 'file-text', text: 'Draft' }
	}

	onMount(() => {
		refreshInterval = setInterval(() => {
			if (!showSignatureModal && !showPreviewModal) {
				refreshData()
			}
		}, 3000)

		return () => {
			if (refreshInterval) clearInterval(refreshInterval)
		}
	})

	onDestroy(() => {
		if (signaturePad) {
			signaturePad.off()
			signaturePad = null
		}
	})
</script>

<svelte:head>
	<title>Dashboard Tanda Tangan Laporan</title>
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
</svelte:head>

{#if toast}
	<div class="toast {toast.type === 'error' ? 'toast-error' : ''}">
		<span>{toast.msg}</span>
	</div>
{/if}

<div class="page">
	<!-- Header -->
	<div class="header">
		<div class="header-left">
			<h1 class="title">Dashboard Tanda Tangan</h1>
			<p class="subtitle">Kelola dan tanda tangani laporan audit yang memerlukan persetujuan Anda</p>
			<div class="auto-refresh-badge">
				<span class="green-dot"></span>
				<span>Auto refresh setiap 3 detik</span>
			</div>
		</div>
		<button class="btn-refresh" onclick={refreshData}>
			<svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M23 4v6h-6M1 20v-6h6" />
				<path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
			</svg>
			<span>Refresh</span>
		</button>
	</div>

	{#if reports.length === 0}
		<!-- Empty State -->
		<div class="empty-state">
			<svg class="empty-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
				<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
				<polyline points="22 4 12 14.01 9 11.01" />
			</svg>
			<h3>Tidak Ada Laporan</h3>
			<p>Belum ada laporan yang memerlukan tanda tangan Anda.</p>
			<button class="btn-primary" onclick={() => goto('/stock-audit')}>
				<svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M3 12h18M12 3v18" />
				</svg>
				Lihat Audit
			</button>
		</div>
	{:else}
		<!-- Reports Grid -->
		<div class="reports-grid">
			{#each reports as report}
				<div class="report-card">
					<div class="card-header">
						<div class="card-title">
							<div class="title-info">
								<h3>{report.cabinetName}</h3>
								<span class="section-name">{report.sectionName}</span>
							</div>
							<span class="badge {getStatusBadge(report.status).class}">
								<svg class="badge-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									{#if getStatusBadge(report.status).icon === 'clock'}
										<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
									{:else if getStatusBadge(report.status).icon === 'refresh-cw'}
										<path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
									{:else if getStatusBadge(report.status).icon === 'check-circle'}
										<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
									{:else}
										<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
									{/if}
								</svg>
								{getStatusBadge(report.status).text}
							</span>
						</div>
						
						{#if report.totalResponsible > 1}
							<div class="signature-info">
								<span class="signature-order">
									<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
										<circle cx="12" cy="7" r="4"/>
									</svg>
									Anda Penanggung Jawab {report.order === 1 ? 'Utama' : 'Kedua'}
								</span>
								{#if report.otherSignedCount > 0}
									<span class="other-signed">
										<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<polyline points="20 6 9 17 4 12"/>
										</svg>
										{report.otherSignedCount} penanggung jawab lain sudah menandatangani
									</span>
								{/if}
							</div>
						{/if}
					</div>

					<!-- Stats -->
					<div class="card-stats">
						<div class="stat">
							<span class="stat-value">{report.totalCards || 0}</span>
							<span class="stat-label">Total Item</span>
						</div>
						<div class="stat match">
							<span class="stat-value">{report.totalMatch || 0}</span>
							<span class="stat-label">Match</span>
						</div>
						<div class="stat mismatch">
							<span class="stat-value">{report.totalMismatch || 0}</span>
							<span class="stat-label">Mismatch</span>
						</div>
						<div class="stat missing">
							<span class="stat-value">{report.totalMissing || 0}</span>
							<span class="stat-label">Missing</span>
						</div>
					</div>

					<!-- Footer -->
					<div class="card-footer">
						<div class="audit-info">
							<div class="info-line">
								<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
									<circle cx="12" cy="7" r="4"/>
								</svg>
								<span>{report.auditorName}</span>
							</div>
							<div class="info-line">
								<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<circle cx="12" cy="12" r="10"/>
									<polyline points="12 6 12 12 16 14"/>
								</svg>
								<span>{formatDate(report.createdAt)}</span>
							</div>
						</div>
						<div class="action-buttons">
							<button class="btn-outline" onclick={() => openPreview(report.id)}>
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
									<circle cx="12" cy="12" r="3"/>
								</svg>
								Preview
							</button>
							<button
								class="btn-sign"
								onclick={() => openSignatureModal(report)}
								disabled={report.hasSigned === true || report.status === 'COMPLETED'}
							>
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
									<polyline points="14 2 14 8 20 8"/>
									<line x1="16" y1="13" x2="8" y2="13"/>
									<line x1="16" y1="17" x2="8" y2="17"/>
									<polyline points="10 9 9 9 8 9"/>
								</svg>
								{report.hasSigned ? 'Sudah Ditandatangani' : 'Tanda Tangani'}
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Modal Preview PDF -->
{#if showPreviewModal && previewReportId}
	<div class="modal-overlay" onclick={closePreview}>
		<div class="modal-preview" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h2>
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
						<circle cx="12" cy="12" r="3"/>
					</svg>
					Preview Laporan Audit
				</h2>
				<button class="modal-close" onclick={closePreview}>
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="18" y1="6" x2="6" y2="18"/>
						<line x1="6" y1="6" x2="18" y2="18"/>
					</svg>
				</button>
			</div>
			<div class="modal-content preview-content">
				<iframe src={`/api/preview-pdf/${previewReportId}`} class="pdf-preview" title="Preview PDF"></iframe>
			</div>
			<div class="modal-actions">
				<button class="btn-secondary" onclick={closePreview}>Tutup</button>
				<button
					class="btn-primary"
					onclick={() => {
						const report = reports.find((r) => r.id === previewReportId)
						closePreview()
						if (report && !report.hasSigned && report.status !== 'COMPLETED') {
							setTimeout(() => openSignatureModal(report), 100)
						}
					}}
				>
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
						<polyline points="14 2 14 8 20 8"/>
						<line x1="16" y1="13" x2="8" y2="13"/>
						<line x1="16" y1="17" x2="8" y2="17"/>
					</svg>
					Lanjutkan Tanda Tangan
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Modal Signature -->
{#if showSignatureModal && selectedReport}
	<div class="modal-overlay" onclick={() => (showSignatureModal = false)}>
		<div class="modal" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h2>
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
						<polyline points="14 2 14 8 20 8"/>
						<line x1="16" y1="13" x2="8" y2="13"/>
						<line x1="16" y1="17" x2="8" y2="17"/>
					</svg>
					Tanda Tangan Laporan
				</h2>
				<button class="modal-close" onclick={() => (showSignatureModal = false)}>
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="18" y1="6" x2="6" y2="18"/>
						<line x1="6" y1="6" x2="18" y2="18"/>
					</svg>
				</button>
			</div>

			<div class="modal-content">
				<div class="report-info">
					<div class="info-row">
						<span class="info-label">Cabinet / Section</span>
						<span class="info-value">{selectedReport.cabinetName} / {selectedReport.sectionName}</span>
					</div>
					<div class="info-row">
						<span class="info-label">Auditor</span>
						<span class="info-value">{selectedReport.auditorName}</span>
					</div>
					<div class="info-row">
						<span class="info-label">Tanggal Audit</span>
						<span class="info-value">{formatDate(selectedReport.createdAt)}</span>
					</div>
					<div class="info-row">
						<span class="info-label">Total Item</span>
						<span class="info-value">{selectedReport.totalCards || 0}</span>
					</div>
				</div>

				<div class="signature-area">
					<p class="signature-label">Tanda Tangan Digital</p>
					<div class="canvas-container">
						<canvas bind:this={canvasEl} class="signature-canvas"></canvas>
						<div class="canvas-actions">
							<button class="btn-clear" onclick={clearCanvas}>
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
								</svg>
								Hapus
							</button>
						</div>
					</div>
					<p class="hint">Tanda tangan di area kotak putih menggunakan mouse atau sentuhan</p>
				</div>
			</div>

			<div class="modal-actions">
				<button class="btn-secondary" onclick={() => (showSignatureModal = false)}>Batal</button>
				<button class="btn-primary" onclick={saveSignature} disabled={isSaving}>
					{isSaving ? 'Menyimpan...' : 'Simpan Tanda Tangan'}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	* {
		margin: 0;
		padding: 0;
		box-sizing: border-box;
	}

	.page {
		max-width: 1400px;
		margin: 0 auto;
		padding: 2rem;
		font-family: 'Inter', sans-serif;
		background: #f8fafc;
		min-height: 100vh;
		color: #1e293b;
	}

	/* Toast */
	.toast {
		position: fixed;
		bottom: 1.5rem;
		right: 1.5rem;
		z-index: 9999;
		padding: 12px 20px;
		border-radius: 10px;
		font-size: 14px;
		font-weight: 500;
		background: #ffffff;
		border: 1px solid #10b981;
		color: #10b981;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
	}

	.toast-error {
		border-color: #ef4444;
		color: #ef4444;
	}

	/* Header */
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.header-left {
		flex: 1;
	}

	.title {
		font-size: 1.75rem;
		font-weight: 700;
		color: #0f172a;
		margin-bottom: 0.25rem;
		letter-spacing: -0.01em;
	}

	.subtitle {
		color: #64748b;
		font-size: 0.875rem;
	}

	.auto-refresh-badge {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 0.5rem;
		font-size: 0.7rem;
		color: #10b981;
		background: rgba(16, 185, 129, 0.1);
		padding: 4px 10px;
		border-radius: 20px;
		width: fit-content;
	}

	.green-dot {
		width: 8px;
		height: 8px;
		background: #10b981;
		border-radius: 50%;
		animation: pulse 1.5s infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.5; transform: scale(1.2); }
	}

	.btn-refresh {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 0.5rem 1rem;
		background: #ffffff;
		border: 1px solid #e2e8f0;
		border-radius: 10px;
		color: #475569;
		font-size: 0.85rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-refresh:hover {
		background: #f1f5f9;
		border-color: #cbd5e1;
		transform: translateY(-1px);
	}

	/* Empty State */
	.empty-state {
		text-align: center;
		padding: 4rem;
		background: #ffffff;
		border-radius: 16px;
		border: 1px solid #e2e8f0;
	}

	.empty-icon {
		margin-bottom: 1rem;
		opacity: 0.5;
		color: #94a3b8;
	}

	.empty-state h3 {
		font-size: 1.1rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
		color: #1e293b;
	}

	.empty-state p {
		color: #64748b;
		font-size: 0.85rem;
		margin-bottom: 1.5rem;
	}

	/* Reports Grid */
	.reports-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
		gap: 1.5rem;
	}

	.report-card {
		background: #ffffff;
		border: 1px solid #e2e8f0;
		border-radius: 16px;
		padding: 1.25rem;
		transition: all 0.3s ease;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	}

	.report-card:hover {
		border-color: #cbd5e1;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
		transform: translateY(-2px);
	}

	.card-header {
		margin-bottom: 1rem;
	}

	.card-title {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 0.5rem;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.title-info h3 {
		font-size: 0.9rem;
		font-weight: 600;
		color: #475569;
		margin-bottom: 0.25rem;
	}

	.section-name {
		font-size: 1rem;
		font-weight: 700;
		color: #0f172a;
	}

	.badge {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		font-size: 0.7rem;
		font-weight: 600;
	}

	.badge-icon {
		width: 12px;
		height: 12px;
	}

	.badge.draft {
		background: #f1f5f9;
		color: #64748b;
	}

	.badge.pending {
		background: #fef3c7;
		color: #d97706;
	}

	.badge.partial {
		background: #dbeafe;
		color: #2563eb;
	}

	.badge.completed {
		background: #d1fae5;
		color: #059669;
	}

	.signature-info {
		margin-top: 0.75rem;
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.signature-order, .other-signed {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font-size: 0.65rem;
		padding: 0.2rem 0.6rem;
		border-radius: 12px;
		font-weight: 500;
	}

	.signature-order {
		background: #d1fae5;
		color: #059669;
	}

	.other-signed {
		background: #e0f2fe;
		color: #0284c7;
	}

	/* Stats */
	.card-stats {
		display: flex;
		gap: 1rem;
		padding: 0.75rem 0;
		border-top: 1px solid #e2e8f0;
		border-bottom: 1px solid #e2e8f0;
		margin-bottom: 1rem;
	}

	.stat {
		text-align: center;
		flex: 1;
	}

	.stat-value {
		display: block;
		font-size: 1.1rem;
		font-weight: 700;
		color: #1e293b;
	}

	.stat-label {
		font-size: 0.65rem;
		color: #94a3b8;
		margin-top: 4px;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.stat.match .stat-value { color: #059669; }
	.stat.mismatch .stat-value { color: #d97706; }
	.stat.missing .stat-value { color: #dc2626; }

	/* Card Footer */
	.card-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.audit-info {
		font-size: 0.7rem;
		color: #64748b;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.info-line {
		display: flex;
		align-items: center;
		gap: 5px;
	}

	.action-buttons {
		display: flex;
		gap: 0.5rem;
	}

	.btn-outline, .btn-sign {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 0.4rem 0.75rem;
		border-radius: 8px;
		font-weight: 500;
		font-size: 0.7rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-outline {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		color: #475569;
	}

	.btn-outline:hover {
		background: #f1f5f9;
		border-color: #cbd5e1;
	}

	.btn-sign {
		background: #10b981;
		border: none;
		color: #ffffff;
	}

	.btn-sign:hover:not(:disabled) {
		background: #059669;
		transform: translateY(-1px);
	}

	.btn-sign:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		background: #94a3af;
	}

	/* Modal */
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal-preview {
		background: #ffffff;
		border-radius: 16px;
		width: 90vw;
		height: 90vh;
		max-width: 1200px;
		display: flex;
		flex-direction: column;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
	}

	.modal {
		background: #ffffff;
		border-radius: 16px;
		width: 550px;
		max-width: 90%;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid #e2e8f0;
	}

	.modal-header h2 {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 1rem;
		font-weight: 600;
		color: #1e293b;
	}

	.modal-close {
		background: none;
		border: none;
		color: #94a3b8;
		cursor: pointer;
		transition: color 0.2s;
	}

	.modal-close:hover {
		color: #1e293b;
	}

	.modal-content {
		padding: 1.5rem;
	}

	.preview-content {
		flex: 1;
		padding: 0;
		overflow: hidden;
	}

	.pdf-preview {
		width: 100%;
		height: 100%;
		border: none;
	}

	.report-info {
		background: #f8fafc;
		border-radius: 12px;
		padding: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		padding: 0.5rem 0;
		font-size: 0.85rem;
	}

	.info-label {
		color: #64748b;
		font-weight: 500;
	}

	.info-value {
		font-weight: 600;
		color: #0f172a;
	}

	.signature-area {
		margin-top: 1rem;
	}

	.signature-label {
		font-size: 0.85rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
		color: #1e293b;
	}

	.canvas-container {
		margin-bottom: 0.5rem;
	}

	.signature-canvas {
		width: 100%;
		height: 200px;
		background: #ffffff;
		border: 2px solid #e2e8f0;
		border-radius: 12px;
		cursor: crosshair;
		touch-action: none;
	}

	.canvas-actions {
		display: flex;
		justify-content: flex-end;
		margin-top: 0.5rem;
	}

	.btn-clear {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 0.3rem 0.8rem;
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 8px;
		color: #dc2626;
		font-size: 0.7rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-clear:hover {
		background: #fee2e2;
	}

	.hint {
		font-size: 0.65rem;
		color: #94a3b8;
		margin-top: 0.5rem;
		text-align: center;
	}

	.modal-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
		padding: 1rem 1.5rem;
		border-top: 1px solid #e2e8f0;
	}

	.btn-secondary, .btn-primary {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 0.5rem 1.25rem;
		border-radius: 10px;
		font-weight: 600;
		font-size: 0.85rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-secondary {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		color: #475569;
	}

	.btn-secondary:hover {
		background: #f1f5f9;
	}

	.btn-primary {
		background: #10b981;
		border: none;
		color: #ffffff;
	}

	.btn-primary:hover:not(:disabled) {
		background: #059669;
		transform: translateY(-1px);
	}

	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.page {
			padding: 1rem;
		}

		.header {
			flex-direction: column;
			align-items: flex-start;
		}

		.reports-grid {
			grid-template-columns: 1fr;
		}

		.card-footer {
			flex-direction: column;
			align-items: stretch;
		}

		.action-buttons {
			flex-direction: column;
		}

		.btn-outline, .btn-sign {
			width: 100%;
			justify-content: center;
		}

		.modal-preview {
			width: 95vw;
			height: 95vh;
		}

		.modal {
			width: 95%;
		}

		.info-row {
			flex-direction: column;
			gap: 4px;
		}
	}
</style>