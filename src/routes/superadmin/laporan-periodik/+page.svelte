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
        <span class="alert-icon">⚠️</span>
        <div>
          <strong class="alert-title">Terdeteksi Perubahan Data Baru!</strong>
          <p class="alert-desc">Ada log mutasi barang atau aktivitas stock opname baru yang masuk setelah pembukuan ini dikunci. Data laporan PDF saat ini mungkin tidak akurat.</p>
        </div>
      </div>
      <form method="POST" action="?/unlockReport" use:enhance={() => { isUnlocking = true; return async ({ update }) => { await update(); isUnlocking = false; }; }}>
        <input type="hidden" name="month" value={month} />
        <input type="hidden" name="year" value={year} />
        <input type="hidden" name="weekOfMonth" value={week} />
        <button type="submit" class="btn btn-unlock-sync" disabled={isUnlocking}>
          {isUnlocking ? 'Membuka...' : 'Buka Kunci & Sinkronisasi Ulang'}
        </button>
      </form>
    </div>
  {/if}

  <div class="calendar-navigator card">
    <div class="month-controls">
      <button class="btn-nav" onclick={() => navigateMonth('prev')} aria-label="Bulan sebelumnya">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <span class="month-heading">{namaBulan[month - 1]} {year}</span>
      <button class="btn-nav" onclick={() => navigateMonth('next')} aria-label="Bulan berikutnya">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
      </button>
    </div>

    <div class="status-indicator">
      {#if data.savedReport && data.savedReport.status === 'COMPLETED'}
        {#if data.hasNewData}
          <span class="indicator-badge danger-badge">⚠️ Perlu Sinkronisasi</span>
        {:else}
          <span class="indicator-badge success">🔒 Terkunci & Disimpan</span>
        {/if}
      {:else}
        <span class="indicator-badge warning">📝 Status: Draft Laporan</span>
      {/if}
    </div>
  </div>

  <div class="metrics-grid">
    <div class="metric-card card-kuning">
      <div class="metric-icon">📋</div>
      <div class="metric-info">
        <div class="metric-value">{data.summary.totalAudits}</div>
        <div class="metric-label">Total Sesi Audit</div>
      </div>
    </div>
    <div class="metric-card card-hijau">
      <div class="metric-icon">➕</div>
      <div class="metric-info">
        <div class="metric-value">{data.summary.totalItemsAdded}</div>
        <div class="metric-label">Item Baru Ditambahkan</div>
      </div>
    </div>
    <div class="metric-card card-merah">
      <div class="metric-icon">🗑️</div>
      <div class="metric-info">
        <div class="metric-value">{data.summary.totalItemsDeleted}</div>
        <div class="metric-label">Item Dihapus (Soft-Delete)</div>
      </div>
    </div>
    <div class="metric-card card-biru">
      <div class="metric-icon">🔄</div>
      <div class="metric-info">
        <div class="metric-value">{data.summary.totalItemsRestored}</div>
        <div class="metric-label">Item Di-restore</div>
      </div>
    </div>
  </div>

  <div class="weeks-tabs">
    {#each [1, 2, 3, 4] as w}
      <button class="tab-week-item" class:active={week === w} onclick={() => navigateWeek(w)}>
        <span class="week-title">Minggu {w}</span>
        <span class="week-range">{data.weeksInMonth[w - 1] ? formatDate(data.weeksInMonth[w - 1].startDate) : '—'}</span>
      </button>
    {/each}
  </div>

  <div class="workspace-card">
    <div class="workspace-tabs-header">
      <button class="sub-tab" class:active={activeLogTab === 'audit'} onclick={() => activeLogTab = 'audit'}> Sesi Audit ({data.auditsInPeriod.length})</button>
      <button class="sub-tab" class:active={activeLogTab === 'added'} onclick={() => activeLogTab = 'added'}> Item Baru ({data.itemsAdded.length})</button>
      <button class="sub-tab" class:active={activeLogTab === 'deleted'} onclick={() => activeLogTab = 'deleted'}> Item Dihapus ({data.itemsDeleted.length})</button>
      <button class="sub-tab" class:active={activeLogTab === 'restored'} onclick={() => activeLogTab = 'restored'}> Pemulihan ({data.itemsRestored.length})</button>
      <button class="sub-tab" class:active={activeLogTab === 'cabinet'} onclick={() => activeLogTab = 'cabinet'}> Struktur Kabinet ({data.cabinetLogs.length})</button>
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
                    <td><span class="font-mono">{audit.id}</span></td>
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
                <tr><th>Nama Item Log</th><th>Aksi Layout</th><th>Lokasi Penempatan</th><th>Harga Satuan / Pokok</th><th>Petugas Pelaksana</th></tr>
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

  <div class="report-submission card">
     {#if data.savedReport && data.savedReport.status === 'COMPLETED'}
        <div class="download-pdf-banner">
           <div>
              <div class="banner-title">Pembukuan Terkunci & Sah</div>
              <p class="banner-subtitle">Data inventaris telah diarsipkan.</p>
              {#if data.savedReport.notes}
                <p class="table-para" style="margin-top: 0.5rem; font-style: italic;">" {data.savedReport.notes} "</p>
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
              <a href="/api/report/download" class="btn btn-download-pdf" download>Unduh Laporan PDF</a>
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
                 {isSaving ? 'Mengunci...' : 'Kunci & Simpan Pembukuan'}
              </button>
           </div>
        </form>
     {/if}
  </div>
</div>

<style>
  /* ─────────────────────────────────────────────────────────────────────────
     1. GLOBAL & LAYOUT CONTAINER
     ───────────────────────────────────────────────────────────────────────── */
  :global(body) {
    background-color: #f1f5f9;
    margin: 0;
    padding: 0;
  }

  .report-container {
    max-width: 1280px;
    margin: 2rem auto;
    padding: 0 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    color: #1e293b;
  }

  .card {
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.25rem;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
  }

  /* ALERT BOX UNTUK DATA SUSULAN */
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
    color: #78350f;
  }

  .alert-content {
    display: flex;
    gap: 0.75rem;
    align-items: flex-start;
  }

  .alert-icon { font-size: 1.25rem; margin-top: 0.1rem; }
  .alert-title { font-size: 0.95rem; font-weight: 700; }
  .alert-desc { margin: 0.15rem 0 0 0; font-size: 0.85rem; color: #92400e; line-height: 1.4; }

  .btn-unlock-sync {
    background-color: #d97706;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    white-space: nowrap;
    transition: background-color 0.2s;
  }
  .btn-unlock-sync:hover { background-color: #b45309; }

  .btn-text-link {
    background: transparent;
    border: none;
    color: #64748b;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    text-decoration: underline;
  }
  .btn-text-link:hover { color: #dc2626; }

  /* ─────────────────────────────────────────────────────────────────────────
     2. CALENDAR NAVIGATOR
     ───────────────────────────────────────────────────────────────────────── */
  .calendar-navigator {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #ffffff;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .month-controls { display: flex; align-items: center; gap: 1.25rem; }

  .btn-nav {
    background-color: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    width: 38px;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #475569;
    transition: all 0.2s ease;
  }
  .btn-nav:hover { background-color: #f8fafc; border-color: #94a3b8; }

  .month-heading { font-size: 1.25rem; font-weight: 700; min-width: 180px; text-align: center; }
  .indicator-badge { padding: 0.5rem 0.85rem; border-radius: 8px; font-size: 0.85rem; font-weight: 600; }
  .indicator-badge.success { background-color: #dcfce7; color: #14532d; border: 1px solid #bbf7d0; }
  .indicator-badge.warning { background-color: #fef3c7; color: #78350f; border: 1px solid #fde68a; }
  .danger-badge { background-color: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }

  /* ─────────────────────────────────────────────────────────────────────────
     3. METRICS GRID
     ───────────────────────────────────────────────────────────────────────── */
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1rem;
  }

  .metric-card {
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.25rem;
    display: flex;
    align-items: center;
    gap: 1.25rem;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
  }

  .metric-icon { font-size: 1.75rem; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 10px; }
  .metric-info { display: flex; flex-direction: column; gap: 0.15rem; }
  .metric-value { font-size: 1.5rem; font-weight: 700; color: #0f172a; line-height: 1; }
  .metric-label { font-size: 0.85rem; color: #64748b; font-weight: 500; }

  .card-kuning { border-left: 4px solid #eab308; } .card-kuning .metric-icon { background-color: #fef9c3; }
  .card-hijau { border-left: 4px solid #22c55e; } .card-hijau .metric-icon { background-color: #dcfce7; }
  .card-merah { border-left: 4px solid #ef4444; } .card-merah .metric-icon { background-color: #fee2e2; }
  .card-biru { border-left: 4px solid #3b82f6; } .card-biru .metric-icon { background-color: #dbeafe; }

  /* ─────────────────────────────────────────────────────────────────────────
     4. WEEKS TABS
     ───────────────────────────────────────────────────────────────────────── */
  .weeks-tabs {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
    background-color: #e2e8f0;
    padding: 0.35rem;
    border-radius: 12px;
  }

  .tab-week-item {
    background: transparent;
    border: none;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    transition: all 0.2s ease;
  }

  .tab-week-item.active { background-color: #ffffff; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1); }
  .tab-week-item.active .week-title { color: #0284c7; }
  .week-title { font-weight: 700; font-size: 0.9rem; color: #334155; }
  .week-range { font-size: 0.75rem; color: #64748b; }

  /* ─────────────────────────────────────────────────────────────────────────
     5. WORKSPACE & SUB-TABS
     ───────────────────────────────────────────────────────────────────────── */
  .workspace-card { background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
  .workspace-tabs-header { display: flex; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; overflow-x: auto; }

  .sub-tab {
    background: transparent;
    border: none;
    padding: 1rem 1.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: #64748b;
    cursor: pointer;
    white-space: nowrap;
    border-bottom: 2px solid transparent;
  }
  .sub-tab.active { color: #0284c7; background-color: #ffffff; border-bottom: 2px solid #0284c7; }
  .workspace-tab-body { padding: 1.5rem; }
  .empty-panel { padding: 4rem 2rem; text-align: center; color: #94a3b8; font-size: 0.95rem; }

  /* ─────────────────────────────────────────────────────────────────────────
     6. TABLES DESIGN
     ───────────────────────────────────────────────────────────────────────── */
  .table-responsive { width: 100%; overflow-x: auto; border-radius: 8px; border: 1px solid #edf2f7; }
  table { width: 100%; border-collapse: collapse; font-size: 0.875rem; text-align: left; }
  th { background-color: #f8fafc; color: #475569; padding: 0.85rem 1rem; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
  td { padding: 1rem; border-bottom: 1px solid #edf2f7; color: #334155; }
  tr:hover td { background-color: #f8fafc; }

  .primary-text { font-weight: 600; color: #0f172a; }
  .sub-text { font-size: 0.75rem; color: #64748b; }
  .font-mono { font-family: monospace; font-size: 0.8rem; }
  .text-strike { text-decoration: line-through; color: #94a3b8; }
  .table-para { margin: 0; max-width: 320px; color: #475569; font-size: 0.85rem; line-height: 1.4; }
  
  .pricing { display: flex; flex-direction: column; }
  .pricing .price { color: #16a34a; font-weight: 600; }
  .pricing .cost { color: #dc2626; }

  /* ─────────────────────────────────────────────────────────────────────────
     7. BADGES & PILLS
     ───────────────────────────────────────────────────────────────────────── */
  .badge { padding: 0.25rem 0.5rem; border-radius: 6px; font-size: 0.75rem; font-weight: 700; }
  .badge-hijau { background-color: #dcfce7; color: #15803d; }
  .badge-merah { background-color: #fee2e2; color: #b91c1c; }
  .badge-kuning { background-color: #fef3c7; color: #a16207; }
  .badge-outline { padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.75rem; border: 1px solid #cbd5e1; color: #475569; }
  .user-pill { background-color: #f1f5f9; padding: 0.25rem 0.5rem; border-radius: 20px; font-size: 0.8rem; }
  .role-tag { font-size: 0.7rem; background-color: #e2e8f0; padding: 0.05rem 0.25rem; border-radius: 4px; }

  /* ─────────────────────────────────────────────────────────────────────────
     8. BOTTOM BANNER & FORM
     ───────────────────────────────────────────────────────────────────────── */
  .submission-layout { display: flex; flex-direction: column; gap: 1.25rem; }
  .input-container { display: flex; flex-direction: column; gap: 0.5rem; }
  .input-container label { font-size: 0.9rem; font-weight: 600; }
  .input-container textarea { width: 100%; padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 8px; }

  .btn { padding: 0.65rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; }
  .btn-submit-report { align-self: flex-end; background-color: #16a34a; color: white; }
  .btn-submit-report:disabled { background-color: #94a3b8; }
  
  .download-pdf-banner { display: flex; justify-content: space-between; align-items: center; background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 1.25rem; border-radius: 8px; }
  .action-locked-group { display: flex; align-items: center; gap: 1.5rem; }
  .banner-title { font-weight: 700; color: #14532d; }
  .banner-subtitle { margin: 0.25rem 0 0 0; font-size: 0.875rem; color: #166534; }
  .btn-download-pdf { background-color: #166534; color: white; text-decoration: none; padding: 0.65rem 1.5rem; border-radius: 8px; }

  /* ─────────────────────────────────────────────────────────────────────────
     9. RESPONSIVE MEDIA QUERIES
     ───────────────────────────────────────────────────────────────────────── */
  @media (max-width: 768px) {
    .calendar-navigator, .alert-banner, .download-pdf-banner { flex-direction: column; align-items: stretch; }
    .weeks-tabs { grid-template-columns: repeat(2, 1fr); }
    .btn-submit-report, .btn-unlock-sync, .btn-download-pdf { width: 100%; text-align: center; }
    .action-locked-group { flex-direction: column-reverse; gap: 0.75rem; }
  }
</style>