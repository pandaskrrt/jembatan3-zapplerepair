<script lang="ts">
  import { enhance } from '$app/forms';

  // Svelte 5 Runes
  let { data } = $props();

  // State untuk mengontrol status loading & modal dialog
  let loading = $state(false);
  let selectedItem = $state<any>(null);
  let targetSectionId = $state<number | string>('');
  let restoreNote = $state('');

  // Format Helper Lokasi Asal
  function formatOriginalLocation(item: any) {
    const section = item.deletedFromSectionName || 'Tidak diketahui';
    const cabinet = item.deletedFromCabinetName ? `(Kabinet: ${item.deletedFromCabinetName})` : '';
    return `${section} ${cabinet}`.trim();
  }

  // Format Tanggal Indonesia
  function formatDateTime(date: Date | string) {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Buka dialog restore item
  function openRestoreModal(item: any) {
    selectedItem = item;
    // Cari apakah section asal masih aktif untuk dijadikan default value dropdown
    const matchedSection = data.activeSections.find(
      (s: any) => s.name === item.deletedFromSectionName
    );
    targetSectionId = matchedSection ? matchedSection.id : '';
    restoreNote = '';
  }

  function closeRestoreModal() {
    selectedItem = null;
  }
</script>

<div class="container">
  <div class="header-section">
    <h1><i class="ti ti-trash-x"></i> Item yang Dihapus</h1>
    <p>Daftar seluruh item inventaris yang telah di-soft-delete dari sistem gudang.</p>
  </div>

  {#if !data.deletedItems || data.deletedItems.length === 0}
    <div class="empty-state">
      <i class="ti ti-package-off"></i>
      <h3>Tidak ada item yang dihapus</h3>
      <p>Semua item inventaris aktif berada di dalam sistem gudang.</p>
    </div>
  {:else}
    <div class="table-container">
      <table class="responsive-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Kategori</th>
            <th>Lokasi Asal</th>
            <th>Waktu & Pengonfirmasi</th>
            <th>Alasan Hapus</th>
            <th>Log Status</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {#each data.deletedItems as item (item.id)}
            <tr>
              <td>
                <div class="item-info">
                  {#if item.imageUrl}
                    <img src={item.imageUrl} alt={item.name} class="item-img" />
                  {:else}
                    <div class="item-img-placeholder"><i class="ti ti-box"></i></div>
                  {/if}
                  <div>
                    <span class="item-name">{item.name}</span>
                    <span class="item-sku">Stok: {item.stock} | SN: {item.serialNumber || '-'}</span>
                  </div>
                </div>
              </td>
              <td>
                <span class="category-badge">{item.category}</span>
                <span class="subcategory-text">{item.subCategory}</span>
              </td>
              <td>
                <span class="location-text"><i class="ti ti-map-pin"></i> {formatOriginalLocation(item)}</span>
              </td>
              <td>
                <div class="meta-container">
                  <span class="time-text">{formatDateTime(item.deletedAt)}</span>
                  <span class="user-text"><i class="ti ti-user"></i> ID: {item.deletedBy}</span>
                </div>
              </td>
              <td>
                <p class="reason-text">{item.deleteReason || 'Tanpa alasan tertulis'}</p>
              </td>
              <td>
                {#if item.restoreLogs && item.restoreLogs.length > 0}
                  <span class="status-badge blue">
                    <i class="ti ti-history"></i> Pernah Di-restore ({formatDateTime(item.restoreLogs[0].createdAt)})
                  </span>
                {:else}
                  <span class="status-badge gray">Belum pernah di-restore</span>
                {/if}
              </td>
              <td>
                <button class="btn btn-restore" onclick={() => openRestoreModal(item)}>
                  <i class="ti ti-refresh"></i> Restore
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

{#if selectedItem}
  <div class="modal-overlay" onclick={closeRestoreModal} role="presentation">
    <div class="modal-card" onclick={(e) => e.stopPropagation()} role="presentation">
      <div class="modal-header">
        <h3>Restore Item Inventaris</h3>
        <button class="btn-close" onclick={closeRestoreModal}><i class="ti ti-x"></i></button>
      </div>
      
      <form
        method="POST"
        action="?/restore"
        use:enhance={() => {
          loading = true;
          return async ({ update }) => {
            await update();
            loading = false;
            closeRestoreModal();
          };
        }}
      >
        <div class="modal-body">
          <p class="modal-desc">Anda akan mengembalikan item <strong>{selectedItem.name}</strong> ke sistem inventaris aktif.</p>
          
          <input type="hidden" name="itemId" value={selectedItem.id} />

          <div class="form-group">
            <label for="restoredToSectionId">Pilih Section / Rak Tujuan</label>
            <select name="restoredToSectionId" id="restoredToSectionId" bind:value={targetSectionId}>
              <option value="">Pulihkan ke Section Asal ({selectedItem.deletedFromSectionName || 'Default'})</option>
              {#each data.activeSections as sec}
                <option value={sec.id}>
                  {sec.name} {sec.cabinet ? `— Kabinet: ${sec.cabinet.name}` : ''}
                </option>
              {/each}
            </select>
            <small class="form-help">Jika section asal sudah tidak ada atau berubah, mohon pindahkan ke section yang baru.</small>
          </div>

          <div class="form-group">
            <label for="note">Catatan Alasan Pemulihan (Opsional)</label>
            <textarea
              name="note"
              id="note"
              bind:value={restoreNote}
              placeholder="Contoh: Salah hapus atau barang ditemukan kembali saat audit..."
              rows="3"
            ></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick={closeRestoreModal} disabled={loading}>
            Batal
          </button>
          <button type="submit" class="btn btn-primary" disabled={loading}>
            {#if loading}
              <i class="ti ti-loader-2 spinner"></i> Memproses...
            {:else}
              <i class="ti ti-check"></i> Konfirmasi Pemulihan
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  :global(body) {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #1e293b;
    background-color: #f1f5f9;
    margin: 0;
  }

  .container {
    max-width: 1280px;
    margin: 2rem auto;
    padding: 0 1.5rem;
  }

  .header-section {
    margin-bottom: 2rem;
  }

  .header-section h1 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.75rem;
    color: #1e293b;
    margin: 0 0 0.5rem 0;
  }

  .header-section p {
    color: #64748b;
    margin: 0;
  }

  .empty-state {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 4rem 2rem;
    text-align: center;
    color: #64748b;
  }

  .empty-state i {
    font-size: 4rem;
    color: #94a3b8;
    margin-bottom: 1rem;
    display: inline-block;
  }

  .empty-state h3 {
    margin: 0 0 0.5rem 0;
    color: #1e293b;
  }

  .table-container {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    overflow-x: auto;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }

  .responsive-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    font-size: 0.925rem;
  }

  .responsive-table th {
    background: #f8fafc;
    padding: 1rem;
    color: #64748b;
    font-weight: 600;
    border-bottom: 1px solid #e2e8f0;
  }

  .responsive-table td {
    padding: 1rem;
    border-bottom: 1px solid #e2e8f0;
    vertical-align: middle;
  }

  .responsive-table tr:last-child td {
    border-bottom: none;
  }

  .item-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .item-img, .item-img-placeholder {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    object-fit: cover;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #94a3b8;
  }

  .item-img-placeholder i {
    font-size: 1.5rem;
  }

  .item-name {
    display: block;
    font-weight: 600;
    color: #1e293b;
  }

  .item-sku {
    font-size: 0.8rem;
    color: #64748b;
  }

  .category-badge {
    display: inline-block;
    padding: 0.2rem 0.5rem;
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
    color: #475569;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .subcategory-text {
    display: block;
    font-size: 0.8rem;
    color: #64748b;
    margin-top: 0.25rem;
  }

  .location-text {
    color: #334155;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .meta-container {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .time-text {
    font-size: 0.85rem;
    color: #1e293b;
  }

  .user-text {
    font-size: 0.775rem;
    color: #64748b;
  }

  .reason-text {
    margin: 0;
    font-size: 0.85rem;
    color: #475569;
    max-width: 200px;
    word-wrap: break-word;
    white-space: normal;
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .status-badge.blue {
    color: #0369a1;
    background-color: #e0f2fe;
  }

  .status-badge.gray {
    color: #64748b;
    background-color: #f1f5f9;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.5rem 0.85rem;
    font-size: 0.85rem;
    font-weight: 500;
    border-radius: 8px;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.2s;
  }

  .btn-restore {
    color: #0369a1;
    background: #e0f2fe;
    border-color: #bae6fd;
  }

  .btn-restore:hover {
    background: #bae6fd;
  }

  /* MODAL STYLES */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(15, 23, 42, 0.4);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .modal-card {
    background: #ffffff;
    border-radius: 12px;
    width: 100%;
    max-width: 500px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    overflow: hidden;
    animation: scaleUp 0.15s ease-out;
  }

  @keyframes scaleUp {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }

  .modal-header {
    padding: 1.25rem;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .modal-header h3 {
    margin: 0;
    font-size: 1.2rem;
    color: #1e293b;
  }

  .btn-close {
    background: none;
    border: none;
    font-size: 1.25rem;
    color: #94a3b8;
    cursor: pointer;
    padding: 0.25rem;
  }

  .btn-close:hover {
    color: #475569;
  }

  .modal-body {
    padding: 1.25rem;
  }

  .modal-desc {
    margin: 0 0 1.25rem 0;
    font-size: 0.95rem;
    color: #475569;
    line-height: 1.4;
  }

  .form-group {
    margin-bottom: 1.25rem;
  }

  .form-group label {
    display: block;
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 0.4rem;
    color: #334155;
  }

  .form-group select, .form-group textarea {
    width: 100%;
    padding: 0.6rem 0.75rem;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font-family: inherit;
    font-size: 0.9rem;
    color: #1e293b;
    box-sizing: border-box;
    background-color: #fff;
  }

  .form-group select:focus, .form-group textarea:focus {
    outline: none;
    border-color: #0369a1;
    box-shadow: 0 0 0 3px rgba(3, 105, 161, 0.15);
  }

  .form-help {
    display: block;
    margin-top: 0.35rem;
    font-size: 0.775rem;
    color: #64748b;
  }

  .modal-footer {
    padding: 1rem 1.25rem;
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
  }

  .btn-secondary {
    background: #fff;
    border-color: #cbd5e1;
    color: #475569;
  }

  .btn-secondary:hover:not(:disabled) {
    background: #f1f5f9;
  }

  .btn-primary {
    background: #0369a1;
    color: #ffffff;
  }

  .btn-primary:hover:not(:disabled) {
    background: #0284c7;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .spinner {
    animation: rotate 1s linear infinite;
  }

  @keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @media (max-width: 768px) {
    .responsive-table thead {
      display: none;
    }
    .responsive-table tr {
      display: block;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      margin-bottom: 1rem;
      padding: 0.5rem;
      background: #f8fafc;
    }
    .responsive-table td {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0.75rem;
      border-bottom: 1px dashed #e2e8f0;
    }
    .responsive-table td:last-child {
      border-bottom: none;
    }
    .responsive-table td::before {
      content: attr(data-label);
      font-weight: 600;
      color: #64748b;
      font-size: 0.8rem;
    }
    .reason-text {
      max-width: 100%;
      text-align: right;
    }
  }
</style>