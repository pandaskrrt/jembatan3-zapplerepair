<script lang="ts">
    import { goto } from '$app/navigation';
    import { onDestroy, onMount } from 'svelte';
    import { invalidateAll } from '$app/navigation';
    import { browser } from '$app/environment';
    
    // Import Signature Pad hanya di client-side
    let SignaturePad: any;
    if (browser) {
        import('signature_pad').then(module => {
            SignaturePad = module.default;
        });
    }

    let { data } = $props();
    let audit = data?.audit;
    let report = data?.report;
    let availableAdmins = data?.availableAdmins || [];

    let showResponsibleModal = $state(false);
    let isSubmitting = $state(false);
    let errorMessage = $state('');

    let hasSignature = $state(!!report?.auditorSignature);
    let isSavingSignature = $state(false);
    let signaturePad: any = null;
    let canvasEl: HTMLCanvasElement | null = null;
    let isDownloading = $state(false);

    let selectedResponsibleIds = $state<string[]>(
        Array.isArray(report?.responsibleIds) ? report.responsibleIds : []
    );
    const maxResponsible = 2;
    const minResponsible = 1;

    let progressSteps = $state([
        { id: 1, label: 'Laporan Dibuat', status: report ? 'completed' : 'pending' },
        { id: 2, label: 'Audit Tanda Tangan', status: report?.auditorSignature ? 'completed' : 'pending' },
        { id: 3, label: 'Penanggung Jawab', status: report?.status === 'COMPLETED' ? 'completed' : 'pending' }
    ]);

    let toast = $state<{ msg: string; type: 'success' | 'error' } | null>(null);
    let alert = $state<{ msg: string; type: 'info' | 'success' | 'warning' | 'error' } | null>(null);
    let toastTimer: ReturnType<typeof setTimeout>;
    let alertTimer: ReturnType<typeof setTimeout>;

    function showToast(msg: string, type: 'success' | 'error' = 'success') {
        clearTimeout(toastTimer);
        toast = { msg, type };
        toastTimer = setTimeout(() => (toast = null), 3500);
    }
    
    function showAlert(msg: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
        clearTimeout(alertTimer);
        alert = { msg, type };
        alertTimer = setTimeout(() => (alert = null), 5000);
    }

    function formatDate(date: string | Date) {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    function getStatusBadge(status: string) {
        const badges: Record<string, { class: string; icon: string; text: string }> = {
            DRAFT: { class: 'draft', icon: '📝', text: 'Draft' },
            PENDING_SIGN: { class: 'pending', icon: '⏳', text: 'Menunggu Tanda Tangan' },
            COMPLETED: { class: 'completed', icon: '✅', text: 'Selesai' }
        };
        return badges[status] ?? { class: 'draft', icon: '📝', text: status };
    }

    // Inisialisasi Signature Pad hanya di client-side
    onMount(async () => {
        if (!browser) return;
        
        // Import Signature Pad
        const { default: SP } = await import('signature_pad');
        SignaturePad = SP;
        
        // Inisialisasi jika canvas tersedia
        if (canvasEl && !hasSignature) {
            initSignaturePad(canvasEl);
        }
        
        // Tambahkan resize handler
        window.addEventListener('resize', handleResize);
    });

    function initSignaturePad(canvas: HTMLCanvasElement) {
        if (!SignaturePad) return;
        
        // Set ukuran canvas yang tepat
        const container = canvas.parentElement;
        if (container) {
            const rect = container.getBoundingClientRect();
            canvas.width = rect.width - 32;
            canvas.height = 200;
        } else {
            canvas.width = 600;
            canvas.height = 200;
        }

        // Inisialisasi Signature Pad
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

        // Load signature yang sudah ada
        if (report?.auditorSignature) {
            try {
                signaturePad.fromDataURL(report.auditorSignature);
                hasSignature = true;
            } catch (err) {
                console.error('Failed to load signature:', err);
            }
        }
    }

    function clearCanvas() {
        if (signaturePad) {
            signaturePad.clear();
            showToast('Canvas dibersihkan', 'success');
        }
    }

    async function saveAuditorSignature() {
        if (!signaturePad) {
            showToast('Signature pad belum siap', 'error');
            return;
        }

        if (signaturePad.isEmpty()) {
            showToast('Silakan tanda tangan terlebih dahulu', 'error');
            return;
        }

        if (isSavingSignature) return;

        isSavingSignature = true;
        errorMessage = '';

        try {
            // Ambil data signature asli
            const originalDataURL = signaturePad.toDataURL('image/png');
            
            // Hapus background menjadi transparan
            const transparentSignature = await removeBackground(originalDataURL);
            
            const res = await fetch(`/api/report/${report?.id}/auditor-sign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ signature: transparentSignature })
            });
            
            const result = await res.json();
            
            if (result.success) {
                hasSignature = true;
                progressSteps[1].status = 'completed';
                showToast('Tanda tangan berhasil disimpan!', 'success');
                showAlert('Tanda tangan audit telah disimpan!', 'success');
                await invalidateAll();
            } else {
                errorMessage = result.message || 'Gagal menyimpan tanda tangan';
                showToast(errorMessage, 'error');
            }
        } catch (err) {
            console.error('Save error:', err);
            errorMessage = 'Terjadi kesalahan jaringan';
            showToast(errorMessage, 'error');
        } finally {
            isSavingSignature = false;
        }
    }

    // Fungsi untuk menghapus background
    function removeBackground(dataURL: string): Promise<string> {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                // Buat canvas temporer
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d')!;
                
                canvas.width = img.width;
                canvas.height = img.height;
                
                // Gambar image ke canvas
                ctx.drawImage(img, 0, 0);
                
                // Ambil data pixel
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                
                // Warna background yang akan dihapus (#1a1a2a -> RGB: 26, 26, 42)
                const targetR = 26;
                const targetG = 26;
                const targetB = 42;
                const tolerance = 30; // Toleransi warna
                
                // Loop melalui setiap pixel
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    
                    // Cek apakah pixel mendekati warna background
                    if (Math.abs(r - targetR) < tolerance && 
                        Math.abs(g - targetG) < tolerance && 
                        Math.abs(b - targetB) < tolerance) {
                        // Ubah menjadi transparan
                        data[i + 3] = 0; // Alpha channel = 0
                    }
                }
                
                // Put data back
                ctx.putImageData(imageData, 0, 0);
                
                // Konversi ke PNG dengan background transparan
                resolve(canvas.toDataURL('image/png'));
            };
            img.src = dataURL;
        });
    }

    async function saveResponsible() {
        if (selectedResponsibleIds.length < minResponsible) {
            errorMessage = `Pilih minimal ${minResponsible} penanggung jawab`;
            showAlert(errorMessage, 'error');
            return;
        }
        if (selectedResponsibleIds.length > maxResponsible) {
            errorMessage = `Maksimal ${maxResponsible} penanggung jawab`;
            showAlert(errorMessage, 'error');
            return;
        }
        
        isSubmitting = true;
        errorMessage = '';
        
        try {
            const res = await fetch(`/api/report/${report?.id}/responsible`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ responsibleIds: selectedResponsibleIds })
            });
            
            const result = await res.json();
            
            if (result.success) {
                showToast('Penanggung jawab berhasil dipilih!', 'success');
                showAlert('Penanggung jawab telah ditetapkan!', 'success');
                showResponsibleModal = false;
                await invalidateAll();
            } else {
                errorMessage = result.message || 'Gagal menyimpan';
                showAlert(errorMessage, 'error');
            }
        } catch {
            errorMessage = 'Terjadi kesalahan jaringan';
            showAlert(errorMessage, 'error');
        } finally {
            isSubmitting = false;
        }
    }

    async function submitReport() {
        if (isSubmitting) return;
        
        isSubmitting = true;
        
        try {
            const res = await fetch(`/api/report/${report?.id}/submit`, { method: 'POST' });
            const result = await res.json();
            
            if (result.success) {
                showToast('Laporan berhasil dikirim!', 'success');
                showAlert('Laporan telah dikirim ke penanggung jawab untuk ditandatangani!', 'success');
                
                // Refresh data terlebih dahulu
                await invalidateAll();
                
                // Redirect ke halaman laporan yang sama (akan refresh status)
                // atau bisa juga ke halaman list audit
                setTimeout(() => {
                    goto(`/stock-audit/laporan/${audit?.id}`);
                }, 1500);
            } else {
                errorMessage = result.message || 'Gagal mengirim laporan';
                showAlert(errorMessage, 'error');
            }
        } catch (err) {
            console.error('Submit error:', err);
            showAlert('Terjadi kesalahan saat mengirim laporan', 'error');
        } finally {
            isSubmitting = false;
        }
    }

    async function downloadPDF() {
        if (isDownloading) return;
        
        try {
            isDownloading = true;
            showToast('Menyiapkan PDF...', 'success');
            
            // Tambahkan class loading ke button
            const downloadBtn = document.querySelector('.btn-download');
            downloadBtn?.classList.add('downloading');
            
            const response = await fetch(`/api/report/${report?.id}/pdf`);
            
            if (!response.ok) {
                throw new Error('Gagal mengunduh PDF');
            }
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Laporan_Audit_${audit?.sectionName || 'Stock'}_${new Date().toISOString().split('T')[0]}.pdf`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            showToast('PDF berhasil diunduh!', 'success');
        } catch (error) {
            console.error('Error downloading PDF:', error);
            showToast('Gagal mengunduh PDF', 'error');
            showAlert('Terjadi kesalahan saat mengunduh PDF', 'error');
        } finally {
            isDownloading = false;
            const downloadBtn = document.querySelector('.btn-download');
            downloadBtn?.classList.remove('downloading');
        }
    }

    function toggleResponsible(adminId: string) {
        if (selectedResponsibleIds.includes(adminId)) {
            selectedResponsibleIds = selectedResponsibleIds.filter(id => id !== adminId);
        } else if (selectedResponsibleIds.length < maxResponsible) {
            selectedResponsibleIds = [...selectedResponsibleIds, adminId];
        } else {
            showAlert(`Maksimal ${maxResponsible} orang penanggung jawab`, 'warning');
        }
    }

    // Handle resize untuk responsive canvas
    function handleResize() {
        if (!browser) return;
        if (canvasEl && signaturePad && !signaturePad.isEmpty()) {
            const container = canvasEl.parentElement;
            if (container) {
                const rect = container.getBoundingClientRect();
                const oldData = signaturePad.toData();
                
                canvasEl.width = rect.width - 32;
                canvasEl.height = 200;
                
                signaturePad.clear();
                if (oldData && oldData.length > 0) {
                    setTimeout(() => {
                        signaturePad.fromData(oldData);
                    }, 100);
                }
            }
        }
    }

    onDestroy(() => {
        clearTimeout(toastTimer);
        clearTimeout(alertTimer);
        if (browser) {
            window.removeEventListener('resize', handleResize);
        }
        if (signaturePad) {
            signaturePad.off();
            signaturePad = null;
        }
    });
</script>

<svelte:head>
    <title>Laporan Audit - {audit?.sectionName}</title>
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

{#if alert}
    <div class="alert alert-{alert.type}">
        <span>
            {#if alert.type === 'success'}✅
            {:else if alert.type === 'warning'}⚠️
            {:else if alert.type === 'error'}❌
            {:else}ℹ️{/if}
        </span>
        <span>{alert.msg}</span>
    </div>
{/if}

<div class="page">
    <!-- Header -->
        <div class="header">
            <button class="back-btn" onclick={() => goto(`/stock-audit/riwayat/${audit?.sectionId}`)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Kembali ke Detail Section
        </button>
        <div>
            <h1 class="title">Laporan Audit</h1>
            <p class="subtitle">{audit?.cabinetName} / {audit?.sectionName}</p>
        </div>
        <div class="status-badge {getStatusBadge(report?.status || 'DRAFT').class}">
            {getStatusBadge(report?.status || 'DRAFT').icon}
            {getStatusBadge(report?.status || 'DRAFT').text}
        </div>
    </div>

    <!-- Progress -->
    <div class="progress-section">
        <div class="progress-header">
            <h3>Status Laporan</h3>
            <span class="progress-percent">
                {Math.round((progressSteps.filter(s => s.status === 'completed').length / progressSteps.length) * 100)}%
            </span>
        </div>
        <div class="progress-bar-container">
            <div class="progress-bar-fill"
                style="width: {(progressSteps.filter(s => s.status === 'completed').length / progressSteps.length) * 100}%">
            </div>
        </div>
        <div class="progress-steps">
            {#each progressSteps as step}
                <div class="step" class:completed={step.status === 'completed'} class:active={step.status === 'pending'}>
                    <div class="step-marker">{step.status === 'completed' ? '✓' : step.id}</div>
                    <div class="step-label">{step.label}</div>
                </div>
            {/each}
        </div>
    </div>

    <!-- Stats -->
    <div class="stats-grid">
        <div class="stat-card"><span class="stat-value">{audit?.totalCards   || 0}</span><span class="stat-label">Total Card</span></div>
        <div class="stat-card match">   <span class="stat-value">{audit?.totalMatch    || 0}</span><span class="stat-label">Match</span></div>
        <div class="stat-card mismatch"><span class="stat-value">{audit?.totalMismatch || 0}</span><span class="stat-label">Mismatch</span></div>
        <div class="stat-card missing"> <span class="stat-value">{audit?.totalMissing  || 0}</span><span class="stat-label">Missing</span></div>
        <div class="stat-card new">     <span class="stat-value">{audit?.totalNewEntry || 0}</span><span class="stat-label">New Entry</span></div>
    </div>

    <!-- Info -->
    <div class="info-card">
        <div class="info-row"><span class="info-label">Auditor</span><span class="info-value">{audit?.auditorName}</span></div>
        <div class="info-row"><span class="info-label">Tanggal Audit</span><span class="info-value">{formatDate(audit?.createdAt)}</span></div>
        {#if audit?.completedAt}
            <div class="info-row"><span class="info-label">Selesai</span><span class="info-value">{formatDate(audit?.completedAt)}</span></div>
        {/if}
        {#if audit?.note}
            <div class="info-row"><span class="info-label">Catatan</span><span class="info-value note-value">{audit.note}</span></div>
        {/if}
    </div>

    <!-- Tanda Tangan -->
<!-- Tanda Tangan -->
<div class="signature-section">
    <div class="section-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
        </svg>
        Tanda Tangan Auditor
    </div>

    {#if hasSignature}
        <div class="signature-done">
            <span class="signature-done-icon">✅</span>
            <div>
                <strong>Tanda tangan sudah diberikan</strong>
                <p>Ditandatangani pada: {formatDate(report?.auditorSignedAt)}</p>
            </div>
        </div>
    {:else}
        <div class="canvas-container">
            <canvas
                bind:this={canvasEl}
                class="signature-canvas"
            ></canvas>
            <div class="canvas-actions">
                <button class="btn-clear" onclick={clearCanvas}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                    Hapus
                </button>
                <button class="btn-save" onclick={saveAuditorSignature} disabled={isSavingSignature}>
                    {isSavingSignature ? 'Menyimpan...' : 'Simpan Tanda Tangan'}
                </button>
            </div>
        </div>
        <p class="canvas-hint">Silakan tanda tangan di area kotak di atas menggunakan mouse atau sentuhan</p>
    {/if}
</div>

   <!-- Penanggung Jawab -->
<div class="responsible-section">
    <div class="section-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
        </svg>
        Penanggung Jawab ({report?.responsibleIds?.length || 0}/{maxResponsible})
    </div>
    <div class="responsible-list">
        {#if report?.responsiblePersons?.length}
            {#each report.responsiblePersons as resp}
                <div class="responsible-item">
                    <div>
                        <div class="responsible-name">{resp.name}</div>
                        <div class="responsible-username">@{resp.username}</div>
                    </div>
                    <div class="responsible-status">
                        {#if report.status === 'COMPLETED'}
                            <span class="status-success">✅ Sudah ditandatangani</span>
                        {:else if report.status === 'PENDING_SIGN'}
                            <span class="status-pending">⏳ Menunggu tanda tangan</span>
                        {:else}
                            <span class="status-waiting">Belum dikirim</span>
                        {/if}
                        
                        {#if report.status !== 'DRAFT' && report.signatures?.length > 0}
                            {#each report.signatures as sig}
                                {#if sig.signerId === resp.id && sig.signedAt}
                                    <span class="signature-date">
                                        Ditandatangani: {formatDate(sig.signedAt)}
                                    </span>
                                {/if}
                            {/each}
                        {/if}
                    </div>
                </div>
            {/each}
        {/if}
        
        <!-- Tombol pilih penanggung jawab hanya muncul di status DRAFT -->
        {#if report?.status === 'DRAFT' && (!report?.responsibleIds || report.responsibleIds.length < maxResponsible)}
            <button class="btn-outline" onclick={() => showResponsibleModal = true}>
                {report?.responsibleIds?.length ? 'Tambah' : 'Pilih'} Penanggung Jawab
            </button>
        {/if}
    </div>
</div>

<!-- Action Buttons -->
<div class="action-buttons">
    <!-- Tombol Download PDF selalu muncul jika sudah ada signature -->
    {#if hasSignature}
        <button 
            class="btn-download" 
            onclick={downloadPDF}
            disabled={isDownloading}
        >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            {isDownloading ? 'Mengunduh...' : 'Download PDF'}
        </button>
    {/if}

    <!-- Tombol Kirim Laporan hanya muncul di status DRAFT -->
    {#if report?.status === 'DRAFT'}
        <button 
            class="btn-primary" 
            onclick={submitReport}
            disabled={!hasSignature || !report?.responsibleIds?.length || isSubmitting}
        >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"/>
            </svg>
            {isSubmitting ? 'Mengirim...' : 'Kirim Laporan'}
        </button>
    {:else if report?.status === 'PENDING_SIGN'}
        <!-- Status menunggu tanda tangan penanggung jawab -->
        <div class="info-status">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffaa00" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>Menunggu tanda tangan dari penanggung jawab</span>
        </div>
    {:else if report?.status === 'COMPLETED'}
        <!-- Status selesai semua -->
        <div class="info-status success">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00ff9d" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>Laporan telah selesai dan ditandatangani semua pihak</span>
        </div>
    {/if}
</div>
</div>

<!-- Modal -->
{#if showResponsibleModal}
<div class="modal-overlay" onclick={() => showResponsibleModal = false}>
    <div class="modal" onclick={(e) => e.stopPropagation()}>
        <div class="modal-header">
            <h2>Pilih Penanggung Jawab</h2>
            <button class="modal-close" onclick={() => showResponsibleModal = false}>✕</button>
        </div>
        <p class="modal-hint">Pilih {minResponsible}–{maxResponsible} orang penanggung jawab</p>
        {#if errorMessage}
            <div class="error-message">{errorMessage}</div>
        {/if}
        <div class="admin-list">
            {#each availableAdmins as admin}
                <label class="admin-option">
                    <input type="checkbox" value={admin.id}
                        checked={selectedResponsibleIds.includes(admin.id)}
                        onchange={() => toggleResponsible(admin.id)} />
                    <div>
                        <div class="admin-name">{admin.name}</div>
                        <div class="admin-username">@{admin.username}</div>
                    </div>
                </label>
            {/each}
        </div>
        <div class="selected-info">
            Terpilih: <strong>{selectedResponsibleIds.length}</strong> dari {minResponsible}–{maxResponsible} orang
        </div>
        <div class="modal-actions">
            <button class="btn-secondary" onclick={() => showResponsibleModal = false}>Batal</button>
            <button class="btn-primary" onclick={saveResponsible} disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </button>
        </div>
    </div>
</div>
{/if}

<style>

/* Status Info */
.info-status {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 0.6rem 1.2rem;
    background: rgba(255, 170, 0, 0.1);
    border: 1px solid rgba(255, 170, 0, 0.3);
    border-radius: 12px;
    color: #ffaa00;
    font-size: 0.8rem;
    font-weight: 500;
}

.info-status.success {
    background: rgba(0, 255, 157, 0.1);
    border-color: rgba(0, 255, 157, 0.3);
    color: #00ff9d;
}

.responsible-status {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
}

.status-success {
    color: #00ff9d;
    font-size: 0.7rem;
    font-weight: 500;
}

.signature-date {
    font-size: 0.6rem;
    color: rgba(255, 255, 255, 0.4);
}

/* Responsive */
@media (max-width: 768px) {
    .responsible-item {
        flex-direction: column;
        align-items: flex-start;
    }
    
    .responsible-status {
        align-items: flex-start;
        margin-top: 0.5rem;
        width: 100%;
    }
    
    .info-status {
        width: 100%;
        justify-content: center;
    }
}
/* Action Buttons Container */
.action-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}

/* Download PDF Button */
.btn-download {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 0.75rem 1.5rem;
    border-radius: 12px;
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    
    /* Gradient background */
    background: linear-gradient(135deg, rgba(0, 255, 157, 0.15), rgba(0, 204, 255, 0.15));
    border: 1px solid rgba(0, 255, 157, 0.3);
    color: #00ff9d;
}

.btn-download::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(0, 255, 157, 0.2), transparent);
    transition: left 0.5s ease;
}

.btn-download:hover::before {
    left: 100%;
}

.btn-download:hover {
    background: linear-gradient(135deg, rgba(0, 255, 157, 0.25), rgba(0, 204, 255, 0.25));
    border-color: rgba(0, 255, 157, 0.6);
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0, 255, 157, 0.2);
}

.btn-download:active {
    transform: translateY(0);
}

.btn-download svg {
    width: 18px;
    height: 18px;
    transition: transform 0.2s ease;
}

.btn-download:hover svg {
    transform: translateY(2px);
}

/* Disabled state */
.btn-download:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
}

.btn-download:disabled:hover {
    background: linear-gradient(135deg, rgba(0, 255, 157, 0.15), rgba(0, 204, 255, 0.15));
    border-color: rgba(0, 255, 157, 0.3);
}

.btn-download:disabled:hover svg {
    transform: none;
}

/* Primary Button (Kirim Laporan) */
.btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 0.75rem 1.5rem;
    border-radius: 12px;
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.3s ease;
    
    background: linear-gradient(135deg, #00ff9d, #00ccff);
    border: none;
    color: #000;
    position: relative;
    overflow: hidden;
}

.btn-primary::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transition: left 0.5s ease;
}

.btn-primary:hover::before {
    left: 100%;
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0, 255, 157, 0.3);
}

.btn-primary:active {
    transform: translateY(0);
}

.btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
}

.btn-primary:disabled:hover {
    box-shadow: none;
}

/* Loading animation untuk download */
.btn-download.loading {
    pointer-events: none;
    opacity: 0.7;
}

.btn-download.loading svg {
    animation: bounce 1s ease infinite;
}

@keyframes bounce {
    0%, 100% {
        transform: translateY(0);
    }
    50% {
        transform: translateY(3px);
    }
}

/* Responsive Design */
@media (max-width: 768px) {
    .action-buttons {
        flex-direction: column;
        gap: 0.75rem;
    }
    
    .btn-download,
    .btn-primary {
        justify-content: center;
        padding: 0.65rem 1.25rem;
        font-size: 0.8rem;
    }
    
    .btn-download svg,
    .btn-primary svg {
        width: 16px;
        height: 16px;
    }
}

/* Untuk layar sangat kecil */
@media (max-width: 480px) {
    .action-buttons {
        margin-top: 1rem;
    }
    
    .btn-download,
    .btn-primary {
        width: 100%;
        padding: 0.6rem 1rem;
    }
}

/* Dark mode support (sudah sesuai dengan tema gelap) */
@media (prefers-color-scheme: light) {
    .btn-download {
        background: linear-gradient(135deg, rgba(0, 100, 50, 0.1), rgba(0, 100, 150, 0.1));
        color: #00a86b;
    }
    
    .btn-download:hover {
        background: linear-gradient(135deg, rgba(0, 100, 50, 0.15), rgba(0, 100, 150, 0.15));
    }
}

/* Tooltip untuk memberi tahu user */
.btn-download {
    position: relative;
}

.btn-download::after {
    content: 'Download PDF';
    position: absolute;
    bottom: -30px;
    left: 50%;
    transform: translateX(-50%) translateY(-5px);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 11px;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: all 0.2s ease;
    z-index: 100;
}

.btn-download:hover::after {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
}

/* Untuk mobile, disable tooltip */
@media (max-width: 768px) {
    .btn-download::after {
        display: none;
    }
}

/* Progress indicator saat download */
@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

.btn-download.downloading svg {
    animation: spin 1s linear infinite;
}

.btn-download.downloading::after {
    content: 'Mengunduh...';
}
.canvas-container {
    margin-bottom: 0.5rem;
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
}

.signature-canvas {
    display: block;
    width: 100%;
    height: auto;
    min-height: 150px;
    background: #1a1a2a;
    border-radius: 8px;
    cursor: crosshair;
    touch-action: none; /* Penting untuk touch devices */
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    border: 2px solid rgba(0, 255, 157, 0.3);
    transition: border-color 0.2s ease;
}

.signature-canvas:active {
    cursor: crosshair;
}

/* Untuk Firefox - pastikan canvas tetap responsif */
@-moz-document url-prefix() {
    .signature-canvas {
        width: 100%;
        height: auto;
    }
}

/* Untuk Edge/Chromium */
@media all and (-ms-high-contrast: none), (-ms-high-contrast: active) {
    .signature-canvas {
        width: 100%;
        height: auto;
    }
}
    .page {
        max-width: 900px;
        margin: 0 auto;
        padding: 1.5rem;
        font-family: 'Inter', sans-serif;
        background: #0a0a0f;
        min-height: 100vh;
        color: #fff;
    }

    /* Toast */
    .toast {
        position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 9999;
        display: flex; align-items: center; gap: 8px;
        padding: 10px 16px; border-radius: 10px; font-size: 13px;
        background: rgba(0,255,157,0.12); border: 1px solid rgba(0,255,157,0.3); color: #00ff9d;
    }
    .toast.toast-error { background: rgba(255,107,107,0.12); border-color: rgba(255,107,107,0.3); color: #ff6b6b; }

    /* Alert */
    .alert {
        position: fixed; top: 1.5rem; right: 1.5rem; z-index: 9998;
        display: flex; align-items: center; gap: 10px;
        padding: 12px 20px; border-radius: 10px; font-size: 13px; font-weight: 500;
        animation: slideDown 0.3s ease; box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    }
    @keyframes slideDown { from { opacity:0; transform:translateY(-20px); } to { opacity:1; transform:translateY(0); } }
    .alert-info    { background: rgba(0,204,255,0.12);  border: 1px solid rgba(0,204,255,0.3);  color: #00ccff; }
    .alert-success { background: rgba(0,255,157,0.12);  border: 1px solid rgba(0,255,157,0.3);  color: #00ff9d; }
    .alert-warning { background: rgba(255,170,0,0.12);  border: 1px solid rgba(255,170,0,0.3);  color: #ffaa00; }
    .alert-error   { background: rgba(255,107,107,0.12);border: 1px solid rgba(255,107,107,0.3);color: #ff6b6b; }

    /* Header */
    .header { display:flex; align-items:center; gap:1rem; margin-bottom:1.5rem; flex-wrap:wrap; }
    .back-btn { display:flex; align-items:center; gap:5px; background:none; border:none; color:rgba(255,255,255,0.5); font-size:12px; cursor:pointer; }
    .title { font-size:1.3rem; font-weight:600; color:#fff; margin-bottom:2px; }
    .subtitle { font-size:0.75rem; color:rgba(255,255,255,0.5); }
    .status-badge { display:inline-flex; align-items:center; gap:6px; padding:4px 12px; border-radius:20px; font-size:11px; font-weight:500; }
    .status-badge.draft     { background:rgba(245,158,11,0.1);  color:#f59e0b; border:1px solid rgba(245,158,11,0.2);  }
    .status-badge.pending   { background:rgba(0,204,255,0.1);   color:#00ccff; border:1px solid rgba(0,204,255,0.2);   }
    .status-badge.completed { background:rgba(0,255,157,0.15);  color:#00ff9d; border:1px solid rgba(0,255,157,0.3);   }

    /* Progress */
    .progress-section { background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:16px; padding:1rem; margin-bottom:1.5rem; }
    .progress-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem; }
    .progress-header h3 { font-size:0.8rem; font-weight:600; color:rgba(255,255,255,0.7); }
    .progress-percent { font-size:0.7rem; color:#00ff9d; }
    .progress-bar-container { height:6px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden; margin-bottom:1rem; }
    .progress-bar-fill { height:100%; background:linear-gradient(90deg,#00ff9d,#00ccff); border-radius:3px; transition:width 0.3s; }
    .progress-steps { display:flex; justify-content:space-between; flex-wrap:wrap; gap:0.5rem; }
    .step { flex:1; text-align:center; min-width:80px; }
    .step-marker { width:28px; height:28px; margin:0 auto 4px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:600; color:rgba(255,255,255,0.4); }
    .step.completed .step-marker { background:#00ff9d; border-color:#00ff9d; color:#000; }
    .step.active    .step-marker { border-color:#00ff9d; color:#00ff9d; animation:pulse 1.5s infinite; }
    @keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(0,255,157,0.4);} 50%{box-shadow:0 0 0 4px rgba(0,255,157,0.2);} }
    .step-label { font-size:0.6rem; color:rgba(255,255,255,0.5); }
    .step.completed .step-label { color:#00ff9d; }
    .step.active    .step-label { color:#fff; }

    /* Stats */
    .stats-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:0.5rem; margin-bottom:1.5rem; }
    .stat-card { text-align:center; padding:0.75rem; background:rgba(255,255,255,0.02); border-radius:10px; }
    .stat-value { display:block; font-size:1rem; font-weight:700; color:#fff; }
    .stat-label { font-size:0.55rem; color:rgba(255,255,255,0.5); }
    .stat-card.match    .stat-value { color:#00ff9d; }
    .stat-card.mismatch .stat-value { color:#ffaa00; }
    .stat-card.missing  .stat-value { color:#ff6b6b; }
    .stat-card.new      .stat-value { color:#00ccff; }

    /* Info */
    .info-card { background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:12px; padding:1rem; margin-bottom:1.5rem; }
    .info-row { display:flex; justify-content:space-between; padding:0.4rem 0; font-size:0.8rem; }
    .info-label { color:rgba(255,255,255,0.5); }
    .info-value { font-weight:500; }
    .note-value { max-width:60%; text-align:right; font-style:italic; color:rgba(255,255,255,0.6); }

    /* Signature */
    .signature-section, .responsible-section {
        background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05);
        border-radius:12px; padding:1rem; margin-bottom:1rem;
    }
    .section-title { display:flex; align-items:center; gap:6px; font-size:0.8rem; font-weight:600; color:rgba(255,255,255,0.7); margin-bottom:1rem; padding-bottom:0.5rem; border-bottom:1px solid rgba(255,255,255,0.05); }
    .canvas-container { margin-bottom:0.5rem; }
    .signature-canvas {
        display: block;
        width: 100%;
        height: 150px;
        background: #1a1a2a;
        border-radius: 8px;
        cursor: crosshair;
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
        border: 1px solid rgba(0,255,157,0.2);
    }
    .canvas-actions { display:flex; gap:0.5rem; margin-top:0.5rem; }
    .btn-clear { display:flex; align-items:center; gap:4px; padding:0.3rem 0.8rem; border-radius:6px; font-size:0.7rem; cursor:pointer; background:rgba(255,107,107,0.1); border:1px solid rgba(255,107,107,0.3); color:#ff6b6b; }
    .btn-clear:disabled { opacity:0.4; cursor:not-allowed; }
    .btn-save { padding:0.3rem 0.8rem; border-radius:6px; font-size:0.7rem; cursor:pointer; background:rgba(0,255,157,0.1); border:1px solid rgba(0,255,157,0.3); color:#00ff9d; }
    .btn-save:disabled { opacity:0.4; cursor:not-allowed; }
    .canvas-hint { font-size:0.6rem; color:rgba(255,255,255,0.3); margin-top:0.5rem; }
    .signature-done { display:flex; align-items:center; gap:10px; padding:0.75rem; background:rgba(0,255,157,0.05); border-radius:8px; }
    .signature-done-icon { font-size:1.2rem; }

    /* Responsible */
    .responsible-list { display:flex; flex-direction:column; gap:0.75rem; }
    .responsible-item { display:flex; justify-content:space-between; align-items:center; padding:0.6rem; background:rgba(255,255,255,0.02); border-radius:8px; flex-wrap:wrap; gap:0.5rem; }
    .responsible-name { font-weight:600; font-size:0.8rem; }
    .responsible-username { font-size:0.6rem; color:rgba(255,255,255,0.4); }
    .status-pending { color:#ffaa00; font-size:0.7rem; }
    .status-waiting { color:rgba(255,255,255,0.4); font-size:0.7rem; }
    .btn-outline { padding:0.4rem 1rem; background:none; border:1px solid rgba(0,255,157,0.3); border-radius:20px; color:#00ff9d; font-size:0.7rem; cursor:pointer; width:fit-content; }

    /* Actions */
    .action-buttons { display:flex; justify-content:flex-end; margin-top:1rem; }
    .btn-primary, .btn-success { display:flex; align-items:center; gap:6px; padding:0.6rem 1.2rem; border-radius:30px; font-weight:600; font-size:0.8rem; cursor:pointer; }
    .btn-primary { background:linear-gradient(135deg,#00ff9d,#00ccff); border:none; color:#000; }
    .btn-primary:disabled { opacity:0.5; cursor:not-allowed; }
    .btn-success { background:rgba(0,255,157,0.1); border:1px solid rgba(0,255,157,0.3); color:#00ff9d; }

    /* Modal */
    .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.8); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; z-index:1000; }
    .modal { background:#14141f; border:1px solid rgba(255,255,255,0.1); border-radius:16px; padding:1.5rem; width:450px; max-width:90%; }
    .modal-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; }
    .modal-header h2 { font-size:1rem; font-weight:600; }
    .modal-close { background:none; border:none; color:rgba(255,255,255,0.5); font-size:1.2rem; cursor:pointer; }
    .modal-hint { font-size:0.7rem; color:rgba(255,255,255,0.4); margin-bottom:1rem; }
    .admin-list { max-height:300px; overflow-y:auto; margin-bottom:1rem; }
    .admin-option { display:flex; align-items:center; gap:12px; padding:0.6rem; margin-bottom:0.5rem; background:rgba(255,255,255,0.02); border-radius:8px; cursor:pointer; }
    .admin-option:hover { background:rgba(255,255,255,0.05); }
    .admin-name { font-weight:500; font-size:0.8rem; }
    .admin-username { font-size:0.65rem; color:rgba(255,255,255,0.4); }
    .selected-info { font-size:0.7rem; padding:0.5rem; background:rgba(0,255,157,0.05); border-radius:8px; text-align:center; margin-bottom:1rem; }
    .error-message { padding:0.5rem; background:rgba(255,107,107,0.1); border:1px solid rgba(255,107,107,0.2); border-radius:8px; color:#ff6b6b; font-size:0.7rem; margin-bottom:1rem; }
    .modal-actions { display:flex; gap:0.5rem; justify-content:flex-end; }
    .btn-secondary { padding:0.5rem 1rem; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:20px; color:rgba(255,255,255,0.6); font-size:0.7rem; cursor:pointer; }

    @media (max-width: 700px) {
        .stats-grid { grid-template-columns: repeat(3,1fr); }
        .progress-steps { flex-direction: column; }
        .step { display:flex; align-items:center; gap:10px; text-align:left; }
        .step-marker { margin:0; flex-shrink:0; }
        .info-row { flex-direction:column; gap:4px; }
        .note-value { max-width:100%; text-align:left; }
    }
</style>