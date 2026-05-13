<script lang="ts">
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import SignaturePad from 'signature_pad';
    import { browser } from '$app/environment';

    let { data } = $props();
    let reports = $state(data?.reports || []);
    let loading = $state(false);
    let selectedReport: any = null;
    let showSignatureModal = $state(false);
    let showPreviewModal = $state(false);
    let previewReportId: string | null = null;
    let signaturePad: any = null;
    let canvasEl: HTMLCanvasElement | null = null;
    let isSaving = $state(false);
    let toast: { msg: string; type: 'success' | 'error' } | null = null;
    let toastTimer: ReturnType<typeof setTimeout>;

    function showToast(msg: string, type: 'success' | 'error' = 'success') {
        clearTimeout(toastTimer);
        toast = { msg, type };
        toastTimer = setTimeout(() => (toast = null), 3500);
    }

    // Fungsi untuk refresh data
    async function refreshData() {
        try {
            const res = await fetch('/api/admin/pending-signatures');
            const result = await res.json();
            if (result.success) {
                reports = result.reports;
            }
        } catch (error) {
            console.error('Error refreshing data:', error);
        }
    }

    function openPreview(reportId: string) {
        previewReportId = reportId;
        showPreviewModal = true;
    }

    function closePreview() {
        showPreviewModal = false;
        previewReportId = null;
    }

    function openSignatureModal(report: any) {
        selectedReport = report;
        showSignatureModal = true;
        
        setTimeout(() => {
            if (canvasEl) {
                initSignaturePad(canvasEl);
            }
        }, 100);
    }

    function initSignaturePad(canvas: HTMLCanvasElement) {
        const container = canvas.parentElement;
        if (container) {
            const rect = container.getBoundingClientRect();
            canvas.width = rect.width - 32;
            canvas.height = 200;
        } else {
            canvas.width = 500;
            canvas.height = 200;
        }

        signaturePad = new SignaturePad(canvas, {
            backgroundColor: '#1a1a2a',
            penColor: '#00ff9d',
            velocityFilterWeight: 0.7,
            minWidth: 1,
            maxWidth: 2.5,
            throttle: 16,
            minDistance: 5,
            dotSize: 2
        });
    }

    function clearCanvas() {
        if (signaturePad) {
            signaturePad.clear();
        }
    }

    async function saveSignature() {
        if (!signaturePad || signaturePad.isEmpty()) {
            showToast('Silakan tanda tangan terlebih dahulu', 'error');
            return;
        }

        if (isSaving) return;

        isSaving = true;
        
        try {
            const signatureData = signaturePad.toDataURL('image/png');
            
            const res = await fetch('/api/admin/sign-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    reportId: selectedReport.id, 
                    signature: signatureData 
                })
            });
            
            const result = await res.json();
            
            if (result.success) {
                showToast(result.message || 'Tanda tangan berhasil disimpan!', 'success');
                showSignatureModal = false;
                
                // Refresh data setelah tanda tangan
                await refreshData();
                
                // Update report yang sudah ditandatangani di state
                const updatedReport = reports.find(r => r.id === selectedReport.id);
                if (updatedReport) {
                    updatedReport.hasSigned = true;
                    if (result.allSigned) {
                        updatedReport.status = 'COMPLETED';
                    } else if (result.remaining > 0) {
                        updatedReport.status = 'PARTIALLY_SIGNED';
                    }
                }
                
                // Force re-render dengan mengganti object reports
                reports = [...reports];
            } else {
                showToast(result.message || 'Gagal menyimpan tanda tangan', 'error');
            }
        } catch (error) {
            console.error('Error saving signature:', error);
            showToast('Terjadi kesalahan', 'error');
        } finally {
            isSaving = false;
        }
    }

    function formatDate(date: string | Date) {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function getStatusBadge(status: string) {
        if (status === 'PENDING_SIGN') {
            return { class: 'pending', icon: '⏳', text: 'Menunggu Tanda Tangan' };
        }
        if (status === 'PARTIALLY_SIGNED') {
            return { class: 'partial', icon: '🔄', text: 'Sebagian Ditandatangani' };
        }
        if (status === 'COMPLETED') {
            return { class: 'completed', icon: '✅', text: 'Selesai' };
        }
        return { class: 'draft', icon: '📝', text: 'Draft' };
    }

    // Auto refresh setiap 30 detik
    onMount(() => {
        const interval = setInterval(() => {
            if (!showSignatureModal && !showPreviewModal) {
                refreshData();
            }
        }, 30000);
        
        return () => clearInterval(interval);
    });
</script>

<svelte:head>
    <title>Admin Dashboard - Tanda Tangan Laporan</title>
</svelte:head>

{#if toast}
    <div class="toast {toast.type === 'error' ? 'toast-error' : ''}">
        <span>{toast.msg}</span>
    </div>
{/if}

<div class="page">
    <div class="header">
        <div>
            <h1 class="title">📋 Dashboard Admin</h1>
            <p class="subtitle">Laporan yang perlu ditandatangani</p>
        </div>
        <button class="btn-refresh" onclick={refreshData}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 4v6h-6M1 20v-6h6"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Refresh
        </button>
    </div>

    {#if reports.length === 0}
        <div class="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <h3>Tidak ada laporan yang perlu ditandatangani</h3>
            <p>Semua laporan sudah lengkap atau belum ada yang memerlukan tanda tangan Anda.</p>
        </div>
    {:else}
        <div class="reports-grid">
            {#each reports as report}
                <div class="report-card">
                    <div class="card-header">
                        <div class="card-title">
                            <h3>{report.sectionName}</h3>
                            <span class="badge {getStatusBadge(report.status).class}">
                                {getStatusBadge(report.status).icon} {getStatusBadge(report.status).text}
                            </span>
                        </div>
                        <p class="card-subtitle">{report.cabinetName}</p>
                    </div>
                    
                    <div class="card-stats">
                        <div class="stat">
                            <span class="stat-value">{report.totalCards || 0}</span>
                            <span class="stat-label">Total Card</span>
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
                            <span>👤 Auditor: {report.auditorName}</span>
                            <span>📅 Tanggal: {formatDate(report.createdAt)}</span>
                        </div>
                        <div class="action-buttons">
                            <button class="btn-preview" onclick={() => openPreview(report.id)}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                    <circle cx="12" cy="12" r="3"/>
                                </svg>
                                Preview PDF
                            </button>
                            <button 
                                class="btn-sign" 
                                onclick={() => openSignatureModal(report)}
                                disabled={report.hasSigned === true || report.status === 'COMPLETED'}
                            >
                                {report.hasSigned ? '✓ Sudah Ditandatangani' : '✍️ Tanda Tangani'}
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
                <h2>📄 Preview Laporan Audit</h2>
                <button class="modal-close" onclick={closePreview}>✕</button>
            </div>
            <div class="modal-content preview-content">
                <iframe
                    src={`/api/preview-pdf/${previewReportId}`}
                    class="pdf-preview"
                    title="Preview PDF"
                ></iframe>
            </div>
            <div class="modal-actions">
                <button class="btn-secondary" onclick={closePreview}>Tutup</button>
                <button 
                    class="btn-primary" 
                    onclick={() => {
                        const report = reports.find(r => r.id === previewReportId);
                        closePreview();
                        if (report && !report.hasSigned && report.status !== 'COMPLETED') {
                            setTimeout(() => openSignatureModal(report), 100);
                        }
                    }}
                >
                    Lanjutkan Tanda Tangan
                </button>
            </div>
        </div>
    </div>
{/if}

<!-- Modal Signature -->
{#if showSignatureModal && selectedReport}
    <div class="modal-overlay" onclick={() => showSignatureModal = false}>
        <div class="modal" onclick={(e) => e.stopPropagation()}>
            <div class="modal-header">
                <h2>✍️ Tanda Tangan Laporan</h2>
                <button class="modal-close" onclick={() => showSignatureModal = false}>✕</button>
            </div>
            
            <div class="modal-content">
                <div class="report-info">
                    <div class="info-row">
                        <span class="info-label">Section:</span>
                        <span class="info-value">{selectedReport.sectionName}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Cabinet:</span>
                        <span class="info-value">{selectedReport.cabinetName}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Auditor:</span>
                        <span class="info-value">{selectedReport.auditorName}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Tanggal Audit:</span>
                        <span class="info-value">{formatDate(selectedReport.createdAt)}</span>
                    </div>
                </div>
                
                <div class="signature-area">
                    <p class="signature-label">Tanda Tangan Anda:</p>
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
                    <p class="hint">Silakan tanda tangan di area di atas menggunakan mouse atau sentuhan</p>
                </div>
            </div>
            
            <div class="modal-actions">
                <button class="btn-secondary" onclick={() => showSignatureModal = false}>Batal</button>
                <button class="btn-primary" onclick={saveSignature} disabled={isSaving}>
                    {isSaving ? 'Menyimpan...' : 'Simpan Tanda Tangan'}
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    .page {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem 1.5rem;
        font-family: 'Inter', sans-serif;
        background: #0a0a0f;
        min-height: 100vh;
        color: #fff;
    }

    /* Toast */
    .toast {
        position: fixed;
        bottom: 1.5rem;
        right: 1.5rem;
        z-index: 9999;
        padding: 10px 16px;
        border-radius: 10px;
        font-size: 13px;
        background: rgba(0, 255, 157, 0.12);
        border: 1px solid rgba(0, 255, 157, 0.3);
        color: #00ff9d;
    }

    .toast-error {
        background: rgba(255, 107, 107, 0.12);
        border-color: rgba(255, 107, 107, 0.3);
        color: #ff6b6b;
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

    .title {
        font-size: 2rem;
        font-weight: 700;
        background: linear-gradient(135deg, #ffffff, #00ff9d);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin-bottom: 0.5rem;
    }

    .subtitle {
        color: rgba(255, 255, 255, 0.5);
        font-size: 0.9rem;
    }

    .btn-refresh {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0.5rem 1rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.8rem;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .btn-refresh:hover {
        background: rgba(255, 255, 255, 0.1);
        transform: translateY(-1px);
    }

    /* Reports Grid */
    .reports-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
        gap: 1.5rem;
    }

    .report-card {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 16px;
        padding: 1.25rem;
        transition: all 0.3s ease;
    }

    .report-card:hover {
        border-color: rgba(0, 255, 157, 0.3);
        transform: translateY(-2px);
    }

    .card-header {
        margin-bottom: 1rem;
    }

    .card-title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.25rem;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .card-title h3 {
        font-size: 1.1rem;
        font-weight: 600;
    }

    .badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 0.2rem 0.6rem;
        border-radius: 20px;
        font-size: 0.7rem;
    }

    .badge.pending {
        background: rgba(0, 204, 255, 0.1);
        color: #00ccff;
    }

    .badge.partial {
        background: rgba(255, 170, 0, 0.1);
        color: #ffaa00;
    }

    .badge.completed {
        background: rgba(0, 255, 157, 0.1);
        color: #00ff9d;
    }

    .badge.draft {
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
    }

    .card-subtitle {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.4);
    }

    .card-stats {
        display: flex;
        gap: 1rem;
        padding: 0.75rem 0;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        margin-bottom: 1rem;
    }

    .stat {
        text-align: center;
        flex: 1;
    }

    .stat-value {
        display: block;
        font-size: 1rem;
        font-weight: 700;
    }

    .stat-label {
        font-size: 0.6rem;
        color: rgba(255, 255, 255, 0.4);
    }

    .stat.match .stat-value { color: #00ff9d; }
    .stat.mismatch .stat-value { color: #ffaa00; }
    .stat.missing .stat-value { color: #ff6b6b; }

    .card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.75rem;
    }

    .audit-info {
        font-size: 0.65rem;
        color: rgba(255, 255, 255, 0.4);
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .action-buttons {
        display: flex;
        gap: 0.5rem;
    }

    .btn-preview {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 0.5rem 0.75rem;
        background: rgba(0, 204, 255, 0.1);
        border: 1px solid rgba(0, 204, 255, 0.3);
        border-radius: 8px;
        color: #00ccff;
        font-weight: 600;
        font-size: 0.7rem;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .btn-preview:hover {
        background: rgba(0, 204, 255, 0.2);
        transform: translateY(-1px);
    }

    .btn-sign {
        padding: 0.5rem 0.75rem;
        background: linear-gradient(135deg, #00ff9d, #00ccff);
        border: none;
        border-radius: 8px;
        color: #000;
        font-weight: 600;
        font-size: 0.7rem;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .btn-sign:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 255, 157, 0.3);
    }

    .btn-sign:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        background: rgba(0, 255, 157, 0.3);
    }

    .empty-state {
        text-align: center;
        padding: 4rem;
    }

    .empty-state svg {
        margin-bottom: 1rem;
        opacity: 0.5;
    }

    .empty-state h3 {
        font-size: 1.1rem;
        margin-bottom: 0.5rem;
    }

    .empty-state p {
        color: rgba(255, 255, 255, 0.4);
        font-size: 0.85rem;
    }

    /* Modal Preview */
    .modal-preview {
        background: #14141f;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        width: 90vw;
        height: 90vh;
        max-width: 1200px;
        display: flex;
        flex-direction: column;
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
        background: #fff;
    }

    /* Modal Signature */
    .modal {
        background: #14141f;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        width: 550px;
        max-width: 90%;
    }

    .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.5rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .modal-header h2 {
        font-size: 1.1rem;
        font-weight: 600;
    }

    .modal-close {
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.5);
        font-size: 1.2rem;
        cursor: pointer;
    }

    .modal-content {
        padding: 1.5rem;
    }

    .report-info {
        background: rgba(0, 255, 157, 0.05);
        border-radius: 8px;
        padding: 0.75rem;
        margin-bottom: 1.5rem;
    }

    .info-row {
        display: flex;
        justify-content: space-between;
        padding: 0.25rem 0;
        font-size: 0.8rem;
    }

    .info-label {
        color: rgba(255, 255, 255, 0.5);
    }

    .info-value {
        font-weight: 500;
        color: #00ff9d;
    }

    .signature-area {
        margin-top: 1rem;
    }

    .signature-label {
        font-size: 0.85rem;
        font-weight: 500;
        margin-bottom: 0.5rem;
    }

    .canvas-container {
        margin-bottom: 0.5rem;
    }

    .signature-canvas {
        width: 100%;
        height: 200px;
        background: #1a1a2a;
        border: 2px solid rgba(0, 255, 157, 0.3);
        border-radius: 8px;
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
        gap: 4px;
        padding: 0.3rem 0.8rem;
        background: rgba(255, 107, 107, 0.1);
        border: 1px solid rgba(255, 107, 107, 0.3);
        border-radius: 6px;
        color: #ff6b6b;
        font-size: 0.7rem;
        cursor: pointer;
    }

    .btn-clear:hover {
        background: rgba(255, 107, 107, 0.2);
    }

    .hint {
        font-size: 0.65rem;
        color: rgba(255, 255, 255, 0.3);
        margin-top: 0.5rem;
        text-align: center;
    }

    .modal-actions {
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
        padding: 1rem 1.5rem;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    .btn-secondary {
        padding: 0.5rem 1rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.8rem;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .btn-secondary:hover {
        background: rgba(255, 255, 255, 0.1);
    }

    .btn-primary {
        padding: 0.5rem 1rem;
        background: linear-gradient(135deg, #00ff9d, #00ccff);
        border: none;
        border-radius: 8px;
        color: #000;
        font-weight: 600;
        font-size: 0.8rem;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .btn-primary:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 255, 157, 0.3);
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

        .btn-preview, .btn-sign {
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