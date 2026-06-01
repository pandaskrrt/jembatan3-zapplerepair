<script lang="ts">
	import { goto } from '$app/navigation'
	import { onDestroy, onMount } from 'svelte'
	import { invalidateAll } from '$app/navigation'
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
	let SignaturePadClass: any = null

	async function loadSignaturePad() {
		if (!browser) return null
		if (!SignaturePadClass) {
			const module = await import('signature_pad')
			SignaturePadClass = module.default
		}
		return SignaturePadClass
	}

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

	async function openSignatureModal(report: any) {
		selectedReport = report
		showSignatureModal = true

		// Tunggu modal terbuka dan canvas siap
		await new Promise(resolve => setTimeout(resolve, 200))
		
		if (canvasEl && browser) {
			await initSignaturePad(canvasEl)
		}
	}

	async function initSignaturePad(canvas: HTMLCanvasElement) {
		const SP = await loadSignaturePad()
		if (!SP) return

		const container = canvas.parentElement
		if (container) {
			const rect = container.getBoundingClientRect()
			canvas.width = rect.width
			canvas.height = 200
		} else {
			canvas.width = 500
			canvas.height = 200
		}

		if (signaturePad) {
			signaturePad.off()
			signaturePad = null
		}

		signaturePad = new SP(canvas, {
			backgroundColor: '#ffffff',
			penColor: '#0f172a',
			velocityFilterWeight: 0.7,
			minWidth: 1.5,
			maxWidth: 3,
			throttle: 16,
			minDistance: 5,
			dotSize: 2.5
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
	<div class="toast {toast.type === 'error' ? 'toast-error' : 'toast-success'}">
		<div class="toast-content">
			{#if toast.type === 'error'}
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
			{:else}
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
			{/if}
			<span>{toast.msg}</span>
		</div>
	</div>
{/if}

<div class="page">
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
			<svg class="icon animate-spin-hover" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
				<path d="M23 4v6h-6M1 20v-6h6" />
				<path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
			</svg>
			<span>Refresh</span>
		</button>
	</div>

	{#if reports.length === 0}
		<div class="empty-state">
			<div class="empty-icon-wrapper">
				<svg class="empty-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
					<polyline points="14 2 14 8 20 8"></polyline>
					<line x1="16" y1="13" x2="8" y2="13"></line>
					<line x1="16" y1="17" x2="8" y2="17"></line>
					<polyline points="10 9 9 9 8 9"></polyline>
				</svg>
			</div>
			<h3>Tidak Ada Laporan</h3>
			<p>Belum ada laporan yang memerlukan tanda tangan Anda saat ini.</p>
			<button class="btn-primary" onclick={() => goto('/stock-audit')}>
				<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
				</svg>
				Lihat Audit
			</button>
		</div>
	{:else}
		<div class="reports-grid">
			{#each reports as report}
				<div class="report-card" class:card-signed={report.hasSigned}>
					<div class="card-header">
						<div class="card-title">
							<div class="title-info">
								<h3>{report.cabinetName}</h3>
								<span class="section-name">{report.sectionName}</span>
							</div>
							<span class="badge {getStatusBadge(report.status).class}">
								<svg class="badge-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
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
									<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
										<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
										<circle cx="12" cy="7" r="4"/>
									</svg>
									Anda Penanggung Jawab {report.order === 1 ? 'Utama' : 'Kedua'}
								</span>
								{#if report.otherSignedCount > 0}
									<span class="other-signed">
										<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
											<polyline points="20 6 9 17 4 12"/>
										</svg>
										{report.otherSignedCount} penanggung jawab lain sudah menandatangani
									</span>
								{/if}
							</div>
						{/if}
					</div>

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

					<div class="card-footer">
						<div class="audit-info">
							<div class="info-line">
								<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
									<circle cx="12" cy="7" r="4"/>
								</svg>
								<span>{report.auditorName}</span>
							</div>
							<div class="info-line">
								<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<circle cx="12" cy="12" r="10"/>
									<polyline points="12 6 12 12 16 14"/>
								</svg>
								<span>{formatDate(report.createdAt)}</span>
							</div>
						</div>
						<div class="action-buttons">
							<button class="btn-outline" onclick={() => openPreview(report.id)}>
								<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
									<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
									<circle cx="12" cy="12" r="3"/>
								</svg>
								<span>Preview</span>
							</button>
							<button
								class="btn-sign"
								onclick={() => openSignatureModal(report)}
								disabled={report.hasSigned === true || report.status === 'COMPLETED'}
							>
								{#if report.hasSigned}
									<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
										<polyline points="20 6 9 17 4 12"/>
									</svg>
								{:else}
									<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
										<path d="M12 20h9"></path>
										<path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
									</svg>
								{/if}
								<span>{report.hasSigned ? 'Sudah Ditandatangani' : 'Tanda Tangani'}</span>
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

{#if showPreviewModal && previewReportId}
	<div class="modal-overlay" onclick={closePreview}>
		<div class="modal-preview" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h2>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
						<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
						<circle cx="12" cy="12" r="3"/>
					</svg>
					Preview Laporan Audit
				</h2>
				<button class="modal-close" onclick={closePreview}>
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
						<path d="M12 20h9"></path>
						<path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
					</svg>
					Lanjutkan Tanda Tangan
				</button>
			</div>
		</div>
	</div>
{/if}

{#if showSignatureModal && selectedReport}
	<div class="modal-overlay" onclick={() => (showSignatureModal = false)}>
		<div class="modal" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h2>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
						<path d="M12 20h9"></path>
						<path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
					</svg>
					Tanda Tangan Laporan
				</h2>
				<button class="modal-close" onclick={() => (showSignatureModal = false)}>
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
						<span class="info-value count-badge">{selectedReport.totalCards || 0}</span>
					</div>
				</div>

				<div class="signature-area">
					<p class="signature-label">Tanda Tangan Digital</p>
					<div class="canvas-container">
						<canvas bind:this={canvasEl} class="signature-canvas"></canvas>
						<div class="canvas-actions">
							<button class="btn-clear" onclick={clearCanvas}>
								<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
									<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
								</svg>
								Hapus
							</button>
						</div>
					</div>
					<p class="hint">Gunakan mouse atau perangkat sentuh Anda untuk menandatangani di dalam area kotak di atas</p>
				</div>
			</div>

			<div class="modal-actions">
				<button class="btn-secondary" onclick={() => (showSignatureModal = false)}>Batal</button>
				<button class="btn-primary" onclick={saveSignature} disabled={isSaving}>
					{#if isSaving}
						<svg class="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
					{/if}
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

	/* BACKGROUND DIHILANGKAN / MENJADI HITAM PEKAT TRANSPARAN */
	.page {
		max-width: 1400px;
		margin: 0 auto;
		padding: 2.5rem 2rem;
		font-family: 'Inter', system-ui, -apple-system, sans-serif;
		background: transparent;
		min-height: 100vh;
		color: #e3e4e6;
	}

	/* Toast modern dark theme */
	.toast {
		position: fixed;
		top: 1.5rem;
		right: 1.5rem;
		z-index: 9999;
		padding: 14px 20px;
		border-radius: 12px;
		font-size: 14px;
		font-weight: 500;
		background: #18181b;
		border: 1px solid rgba(255, 255, 255, 0.08);
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
		animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.toast-success { border-left: 4px solid #10b981; color: #ffffff; }
	.toast-success svg { color: #10b981; }
	.toast-error { border-left: 4px solid #ef4444; color: #ffffff; }
	.toast-error svg { color: #ef4444; }

	.toast-content {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	@keyframes slideIn {
		from { transform: translateY(-10px); opacity: 0; }
		to { transform: translateY(0); opacity: 1; }
	}

	/* Header */
	.header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 2.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
		padding-bottom: 1.5rem;
		gap: 1rem;
	}

	.title {
		font-size: 1.75rem;
		font-weight: 700;
		color: #ffffff;
		letter-spacing: -0.02em;
		margin-bottom: 0.35rem;
	}

	.subtitle {
		color: #a1a1a5;
		font-size: 0.9rem;
		line-height: 1.5;
	}

	.auto-refresh-badge {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 0.75rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: #10b981;
		background: rgba(16, 185, 129, 0.06);
		border: 1px solid rgba(16, 185, 129, 0.2);
		padding: 4px 12px;
		border-radius: 9999px;
		width: fit-content;
	}

	.green-dot {
		width: 6px;
		height: 6px;
		background: #10b981;
		border-radius: 50%;
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.4; transform: scale(1.3); }
	}

	.btn-refresh {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 0.6rem 1.2rem;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 10px;
		color: #a1a1a5;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-refresh:hover {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.2);
		color: #ffffff;
	}
	
	.animate-spin-hover:hover {
		transform: rotate(45deg);
		transition: transform 0.2s ease;
	}

	/* Empty State */
	.empty-state {
		text-align: center;
		padding: 5rem 2rem;
		background: rgba(18, 18, 20, 0.6);
		border-radius: 16px;
		border: 1px solid rgba(255, 255, 255, 0.06);
		max-width: 500px;
		margin: 4rem auto 0 auto;
		box-shadow: 0 20px 40px rgba(0,0,0,0.3);
	}

	.empty-icon-wrapper {
		width: 72px;
		height: 72px;
		background: rgba(255, 255, 255, 0.03);
		color: #71717a;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 1.5rem auto;
		border: 1px solid rgba(255, 255, 255, 0.06);
	}

	.empty-state h3 {
		font-size: 1.25rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
		color: #ffffff;
	}

	.empty-state p {
		color: #71717a;
		font-size: 0.9rem;
		margin-bottom: 2rem;
		line-height: 1.5;
	}

	/* Reports Grid & Cards Theme Dark */
	.reports-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(440px, 1fr));
		gap: 1.5rem;
	}

	.report-card {
		background: rgba(20, 20, 22, 0.8);
		border: 1px solid rgba(255, 255, 255, 0.06);
		border-radius: 16px;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
		backdrop-filter: blur(10px);
	}

	.report-card:hover {
		border-color: rgba(255, 255, 255, 0.15);
		box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4);
		transform: translateY(-2px);
	}
	
	.card-signed {
		background: linear-gradient(135deg, rgba(20, 20, 22, 0.9) 0%, rgba(30, 30, 35, 0.4) 100%);
	}

	.card-header {
		margin-bottom: 1.25rem;
	}

	.card-title {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 0.75rem;
	}

	.title-info h3 {
		font-size: 0.8rem;
		font-weight: 600;
		color: #71717a;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 0.25rem;
	}

	.section-name {
		font-size: 1.15rem;
		font-weight: 700;
		color: #ffffff;
		letter-spacing: -0.01em;
	}

	/* Badges */
	.badge {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 5px 12px;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 600;
		white-space: nowrap;
	}

	.badge.draft { background: rgba(255,255,255,0.05); color: #a1a1a5; }
	.badge.pending { background: rgba(217, 119, 6, 0.1); color: #f59e0b; border: 1px solid rgba(217, 119, 6, 0.2); }
	.badge.partial { background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.2); }
	.badge.completed { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); }

	.signature-info {
		margin-top: 1rem;
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.signature-order, .other-signed {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font-size: 0.7rem;
		padding: 4px 10px;
		border-radius: 6px;
		font-weight: 500;
	}

	.signature-order { background: rgba(16, 185, 129, 0.1); color: #10b981; font-weight: 600; }
	.other-signed { background: rgba(14, 165, 233, 0.1); color: #38bdf8; border: 1px solid rgba(14, 165, 233, 0.15); }

	/* Stats Dark */
	.card-stats {
		display: flex;
		background: rgba(255, 255, 255, 0.02);
		border-radius: 12px;
		padding: 0.85rem 0.5rem;
		border: 1px solid rgba(255, 255, 255, 0.04);
		margin-bottom: 1.25rem;
	}

	.stat {
		text-align: center;
		flex: 1;
		border-right: 1px solid rgba(255, 255, 255, 0.06);
	}
	.stat:last-child { border-right: none; }

	.stat-value {
		display: block;
		font-size: 1.25rem;
		font-weight: 700;
		color: #ffffff;
	}

	.stat-label {
		display: block;
		font-size: 0.65rem;
		color: #71717a;
		margin-top: 2px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.stat.match .stat-value { color: #10b981; }
	.stat.mismatch .stat-value { color: #f59e0b; }
	.stat.missing .stat-value { color: #ef4444; }

	/* Card Footer & ADJUST BUTTON SUPAYA SELALU 1 BARIS */
	.card-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: auto;
		padding-top: 1rem;
		border-top: 1px solid rgba(255, 255, 255, 0.04);
		gap: 1rem; /* Memberikan ruang antar info audit dan grup tombol */
	}

	.audit-info {
		font-size: 0.75rem;
		color: #71717a;
		display: flex;
		flex-direction: column;
		gap: 4px;
		flex-shrink: 0; /* Mencegah info kiriman teks mengecil */
	}

	.info-line {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.info-line span { color: #a1a1a5; font-weight: 500; }
	.info-line svg { color: #52525b; }

	/* Grup Tombol - Dibuat flex row yang rigid agar tidak membungkus ke bawah */
	.action-buttons {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		flex: 1;
		justify-content: flex-end;
		min-width: 0; /* Kunci CSS flexbox agar elemen anak bisa mengecilkan ukuran teksnya */
	}

	/* Tombol Premium Style - Mengoptimalkan padding & ukuran font agar 1 baris */
	.btn-outline, .btn-sign, .btn-primary, .btn-secondary {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		white-space: nowrap; /* MENCEGAH teks melompat ke baris baru */
		transition: all 0.15s ease;
	}

	.btn-outline {
		padding: 0.5rem 0.75rem;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.1);
		color: #a1a1a5;
		font-size: 0.75rem;
		flex-shrink: 0;
	}

	.btn-outline:hover {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.2);
		color: #ffffff;
	}

	.btn-sign {
		padding: 0.5rem 0.85rem;
		background: #4f46e5;
		border: 1px solid transparent;
		color: #ffffff;
		font-size: 0.75rem;
		flex: 1; /* Biarkan tombol ini mengambil sisa area secara fleksibel */
		min-width: 0;
	}

	.btn-sign span {
		overflow: hidden;
		text-overflow: ellipsis; /* Jika sangat sempit, teks dipotong elipsis tanpa merusak layout */
		white-space: nowrap;
	}

	.btn-sign:hover:not(:disabled) {
		background: #4338ca;
	}

	.btn-sign:disabled {
		opacity: 0.4;
		cursor: not-allowed;
		background: rgba(255, 255, 255, 0.02);
		border-color: rgba(255, 255, 255, 0.04);
		color: #52525b;
	}

	/* Modals Dark Mode */
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal-preview {
		background: #121214;
		border-radius: 16px;
		width: 90vw;
		height: 85vh;
		max-width: 1200px;
		display: flex;
		flex-direction: column;
		box-shadow: 0 25px 50px rgba(0,0,0,0.5);
		border: 1px solid rgba(255,255,255,0.08);
		overflow: hidden;
	}

	.modal {
		background: #121214;
		border-radius: 16px;
		width: 520px;
		max-width: 100%;
		box-shadow: 0 25px 50px rgba(0,0,0,0.5);
		border: 1px solid rgba(255,255,255,0.08);
		overflow: hidden;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid rgba(255,255,255,0.06);
		background: rgba(255,255,255,0.02);
	}

	.modal-header h2 {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 1rem;
		font-weight: 700;
		color: #ffffff;
	}

	.modal-close {
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.08);
		color: #71717a;
		cursor: pointer;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.15s ease;
	}

	.modal-close:hover {
		color: #ffffff;
		border-color: rgba(255, 255, 255, 0.2);
		background: rgba(255, 255, 255, 0.08);
	}

	.modal-content {
		padding: 1.5rem;
	}

	.preview-content {
		flex: 1;
		padding: 0;
		background: #27272a;
	}

	.pdf-preview {
		width: 100%;
		height: 100%;
		border: none;
	}

	.report-info {
		background: rgba(255,255,255,0.01);
		border-radius: 12px;
		padding: 0.5rem 1rem;
		margin-bottom: 1.5rem;
		border: 1px solid rgba(255,255,255,0.04);
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		padding: 0.6rem 0;
		font-size: 0.875rem;
		border-bottom: 1px solid rgba(255,255,255,0.04);
	}
	.info-row:last-child { border-bottom: none; }

	.info-label { color: #71717a; font-weight: 500; }
	.info-value { font-weight: 600; color: #ffffff; }
	
	.count-badge {
		background: rgba(255,255,255,0.08);
		padding: 2px 8px;
		border-radius: 6px;
		font-size: 0.8rem;
		color: #ffffff;
	}

	.signature-area {
		margin-top: 1rem;
	}

	.signature-label {
		font-size: 0.875rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
		color: #ffffff;
	}

	.canvas-container {
		position: relative;
		margin-bottom: 0.5rem;
		border-radius: 12px;
		overflow: hidden;
		border: 2px dashed rgba(255,255,255,0.15);
		background: #ffffff; /* Pad tanda tangan tetap putih agar hasil gambar kontras */
	}

	.signature-canvas {
		width: 100%;
		height: 200px;
		cursor: crosshair;
		touch-action: none;
	}

	.canvas-actions {
		position: absolute;
		bottom: 8px;
		right: 8px;
		z-index: 5;
	}

	.btn-clear {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 5px 10px;
		background: rgba(24, 24, 27, 0.9);
		border: 1px solid rgba(239, 68, 68, 0.4);
		border-radius: 6px;
		color: #ef4444;
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s;
	}

	.btn-clear:hover {
		background: #ef4444;
		color: #ffffff;
	}

	.hint {
		font-size: 0.75rem;
		color: #71717a;
		margin-top: 0.75rem;
		text-align: center;
		line-height: 1.4;
	}

	.modal-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
		padding: 1rem 1.5rem;
		border-top: 1px solid rgba(255,255,255,0.06);
		background: rgba(255,255,255,0.02);
	}

	.btn-secondary {
		padding: 0.6rem 1.25rem;
		background: rgba(255,255,255,0.03);
		border: 1px solid rgba(255,255,255,0.08);
		color: #a1a1a5;
		font-size: 0.875rem;
	}

	.btn-secondary:hover {
		background: rgba(255, 255, 255, 0.08);
		color: #ffffff;
		border-color: rgba(255,255,255,0.2);
	}

	.btn-primary {
		padding: 0.6rem 1.25rem;
		background: #4f46e5;
		border: 1px solid transparent;
		color: #ffffff;
		font-size: 0.875rem;
	}

	.btn-primary:hover:not(:disabled) { background: #4338ca; }
	.btn-primary:disabled { opacity: 0.4; background: #27272a; color: #71717a; cursor: not-allowed; }
	
	.animate-spin { animation: spin 1s linear infinite; }
	@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

	/* Responsive Optimization */
	@media (max-width: 768px) {
		.page { padding: 1.5rem 1rem; }
		.header { flex-direction: column; align-items: stretch; gap: 1.25rem; }
		.reports-grid { grid-template-columns: 1fr; }
		.card-footer { flex-direction: column; align-items: stretch; gap: 1rem; }
		.action-buttons { width: 100%; }
		.btn-outline, .btn-sign { padding: 0.65rem; font-size: 0.85rem; }
		.modal-preview { width: 96vw; height: 92vh; }
		.modal { width: 100%; }
	}
</style>