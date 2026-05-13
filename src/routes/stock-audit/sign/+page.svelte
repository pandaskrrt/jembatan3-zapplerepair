<script lang="ts">
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    let pendingReports = $state<any[]>([]);
    let loading = $state(true);
    let selectedReport = $state<any>(null);
    let showSignatureModal = $state(false);
    let isSubmitting = $state(false);
    let errorMessage = $state('');
    let successMessage = $state('');

    // Canvas refs
    let canvasRef: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D | null = null;
    let isDrawing = $state(false);
    let lastX = 0;
    let lastY = 0;

    // Toast
    let toast = $state<{ msg: string; type: 'success' | 'error' } | null>(null);
    let toastTimer: ReturnType<typeof setTimeout>;

    function showToast(msg: string, type: 'success' | 'error' = 'success') {
        clearTimeout(toastTimer);
        toast = { msg, type };
        toastTimer = setTimeout(() => toast = null, 3500);
    }

    async function loadPendingReports() {
        loading = true;
        try {
            const res = await fetch('/api/report/pending');
            const result = await res.json();
            if (result.success) {
                pendingReports = result.data;
            }
        } catch (err) {
            console.error('Load pending reports error:', err);
        } finally {
            loading = false;
        }
    }

    function openSignatureModal(report: any) {
        selectedReport = report;
        showSignatureModal = true;
        errorMessage = '';
        // Reset canvas setelah modal terbuka
        setTimeout(() => {
            if (canvasRef) {
                ctx = canvasRef.getContext('2d');
                if (ctx) {
                    ctx.strokeStyle = '#00ff9d';
                    ctx.lineWidth = 2;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    // Clear canvas
                    ctx.clearRect(0, 0, canvasRef.width, canvasRef.height);
                }
            }
        }, 100);
    }

    function closeSignatureModal() {
        showSignatureModal = false;
        selectedReport = null;
        isSubmitting = false;
        errorMessage = '';
    }

    // Canvas drawing functions
    function startDrawing(e: MouseEvent | TouchEvent) {
        isDrawing = true;
        const pos = getCanvasCoordinates(e);
        lastX = pos.x;
        lastY = pos.y;
        if (ctx) {
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
        }
    }

    function draw(e: MouseEvent | TouchEvent) {
        if (!isDrawing || !ctx) return;
        e.preventDefault();
        const pos = getCanvasCoordinates(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        lastX = pos.x;
        lastY = pos.y;
    }

    function stopDrawing() {
        isDrawing = false;
        if (ctx) {
            ctx.beginPath();
        }
    }

    function getCanvasCoordinates(e: MouseEvent | TouchEvent) {
        const rect = canvasRef.getBoundingClientRect();
        const scaleX = canvasRef.width / rect.width;
        const scaleY = canvasRef.height / rect.height;
        
        let clientX, clientY;
        if (e instanceof TouchEvent) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        const x = (clientX - rect.left) * scaleX;
        const y = (clientY - rect.top) * scaleY;
        return { x: Math.max(0, Math.min(canvasRef.width, x)), y: Math.max(0, Math.min(canvasRef.height, y)) };
    }

    function clearCanvas() {
        if (ctx) {
            ctx.clearRect(0, 0, canvasRef.width, canvasRef.height);
        }
    }

    async function submitSignature() {
        if (!ctx) return;
        
        // Ambil data URL dari canvas
        const signatureData = canvasRef.toDataURL('image/png');
        
        isSubmitting = true;
        errorMessage = '';
        
        try {
            const res = await fetch(`/api/report/${selectedReport.report.id}/sign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    signature: signatureData,
                    signatureType: 'canvas'
                })
            });
            const result = await res.json();
            
            if (result.success) {
                showToast('Tanda tangan berhasil!', 'success');
                closeSignatureModal();
                await loadPendingReports();
            } else {
                errorMessage = result.message || 'Gagal menyimpan tanda tangan';
            }
        } catch (err) {
            errorMessage = 'Terjadi kesalahan jaringan';
        } finally {
            isSubmitting = false;
        }
    }

    function formatDate(date: string | Date) {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    onMount(() => {
        loadPendingReports();
    });
</script>

<svelte:head>
    <title>Tanda Tangan Laporan</title>
</svelte:head>

{#if toast}
    <div class="toast {toast.type === 'error' ? 'toast-error' : ''}">
        <span class="toast-icon">
            {#if toast.type === 'success'}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            {:else}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {/if}
        </span>
        <span>{toast.msg}</span>
    </div>
{/if}

<div class="page">
    <div class="header">
        <button class="back-btn" onclick={() => goto('/stock-audit')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Kembali
        </button>
        <div>
            <h1 class="title">Tanda Tangan Laporan</h1>
            <p class="subtitle">Laporan yang perlu ditandatangani</p>
        </div>
    </div>

    {#if loading}
        <div class="loading">Memuat...</div>
    {:else if pendingReports.length === 0}
        <div class="empty-state">
            <div class="empty-icon">📝</div>
            <h3>Tidak ada laporan</h3>
            <p>Belum ada laporan yang perlu ditandatangani</p>
        </div>
    {:else}
        <div class="reports-list">
            {#each pendingReports as item}
                {@const report = item.report}
                <div class="report-card">
                    <div class="report-header">
                        <div class="report-badge">Menunggu Tanda Tangan</div>
                        <div class="report-order">Tanda Tangan #{item.order}</div>
                    </div>
                    <div class="report-body">
                        <div class="report-title">{report.audit?.section?.cabinet?.name} / {report.audit?.section?.name}</div>
                        <div class="report-details">
                            <div class="detail">
                                <span class="detail-label">Auditor:</span>
                                <span class="detail-value">{report.audit?.auditor?.name}</span>
                            </div>
                            <div class="detail">
                                <span class="detail-label">Penanggung Jawab:</span>
                                <span class="detail-value">{report.responsible?.name}</span>
                            </div>
                            <div class="detail">
                                <span class="detail-label">Tanggal Audit:</span>
                                <span class="detail-value">{formatDate(report.audit?.createdAt)}</span>
                            </div>
                            <div class="detail">
                                <span class="detail-label">Total Card:</span>
                                <span class="detail-value">{report.audit?.totalCards}</span>
                            </div>
                        </div>
                        <div class="report-stats">
                            <span class="stat match">✓ {report.audit?.totalMatch}</span>
                            <span class="stat mismatch">⚠ {report.audit?.totalMismatch}</span>
                            <span class="stat missing">✕ {report.audit?.totalMissing}</span>
                            <span class="stat new">+ {report.audit?.totalNewEntry}</span>
                        </div>
                    </div>
                    <div class="report-footer">
                        <button class="btn-primary" onclick={() => openSignatureModal(item)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="16" y1="13" x2="8" y2="13"/>
                                <line x1="16" y1="17" x2="8" y2="17"/>
                            </svg>
                            Tanda Tangan Sekarang
                        </button>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<!-- Modal Tanda Tangan Canvas -->
{#if showSignatureModal && selectedReport}
<div class="modal-overlay" onclick={closeSignatureModal}>
    <div class="modal" onclick={(e) => e.stopPropagation()}>
        <div class="modal-header">
            <h2>Tanda Tangan Laporan</h2>
            <button class="modal-close" onclick={closeSignatureModal}>✕</button>
        </div>
        
        <div class="modal-body">
            <div class="sign-info">
                <p><strong>Laporan:</strong> {selectedReport.report.audit?.section?.cabinet?.name} / {selectedReport.report.audit?.section?.name}</p>
                <p><strong>Tanda Tangan ke-</strong> {selectedReport.order}</p>
                <p class="sign-hint">Silakan tanda tangan di area bawah menggunakan mouse atau sentuhan</p>
            </div>
            
            <div class="canvas-container">
                <canvas 
                    bind:this={canvasRef}
                    width={500}
                    height={200}
                    class="signature-canvas"
                    on:mousedown={startDrawing}
                    on:mousemove={draw}
                    on:mouseup={stopDrawing}
                    on:mouseleave={stopDrawing}
                    on:touchstart={startDrawing}
                    on:touchmove={draw}
                    on:touchend={stopDrawing}
                ></canvas>
                <div class="canvas-border"></div>
            </div>
            
            <div class="canvas-actions">
                <button class="btn-clear" onclick={clearCanvas}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                    Hapus
                </button>
                <span class="canvas-hint">Tanda tangan di dalam kotak</span>
            </div>
            
            {#if errorMessage}
                <div class="error-message">{errorMessage}</div>
            {/if}
        </div>
        
        <div class="modal-actions">
            <button class="btn-secondary" onclick={closeSignatureModal}>Batal</button>
            <button class="btn-primary" onclick={submitSignature} disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : 'Simpan Tanda Tangan'}
            </button>
        </div>
    </div>
</div>
{/if}

<style>
    .page {
        max-width: 800px;
        margin: 0 auto;
        padding: 1.5rem;
        font-family: 'Inter', sans-serif;
    }

    .toast {
        position: fixed;
        bottom: 1.5rem;
        right: 1.5rem;
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 16px;
        border-radius: 10px;
        background: rgba(0, 255, 157, 0.12);
        border: 1px solid rgba(0, 255, 157, 0.3);
        color: #00ff9d;
        font-size: 13px;
    }

    .toast.toast-error {
        background: rgba(255, 107, 107, 0.12);
        border-color: rgba(255, 107, 107, 0.3);
        color: #ff6b6b;
    }

    .header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1.5rem;
    }

    .back-btn {
        display: flex;
        align-items: center;
        gap: 5px;
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.5);
        font-size: 12px;
        cursor: pointer;
    }

    .title {
        font-size: 1.3rem;
        font-weight: 600;
        color: #fff;
        margin-bottom: 2px;
    }

    .subtitle {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.5);
    }

    .loading {
        text-align: center;
        padding: 2rem;
        color: rgba(255, 255, 255, 0.5);
    }

    .empty-state {
        text-align: center;
        padding: 3rem;
        background: rgba(255, 255, 255, 0.02);
        border-radius: 16px;
    }

    .empty-icon {
        font-size: 3rem;
        margin-bottom: 0.5rem;
        opacity: 0.5;
    }

    .empty-state h3 {
        font-size: 1rem;
        margin-bottom: 0.25rem;
    }

    .empty-state p {
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.4);
    }

    .reports-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .report-card {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        overflow: hidden;
    }

    .report-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 1rem;
        background: rgba(0, 0, 0, 0.2);
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .report-badge {
        font-size: 0.7rem;
        padding: 0.2rem 0.6rem;
        background: rgba(0, 204, 255, 0.1);
        color: #00ccff;
        border-radius: 20px;
    }

    .report-order {
        font-size: 0.7rem;
        color: #f59e0b;
    }

    .report-body {
        padding: 1rem;
    }

    .report-title {
        font-size: 1rem;
        font-weight: 600;
        color: #00ff9d;
        margin-bottom: 0.5rem;
    }

    .report-details {
        margin-bottom: 0.75rem;
    }

    .detail {
        display: flex;
        gap: 0.5rem;
        font-size: 0.7rem;
        padding: 0.2rem 0;
    }

    .detail-label {
        color: rgba(255, 255, 255, 0.5);
        width: 100px;
    }

    .detail-value {
        color: rgba(255, 255, 255, 0.8);
    }

    .report-stats {
        display: flex;
        gap: 0.75rem;
    }

    .stat {
        font-size: 0.7rem;
        font-weight: 500;
    }

    .stat.match { color: #00ff9d; }
    .stat.mismatch { color: #ffaa00; }
    .stat.missing { color: #ff6b6b; }
    .stat.new { color: #00ccff; }

    .report-footer {
        padding: 0.75rem 1rem;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
        display: flex;
        justify-content: flex-end;
    }

    .btn-primary {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 0.5rem 1rem;
        background: linear-gradient(135deg, #00ff9d, #00ccff);
        border: none;
        border-radius: 20px;
        color: #000;
        font-weight: 600;
        font-size: 0.7rem;
        cursor: pointer;
    }

    /* Modal Canvas */
    .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .modal {
        background: #14141f;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 1.5rem;
        width: 550px;
        max-width: 90%;
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    .modal-header h2 {
        font-size: 1rem;
        font-weight: 600;
    }

    .modal-close {
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.5);
        font-size: 1.2rem;
        cursor: pointer;
    }

    .modal-body {
        margin-bottom: 1rem;
    }

    .sign-info {
        margin-bottom: 1rem;
        font-size: 0.75rem;
    }

    .sign-info p {
        margin: 0.25rem 0;
    }

    .sign-hint {
        color: rgba(255, 255, 255, 0.5);
        font-style: italic;
        margin-top: 0.5rem !important;
    }

    .canvas-container {
        position: relative;
        margin-bottom: 0.5rem;
    }

    .signature-canvas {
        width: 100%;
        height: 150px;
        background: #1a1a2a;
        border-radius: 8px;
        cursor: crosshair;
        touch-action: none;
    }

    .canvas-border {
        position: absolute;
        bottom: -2px;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, #00ff9d, #00ccff);
        opacity: 0.5;
    }

    .canvas-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    .btn-clear {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 0.3rem 0.8rem;
        background: rgba(255, 107, 107, 0.1);
        border: 1px solid rgba(255, 107, 107, 0.3);
        border-radius: 20px;
        color: #ff6b6b;
        font-size: 0.7rem;
        cursor: pointer;
    }

    .canvas-hint {
        font-size: 0.6rem;
        color: rgba(255, 255, 255, 0.3);
    }

    .error-message {
        padding: 0.5rem;
        background: rgba(255, 107, 107, 0.1);
        border: 1px solid rgba(255, 107, 107, 0.2);
        border-radius: 8px;
        color: #ff6b6b;
        font-size: 0.7rem;
        margin-top: 0.5rem;
    }

    .modal-actions {
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
    }

    .btn-secondary {
        padding: 0.5rem 1rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.7rem;
        cursor: pointer;
    }

    @media (max-width: 600px) {
        .page {
            padding: 1rem;
        }

        .modal {
            width: 95%;
            padding: 1rem;
        }

        .signature-canvas {
            height: 120px;
        }
    }
</style>