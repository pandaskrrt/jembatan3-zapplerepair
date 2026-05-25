<script lang="ts">
  import { enhance } from '$app/forms';

  // Svelte 5 Runes Mode untuk menangkap data server
  let { data, form } = $props();

  // State pelacakan tombol loading restore per ID item
  let restoringId = $state<string | null>(null);

  // Format IDR Rupiah
  function formatRupiah(amount: number | null | undefined) {
    if (amount === null || amount === undefined) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  }

  // Format Waktu & Tanggal Indonesia
  function formatDateTime(date: Date | string) {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
</script>

<div class="deleted-container">
  <div class="header-card card">
    <div class="title-section">
      <div class="header-icon-box">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
      </div>
      <div>
        <h1>Tempat Sampah Inventaris (Soft-Deleted)</h1>
        <p class="subtitle">Daftar item yang dihapus sementara dari rak gudang. Anda dapat memulihkan kembali item ke layout aktif.</p>
      </div>
    </div>
    <div class="counter-badge">
      <span class="count-num">{data.deletedItems.length}</span>
      <span class="count-label">Total Terhapus</span>
    </div>
  </div>

  {#if form?.message}
    <div class="alert {form.success ? 'alert-success' : 'alert-danger'}">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
      {form.message}
    </div>
  {/if}

  <div class="workspace-card">
    {#if data.deletedItems.length === 0}
      <div class="empty-panel">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
        <h3>Tempat sampah kosong</h3>
        <p>Tidak ada item atau barang pembukuan yang sedang dalam status terhapus.</p>
      </div>
    {:else}
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Detail Item Inventaris</th>
              <th>Kategori & Lokasi Asal</th>
              <th>Nilai Nominal</th>
              <th>Alasan & Waktu Hapus</th>
              <th style="text-align: center;">Aksi Pemulihan</th>
            </tr>
          </thead>
          <tbody>
            {#each data.deletedItems as item (item.id)}
              <tr>
                <td>
                  <div class="primary-text text-strike">{item.name}</div>
                  <div class="sub-text">
                    ID: <span class="font-mono">{item.id}</span> 
                    {#if item.serialNumber}
                      | <span class="mini-pill">SN: {item.serialNumber}</span>
                    {/if}
                  </div>
                </td>
                <td>
                  <div><span class="category-tag">{item.category}</span></div>
                  <div class="sub-text" style="margin-top: 4px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray" style="vertical-align: -1px; margin-right: 2px;"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                    Kabinet: {item.cabinetName} / Section: {item.sectionName}
                  </div>
                </td>
                <td>
                  <div class="pricing">
                    <div>Beli: <span class="cost">{formatRupiah(item.costPrice?.amount)}</span></div>
                    <div>Jual: <span class="price">{formatRupiah(item.price?.amount)}</span></div>
                  </div>
                </td>
                <td>
                  <p class="table-para delete-reason">"{item.deleteReason}"</p>
                  <div class="sub-text" style="margin-top: 3px;">
                    Oleh: <strong>{item.deletedBy}</strong> • {formatDateTime(item.deletedAt)}
                  </div>
                </td>
                <td style="text-align: center;">
                  <form
                    method="POST"
                    action="?/restoreItem"
                    use:enhance={() => {
                      restoringId = item.id;
                      return async ({ update }) => {
                        await update();
                        restoringId = null;
                      };
                    }}
                  >
                    <input type="hidden" name="itemId" value={item.id} />
                    <button 
                      type="submit" 
                      class="btn btn-restore" 
                      disabled={restoringId !== null}
                    >
                      {#if restoringId === item.id}
                        <svg class="spinner" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.21-8.56"/></svg> Proses...
                      {:else}
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg> Restore
                      {/if}
                    </button>
                  </form>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>

<style>
  .deleted-container {
    max-width: 1280px;
    margin: 2rem auto;
    padding: 0 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    font-family: system-ui, -apple-system, sans-serif;
    color: #1e293b;
  }

  .card {
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.5rem;
  }

  /* TOP HEADER COMPONENT */
  .header-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .title-section {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .header-icon-box {
    width: 48px;
    height: 48px;
    background-color: #fee2e2;
    color: #c2410c;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .header-card h1 { font-size: 1.35rem; font-weight: 700; margin: 0; color: #1e293b; }
  .subtitle { font-size: 0.85rem; color: #64748b; margin: 0.25rem 0 0 0; }

  .counter-badge {
    background-color: #f1f5f9;
    padding: 0.5rem 1rem;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    border: 1px solid #e2e8f0;
  }

  .count-num { font-size: 1.4rem; font-weight: 700; color: #c2410c; line-height: 1.2; }
  .count-label { font-size: 0.725rem; color: #64748b; font-weight: 600; text-transform: uppercase; }

  /* FEEDBACK ALERTS */
  .alert {
    padding: 0.85rem 1rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    display: flex;
    align-items: center;
  }
  .alert-success { background-color: #dcfce7; color: #0f6e56; border: 1px solid #bbf7d0; }
  .alert-danger { background-color: #fee2e2; color: #c2410c; border: 1px solid #fecaca; }

  /* MAIN TABLE PANEL */
  .workspace-card {
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  }

  .empty-panel {
    padding: 5rem 2rem;
    text-align: center;
    color: #94a3b8;
  }
  .empty-panel svg { color: #0f6e56; margin-bottom: 0.75rem; }
  .empty-panel h3 { margin: 0; color: #334155; font-size: 1.1rem; }
  .empty-panel p { margin: 0.25rem 0 0 0; font-size: 0.85rem; }

  .table-responsive { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.875rem; }
  th { background-color: #f8fafc; color: #475569; font-weight: 600; padding: 0.85rem 1rem; border-bottom: 1px solid #e2e8f0; }
  td { padding: 1rem; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background-color: #f8fafc; }

  .primary-text { font-weight: 600; color: #1e293b; }
  .sub-text { font-size: 0.75rem; color: #64748b; }
  .font-mono { font-family: monospace; font-size: 0.825rem; }
  .text-strike { text-decoration: line-through; color: #94a3b8; }
  .text-gray { color: #94a3b8; }

  .category-tag { font-size: 0.725rem; background-color: #f1f5f9; padding: 0.15rem 0.4rem; border-radius: 4px; color: #475569; font-weight: 600; }
  .mini-pill { font-size: 0.7rem; background-color: #fee2e2; padding: 0.1rem 0.3rem; border-radius: 4px; color: #c2410c; font-weight: 600; }

  .pricing { display: flex; flex-direction: column; gap: 0.1rem; font-size: 0.8rem; }
  .cost { color: #c2410c; font-weight: 600; }
  .price { color: #0f6e56; font-weight: 600; }

  .table-para { margin: 0; max-width: 320px; line-height: 1.4; font-size: 0.85rem; }
  .delete-reason { color: #64748b; font-style: italic; }

  /* BUTTON ACTION STYLE GUIDE */
  .btn-restore {
    background-color: #e0f2fe;
    color: #0369a1;
    border: 1px solid #bae6fd;
    padding: 0.45rem 1rem;
    font-size: 0.825rem;
    font-weight: 700;
    border-radius: 6px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    transition: all 0.2s;
  }
  .btn-restore:hover:not(:disabled) { background-color: #0369a1; color: #ffffff; border-color: #0369a1; }
  .btn-restore:disabled { opacity: 0.6; cursor: not-allowed; }

  .spinner { animation: rotate 1s linear infinite; }
  @keyframes rotate { to { transform: rotate(360deg); } }
</style>