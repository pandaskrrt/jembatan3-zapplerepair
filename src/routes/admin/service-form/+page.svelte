<script lang="ts">
    import { goto } from '$app/navigation';

    let { data } = $props();
    let serviceForms = $derived(data.serviceForms || []);

    function formatDate(d: Date | string) {
        return new Date(d).toLocaleString('id-ID', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    function statusLabel(status: string) {
        const labels: Record<string, string> = {
            DRAFT: 'Draft',
            IN_PROGRESS: 'Dikerjakan',
            WAITING_APPROVAL: 'Menunggu Persetujuan',
            COMPLETED: 'Selesai',
            CANCELLED: 'Dibatalkan'
        };
        return labels[status] || status;
    }

    function statusColor(status: string) {
        const colors: Record<string, string> = {
            DRAFT: '#6b7280',
            IN_PROGRESS: '#3b82f6',
            WAITING_APPROVAL: '#f59e0b',
            COMPLETED: '#10b981',
            CANCELLED: '#ef4444'
        };
        return colors[status] || '#6b7280';
    }

    function formatCurrency(amount: number) {
        return `Rp ${amount.toLocaleString('id-ID')}`;
    }
</script>

<div class="page">
    <div class="header">
        <div class="header-left">
            <h1 class="page-title">Service Forms</h1>
            <p class="page-subtitle">Kelola service dan invoice</p>
        </div>
        <button class="btn-add" onclick={() => goto('/admin/service-form/create')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Service Baru
        </button>
    </div>

    <div class="service-list">
        {#if serviceForms.length === 0}
            <div class="empty-state">
                <p>Belum ada service form.</p>
            </div>
        {:else}
            {#each serviceForms as sf}
                <div class="service-card" onclick={() => goto(`/admin/service-form/${sf.id}`)}>
                    <div class="card-top">
                        <div class="card-number">
                            <span class="num-label">No.</span>
                            <span class="num-value">{sf.serviceNumber}</span>
                        </div>
                        <span class="status-badge" style="background: {statusColor(sf.status)}">
                            {statusLabel(sf.status)}
                        </span>
                    </div>

                    <div class="card-body">
                        <div class="info-row">
                            <span class="info-label">Customer</span>
                            <span class="info-value">{sf.customerName}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Device</span>
                            <span class="info-value">{sf.deviceType} {sf.deviceBrand || ''} {sf.deviceModel || ''}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Items Dipakai</span>
                            <span class="info-value">{sf.items.length} item</span>
                        </div>
                        {#if sf.invoice}
                            <div class="info-row">
                                <span class="info-label">Invoice</span>
                                <span class="info-value invoice-total">{formatCurrency(sf.invoice.grandTotal)}</span>
                            </div>
                        {/if}
                    </div>

                    <div class="card-footer">
                        <span class="footer-date">{formatDate(sf.createdAt)}</span>
                        <span class="footer-by">oleh {sf.createdBy.name}</span>
                    </div>
                </div>
            {/each}
        {/if}
    </div>
</div>

<style>
    .page { padding: 2rem; max-width: 1200px; margin: 0 auto; font-family: 'Inter', sans-serif; color: #e3e4e6; min-height: 100vh; background-color: #0b0b0c; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .page-title { font-size: 2rem; font-weight: 600; color: #ffffff; margin: 0; }
    .page-subtitle { color: #71717a; font-size: 0.9rem; margin: 0.25rem 0 0 0; }
    .btn-add { background: #10b981; color: #fff; border: none; padding: 0.6rem 1.25rem; border-radius: 8px; font-weight: 500; font-size: 0.9rem; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
    .btn-add:hover { background: #059669; }

    .service-list { display: flex; flex-direction: column; gap: 1rem; }
    .empty-state { text-align: center; padding: 4rem; color: #71717a; }

    .service-card { background: rgba(20, 20, 22, 0.6); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 12px; padding: 1.25rem; cursor: pointer; transition: all 0.2s; }
    .service-card:hover { transform: translateY(-2px); border-color: rgba(16, 185, 129, 0.3); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3); }

    .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .card-number { display: flex; align-items: baseline; gap: 0.5rem; }
    .num-label { font-size: 0.75rem; color: #71717a; }
    .num-value { font-size: 1.1rem; font-weight: 700; color: #10b981; font-family: monospace; }
    .status-badge { padding: 0.2rem 0.75rem; border-radius: 20px; font-size: 0.7rem; font-weight: 600; color: #fff; }

    .card-body { display: flex; flex-direction: column; gap: 0.5rem; }
    .info-row { display: flex; justify-content: space-between; font-size: 0.85rem; }
    .info-label { color: #71717a; }
    .info-value { color: #e3e4e6; font-weight: 500; }
    .invoice-total { color: #10b981; font-weight: 600; }

    .card-footer { display: flex; justify-content: space-between; margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid rgba(255, 255, 255, 0.04); font-size: 0.75rem; color: #52525b; }
</style>
