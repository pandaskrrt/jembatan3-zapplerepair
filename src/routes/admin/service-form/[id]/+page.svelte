<script lang="ts">
    import { goto } from '$app/navigation';
    import { enhance } from '$app/forms';

    let { data, form } = $props();
    let sf = $derived(data.serviceForm);
    let items = $derived(data.items || []);
    let cabinets = $derived(data.cabinets || []);
    let invoice = $derived(sf?.invoice);

    let showAddItemModal = $state(false);
    let showAddInvoiceItemModal = $state(false);
    let showCabinetModal = $state(false);
    let showSectionModal = $state(false);
    let selectedCategory = $state('');
    let isSyncing = $state(false);

    let errorMessage = $state('');
    let successMessage = $state('');

    $effect(() => {
        if (form?.error) { errorMessage = form.error; successMessage = ''; }
        if (form?.success) { successMessage = 'Berhasil!'; errorMessage = ''; }
    });

    const categories = [
        { key: 'JASA_SERVICE', label: 'Jasa Service', icon: '🔧', color: '#3b82f6' },
        { key: 'STOCK_GUDANG', label: 'Stock Gudang', icon: '📦', color: '#8b5cf6' },
        { key: 'ALAT_KERJA', label: 'Alat Kerja', icon: '🛠️', color: '#f59e0b' },
        { key: 'JASA_MITRA', label: 'Jasa Mitra', icon: '🤝', color: '#06b6d4' },
        { key: 'PEMBELIAN', label: 'Pembelian', icon: '🛒', color: '#10b981' },
        { key: 'STOK_CUSTOMER', label: 'Stok dari Customer', icon: '👤', color: '#ef4444' },
    ];

    function formatCurrency(amount: number) {
        return `Rp ${amount.toLocaleString('id-ID')}`;
    }

    function formatDate(d: Date | string) {
        return new Date(d).toLocaleString('id-ID', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    function statusColor(status: string) {
        const colors: Record<string, string> = {
            DRAFT: '#6b7280', IN_PROGRESS: '#3b82f6', WAITING_APPROVAL: '#f59e0b',
            COMPLETED: '#10b981', CANCELLED: '#ef4444'
        };
        return colors[status] || '#6b7280';
    }

    function statusLabel(status: string) {
        const labels: Record<string, string> = {
            DRAFT: 'Draft', IN_PROGRESS: 'Dikerjakan', WAITING_APPROVAL: 'Menunggu Persetujuan',
            COMPLETED: 'Selesai', CANCELLED: 'Dibatalkan'
        };
        return labels[status] || status;
    }

    function getCategoryInfo(key: string) {
        return categories.find(c => c.key === key) || categories[0];
    }

    function getStockItemsTotal() {
        return sf?.items?.reduce((sum: number, sfi: any) => sum + (sfi.item?.price?.amount || 0) * sfi.quantity, 0) || 0;
    }

    function openAddInvoiceItem(category: string) {
        selectedCategory = category;
        showAddInvoiceItemModal = true;
    }

    async function syncAndPrint() {
        if (!sf?.id) return;
        isSyncing = true;
        try {
            const res = await fetch('/api/service-invoice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ serviceFormId: sf.id })
            });
            const data = await res.json();
            if (data.success) {
                window.open(data.print_url, '_blank');
                successMessage = 'Invoice berhasil di-sync dan dibuka!';
            } else {
                errorMessage = data.error || 'Gagal sync invoice';
            }
        } catch (e) {
            errorMessage = 'Gagal menghubungi server gajibonusold';
        }
        isSyncing = false;
    }
</script>

<div class="page">
    <div class="header">
        <button class="back-btn" onclick={() => goto('/admin/service-form')}>← Kembali</button>
        <div class="header-info">
            <h1>Service {sf?.serviceNumber}</h1>
            <span class="status-badge" style="background: {statusColor(sf?.status)}">{statusLabel(sf?.status)}</span>
        </div>
    </div>

    {#if errorMessage}
        <div class="alert error">{errorMessage}</div>
    {/if}
    {#if successMessage}
        <div class="alert success">{successMessage}</div>
    {/if}

    <!-- Info Customer & Device -->
    <div class="info-cards">
        <div class="info-card">
            <h3>Customer</h3>
            <p class="info-main">{sf?.customerName}</p>
            {#if sf?.customerPhone}
                <p class="info-sub">{sf.customerPhone}</p>
            {/if}
        </div>
        <div class="info-card">
            <h3>Device</h3>
            <p class="info-main">{sf?.deviceType} {sf?.deviceBrand || ''}</p>
            {#if sf?.deviceModel}
                <p class="info-sub">Model: {sf.deviceModel}</p>
            {/if}
            {#if sf?.deviceIMEI}
                <p class="info-sub">IMEI: {sf.deviceIMEI}</p>
            {/if}
        </div>
        <div class="info-card">
            <h3>Masalah</h3>
            <p class="info-sub">{sf?.problemDescription || 'Tidak ada deskripsi'}</p>
        </div>
    </div>

    <!-- Status Actions -->
    {#if sf?.status === 'DRAFT'}
        <div class="status-actions">
            <form method="POST" action="?/updateStatus" use:enhance class="inline-form">
                <input type="hidden" name="status" value="IN_PROGRESS" />
                <button type="submit" class="btn-action blue">Mulai Kerjakan</button>
            </form>
        </div>
    {:else if sf?.status === 'IN_PROGRESS'}
        <div class="status-actions">
            <form method="POST" action="?/updateStatus" use:enhance class="inline-form">
                <input type="hidden" name="status" value="COMPLETED" />
                <button type="submit" class="btn-action green">Selesai</button>
            </form>
        </div>
    {:else if sf?.status === 'WAITING_APPROVAL'}
        <div class="status-actions">
            <form method="POST" action="?/updateStatus" use:enhance class="inline-form">
                <input type="hidden" name="status" value="COMPLETED" />
                <button type="submit" class="btn-action green">Approve</button>
            </form>
            <form method="POST" action="?/updateStatus" use:enhance class="inline-form">
                <input type="hidden" name="status" value="CANCELLED" />
                <button type="submit" class="btn-action red">Tolak</button>
            </form>
        </div>
    {/if}

    <!-- Items Dipakai dari Stok -->
    <div class="section-card">
        <div class="section-header">
            <h2>Items dari Stok ({sf?.items?.length || 0})</h2>
            {#if sf?.status === 'DRAFT' || sf?.status === 'IN_PROGRESS'}
                <button class="btn-add-sm" onclick={() => showAddItemModal = true}>+ Tambah Item</button>
            {/if}
        </div>

        {#if sf?.items?.length > 0}
            <div class="items-table">
                <div class="table-header">
                    <span class="th-name">Item</span>
                    <span class="th-qty">Qty</span>
                    <span class="th-price">Harga</span>
                    <span class="th-subtotal">Subtotal</span>
                    <span class="th-action"></span>
                </div>
                {#each sf.items as sfi}
                    <div class="table-row">
                        <span class="td-name">{sfi.item.name}</span>
                        <span class="td-qty">{sfi.quantity}</span>
                        <span class="td-price">{formatCurrency(sfi.item.price?.amount || 0)}</span>
                        <span class="td-subtotal">{formatCurrency((sfi.item.price?.amount || 0) * sfi.quantity)}</span>
                        <span class="td-action">
                            {#if sf?.status === 'DRAFT' || sf?.status === 'IN_PROGRESS'}
                                <form method="POST" action="?/removeItem" use:enhance class="inline-form">
                                    <input type="hidden" name="serviceFormItemId" value={sfi.id} />
                                    <button type="submit" class="btn-remove" title="Hapus">✕</button>
                                </form>
                            {/if}
                        </span>
                    </div>
                {/each}
                <div class="table-footer">
                    <span>Total Stok</span>
                    <span class="total-value">{formatCurrency(getStockItemsTotal())}</span>
                </div>
            </div>
        {:else}
            <p class="empty-text">Belum ada item dari stok.</p>
        {/if}
    </div>

    <!-- Invoice Section -->
    <div class="section-card invoice-card">
        <div class="section-header">
            <h2>{invoice ? `Invoice ${invoice.invoiceNumber}` : 'Invoice (Belum dibuat)'}</h2>
            {#if invoice}
                <button class="btn-print" onclick={syncAndPrint} disabled={isSyncing}>
                    {#if isSyncing}
                        <span class="spinner"></span> Syncing...
                    {:else}
                        🖨️ Print Invoice
                    {/if}
                </button>
            {/if}
        </div>

        <!-- Category Buttons -->
        {#if sf?.status === 'IN_PROGRESS' || sf?.status === 'DRAFT'}
            <div class="category-buttons">
                {#each categories as cat}
                    <button class="category-btn" style="border-color: {cat.color}30; color: {cat.color}" onclick={() => openAddInvoiceItem(cat.key)}>
                        <span class="cat-icon">{cat.icon}</span>
                        <span class="cat-label">+ {cat.label}</span>
                    </button>
                {/each}
            </div>
        {/if}

        <!-- Invoice Line Items -->
        {#if invoice?.items?.length > 0}
            <div class="invoice-items">
                {#each categories as cat}
                    {@const catItems = invoice.items.filter((i: any) => i.category === cat.key)}
                    {#if catItems.length > 0}
                        <div class="invoice-group">
                            <div class="group-header" style="color: {cat.color}">
                                <span>{cat.icon} {cat.label}</span>
                            </div>
                            {#each catItems as item}
                                <div class="invoice-line" class:subtract={item.category === 'STOK_CUSTOMER'}>
                                    <span class="line-desc">{item.description}</span>
                                    <span class="line-qty">x{item.quantity}</span>
                                    <span class="line-price">{formatCurrency(item.unitPrice)}</span>
                                    <span class="line-total">
                                        {#if item.category === 'STOK_CUSTOMER'}- {/if}{formatCurrency(item.totalPrice)}
                                    </span>
                                    {#if sf?.status === 'DRAFT' || sf?.status === 'IN_PROGRESS'}
                                        <form method="POST" action="?/removeInvoiceItem" use:enhance class="inline-form">
                                            <input type="hidden" name="invoiceItemId" value={item.id} />
                                            <input type="hidden" name="invoiceId" value={invoice.id} />
                                            <button type="submit" class="btn-remove-sm">✕</button>
                                        </form>
                                    {/if}
                                </div>
                            {/each}
                        </div>
                    {/if}
                {/each}

                <div class="invoice-total">
                    <span>Grand Total</span>
                    <span class="total-value">{formatCurrency(invoice.grandTotal)}</span>
                </div>
            </div>
        {:else}
            <p class="empty-text">Belum ada item invoice. Klik tombol di atas untuk menambah.</p>
        {/if}
    </div>
</div>

<!-- Add Item from Stock Modal -->
{#if showAddItemModal}
    <div class="modal-backdrop" onclick={() => showAddItemModal = false}>
        <div class="modal-box wide" onclick={(e) => e.stopPropagation()}>
            <h3>Tambah Item dari Stok</h3>
            <form method="POST" action="?/addItem" use:enhance={() => { showAddItemModal = false; return async ({ update }) => { await update(); }; }}>
                <div class="fg">
                    <label class="fl">Pilih Item</label>
                    <select class="fi" name="itemId" required>
                        <option value="">Pilih item...</option>
                        {#each items as item}
                            <option value={item.id}>{item.name} (Stok: {item.stock}) - {item.section?.name || 'No Section'}</option>
                        {/each}
                    </select>
                </div>
                <div class="fg">
                    <label class="fl">Quantity</label>
                    <input class="fi" type="number" name="quantity" value="1" min="1" />
                </div>
                <div class="fg">
                    <label class="fl">Catatan</label>
                    <input class="fi" type="text" name="note" placeholder="Catatan penggunaan" />
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-cancel" onclick={() => showAddItemModal = false}>Batal</button>
                    <button type="submit" class="btn-submit">Tambah</button>
                </div>
            </form>
        </div>
    </div>
{/if}

<!-- Add Invoice Item Modal -->
{#if showAddInvoiceItemModal}
    {@const catInfo = getCategoryInfo(selectedCategory)}
    <div class="modal-backdrop" onclick={() => showAddInvoiceItemModal = false}>
        <div class="modal-box" onclick={(e) => e.stopPropagation()}>
            <h3 style="color: {catInfo.color}">{catInfo.icon} + {catInfo.label}</h3>
            <form method="POST" action="?/addInvoiceItem" use:enhance={() => { showAddInvoiceItemModal = false; return async ({ update }) => { await update(); }; }}>
                <input type="hidden" name="category" value={selectedCategory} />
                <div class="fg">
                    <label class="fl">Deskripsi</label>
                    <input class="fi" type="text" name="description" required placeholder="Nama/deskripsi item" />
                </div>
                <div class="fg">
                    <label class="fl">Quantity</label>
                    <input class="fi" type="number" name="quantity" value="1" min="1" />
                </div>
                <div class="fg">
                    <label class="fl">Harga Satuan (Rp)</label>
                    <input class="fi" type="number" name="unitPrice" value="0" min="0" />
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-cancel" onclick={() => showAddInvoiceItemModal = false}>Batal</button>
                    <button type="submit" class="btn-submit">Tambah</button>
                </div>
            </form>
        </div>
    </div>
{/if}

<style>
    .page { padding: 2rem; max-width: 1000px; margin: 0 auto; font-family: 'Inter', sans-serif; color: #e3e4e6; min-height: 100vh; background-color: #0b0b0c; }
    .header { margin-bottom: 2rem; }
    .back-btn { padding: 0.5rem 1rem; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; background: rgba(20,20,22,0.6); color: #a1a1a5; cursor: pointer; font-size: 0.85rem; margin-bottom: 1rem; }
    .back-btn:hover { background: rgba(255,255,255,0.05); color: #fff; }
    .header-info { display: flex; align-items: center; gap: 1rem; }
    .header-info h1 { margin: 0; font-size: 1.5rem; color: #fff; }
    .status-badge { padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; color: #fff; }

    .alert { padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.85rem; }
    .alert.error { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); color: #ef4444; }
    .alert.success { background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2); color: #10b981; }

    .info-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .info-card { background: rgba(20,20,22,0.6); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 1rem; }
    .info-card h3 { font-size: 0.75rem; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 0.5rem 0; }
    .info-main { font-size: 1.1rem; font-weight: 600; color: #fff; margin: 0; }
    .info-sub { font-size: 0.8rem; color: #a1a1a5; margin: 0.25rem 0 0 0; }

    .status-actions { display: flex; gap: 0.75rem; margin-bottom: 1.5rem; }
    .inline-form { display: inline; }
    .btn-action { padding: 0.5rem 1.25rem; border: none; border-radius: 8px; font-weight: 600; font-size: 0.85rem; cursor: pointer; color: #fff; }
    .btn-action.blue { background: #3b82f6; }
    .btn-action.green { background: #10b981; }
    .btn-action.red { background: #ef4444; }
    .btn-action:hover { opacity: 0.9; }

    .section-card { background: rgba(20,20,22,0.6); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .section-header h2 { margin: 0; font-size: 1rem; color: #fff; }
    .btn-add-sm { padding: 0.4rem 0.75rem; border: 1px dashed rgba(16,185,129,0.3); border-radius: 6px; background: transparent; color: #10b981; cursor: pointer; font-size: 0.8rem; }
    .btn-add-sm:hover { background: rgba(16,185,129,0.1); }

    .items-table { width: 100%; }
    .table-header, .table-row { display: grid; grid-template-columns: 1fr 60px 120px 120px 40px; gap: 0.5rem; padding: 0.6rem 0; align-items: center; font-size: 0.85rem; }
    .table-header { color: #71717a; font-size: 0.75rem; text-transform: uppercase; border-bottom: 1px solid rgba(255,255,255,0.06); }
    .table-row { border-bottom: 1px solid rgba(255,255,255,0.03); }
    .td-name { color: #e3e4e6; }
    .td-subtotal { color: #10b981; font-weight: 500; }
    .table-footer { display: flex; justify-content: space-between; padding: 0.75rem 0 0 0; border-top: 1px solid rgba(255,255,255,0.06); font-weight: 600; }
    .total-value { color: #10b981; }
    .empty-text { color: #52525b; font-size: 0.85rem; text-align: center; padding: 2rem; }

    .btn-remove { background: none; border: none; color: #ef4444; cursor: pointer; font-size: 0.9rem; padding: 0.25rem; }
    .btn-remove-sm { background: none; border: none; color: #ef4444; cursor: pointer; font-size: 0.75rem; padding: 0.15rem 0.3rem; }
    .btn-remove-sm:hover { background: rgba(239,68,68,0.1); border-radius: 4px; }

    .invoice-card { border-color: rgba(16,185,129,0.2); }

    .btn-print { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border: 1px solid rgba(16,185,129,0.3); border-radius: 8px; background: rgba(16,185,129,0.1); color: #10b981; cursor: pointer; font-size: 0.85rem; font-weight: 500; }
    .btn-print:hover:not(:disabled) { background: rgba(16,185,129,0.2); }
    .btn-print:disabled { opacity: 0.5; cursor: not-allowed; }
    .spinner { width: 14px; height: 14px; border: 2px solid rgba(16,185,129,0.3); border-top-color: #10b981; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .category-buttons { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.25rem; }
    .category-btn { display: flex; align-items: center; gap: 0.4rem; padding: 0.5rem 0.85rem; border: 1px solid; border-radius: 8px; background: transparent; cursor: pointer; font-size: 0.8rem; font-weight: 500; transition: all 0.15s; }
    .category-btn:hover { background: rgba(255,255,255,0.03); transform: translateY(-1px); }
    .cat-icon { font-size: 0.9rem; }

    .invoice-items { margin-top: 0.5rem; }
    .invoice-group { margin-bottom: 1rem; }
    .group-header { font-size: 0.8rem; font-weight: 600; padding: 0.4rem 0; border-bottom: 1px solid rgba(255,255,255,0.06); margin-bottom: 0.4rem; }
    .invoice-line { display: flex; align-items: center; gap: 0.75rem; padding: 0.4rem 0; font-size: 0.85rem; border-bottom: 1px solid rgba(255,255,255,0.03); }
    .invoice-line.subtract { opacity: 0.8; }
    .invoice-line.subtract .line-total { color: #f59e0b; }
    .line-desc { flex: 1; color: #e3e4e6; }
    .line-qty { color: #71717a; min-width: 40px; }
    .line-price { color: #a1a1a5; min-width: 100px; text-align: right; }
    .line-total { color: #10b981; font-weight: 500; min-width: 120px; text-align: right; }
    .invoice-total { display: flex; justify-content: space-between; padding: 0.75rem 0; border-top: 2px solid rgba(255,255,255,0.1); font-weight: 700; font-size: 1.1rem; margin-top: 0.5rem; }
    .invoice-total .total-value { color: #10b981; font-size: 1.2rem; }

    .fg { display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 0.75rem; }
    .fl { font-size: 0.8rem; color: #71717a; font-weight: 500; }
    .fi { background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; padding: 0.6rem 0.75rem; color: #e3e4e6; font-size: 0.9rem; outline: none; }
    .fi:focus { border-color: #10b981; }
    select.fi { cursor: pointer; }

    .form-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1rem; }
    .btn-cancel { padding: 0.6rem 1.25rem; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; background: transparent; color: #a1a1a5; cursor: pointer; font-size: 0.85rem; }
    .btn-cancel:hover { background: rgba(255,255,255,0.05); }
    .btn-submit { padding: 0.6rem 1.5rem; border: none; border-radius: 8px; background: #10b981; color: #fff; font-weight: 600; font-size: 0.85rem; cursor: pointer; }
    .btn-submit:hover { background: #059669; }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 2000; }
    .modal-box { background: #141416; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1.5rem; width: 100%; max-width: 450px; }
    .modal-box.wide { max-width: 550px; }
    .modal-box h3 { margin: 0 0 1.25rem 0; color: #fff; font-size: 1.1rem; }

    @media (max-width: 768px) {
        .info-cards { grid-template-columns: 1fr; }
        .category-buttons { flex-direction: column; }
        .table-header, .table-row { grid-template-columns: 1fr 50px 90px 90px 30px; font-size: 0.75rem; }
    }
</style>
