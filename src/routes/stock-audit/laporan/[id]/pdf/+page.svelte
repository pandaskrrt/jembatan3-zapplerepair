<script lang="ts">
    import { goto } from '$app/navigation';
    import LaporanPDF from '$lib/components/pdf/LaporanPDF.svelte';
    import html2canvas from 'html2canvas';
    import jsPDF from 'jspdf';

    let { data } = $props();
    let audit = data?.audit;
    let report = data?.report;
    let summary = data?.summary;

    let isGenerating = $state(false);
    let toast = $state<{ msg: string; type: 'success' | 'error' } | null>(null);
    let toastTimer: ReturnType<typeof setTimeout>;

    function showToast(msg: string, type: 'success' | 'error' = 'success') {
        clearTimeout(toastTimer);
        toast = { msg, type };
        toastTimer = setTimeout(() => toast = null, 3000);
    }

    async function downloadPDF() {
        isGenerating = true;
        showToast('Menyiapkan PDF...', 'success');
        
        try {
            const element = document.querySelector('.pdf-report') as HTMLElement;
            if (!element) return;
            
            const canvas = await html2canvas(element, {
                scale: 2,
                backgroundColor: '#ffffff',
                logging: false
            });
            
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save(`Laporan_Audit_${audit?.sectionName}_${new Date().toISOString().slice(0, 10)}.pdf`);
            
            showToast('PDF berhasil diunduh!', 'success');
        } catch (error) {
            console.error('PDF generation error:', error);
            showToast('Gagal membuat PDF', 'error');
        } finally {
            isGenerating = false;
        }
    }
</script>

<svelte:head>
    <title>Preview PDF - {audit?.sectionName}</title>
</svelte:head>

{#if toast}
    <div class="toast {toast.type === 'error' ? 'toast-error' : ''}">
        <span>{toast.type === 'success' ? '✅' : '❌'}</span>
        <span>{toast.msg}</span>
    </div>
{/if}

<div class="page">
    <div class="toolbar">
        <button class="back-btn" onclick={() => goto(`/stock-audit/laporan/${audit?.id}`)}>
            ← Kembali ke Laporan
        </button>
        <button class="download-btn" onclick={downloadPDF} disabled={isGenerating}>
            {#if isGenerating}
                <span class="spinner"></span>
                Membuat PDF...
            {:else}
                📄 Download PDF
            {/if}
        </button>
    </div>

    <div class="preview-container">
        <LaporanPDF {audit} {report} {summary} />
    </div>
</div>

<style>
    .page {
        background: #e0e0e0;
        min-height: 100vh;
        padding: 1rem;
    }

    .toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        flex-wrap: wrap;
        gap: 1rem;
    }

    .back-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 0.5rem 1rem;
        background: #333;
        border: none;
        border-radius: 8px;
        color: #fff;
        cursor: pointer;
        font-size: 0.8rem;
    }

    .back-btn:hover {
        background: #444;
    }

    .download-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 0.5rem 1.2rem;
        background: linear-gradient(135deg, #00ff9d, #00ccff);
        border: none;
        border-radius: 8px;
        color: #000;
        font-weight: 600;
        cursor: pointer;
        font-size: 0.8rem;
    }

    .download-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .preview-container {
        background: white;
        border-radius: 16px;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
        overflow: auto;
        max-height: calc(100vh - 100px);
    }

    .toast {
        position: fixed;
        bottom: 1rem;
        right: 1rem;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0.6rem 1rem;
        background: #333;
        border-radius: 8px;
        color: #fff;
        font-size: 0.8rem;
        z-index: 9999;
        animation: slideIn 0.3s ease;
    }

    .toast-error {
        background: #ff6b6b;
    }

    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    .spinner {
        width: 14px;
        height: 14px;
        border: 2px solid rgba(0, 0, 0, 0.2);
        border-top-color: #000;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>