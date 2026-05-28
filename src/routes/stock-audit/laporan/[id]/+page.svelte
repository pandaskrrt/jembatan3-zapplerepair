<script lang="ts">
    import { goto } from '$app/navigation';
    import { onDestroy, onMount } from 'svelte';
    import { invalidateAll } from '$app/navigation';
    import { browser } from '$app/environment';

    let { data } = $props();
    let audit = $derived(data?.audit);
    let report = $derived(data?.report);
    let availableAdmins = $derived(data?.availableAdmins ?? []);

    // State untuk UI
    let showResponsibleModal = $state(false);
    let isSubmitting = $state(false);
    let errorMessage = $state('');
    let isDownloading = $state(false);
    
    // State untuk tanda tangan auditor
    let hasSignature = $state(!!data?.report?.auditorSignature);
    let isSavingSignature = $state(false);
    let signaturePad: any = null;
    let canvasEl: HTMLCanvasElement | null = null;
    
    // State untuk pemilihan penanggung jawab
    let selectedResponsibleIds = $state<string[]>([]);
    let isSavingPJ = $state(false);
    let pjSavedToDB = $state(false);

    const maxResponsible = 2;
    const minResponsible = 1;

    // Toast & Alert
    let toast = $state<{ msg: string; type: 'success' | 'error' } | null>(null);
    let alertState = $state<{ msg: string; type: 'info' | 'success' | 'warning' | 'error' } | null>(null);
    let toastTimer: ReturnType<typeof setTimeout>;
    let alertTimer: ReturnType<typeof setTimeout>;

    // Progress steps
    let progressSteps = $derived([
        { id: 1, label: 'Laporan Dibuat', status: data?.report ? 'completed' : 'pending' },
        { id: 2, label: 'Audit Tanda Tangan', status: hasSignature ? 'completed' : 'pending' },
        { id: 3, label: 'Penanggung Jawab', status: report?.status === 'COMPLETED' ? 'completed' : 'pending' }
    ]);

    // Computed values
    const hasPJSelected = $derived(selectedResponsibleIds.length >= minResponsible);
    const canSubmit = $derived(hasSignature && hasPJSelected && report?.status === 'DRAFT');

    // Helper functions
    function showToast(msg: string, type: 'success' | 'error' = 'success') {
        clearTimeout(toastTimer);
        toast = { msg, type };
        toastTimer = setTimeout(() => (toast = null), 3500);
    }

    function showAlert(msg: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
        clearTimeout(alertTimer);
        alertState = { msg, type };
        alertTimer = setTimeout(() => (alertState = null), 5000);
    }

    function formatDate(date: string | Date | null | undefined) {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    function getStatusBadge(status: string) {
        const badges: Record<string, { cls: string; icon: string; text: string }> = {
            DRAFT: { cls: 'draft', icon: '📝', text: 'Draft' },
            PENDING_SIGN: { cls: 'pending', icon: '⏳', text: 'Menunggu Tanda Tangan' },
            COMPLETED: { cls: 'completed', icon: '✅', text: 'Selesai' }
        };
        return badges[status] ?? { cls: 'draft', icon: '📝', text: status };
    }

    // Inisialisasi
    onMount(() => {
        console.log('=== PAGE MOUNTED ===');
        console.log('Report status:', report?.status);
        console.log('Has signature:', hasSignature);
        console.log('ResponsibleIds from DB:', report?.responsibleIds);
        
        if (report?.responsibleIds && Array.isArray(report.responsibleIds)) {
            selectedResponsibleIds = [...report.responsibleIds];
            pjSavedToDB = true;
            console.log('Loaded PJ from DB:', selectedResponsibleIds);
        }
    });

    // Signature Pad
    onMount(async () => {
        if (!browser || hasSignature) return;

        const { default: SP } = await import('signature_pad');
        if (!canvasEl) return;

        const rect = canvasEl.parentElement?.getBoundingClientRect();
        canvasEl.width = rect ? rect.width - 32 : 600;
        canvasEl.height = 200;

        signaturePad = new SP(canvasEl, {
            backgroundColor: '#ffffff',
            penColor: '#000000',
            velocityFilterWeight: 0.7,
            minWidth: 1,
            maxWidth: 2.5,
            throttle: 16,
            minDistance: 5,
            dotSize: 2
        });

        window.addEventListener('resize', handleResize);
    });

    function handleResize() {
        if (!canvasEl || !signaturePad) return;
        const rect = canvasEl.parentElement?.getBoundingClientRect();
        if (!rect) return;
        const oldData = signaturePad.toData();
        canvasEl.width = rect.width - 32;
        canvasEl.height = 200;
        signaturePad.clear();
        if (oldData?.length) setTimeout(() => signaturePad.fromData(oldData), 100);
    }

    function clearCanvas() {
        signaturePad?.clear();
    }

    async function saveAuditorSignature() {
        if (!signaturePad || signaturePad.isEmpty()) {
            showToast('Silakan tanda tangan terlebih dahulu', 'error');
            return;
        }
        if (isSavingSignature) return;

        console.log('=== SAVING SIGNATURE ===');
        isSavingSignature = true;
        
        try {
            const dataUrl = signaturePad.toDataURL('image/png');
            const res = await fetch(`/api/report/${report?.id}/auditor-sign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ signature: dataUrl })
            });
            const result = await res.json();
            console.log('Save signature result:', result);

            if (result.success) {
                hasSignature = true;
                showToast('Tanda tangan berhasil disimpan!');
                await invalidateAll();
            } else {
                showToast(result.message || 'Gagal menyimpan tanda tangan', 'error');
            }
        } catch (err) {
            console.error('Save signature error:', err);
            showToast('Terjadi kesalahan jaringan', 'error');
        } finally {
            isSavingSignature = false;
        }
    }

    // Penanggung Jawab
    function toggleResponsible(id: string) {
        const currentIds = [...selectedResponsibleIds];
        
        if (currentIds.includes(id)) {
            selectedResponsibleIds = currentIds.filter(x => x !== id);
        } else {
            if (currentIds.length >= maxResponsible) {
                showAlert(`Maksimal ${maxResponsible} penanggung jawab`, 'warning');
                return;
            }
            selectedResponsibleIds = [...currentIds, id];
        }
        console.log('Toggled PJ, now selected:', selectedResponsibleIds);
    }

    async function saveResponsible() {
        if (selectedResponsibleIds.length < minResponsible) {
            errorMessage = `Pilih minimal ${minResponsible} penanggung jawab`;
            showAlert(errorMessage, 'error');
            return;
        }

        console.log('=== SAVING PJ TO DB ===');
        console.log('Selected PJ IDs:', selectedResponsibleIds);
        
        isSavingPJ = true;
        errorMessage = '';

        try {
            const res = await fetch(`/api/report/${report?.id}/responsible`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ responsibleIds: selectedResponsibleIds })
            });
            const result = await res.json();
            console.log('Save PJ result:', result);

            if (result.success) {
                pjSavedToDB = true;
                showToast('Penanggung jawab berhasil dipilih!');
                showResponsibleModal = false;
                await invalidateAll();
            } else {
                errorMessage = result.message || 'Gagal menyimpan';
                showAlert(errorMessage, 'error');
            }
        } catch (err) {
            console.error('Save PJ error:', err);
            errorMessage = 'Terjadi kesalahan jaringan';
            showAlert(errorMessage, 'error');
        } finally {
            isSavingPJ = false;
        }
    }

    // Submit Laporan
    async function submitReport() {
        console.log('=== SUBMIT REPORT CLICKED ===');
        console.log('hasSignature:', hasSignature);
        console.log('hasPJSelected:', hasPJSelected);
        console.log('report.status:', report?.status);
        
        if (!hasSignature) {
            showAlert('Tanda tangan auditor belum lengkap!', 'warning');
            return;
        }
        if (!hasPJSelected) {
            showAlert('Pilih penanggung jawab terlebih dahulu!', 'warning');
            return;
        }
        if (report?.status !== 'DRAFT') {
            showAlert('Laporan sudah dikirim!', 'warning');
            return;
        }
        if (isSubmitting) return;

        isSubmitting = true;
        
        try {
            const res = await fetch(`/api/report/${report?.id}/submit`, { method: 'POST' });
            const result = await res.json();
            console.log('Submit result:', result);

            if (result.success) {
                showToast('Laporan berhasil dikirim ke penanggung jawab!');
                await invalidateAll();
            } else {
                showAlert(result.message || 'Gagal mengirim laporan', 'error');
            }
        } catch (err) {
            console.error('Submit error:', err);
            showAlert('Terjadi kesalahan saat mengirim laporan', 'error');
        } finally {
            isSubmitting = false;
        }
    }

    // Download PDF
    async function downloadPDF() {
        if (isDownloading || !report?.id) return;

        isDownloading = true;
        showToast('Menyiapkan PDF...');

        try {
            const response = await fetch(`/api/report/${report.id}/pdf`);
            if (!response.ok) throw new Error();

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Laporan_Audit_${audit?.sectionName || 'Stock'}_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            showToast('PDF berhasil diunduh!');
        } catch (err) {
            console.error('Download error:', err);
            showToast('Gagal mengunduh PDF', 'error');
        } finally {
            isDownloading = false;
        }
    }

    onDestroy(() => {
        clearTimeout(toastTimer);
        clearTimeout(alertTimer);
        if (browser) window.removeEventListener('resize', handleResize);
        signaturePad?.off();
        signaturePad = null;
    });
</script>

<svelte:head>
    <title>Laporan Audit - {audit?.sectionName}</title>
</svelte:head>

<!-- Toast -->
{#if toast}
    <div class="toast" class:toast-error={toast.type === 'error'}>
        {#if toast.type === 'success'}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"/>
            </svg>
        {:else}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
            </svg>
        {/if}
        {toast.msg}
    </div>
{/if}

<!-- Alert -->
{#if alertState}
    <div class="alert alert-{alertState.type}">{alertState.msg}</div>
{/if}

<div class="page">
    <!-- Header -->
    <div class="header">
        <button class="back-btn" onclick={() => goto(`/stock-audit/riwayat/${audit?.sectionId}`)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Kembali
        </button>
        <div class="header-mid">
            <h1 class="title">Laporan Audit</h1>
            <p class="subtitle">{audit?.cabinetName} / {audit?.sectionName}</p>
        </div>
        <div class="status-badge {getStatusBadge(report?.status || 'DRAFT').cls}">
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
                style="width:{(progressSteps.filter(s => s.status === 'completed').length / progressSteps.length) * 100}%">
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
        <div class="stat-card"><span class="stat-value">{audit?.totalCards || 0}</span><span class="stat-label">Total Card</span></div>
        <div class="stat-card match"><span class="stat-value">{audit?.totalMatch || 0}</span><span class="stat-label">Match</span></div>
        <div class="stat-card mismatch"><span class="stat-value">{audit?.totalMismatch || 0}</span><span class="stat-label">Mismatch</span></div>
        <div class="stat-card missing"><span class="stat-value">{audit?.totalMissing || 0}</span><span class="stat-label">Missing</span></div>
        <div class="stat-card new"><span class="stat-value">{audit?.totalNewEntry || 0}</span><span class="stat-label">New Entry</span></div>
    </div>

    <!-- Info -->
    <div class="info-card">
        <div class="info-row"><span class="info-label">Auditor</span><span class="info-value">{audit?.auditorName}</span></div>
        <div class="info-row"><span class="info-label">Tanggal Audit</span><span class="info-value">{formatDate(audit?.createdAt)}</span></div>
        {#if audit?.completedAt}
            <div class="info-row"><span class="info-label">Selesai</span><span class="info-value">{formatDate(audit.completedAt)}</span></div>
        {/if}
        {#if audit?.note}
            <div class="info-row"><span class="info-label">Catatan</span><span class="info-value note-value">{audit.note}</span></div>
        {/if}
    </div>

    <!-- Tanda Tangan Auditor -->
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
                <div>
                    <strong>Tanda tangan sudah diberikan</strong>
                    <p class="signature-date">{formatDate(report?.auditorSignedAt)}</p>
                </div>
            </div>
        {:else}
            <div class="canvas-container">
                <canvas bind:this={canvasEl} class="signature-canvas"></canvas>
            </div>
            <p class="canvas-hint">Tanda tangan menggunakan mouse atau sentuhan · background putih, tinta hitam</p>
            <div class="canvas-actions">
                <button class="btn-clear" onclick={clearCanvas}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                    </svg>
                    Hapus
                </button>
                <button class="btn-save" onclick={saveAuditorSignature} disabled={isSavingSignature}>
                    {isSavingSignature ? 'Menyimpan...' : 'Simpan Tanda Tangan'}
                </button>
            </div>
        {/if}
    </div>

    <!-- Penanggung Jawab -->
    <div class="responsible-section">
        <div class="section-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
            </svg>
            Penanggung Jawab ({selectedResponsibleIds.length}/{maxResponsible})
        </div>

        <div class="responsible-list">
            {#if selectedResponsibleIds.length > 0}
                {#each selectedResponsibleIds as pjId, i}
                    {@const pj = availableAdmins.find(a => a.id === pjId)}
                    {#if pj}
                        <div class="responsible-item">
                            <div>
                                <div class="responsible-name">{pj.name}</div>
                                <div class="responsible-username">@{pj.username} · PJ {i + 1}</div>
                            </div>
                            <div class="responsible-status">
                                {#if i === 0 && report?.responsibleSignedAt1}
                                    <span class="status-success">✅ Ditandatangani {formatDate(report.responsibleSignedAt1)}</span>
                                {:else if i === 1 && report?.responsibleSignedAt2}
                                    <span class="status-success">✅ Ditandatangani {formatDate(report.responsibleSignedAt2)}</span>
                                {:else if report?.status !== 'DRAFT'}
                                    <span class="status-pending">⏳ Menunggu tanda tangan</span>
                                {:else}
                                    <span class="status-waiting">Belum dikirim</span>
                                {/if}
                            </div>
                        </div>
                    {/if}
                {/each}
            {:else}
                <div class="empty-pj">Belum ada penanggung jawab dipilih</div>
            {/if}

            {#if report?.status === 'DRAFT' && selectedResponsibleIds.length < maxResponsible}
                <button class="btn-outline" onclick={() => { showResponsibleModal = true; errorMessage = ''; }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M12 5v14M5 12h14"/>
                    </svg>
                    {selectedResponsibleIds.length > 0 ? 'Tambah Penanggung Jawab' : 'Pilih Penanggung Jawab'}
                </button>
            {/if}
        </div>
    </div>

    <!-- Action Buttons -->
    <div class="action-buttons">
        {#if hasSignature}
            <button class="btn-download" onclick={downloadPDF} disabled={isDownloading}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                {isDownloading ? 'Mengunduh...' : 'Download PDF'}
            </button>
        {/if}

        {#if report?.status === 'DRAFT'}
            <button class="btn-primary" onclick={submitReport} disabled={!canSubmit || isSubmitting}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
                {isSubmitting ? 'Mengirim...' : 'Kirim Laporan'}
            </button>
            {#if !canSubmit && (hasSignature || selectedResponsibleIds.length > 0)}
                <p class="submit-hint">
                    {!hasSignature ? '⚠️ Tanda tangan dulu' : ''}
                    {!hasSignature && !hasPJSelected ? ' · ' : ''}
                    {!hasPJSelected ? '⚠️ Pilih penanggung jawab dulu' : ''}
                </p>
            {/if}
        {:else if report?.status === 'PENDING_SIGN'}
            <div class="info-status">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffaa00" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                </svg>
                Menunggu tanda tangan dari penanggung jawab
            </div>
        {:else if report?.status === 'COMPLETED'}
            <div class="info-status success">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00ff9d" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
                Laporan selesai dan ditandatangani semua pihak
            </div>
        {/if}
    </div>
</div>

<!-- Modal Pilih Penanggung Jawab -->
{#if showResponsibleModal}
<div class="modal-overlay" onclick={() => showResponsibleModal = false}>
    <div class="modal" onclick={(e) => e.stopPropagation()}>
        <div class="modal-header">
            <h2>Pilih Penanggung Jawab</h2>
            <button class="modal-close" onclick={() => showResponsibleModal = false}>✕</button>
        </div>
        <p class="modal-hint">Pilih {minResponsible}–{maxResponsible} orang yang akan menandatangani laporan</p>

        {#if errorMessage}
            <div class="error-message">{errorMessage}</div>
        {/if}

        {#if availableAdmins && availableAdmins.length > 0}
            <div class="admin-list">
                {#each availableAdmins as admin}
                    <div
                        class="admin-option"
                        class:admin-selected={selectedResponsibleIds.includes(admin.id)}
                        onclick={() => toggleResponsible(admin.id)}
                    >
                        <div class="ao-check" class:ao-checked={selectedResponsibleIds.includes(admin.id)}>
                            {#if selectedResponsibleIds.includes(admin.id)}✓{/if}
                        </div>
                        <div class="ao-avatar">{admin.name?.[0] || 'A'}</div>
                        <div>
                            <div class="admin-name">{admin.name}</div>
                            <div class="admin-username">@{admin.username} · {admin.role}</div>
                        </div>
                        {#if selectedResponsibleIds.includes(admin.id)}
                            <span class="ao-order">PJ {selectedResponsibleIds.indexOf(admin.id) + 1}</span>
                        {/if}
                    </div>
                {/each}
            </div>
        {:else}
            <div class="error-message">Tidak ada admin yang tersedia</div>
        {/if}

        <div class="selected-info">
            Terpilih: <strong>{selectedResponsibleIds.length}</strong> dari {minResponsible}–{maxResponsible} orang
        </div>

        <div class="modal-actions">
            <button class="btn-secondary" onclick={() => showResponsibleModal = false}>Batal</button>
            <button class="btn-primary-modal" onclick={saveResponsible}
                disabled={isSavingPJ || selectedResponsibleIds.length < minResponsible}>
                {isSavingPJ ? 'Menyimpan...' : 'Simpan'}
            </button>
        </div>
    </div>
</div>
{/if}

<style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    .page {
        max-width: 900px;
        margin: 0 auto;
        padding: 1.5rem 1.25rem 4rem;
        font-family: 'Inter', system-ui, sans-serif;
        background: #0a0a0f;
        min-height: 100vh;
        color: #e8e8f0;
    }

    /* Toast */
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
        font-weight: 500;
    }
    .toast-error {
        background: rgba(255, 107, 107, 0.12) !important;
        border-color: rgba(255, 107, 107, 0.3) !important;
        color: #ff6b6b !important;
    }

    /* Alert */
    .alert {
        position: fixed;
        top: 1.5rem;
        right: 1.5rem;
        z-index: 9998;
        padding: 10px 16px;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 500;
    }
    .alert-info    { background: rgba(0, 204, 255, 0.12); border: 1px solid rgba(0, 204, 255, 0.3); color: #00ccff; }
    .alert-success { background: rgba(0, 255, 157, 0.12); border: 1px solid rgba(0, 255, 157, 0.3); color: #00ff9d; }
    .alert-warning { background: rgba(255, 170, 0, 0.12); border: 1px solid rgba(255, 170, 0, 0.3); color: #ffaa00; }
    .alert-error   { background: rgba(255, 107, 107, 0.12); border: 1px solid rgba(255, 107, 107, 0.3); color: #ff6b6b; }

    /* Header */
    .header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
    }
    .back-btn {
        display: flex;
        align-items: center;
        gap: 5px;
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.45);
        font-size: 13px;
        cursor: pointer;
    }
    .back-btn:hover { color: #00ff9d; }
    .header-mid { flex: 1; }
    .title { font-size: 1.3rem; font-weight: 700; color: #fff; }
    .subtitle { font-size: 12px; color: rgba(255, 255, 255, 0.4); margin-top: 2px; }
    .status-badge {
        font-size: 11px;
        font-weight: 600;
        padding: 4px 12px;
        border-radius: 99px;
        display: inline-flex;
        align-items: center;
        gap: 5px;
    }
    .status-badge.draft { background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2); }
    .status-badge.pending { background: rgba(0, 204, 255, 0.1); color: #00ccff; border: 1px solid rgba(0, 204, 255, 0.2); }
    .status-badge.completed { background: rgba(0, 255, 157, 0.12); color: #00ff9d; border: 1px solid rgba(0, 255, 157, 0.25); }

    /* Progress */
    .progress-section {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 14px;
        padding: 1rem;
        margin-bottom: 1.25rem;
    }
    .progress-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.6rem;
    }
    .progress-header h3 { font-size: 12px; font-weight: 600; color: rgba(255, 255, 255, 0.6); }
    .progress-percent { font-size: 11px; color: #00ff9d; font-weight: 700; }
    .progress-bar-container {
        height: 5px;
        background: rgba(255, 255, 255, 0.07);
        border-radius: 3px;
        overflow: hidden;
        margin-bottom: 0.9rem;
    }
    .progress-bar-fill {
        height: 100%;
        background: linear-gradient(90deg, #00ff9d, #00ccff);
        border-radius: 3px;
        transition: width 0.35s;
    }
    .progress-steps { display: flex; justify-content: space-around; }
    .step { flex: 1; text-align: center; }
    .step-marker {
        width: 26px;
        height: 26px;
        margin: 0 auto 4px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.3);
    }
    .step.completed .step-marker { background: #00ff9d; border-color: #00ff9d; color: #000; }
    .step.active .step-marker { border-color: #00ff9d; color: #00ff9d; }
    .step-label { font-size: 10px; color: rgba(255, 255, 255, 0.4); }
    .step.completed .step-label { color: #00ff9d; }
    .step.active .step-label { color: #fff; }

    /* Stats */
    .stats-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 6px;
        margin-bottom: 1.25rem;
    }
    .stat-card {
        text-align: center;
        padding: 0.7rem 0.5rem;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 10px;
    }
    .stat-value { display: block; font-size: 1.1rem; font-weight: 800; color: #fff; }
    .stat-label { font-size: 10px; color: rgba(255, 255, 255, 0.4); }
    .stat-card.match .stat-value { color: #00ff9d; }
    .stat-card.mismatch .stat-value { color: #ffaa00; }
    .stat-card.missing .stat-value { color: #ff6b6b; }
    .stat-card.new .stat-value { color: #00ccff; }

    /* Info Card */
    .info-card {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 12px;
        padding: 0.9rem;
        margin-bottom: 1.25rem;
    }
    .info-row {
        display: flex;
        justify-content: space-between;
        padding: 0.35rem 0;
        font-size: 13px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: rgba(255, 255, 255, 0.45); }
    .info-value { font-weight: 500; }
    .note-value { font-style: italic; color: rgba(255, 255, 255, 0.6); max-width: 60%; text-align: right; }

    /* Signature Section */
    .signature-section, .responsible-section {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 12px;
        padding: 1rem;
        margin-bottom: 1rem;
    }
    .section-title {
        display: flex;
        align-items: center;
        gap: 7px;
        font-size: 12px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.55);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.9rem;
        padding-bottom: 0.6rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    .signature-canvas {
        display: block;
        width: 100%;
        background: #ffffff;
        border-radius: 8px;
        cursor: crosshair;
        touch-action: none;
        border: 1px solid rgba(0, 0, 0, 0.15);
        min-height: 150px;
    }
    .canvas-hint { font-size: 11px; color: rgba(255, 255, 255, 0.35); margin-bottom: 0.5rem; }
    .canvas-actions { display: flex; gap: 7px; }
    .btn-clear {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 6px 14px;
        border-radius: 7px;
        font-size: 12px;
        cursor: pointer;
        background: rgba(255, 107, 107, 0.1);
        border: 1px solid rgba(255, 107, 107, 0.3);
        color: #ff6b6b;
    }
    .btn-save {
        padding: 6px 14px;
        border-radius: 7px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        background: rgba(0, 255, 157, 0.1);
        border: 1px solid rgba(0, 255, 157, 0.25);
        color: #00ff9d;
    }
    .btn-save:disabled { opacity: 0.4; cursor: not-allowed; }
    .signature-done {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        background: rgba(0, 255, 157, 0.06);
        border: 1px solid rgba(0, 255, 157, 0.15);
        border-radius: 8px;
        color: #00ff9d;
        font-size: 13px;
        font-weight: 500;
    }
    .signature-date { font-size: 11px; color: rgba(255, 255, 255, 0.4); margin-top: 2px; }

    /* Responsible */
    .responsible-list { display: flex; flex-direction: column; gap: 8px; }
    .responsible-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 9px 12px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 10px;
        flex-wrap: wrap;
        gap: 0.5rem;
    }
    .responsible-name { font-weight: 600; font-size: 13px; color: #fff; }
    .responsible-username { font-size: 11px; color: rgba(255, 255, 255, 0.35); }
    .responsible-status { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; }
    .status-success { color: #00ff9d; font-size: 11px; font-weight: 500; }
    .status-pending { color: #ffaa00; font-size: 11px; }
    .status-waiting { color: rgba(255, 255, 255, 0.3); font-size: 11px; }
    .empty-pj {
        padding: 20px;
        text-align: center;
        color: rgba(255, 255, 255, 0.3);
        font-size: 12px;
        background: rgba(255, 255, 255, 0.02);
        border-radius: 8px;
    }
    .btn-outline {
        display: flex;
        align-items: center;
        gap: 6px;
        width: fit-content;
        padding: 7px 15px;
        border-radius: 99px;
        background: rgba(0, 255, 157, 0.07);
        border: 1px dashed rgba(0, 255, 157, 0.3);
        color: #00ff9d;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        margin-top: 4px;
    }

    /* Action Buttons */
    .action-buttons {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 1.5rem;
        padding-top: 1rem;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
        flex-wrap: wrap;
    }
    .submit-hint { width: 100%; text-align: right; font-size: 11px; color: #ffaa00; margin-top: 4px; }
    .btn-download {
        display: flex;
        align-items: center;
        gap: 7px;
        padding: 9px 20px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 13px;
        cursor: pointer;
        background: linear-gradient(135deg, rgba(0, 255, 157, 0.12), rgba(0, 204, 255, 0.12));
        border: 1px solid rgba(0, 255, 157, 0.3);
        color: #00ff9d;
    }
    .btn-download:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 15px rgba(0, 255, 157, 0.15); }
    .btn-download:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary {
        display: flex;
        align-items: center;
        gap: 7px;
        padding: 9px 20px;
        border-radius: 12px;
        font-weight: 700;
        font-size: 13px;
        cursor: pointer;
        background: linear-gradient(135deg, #00ff9d, #00ccff);
        border: none;
        color: #000;
    }
    .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 15px rgba(0, 255, 157, 0.25); }
    .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
    .info-status {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 0.6rem 1.2rem;
        background: rgba(255, 170, 0, 0.1);
        border: 1px solid rgba(255, 170, 0, 0.3);
        border-radius: 12px;
        color: #ffaa00;
        font-size: 13px;
        font-weight: 500;
    }
    .info-status.success { background: rgba(0, 255, 157, 0.1); border-color: rgba(0, 255, 157, 0.3); color: #00ff9d; }

    /* Modal */
    .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.78);
        backdrop-filter: blur(7px);
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
        width: 460px;
        max-width: 94vw;
        max-height: 90vh;
        overflow-y: auto;
    }
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }
    .modal-header h2 { font-size: 1rem; font-weight: 700; color: #fff; }
    .modal-close {
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.4);
        font-size: 1.1rem;
        cursor: pointer;
    }
    .modal-hint { font-size: 12px; color: rgba(255, 255, 255, 0.4); margin-bottom: 1rem; }
    .error-message {
        padding: 8px 11px;
        background: rgba(255, 107, 107, 0.08);
        border: 1px solid rgba(255, 107, 107, 0.2);
        border-radius: 8px;
        color: #ff6b6b;
        font-size: 12px;
        margin-bottom: 0.9rem;
    }
    .admin-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
        max-height: 300px;
        overflow-y: auto;
        margin-bottom: 1rem;
    }
    .admin-option {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border-radius: 10px;
        cursor: pointer;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.06);
        transition: all 0.12s;
    }
    .admin-option:hover { background: rgba(255, 255, 255, 0.05); }
    .admin-selected { background: rgba(0, 255, 157, 0.07) !important; border-color: rgba(0, 255, 157, 0.22) !important; }
    .ao-check {
        width: 16px;
        height: 16px;
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: bold;
        color: #000;
    }
    .ao-checked { background: #00ff9d !important; border-color: #00ff9d !important; }
    .ao-avatar {
        width: 28px;
        height: 28px;
        border-radius: 6px;
        background: rgba(0, 255, 157, 0.12);
        color: #00ff9d;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 12px;
    }
    .admin-name { font-size: 13px; font-weight: 600; color: #fff; }
    .admin-username { font-size: 10px; color: rgba(255, 255, 255, 0.35); }
    .ao-order {
        margin-left: auto;
        font-size: 10px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 99px;
        background: rgba(0, 255, 157, 0.15);
        color: #00ff9d;
    }
    .selected-info {
        font-size: 12px;
        text-align: center;
        color: rgba(255, 255, 255, 0.45);
        padding: 8px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 8px;
        margin-bottom: 1rem;
    }
    .modal-actions { display: flex; gap: 8px; }
    .btn-secondary {
        flex: 1;
        padding: 8px;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: none;
        color: rgba(255, 255, 255, 0.5);
        font-size: 13px;
        cursor: pointer;
    }
    .btn-primary-modal {
        flex: 1;
        padding: 8px;
        border-radius: 8px;
        border: none;
        background: linear-gradient(135deg, #00ff9d, #00ccff);
        color: #000;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
    }
    .btn-primary-modal:disabled { opacity: 0.4; cursor: not-allowed; }

    @media (max-width: 640px) {
        .stats-grid { grid-template-columns: repeat(3, 1fr); }
        .action-buttons { flex-direction: column; align-items: stretch; }
        .btn-download, .btn-primary { justify-content: center; }
        .info-row { flex-direction: column; gap: 3px; }
        .note-value { max-width: 100%; text-align: left; }
        .responsible-status { align-items: flex-start; }
    }
</style>