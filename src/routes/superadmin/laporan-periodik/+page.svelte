<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';

  let { data } = $props();

  let isSaving = $state(false);
  let isUnlocking = $state(false);
  let activeLogTab = $state('audit'); 

  let month = $derived(data.period.month);
  let year = $derived(data.period.year);
  let week = $derived(data.period.weekOfMonth);

  const namaBulan = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  function navigateMonth(direction: 'prev' | 'next') {
    let nextMonth = month + (direction === 'prev' ? -1 : 1);
    let nextYear = year;
    if (nextMonth < 1) { nextMonth = 12; nextYear -= 1; }
    else if (nextMonth > 12) { nextMonth = 1; nextYear += 1; }
    goto(`?month=${nextMonth}&year=${nextYear}&week=1`);
  }

  function navigateWeek(weekNum: number) {
    goto(`?month=${month}&year=${year}&week=${weekNum}`);
  }

  function formatRupiah(amount: number | null | undefined) {
    if (!amount) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  }

  function formatDate(date: Date | string) {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function formatDateTime(date: Date | string) {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
</script>

<div class="report-container">
  
  {#if data.savedReport && data.savedReport.status === 'COMPLETED' && data.hasNewData}
    <div class="alert-banner warning-box">
      <div class="alert-content">
        <svg class="alert-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <div>
          <strong class="alert-title">Terdeteksi Perubahan Data Baru!</strong>
          <p class="alert-desc">Ada log mutasi barang atau aktivitas stock opname baru yang masuk setelah pembukuan ini dikunci. Data laporan PDF saat ini mungkin tidak akurat.</p>
        </div>
      </div>
      <form method="POST" action="?/unlockReport" use:enhance={() => { isUnlocking = true; return async ({ update }) => { await update(); isUnlocking = false; }; }}>
        <input type="hidden" name="month" value={month} />
        <input type="hidden" name="year" value={year} />
        <input type="hidden" name="weekOfMonth" value={week} />
        <button type="submit" class="btn-unlock-sync" disabled={isUnlocking}>
          {isUnlocking ? 'Membuka...' : 'Buka Kunci & Sinkronisasi Ulang'}
        </button>
      </form>
    </div>
  {/if}

  <!-- Calendar Navigator -->
  <div class="calendar-navigator card">
    <div class="month-controls">
      <button class="btn-nav" onclick={() => navigateMonth('prev')} aria-label="Bulan sebelumnya">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m15 18-6-6 6-6"/>
        </svg>
      </button>
      <span class="month-heading">{namaBulan[month - 1]} {year}</span>
      <button class="btn-nav" onclick={() => navigateMonth('next')} aria-label="Bulan berikutnya">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m9 18 6-6-6-6"/>
        </svg>
      </button>
    </div>

    <div class="status-indicator">
      {#if data.savedReport && data.savedReport.status === 'COMPLETED'}
        {#if data.hasNewData}
          <span class="indicator-badge danger-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            </svg>
            Perlu Sinkronisasi
          </span>
        {:else}
          <span class="indicator-badge success">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20z"/>
              <path d="M12 6v6l4 2"/>
            </svg>
            Terkunci & Disimpan
          </span>
        {/if}
      {:else}
        <span class="indicator-badge warning">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          Status: Draft Laporan
        </span>
      {/if}
    </div>
  </div>

  <!-- Metrics Grid -->
  <div class="metrics-grid">
    <div class="metric-card card-kuning">
      <div class="metric-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
      </div>
      <div class="metric-info">
        <div class="metric-value">{data.summary.totalAudits}</div>
        <div class="metric-label">Total Sesi Audit</div>
      </div>
    </div>
    <div class="metric-card card-hijau">
      <div class="metric-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </div>
      <div class="metric-info">
        <div class="metric-value">{data.summary.totalItemsAdded}</div>
        <div class="metric-label">Item Baru Ditambahkan</div>
      </div>
    </div>
    <div class="metric-card card-merah">
      <div class="metric-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
      </div>
      <div class="metric-info">
        <div class="metric-value">{data.summary.totalItemsDeleted}</div>
        <div class="metric-label">Item Dihapus</div>
      </div>
    </div>
    <div class="metric-card card-biru">
      <div class="metric-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0z"/>
          <polyline points="12 8 12 12 14 14"/>
        </svg>
      </div>
      <div class="metric-info">
        <div class="metric-value">{data.summary.totalItemsRestored}</div>
        <div class="metric-label">Item Di-restore</div>
      </div>
    </div>
  </div>

  <!-- Weeks Tabs -->
  <div class="weeks-tabs">
    {#each [1, 2, 3, 4] as w}
      <button class="tab-week-item" class:active={week === w} onclick={() => navigateWeek(w)}>
        <span class="week-title">Minggu {w}</span>
        <span class="week-range">{data.weeksInMonth[w - 1] ? formatDate(data.weeksInMonth[w - 1].startDate) : '—'}</span>
      </button>
    {/each}
  </div>

  <!-- Workspace Card -->
  <div class="workspace-card">
    <div class="workspace-tabs-header">
      <button class="sub-tab" class:active={activeLogTab === 'audit'} onclick={() => activeLogTab = 'audit'}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
        Sesi Audit ({data.auditsInPeriod.length})
      </button>
      <button class="sub-tab" class:active={activeLogTab === 'added'} onclick={() => activeLogTab = 'added'}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Item Baru ({data.itemsAdded.length})
      </button>
      <button class="sub-tab" class:active={activeLogTab === 'deleted'} onclick={() => activeLogTab = 'deleted'}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
        Item Dihapus ({data.itemsDeleted.length})
      </button>
      <button class="sub-tab" class:active={activeLogTab === 'restored'} onclick={() => activeLogTab = 'restored'}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0z"/>
          <polyline points="12 8 12 12 14 14"/>
        </svg>
        Pemulihan ({data.itemsRestored.length})
      </button>
      <button class="sub-tab" class:active={activeLogTab === 'cabinet'} onclick={() => activeLogTab = 'cabinet'}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="21 8 21 21 3 21 3 8"/>
          <rect x="1" y="3" width="22" height="5"/>
        </svg>
        Struktur Kabinet ({data.cabinetLogs.length})
      </button>
    </div>

    <div class="workspace-tab-body">
      {#if activeLogTab === 'audit'}
        {#if data.auditsInPeriod.length === 0}
          <div class="empty-panel">Tidak ada riwayat audit minggu ini.</div>
        {:else}
          <div class="table-responsive">
            <table>
              <thead>
                <tr><th>ID</th><th>Waktu</th><th>Lokasi Fisik</th><th>Auditor</th><th>Status</th></tr>
              </thead>
              <tbody>
                {#each data.auditsInPeriod as audit, i (i)}
                  <tr>
                    <td><span class="font-mono">#{audit.id}</span></td>
                    <td>{formatDateTime(audit.createdAt)}</td>
                    <td>
                      <div class="primary-text">{audit.section?.name || 'Section Terhapus'}</div>
                      {#if audit.section?.cabinet}
                        <div class="sub-text">Kabinet: {audit.section.cabinet.name}</div>
                      {/if}
                    </td>
                    <td><span class="user-pill">{audit.auditor?.name || 'Sistem'}</span></td>
                    <td><span class="badge {audit.status === 'COMPLETED' ? 'badge-hijau' : 'badge-kuning'}">{audit.status}</span></td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}

      {:else if activeLogTab === 'added'}
        {#if data.itemsAdded.length === 0}
          <div class="empty-panel">Tidak ada barang baru yang masuk minggu ini.</div>
        {:else}
          <div class="table-responsive">
            <table>
              <thead>
                <tr><th>Nama Item</th><th>Aksi</th><th>Lokasi Penempatan</th><th>Harga Satuan / Pokok</th><th>Petugas Pelaksana</th></tr>
              </thead>
              <tbody>
                {#each data.itemsAdded as log, i (i)}
                  <tr>
                    <td>
                      <div class="primary-text">{log.item?.name || 'Item Baru'}</div>
                      {#if log.item?.serialNumber}<div class="sub-text font-mono">SN: {log.item.serialNumber}</div>{/if}
                    </td>
                    <td><span class="badge badge-hijau">{log.action}</span></td>
                    <td>
                      <div class="primary-text">{log.item?.location || '-'}</div>
                      <div class="sub-text">Kategori: {log.item?.category || '-'}</div>
                    </td>
                    <td>
                      <div class="pricing">
                        <span class="price">{formatRupiah(log.item?.price?.amount)}</span>
                        <span class="cost text-small">{formatRupiah(log.item?.costPrice?.amount)} (modal)</span>
                      </div>
                    </td>
                    <td>
                      <div class="primary-text">{log.user?.name || 'Staff'}</div>
                      <div class="sub-text"><span class="role-tag">{log.user?.role || ''}</span></div>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}

      {:else if activeLogTab === 'deleted'}
        {#if data.itemsDeleted.length === 0}
          <div class="empty-panel">Bersih. Tidak ada penghapusan item pada minggu ini.</div>
        {:else}
          <div class="table-responsive">
            <table>
              <thead>
                <tr><th>Nama Barang</th><th>Status Log</th><th>Alasan Hapus</th><th>Eksekutor & Waktu</th></tr>
              </thead>
              <tbody>
                {#each data.itemsDeleted as history, i (i)}
                  <tr>
                    <td><div class="primary-text text-strike">{history.item?.name || 'Item Terhapus Sistem'}</div></td>
                    <td><span class="badge badge-merah">{history.action}</span></td>
                    <td><p class="table-para">{history.item?.deleteReason || 'Tanpa keterangan'}</p></td>
                    <td>
                      <div class="primary-text">{history.user?.name || 'Admin'}</div>
                      <div class="sub-text">{formatDateTime(history.createdAt)}</div>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}

      {:else if activeLogTab === 'restored'}
        {#if data.itemsRestored.length === 0}
          <div class="empty-panel">Tidak ada pemulihan (restore) item pada minggu ini.</div>
        {:else}
          <div class="table-responsive">
            <table>
              <thead>
                <tr><th>Nama Barang</th><th>Riwayat Aksi</th><th>Catatan Evaluasi</th><th>Penanggung Jawab / Waktu</th></tr>
              </thead>
              <tbody>
                {#each data.itemsRestored as history, i (i)}
                  <tr>
                    <td><div class="primary-text">{history.item?.name || 'Item Berhasil Pulih'}</div></td>
                    <td><span class="badge badge-hijau">RESTORED</span></td>
                    <td><p class="table-para">{history.note || 'Stok dikembalikan ke posisi semula'}</p></td>
                    <td>
                      <div class="primary-text">{history.user?.name || 'Admin'}</div>
                      <div class="sub-text">{formatDateTime(history.createdAt)}</div>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}

      {:else if activeLogTab === 'cabinet'}
        {#if data.cabinetLogs.length === 0}
          <div class="empty-panel">Struktur layout fisik kabinet stabil minggu ini.</div>
        {:else}
          <div class="table-responsive">
            <table>
              <thead>
                <tr><th>Waktu</th><th>Jenis Perubahan</th><th>Objek Target</th><th>Catatan</th><th>Pelaksana</th></tr>
              </thead>
              <tbody>
                {#each data.cabinetLogs as log, i (i)}
                  <tr>
                    <td class="font-mono text-small">{formatDateTime(log.createdAt)}</td>
                    <td><span class="badge-outline">{log.action}</span></td>
                    <td>
                      <div class="entity-details">
                        {#if log.cabinetName}<div>Kabinet: <strong>{log.cabinetName}</strong></div>{/if}
                        {#if log.sectionName}<div>Section: <strong>{log.sectionName}</strong></div>{/if}
                      </div>
                    </td>
                    <td><p class="table-para">{log.note || '-'}</p></td>
                    <td>
                      <div class="primary-text">{log.performedBy?.name || 'Admin'}</div>
                      <div class="sub-text"><span class="role-tag">{log.performedBy?.role || ''}</span></div>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      {/if}
    </div>
  </div>

  <!-- Report Submission -->
  <div class="report-submission card">
     {#if data.savedReport && data.savedReport.status === 'COMPLETED'}
        <div class="download-pdf-banner">
           <div>
              <div class="banner-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20z"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
                Pembukuan Terkunci & Sah
              </div>
              <p class="banner-subtitle">Data inventaris telah diarsipkan.</p>
              {#if data.savedReport.notes}
                <p class="table-para" style="margin-top: 0.5rem; font-style: italic;">"{data.savedReport.notes}"</p>
              {/if}
           </div>
           <div class="action-locked-group">
              {#if !data.hasNewData}
                <form method="POST" action="?/unlockReport" use:enhance={() => { isUnlocking = true; return async ({ update }) => { await update(); isUnlocking = false; }; }}>
                   <input type="hidden" name="month" value={month} />
                   <input type="hidden" name="year" value={year} />
                   <input type="hidden" name="weekOfMonth" value={week} />
                   <button type="submit" class="btn-text-link" disabled={isUnlocking}>Buka Kunci Manual</button>
                </form>
              {/if}
              <button 
                  onclick={() => window.open(`/api/report/export-pdf?month=${month}&year=${year}&week=${week}`, '_blank')} 
                  class="btn btn-download-pdf">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Unduh Laporan PDF
              </button>
           </div>
        </div>
     {:else}
        <form method="POST" action="?/saveReport" use:enhance={() => { isSaving = true; return async ({ update }) => { await update(); isSaving = false; }; }}>
           <input type="hidden" name="month" value={month} />
           <input type="hidden" name="year" value={year} />
           <input type="hidden" name="weekOfMonth" value={week} />
           <div class="submission-layout">
              <div class="input-container">
                 <label for="notes">Catatan Tambahan Evaluasi Super Admin</label>
                 <textarea id="notes" name="notes" rows="3" placeholder="Tulis kesimpulan stok opname..."></textarea>
              </div>
              <button type="submit" class="btn btn-submit-report" disabled={isSaving}>
                 {#if isSaving}
                    <span class="spinner"></span>
                    <span>Mengunci...</span>
                 {:else}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                      <polyline points="17 21 17 13 7 13 7 21"/>
                      <polyline points="7 3 7 8 15 8"/>
                    </svg>
                    <span>Kunci & Simpan Pembukuan</span>
                 {/if}
              </button>
           </div>
        </form>
     {/if}
  </div>
</div>

<style>
  /* Reset */
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :global(body) {
    background-color: #ffffff;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  }

  .report-container {
    max-width: 1280px;
    margin: 0 auto;
    padding: 2rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    color: #1e293b;
  }

  /* Card */
  .card {
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.25rem;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  }

  /* Alert Banner */
  .alert-banner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.25rem;
    border-radius: 12px;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .warning-box {
    background-color: #fffbeb;
    border: 1px solid #fde68a;
  }

  .alert-content {
    display: flex;
    gap: 0.75rem;
    align-items: flex-start;
  }

  .alert-icon {
    flex-shrink: 0;
    color: #d97706;
  }

  .alert-title {
    font-size: 0.9rem;
    font-weight: 600;
    color: #78350f;
  }

  .alert-desc {
    margin: 0.15rem 0 0 0;
    font-size: 0.85rem;
    color: #92400e;
    line-height: 1.4;
  }

  .btn-unlock-sync {
    background-color: #d97706;
    color: white;
    border: none;
    padding: 0.5rem 1.25rem;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    white-space: nowrap;
    transition: background-color 0.2s;
  }

  .btn-unlock-sync:hover:not(:disabled) {
    background-color: #b45309;
  }

  .btn-unlock-sync:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Calendar Navigator */
  .calendar-navigator {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .month-controls {
    display: flex;
    align-items: center;
    gap: 1.25rem;
  }

  .btn-nav {
    background-color: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #475569;
    transition: all 0.2s;
  }

  .btn-nav:hover {
    background-color: #f8fafc;
    border-color: #94a3b8;
  }

  .month-heading {
    font-size: 1.25rem;
    font-weight: 600;
    min-width: 160px;
    text-align: center;
    color: #0f172a;
  }

  .status-indicator {
    display: flex;
    gap: 0.5rem;
  }

  .indicator-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.85rem;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 500;
  }

  .indicator-badge.success {
    background-color: #f0fdf4;
    color: #166534;
    border: 1px solid #bbf7d0;
  }

  .indicator-badge.warning {
    background-color: #fef3c7;
    color: #78350f;
    border: 1px solid #fde68a;
  }

  .danger-badge {
    background-color: #fef2f2;
    color: #991b1b;
    border: 1px solid #fecaca;
  }

  /* Metrics Grid */
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
  }

  @media (max-width: 900px) {
    .metrics-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 500px) {
    .metrics-grid {
      grid-template-columns: 1fr;
    }
  }

  .metric-card {
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 1rem 1.25rem;
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .metric-icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
  }

  .metric-info {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .metric-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #0f172a;
    line-height: 1;
  }

  .metric-label {
    font-size: 0.8rem;
    color: #64748b;
    font-weight: 500;
  }

  .card-kuning { border-left: 3px solid #eab308; }
  .card-kuning .metric-icon { background-color: #fef9c3; color: #ca8a04; }

  .card-hijau { border-left: 3px solid #22c55e; }
  .card-hijau .metric-icon { background-color: #dcfce7; color: #16a34a; }

  .card-merah { border-left: 3px solid #ef4444; }
  .card-merah .metric-icon { background-color: #fee2e2; color: #dc2626; }

  .card-biru { border-left: 3px solid #3b82f6; }
  .card-biru .metric-icon { background-color: #dbeafe; color: #2563eb; }

  /* Weeks Tabs */
  .weeks-tabs {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
    background-color: #f1f5f9;
    padding: 0.35rem;
    border-radius: 12px;
  }

  .tab-week-item {
    background: transparent;
    border: none;
    padding: 0.7rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    transition: all 0.2s;
  }

  .tab-week-item:hover {
    background-color: rgba(255, 255, 255, 0.5);
  }

  .tab-week-item.active {
    background-color: #ffffff;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  }

  .tab-week-item.active .week-title {
    color: #0284c7;
  }

  .week-title {
    font-weight: 600;
    font-size: 0.85rem;
    color: #334155;
  }

  .week-range {
    font-size: 0.7rem;
    color: #64748b;
    margin-top: 0.2rem;
  }

  /* Workspace Card */
  .workspace-card {
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    overflow: hidden;
  }

  .workspace-tabs-header {
    display: flex;
    background-color: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    overflow-x: auto;
    gap: 0.25rem;
    padding: 0 0.5rem;
  }

  .sub-tab {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: transparent;
    border: none;
    padding: 0.85rem 1.25rem;
    font-size: 0.8rem;
    font-weight: 500;
    color: #64748b;
    cursor: pointer;
    white-space: nowrap;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
  }

  .sub-tab:hover {
    color: #0f172a;
  }

  .sub-tab.active {
    color: #0284c7;
    background-color: #ffffff;
    border-bottom-color: #0284c7;
  }

  .workspace-tab-body {
    padding: 1.5rem;
  }

  .empty-panel {
    padding: 3rem 2rem;
    text-align: center;
    color: #94a3b8;
    font-size: 0.9rem;
  }

  /* Tables */
  .table-responsive {
    width: 100%;
    overflow-x: auto;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
  }

  th {
    background-color: #f8fafc;
    color: #475569;
    padding: 0.85rem 1rem;
    font-weight: 600;
    border-bottom: 1px solid #e2e8f0;
    text-align: left;
  }

  td {
    padding: 1rem;
    border-bottom: 1px solid #f1f5f9;
    color: #334155;
  }

  tr:hover td {
    background-color: #fafafa;
  }

  .primary-text {
    font-weight: 600;
    color: #0f172a;
  }

  .sub-text {
    font-size: 0.7rem;
    color: #64748b;
    margin-top: 0.2rem;
  }

  .font-mono {
    font-family: 'SF Mono', Monaco, monospace;
    font-size: 0.75rem;
  }

  .text-strike {
    text-decoration: line-through;
    color: #94a3b8;
  }

  .table-para {
    margin: 0;
    max-width: 280px;
    color: #475569;
    font-size: 0.8rem;
    line-height: 1.4;
  }

  .pricing {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .pricing .price {
    color: #16a34a;
    font-weight: 600;
  }

  .pricing .cost {
    color: #dc2626;
    font-size: 0.7rem;
  }

  /* Badges */
  .badge {
    display: inline-block;
    padding: 0.2rem 0.6rem;
    border-radius: 6px;
    font-size: 0.7rem;
    font-weight: 600;
  }

  .badge-hijau {
    background-color: #dcfce7;
    color: #15803d;
  }

  .badge-merah {
    background-color: #fee2e2;
    color: #b91c1c;
  }

  .badge-kuning {
    background-color: #fef3c7;
    color: #a16207;
  }

  .badge-outline {
    display: inline-block;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    font-size: 0.7rem;
    border: 1px solid #cbd5e1;
    color: #475569;
    background-color: #ffffff;
  }

  .user-pill {
    background-color: #f1f5f9;
    padding: 0.2rem 0.6rem;
    border-radius: 20px;
    font-size: 0.75rem;
    display: inline-block;
  }

  .role-tag {
    font-size: 0.65rem;
    background-color: #e2e8f0;
    padding: 0.1rem 0.35rem;
    border-radius: 4px;
  }

  /* Report Submission */
  .report-submission {
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.25rem;
  }

  .submission-layout {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .input-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .input-container label {
    font-size: 0.85rem;
    font-weight: 600;
    color: #334155;
  }

  .input-container textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font-family: inherit;
    font-size: 0.85rem;
    resize: vertical;
    transition: border-color 0.2s;
  }

  .input-container textarea:focus {
    outline: none;
    border-color: #10b981;
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1);
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.65rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
  }

  .btn-submit-report {
    align-self: flex-end;
    background-color: #16a34a;
    color: white;
  }

  .btn-submit-report:hover:not(:disabled) {
    background-color: #15803d;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(22, 163, 74, 0.2);
  }

  .btn-submit-report:disabled {
    background-color: #94a3b8;
    cursor: not-allowed;
  }

  .download-pdf-banner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #f0fdf4;
    border: 1px solid #bbf7d0;
    padding: 1rem 1.25rem;
    border-radius: 10px;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .banner-title {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 700;
    color: #14532d;
    font-size: 0.9rem;
  }

  .banner-subtitle {
    margin: 0.25rem 0 0 0;
    font-size: 0.8rem;
    color: #166534;
  }

  .action-locked-group {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .btn-text-link {
    background: transparent;
    border: none;
    color: #64748b;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    text-decoration: underline;
    padding: 0.5rem;
  }

  .btn-text-link:hover:not(:disabled) {
    color: #dc2626;
  }

  .btn-download-pdf {
    background-color: #166534;
    color: white;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  .btn-download-pdf:hover {
    background-color: #14532d;
  }

  /* Spinner */
  .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
    display: inline-block;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Responsive */
  @media (max-width: 768px) {
    .report-container {
      padding: 1rem;
    }

    .calendar-navigator,
    .alert-banner,
    .download-pdf-banner {
      flex-direction: column;
      align-items: stretch;
    }

    .weeks-tabs {
      grid-template-columns: repeat(2, 1fr);
    }

    .btn-submit-report,
    .btn-unlock-sync,
    .btn-download-pdf {
      width: 100%;
      text-align: center;
    }

    .action-locked-group {
      flex-direction: column-reverse;
      gap: 0.75rem;
    }

    .workspace-tabs-header {
      padding: 0;
    }

    .sub-tab {
      padding: 0.75rem 1rem;
    }
  }
</style>