<script lang="ts">
  import { enhance } from '$app/forms';

  let { data, form } = $props();

  let restoringId = $state<number | null>(null);
  // Track item yang sedang buka modal pilih section
  let selectedItemId = $state<number | null>(null);
  let selectedSectionId = $state<number | string>('');

  function formatRupiah(amount: number | null | undefined) {
    if (amount === null || amount === undefined) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  }

  function formatDateTime(date: Date | string) {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  function openRestoreModal(itemId: number, defaultSectionId: number | null) {
    selectedItemId = itemId;
    selectedSectionId = defaultSectionId ?? '';
  }

  function closeModal() {
    selectedItemId = null;
    selectedSectionId = '';
  }
</script>

<div class="deleted-container">
  <!-- Header -->
  <div class="header-card card">
    <div class="title-section">
      <div class="header-icon-box">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
      </div>
      <div>
        <h1>Tempat Sampah Inventaris</h1>
        <p class="subtitle">Item yang dihapus sementara. Anda dapat memulihkan kembali ke rak aktif.</p>
      </div>
    </div>
    <div class="counter-badge">
      <span class="count-num">{data.deletedItems.length}</span>
      <span class="count-label">Total Terhapus</span>
    </div>
  </div>

  <!-- Alert feedback -->
  {#if form?.message}
    <div class="alert {form.success && form.warning ? 'alert-warning' : form.success ? 'alert-success' : 'alert-danger'}">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px; flex-shrink:0;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
      {form.message}
    </div>
  {/if}

  <!-- Tabel -->
  <div class="workspace-card">
    {#if data.deletedItems.length === 0}
      <div class="empty-panel">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
        <h3>Tempat sampah kosong</h3>
        <p>Tidak ada item yang sedang dalam status terhapus.</p>
      </div>
    {:else}
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Detail Item</th>
              <th>Kategori & Lokasi Asal</th>
              <th>Nilai Nominal</th>
              <th>Alasan & Waktu Hapus</th>
              <th style="text-align: center;">Aksi</th>
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
                    📦 {item.cabinetName} / {item.sectionName}
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
                  <button
                    class="btn btn-restore"
                    onclick={() => openRestoreModal(item.id, item.deletedFromSectionId ?? null)}
                    disabled={restoringId !== null}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                    Restore
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>

<!-- Modal Restore -->
{#if selectedItemId !== null}
  {@const selectedItem = data.deletedItems.find(i => i.id === selectedItemId)}
  <div class="modal-overlay" onclick={closeModal} role="dialog" aria-modal="true">
    <div class="modal-box" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <h2>Restore Item</h2>
        <button class="btn-close" onclick={closeModal}>✕</button>
      </div>

      <div class="modal-body">
        <div class="restore-item-info">
          <span class="restore-item-name">{selectedItem?.name}</span>
          <span class="restore-item-meta">
            Asal: {selectedItem?.cabinetName} / {selectedItem?.sectionName}
          </span>
        </div>

        <form
          method="POST"
          action="?/restoreItem"
          use:enhance={() => {
            restoringId = selectedItemId;
            return async ({ update }) => {
              await update();
              restoringId = null;
              closeModal();
            };
          }}
        >
          <input type="hidden" name="itemId" value={selectedItemId} />

          <div class="form-group">
            <label for="restoredToSectionId">Section Tujuan Restore</label>
            <select
              id="restoredToSectionId"
              name="restoredToSectionId"
              bind:value={selectedSectionId}
            >
              <option value="">— Kembalikan ke section asal —</option>
              {#each data.activeSections as section}
                <option value={section.id}>
                  {section.cabinet?.name ?? '-'} / {section.name}
                </option>
              {/each}
            </select>
            <small class="form-hint">
              Kosongkan untuk restore ke section asal
              {selectedItem?.deletedFromSectionName
                ? `("${selectedItem.deletedFromSectionName}")`
                : '(section asal tidak diketahui)'}
            </small>
          </div>

          <div class="form-group">
            <label for="note">Catatan Restore <span class="optional">(opsional)</span></label>
            <textarea
              id="note"
              name="note"
              rows="2"
              placeholder="Contoh: Dipulihkan karena terhapus tidak sengaja"
            ></textarea>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-cancel" onclick={closeModal}>Batal</button>
            <button type="submit" class="btn btn-confirm-restore" disabled={restoringId !== null}>
              {#if restoringId === selectedItemId}
                <svg class="spinner" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.21-8.56"/></svg>
                Memproses...
              {:else}
                ✓ Konfirmasi Restore
              {/if}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}

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
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.5rem;
  }

  .header-card { display: flex; justify-content: space-between; align-items: center; }
  .title-section { display: flex; align-items: center; gap: 1rem; }
  .header-icon-box {
    width: 48px; height: 48px;
    background: #fee2e2; color: #c2410c;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .header-card h1 { font-size: 1.35rem; font-weight: 700; margin: 0; }
  .subtitle { font-size: 0.85rem; color: #64748b; margin: 0.25rem 0 0; }

  .counter-badge {
    background: #f1f5f9; padding: 0.5rem 1rem;
    border-radius: 10px; border: 1px solid #e2e8f0;
    display: flex; flex-direction: column; align-items: center;
  }
  .count-num { font-size: 1.4rem; font-weight: 700; color: #c2410c; line-height: 1.2; }
  .count-label { font-size: 0.725rem; color: #64748b; font-weight: 600; text-transform: uppercase; }

  /* Alerts */
  .alert {
    padding: 0.85rem 1rem; border-radius: 8px;
    font-size: 0.875rem; font-weight: 600;
    display: flex; align-items: center;
  }
  .alert-success { background: #dcfce7; color: #0f6e56; border: 1px solid #bbf7d0; }
  .alert-warning { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
  .alert-danger  { background: #fee2e2; color: #c2410c; border: 1px solid #fecaca; }

  /* Table */
  .workspace-card {
    background: #ffffff; border: 1px solid #e2e8f0;
    border-radius: 12px; overflow: hidden;
  }
  .empty-panel { padding: 5rem 2rem; text-align: center; color: #94a3b8; }
  .empty-panel svg { color: #0f6e56; margin-bottom: 0.75rem; }
  .empty-panel h3 { margin: 0; color: #334155; }
  .empty-panel p { margin: 0.25rem 0 0; font-size: 0.85rem; }

  .table-responsive { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
  th { background: #f8fafc; color: #475569; font-weight: 600; padding: 0.85rem 1rem; border-bottom: 1px solid #e2e8f0; }
  td { padding: 1rem; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: #f8fafc; }

  .primary-text { font-weight: 600; color: #1e293b; }
  .sub-text { font-size: 0.75rem; color: #64748b; }
  .font-mono { font-family: monospace; font-size: 0.825rem; }
  .text-strike { text-decoration: line-through; color: #94a3b8; }
  .category-tag { font-size: 0.725rem; background: #f1f5f9; padding: 0.15rem 0.4rem; border-radius: 4px; color: #475569; font-weight: 600; }
  .mini-pill { font-size: 0.7rem; background: #fee2e2; padding: 0.1rem 0.3rem; border-radius: 4px; color: #c2410c; font-weight: 600; }

  .pricing { display: flex; flex-direction: column; gap: 0.1rem; font-size: 0.8rem; }
  .cost { color: #c2410c; font-weight: 600; }
  .price { color: #0f6e56; font-weight: 600; }

  .table-para { margin: 0; max-width: 320px; line-height: 1.4; font-size: 0.85rem; }
  .delete-reason { color: #64748b; font-style: italic; }

  .btn-restore {
    background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd;
    padding: 0.45rem 1rem; font-size: 0.825rem; font-weight: 700;
    border-radius: 6px; cursor: pointer;
    display: inline-flex; align-items: center; gap: 0.35rem;
    transition: all 0.2s;
  }
  .btn-restore:hover:not(:disabled) { background: #0369a1; color: #fff; border-color: #0369a1; }
  .btn-restore:disabled { opacity: 0.6; cursor: not-allowed; }

  /* Modal */
  .modal-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.45);
    display: flex; align-items: center; justify-content: center;
    z-index: 100; padding: 1rem;
  }
  .modal-box {
    background: #fff; border-radius: 16px;
    width: 100%; max-width: 480px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  }
  .modal-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid #e2e8f0;
  }
  .modal-header h2 { margin: 0; font-size: 1.1rem; font-weight: 700; }
  .btn-close {
    background: none; border: none; cursor: pointer;
    font-size: 1rem; color: #64748b; padding: 0.25rem;
  }
  .btn-close:hover { color: #1e293b; }

  .modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; }

  .restore-item-info {
    background: #f8fafc; border: 1px solid #e2e8f0;
    border-radius: 8px; padding: 0.875rem 1rem;
    display: flex; flex-direction: column; gap: 0.25rem;
  }
  .restore-item-name { font-weight: 700; color: #1e293b; font-size: 0.975rem; }
  .restore-item-meta { font-size: 0.8rem; color: #64748b; }

  .form-group { display: flex; flex-direction: column; gap: 0.4rem; }
  .form-group label { font-size: 0.875rem; font-weight: 600; color: #334155; }
  .optional { font-weight: 400; color: #94a3b8; font-size: 0.8rem; }
  .form-group select,
  .form-group textarea {
    width: 100%; padding: 0.625rem 0.75rem;
    border: 1px solid #cbd5e1; border-radius: 8px;
    font-family: inherit; font-size: 0.875rem;
    box-sizing: border-box; color: #1e293b;
  }
  .form-group select:focus,
  .form-group textarea:focus {
    outline: none; border-color: #0369a1;
    box-shadow: 0 0 0 3px rgba(3,105,161,0.12);
  }
  .form-group textarea { resize: vertical; }
  .form-hint { font-size: 0.75rem; color: #64748b; }

  .modal-footer {
    display: flex; justify-content: flex-end; gap: 0.75rem;
    padding-top: 0.5rem;
  }
  .btn-cancel {
    background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0;
    padding: 0.6rem 1.25rem; font-size: 0.875rem; font-weight: 600;
    border-radius: 8px; cursor: pointer;
  }
  .btn-cancel:hover { background: #e2e8f0; }
  .btn-confirm-restore {
    background: #0369a1; color: #fff; border: none;
    padding: 0.6rem 1.25rem; font-size: 0.875rem; font-weight: 700;
    border-radius: 8px; cursor: pointer;
    display: flex; align-items: center; gap: 0.4rem;
    transition: background 0.2s;
  }
  .btn-confirm-restore:hover:not(:disabled) { background: #0284c7; }
  .btn-confirm-restore:disabled { opacity: 0.6; cursor: not-allowed; }

  .spinner { animation: rotate 1s linear infinite; }
  @keyframes rotate { to { transform: rotate(360deg); } }

  @media (max-width: 768px) {
    .header-card { flex-direction: column; align-items: flex-start; gap: 1rem; }
    .modal-box { max-width: 100%; margin: 0 0.5rem; }
  }
</style>