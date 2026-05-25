<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';

  // Svelte 5 Runes Mode untuk menangkap data dari server
  let { data } = $props();

  // State internal untuk UI interaktif
  let isSaving = $state(false);
  let activeLogTab = $state('audit'); // 'audit' | 'added' | 'deleted' | 'restored' | 'cabinet'

  // Properti reaktif turunan
  let month = $derived(data.period.month);
  let year = $derived(data.period.year);
  let week = $derived(data.period.weekOfMonth);

  const namaBulan = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Fungsi navigasi kalender bulanan
  function navigateMonth(direction: 'prev' | 'next') {
    let nextMonth = month + (direction === 'prev' ? -1 : 1);
    let nextYear = year;

    if (nextMonth < 1) {
      nextMonth = 12;
      nextYear -= 1;
    } else if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    goto(`?month=${nextMonth}&year=${nextYear}&week=1`);
  }

  // Fungsi navigasi minggu
  function navigateWeek(weekNum: number) {
    goto(`?month=${month}&year=${year}&week=${weekNum}`);
  }

  // Format IDR Rupiah sesuai panduan
  function formatRupiah(amount: number | null | undefined) {
    if (amount === null || amount === undefined) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  }

  // Format Waktu & Tanggal Indonesia sesuai panduan
  function formatDate(date: Date | string) {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  }

  function formatDateTime(date: Date | string) {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit'
    });
  }
</script>

<div class="report-container">
  <div class="calendar-navigator card">
    <div class="month-controls">
      <button class="btn-nav" onclick={() => navigateMonth('prev')} aria-label="Bulan sebelumnya">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <span class="month-heading">{namaBulan[month - 1]} {year}</span>
      <button class="btn-nav" onclick={() => navigateMonth('next')} aria-label="Bulan berikutnya">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
      </button>
    </div>

    <div class="status-indicator">
      {#if data.savedReport}
        <span class="indicator-badge success">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px; vertical-align: -2px;"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Terkunci & Disimpan ({data.savedReport.status})
        </span>
      {:else}
        <span class="indicator-badge warning">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px; vertical-align: -2px;"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg> Status: Draft Laporan
        </span>
      {/if}
    </div>
  </div>

  <div class="metrics-grid">
    <div class="metric-card card-kuning">
      <div class="metric-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/></svg>
      </div>
      <div class="metric-info">
        <div class="metric-value">{data.summary.totalAudits}</div>
        <div class="metric-label">Total Kegiatan Audit</div>
      </div>
    </div>
    <div class="metric-card card-hijau">
      <div class="metric-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
      </div>
      <div class="metric-info">
        <div class="metric-value">{data.summary.totalItemsAdded}</div>
        <div class="metric-label">Item Baru Ditambahkan</div>
      </div>
    </div>
    <div class="metric-card card-merah">
      <div class="metric-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
      </div>
      <div class="metric-info">
        <div class="metric-value">{data.summary.totalItemsDeleted}</div>
        <div class="metric-label">Item Dihapus (Soft-Delete)</div>
      </div>
    </div>
    <div class="metric-card card-biru">
      <div class="metric-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
      </div>
      <div class="metric-info">
        <div class="metric-value">{data.summary.totalItemsRestored}</div>
        <div class="metric-label">Item Berhasil Di-restore</div>
      </div>
    </div>
  </div>

  <div class="weeks-tabs">
    {#each [1, 2, 3, 4] as w}
      <button 
        class="tab-week-item" 
        class:active={week === w}
        onclick={() => navigateWeek(w)}
      >
        <span class="week-title">Minggu {w}</span>
        <span class="week-range">
          {data.weeksInMonth[w - 1] ? formatDate(data.weeksInMonth[w - 1].startDate) : '—'}
        </span>
      </button>
    {/each}
  </div>

  <div class="workspace-card">
    <div class="workspace-tabs-header">
      <button class="sub-tab" class:active={activeLogTab === 'audit'} onclick={() => activeLogTab = 'audit'}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg> Sesi Audit ({data.auditsInPeriod.length})
      </button>
      <button class="sub-tab" class:active={activeLogTab === 'added'} onclick={() => activeLogTab = 'added'}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg> Item Baru ({data.itemsAdded.length})
      </button>
      <button class="sub-tab" class:active={activeLogTab === 'deleted'} onclick={() => activeLogTab = 'deleted'}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/></svg> Item Dihapus ({data.itemsDeleted.length})
      </button>
      <button class="sub-tab" class:active={activeLogTab === 'restored'} onclick={() => activeLogTab = 'restored'}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg> Pemulihan ({data.itemsRestored.length})
      </button>
      <button class="sub-tab" class:active={activeLogTab === 'cabinet'} onclick={() => activeLogTab = 'cabinet'}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg> Struktur Kabinet ({data.cabinetLogs.length})
      </button>
    </div>

    <div class="workspace-tab-body">
      {#if activeLogTab === 'audit'}
        {#if data.auditsInPeriod.length === 0}
          <div class="empty-panel">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><path d="m10 11 5 5"/><path d="m15 11-5 5"/></svg>
            Tidak ada riwayat stock opname / audit minggu ini.
          </div>
        {:else}
          <div class="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Sesi Audit ID</th>
                  <th>Waktu Log</th>
                  <th>Rak / Kabinet Terkait</th>
                  <th>Auditor Lapangan</th>
                  <th>Status Kegiatan</th>
                </tr>
              </thead>
              <tbody>
                {#each data.auditsInPeriod as audit (audit.id)}
                  <tr>
                    <td><span class="font-mono">{audit.id}</span></td>
                    <td>{formatDateTime(audit.createdAt)}</td>
                    <td>
                      <div class="primary-text">{audit.section.name}</div>
                      {#if audit.section.cabinet}
                        <div class="sub-text">Kabinet: {audit.section.cabinet.name}</div>
                      {/if}
                    </td>
                    <td>
                      <span class="user-pill">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        {audit.auditor.name}
                      </span>
                    </td>
                    <td>
                      <span class="badge {audit.status === 'COMPLETED' ? 'badge-hijau' : 'badge-kuning'}">
                        {audit.status}
                      </span>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}

      {:else if activeLogTab === 'added'}
        {#if data.itemsAdded.length === 0}
          <div class="empty-panel">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
            Tidak ada barang baru yang masuk minggu ini.
          </div>
        {:else}
          <div class="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Nama Item Inventaris</th>
                  <th>Kategori</th>
                  <th>Lokasi Gudang / Rak</th>
                  <th>Nilai Nominal</th>
                  <th>Petugas Input & Waktu</th>
                </tr>
              </thead>
              <tbody>
                {#each data.itemsAdded as log (log.id)}
                  <tr>
                    <td>
                      <div class="primary-text">{log.item.name}</div>
                      {#if log.item.serialNumber}
                        <div class="sub-text"><span class="mini-pill">SN: {log.item.serialNumber}</span></div>
                      {/if}
                    </td>
                    <td><span class="mini-pill">{log.item.category}</span></td>
                    <td>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray" style="vertical-align: -2px; margin-right: 2px;"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                      {log.item.location}
                    </td>
                    <td>
                      <div class="pricing">
                        <div>Beli: <span class="cost">{formatRupiah(log.item.costPrice?.amount)}</span></div>
                        <div>Jual: <span class="price">{formatRupiah(log.item.price?.amount)}</span></div>
                      </div>
                    </td>
                    <td>
                      <div class="primary-text">{log.user.name}</div>
                      <div class="sub-text">{formatDateTime(log.createdAt)} <span class="role-tag">{log.user.role}</span></div>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}

      {:else if activeLogTab === 'deleted'}
        {#if data.itemsDeleted.length === 0}
          <div class="empty-panel">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            Bersih. Tidak ada penghapusan item pada minggu ini.
          </div>
        {:else}
          <div class="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Nama Barang</th>
                  <th>Tipe Log</th>
                  <th>Lokasi Asal</th>
                  <th>Alasan / Keterangan Hapus</th>
                  <th>Eksekutor / Waktu</th>
                </tr>
              </thead>
              <tbody>
                {#each data.itemsDeleted as log (log.id)}
                  <tr>
                    <td><div class="primary-text text-strike">{log.item.name}</div></td>
                    <td><span class="badge badge-merah">{log.action}</span></td>
                    <td>
                      <div class="sub-text">
                        Rak: {log.item.deletedFromSectionName || '-'} 
                        {#if log.item.deletedFromCabinetName} | Kabinet: {log.item.deletedFromCabinetName}{/if}
                      </div>
                    </td>
                    <td><p class="table-para">{log.item.deleteReason}</p></td>
                    <td>
                      <div class="primary-text">{log.user.name}</div>
                      <div class="sub-text">{formatDateTime(log.createdAt)}</div>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}

      {:else if activeLogTab === 'restored'}
        {#if data.itemsRestored.length === 0}
          <div class="empty-panel">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            Tidak ada pemulihan (restore) item pada minggu ini.
          </div>
        {:else}
          <div class="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Nama Barang</th>
                  <th>Tujuan Lokasi Rak</th>
                  <th>Catatan Alasan Restore</th>
                  <th>Penanggung Jawab / Waktu</th>
                </tr>
              </thead>
              <tbody>
                {#each data.itemsRestored as log (log.id)}
                  <tr>
                    <td><div class="primary-text">{log.item.name}</div></td>
                    <td>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray" style="vertical-align: -2px; margin-right: 2px;"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                      {log.item.location}
                    </td>
                    <td><p class="table-para">{log.note || '—'}</p></td>
                    <td>
                      <div class="primary-text">{log.user.name}</div>
                      <div class="sub-text">{formatDateTime(log.createdAt)}</div>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}

      {:else if activeLogTab === 'cabinet'}
        {#if data.cabinetLogs.length === 0}
          <div class="empty-panel">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20H4A2 2 0 0 1 2 18V6A2 2 0 0 1 4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2z"/><path d="M12 4v16M2 12h20"/></svg>
            Struktur layout fisik kabinet stabil minggu ini.
          </div>
        {:else}
          <div class="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Waktu Aktivitas</th>
                  <th>Jenis Aktivitas</th>
                  <th>Target Objek Terkait</th>
                  <th>Catatan Log Perubahan</th>
                  <th>Pelaksana Kegiatan</th>
                </tr>
              </thead>
              <tbody>
                {#each data.cabinetLogs as log (log.id)}
                  <tr>
                    <td class="font-mono text-small">{formatDateTime(log.createdAt)}</td>
                    <td><span class="badge-outline">{log.action}</span></td>
                    <td>
                      <div class="entity-details">
                        {#if log.cabinetName}<div>Kabinet: <strong>{log.cabinetName}</strong></div>{/if}
                        {#if log.sectionName}<div>Section: <strong>{log.sectionName}</strong></div>{/if}
                        {#if log.itemName}<div>Item: <strong>{log.itemName}</strong></div>{/if}
                      </div>
                    </td>
                    <td>
                      <p class="table-para">{log.note}</p>
                      {#if log.onBehalfOf}<div class="obho">Atas Rekomendasi: {log.onBehalfOf}</div>{/if}
                    </td>
                    <td>
                      <div class="primary-text">{log.performedBy.name}</div>
                      <div class="sub-text"><span class="role-tag">{log.performedBy.role}</span></div>
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
    <form
      method="POST"
      action="?/saveReport"
      use:enhance={() => {
        isSaving = true;
        return async ({ update }) => {
          await update();
          isSaving = false;
        };
      }}
    >
      <input type="hidden" name="month" value={month} />
      <input type="hidden" name="year" value={year} />
      <input type="hidden" name="weekOfMonth" value={week} />

      <div class="submission-layout">
        <div class="input-container">
          <label for="notes">Catatan Tambahan Evaluasi Pembukuan Super Admin</label>
          <textarea
            id="notes"
            name="notes"
            rows="3"
            value={data.savedReport?.notes || ''}
            placeholder="Tulis kesimpulan hasil stok opname mingguan, selisih barang, atau kendala rak fisik..."
          ></textarea>
        </div>
        
        <button type="submit" class="btn btn-submit-report" disabled={isSaving}>
          {#if isSaving}
            <svg class="spinner" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><path d="M21 12a9 9 0 1 1-6.21-8.56"/></svg> Mengunci...
          {:else}
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Kunci & Simpan Pembukuan Periode Ini
          {/if}
        </button>
      </div>
    </form>
  </div>
</div>

<style>
  .report-container {
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
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.25rem;
  }

  /* TOP HEADER NAV */
  .calendar-navigator {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #ffffff;
  }

  .month-controls {
    display: flex;
    align-items: center;
    gap: 1.25rem;
  }

  .btn-nav {
    background-color: #f8fafc;
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

  .btn-nav:hover { background-color: #e2e8f0; }
  .month-heading { font-size: 1.2rem; font-weight: 700; color: #1e293b; min-width: 160px; text-align: center; }

  .indicator-badge { padding: 0.4rem 0.75rem; border-radius: 8px; font-size: 0.85rem; font-weight: 600; display: inline-flex; align-items: center; }
  .indicator-badge.success { background-color: #dcfce7; color: #0f6e56; }
  .indicator-badge.warning { background-color: #fef3c7; color: #b45309; }

  /* METRICS GRID */
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1rem;
  }

  .metric-card {
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.25rem;
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .metric-icon {
    width: 46px;
    height: 46px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .card-kuning .metric-icon { background-color: #fef3c7; color: #b45309; }
  .card-hijau .metric-icon { background-color: #dcfce7; color: #0f6e56; }
  .card-merah .metric-icon { background-color: #fee2e2; color: #c2410c; }
  .card-biru .metric-icon { background-color: #e0f2fe; color: #0369a1; }
  .metric-value { font-size: 1.4rem; font-weight: 700; line-height: 1.2; color: #1e293b; }
  .metric-label { font-size: 0.8rem; color: #64748b; font-weight: 500; }

  /* WEEKS SEPARATOR */
  .weeks-tabs {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
    background-color: #cbd5e1;
    padding: 0.35rem;
    border-radius: 12px;
  }

  .tab-week-item {
    background: transparent;
    border: none;
    padding: 0.6rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
  }

  .tab-week-item.active {
    background-color: #ffffff;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
  }

  .week-title { font-weight: 600; font-size: 0.9rem; color: #1e293b; }
  .week-range { font-size: 0.75rem; color: #64748b; }

  /* CENTRAL CARD WORKSPACE */
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
  }

  .sub-tab {
    background: transparent;
    border: none;
    padding: 1rem 1.25rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: #64748b;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    border-bottom: 2px solid transparent;
  }

  .sub-tab:hover { color: #1e293b; background-color: #f1f5f9; }
  .sub-tab.active { color: #0369a1; border-bottom-color: #0369a1; background-color: #ffffff; }

  .workspace-tab-body { padding: 1.5rem; }
  .empty-panel { padding: 4rem 2rem; text-align: center; color: #94a3b8; font-size: 0.9rem; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }

  /* TABLES STYLE */
  .table-responsive { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.875rem; }
  th { background-color: #f8fafc; color: #475569; font-weight: 600; padding: 0.75rem 1rem; border-bottom: 1px solid #e2e8f0; }
  td { padding: 0.85rem 1rem; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
  tr:last-child td { border-bottom: none; }

  .primary-text { font-weight: 600; color: #1e293b; }
  .sub-text { font-size: 0.75rem; color: #64748b; margin-top: 0.15rem; }
  .font-mono { font-family: monospace; font-size: 0.85rem; color: #475569; }
  .text-gray { color: #94a3b8; }
  .text-strike { text-decoration: line-through; color: #94a3b8; }
  .text-small { font-size: 0.8rem; }
  
  .user-pill { font-weight: 600; color: #334155; display: inline-flex; align-items: center; }
  .role-tag { font-size: 0.7rem; background-color: #e2e8f0; color: #475569; padding: 0.05rem 0.25rem; border-radius: 4px; font-weight: 600; }

  /* BADGES COLORS */
  .badge { display: inline-block; padding: 0.2rem 0.4rem; border-radius: 6px; font-size: 0.75rem; font-weight: 700; }
  .badge-hijau { background-color: #dcfce7; color: #0f6e56; }
  .badge-kuning { background-color: #fef3c7; color: #b45309; }
  .badge-merah { background-color: #fee2e2; color: #c2410c; }
  
  .badge-outline { font-family: monospace; font-size: 0.75rem; padding: 0.15rem 0.35rem; background-color: #f8fafc; border: 1px solid #cbd5e1; color: #475569; border-radius: 4px; }
  .mini-pill { font-size: 0.725rem; background-color: #f1f5f9; padding: 0.1rem 0.3rem; border-radius: 4px; color: #475569; font-weight: 500; }

  .pricing { display: flex; flex-direction: column; gap: 0.15rem; font-size: 0.825rem; }
  .cost { color: #c2410c; font-weight: 600; }
  .price { color: #0f6e56; font-weight: 600; }

  .table-para { margin: 0; max-width: 300px; color: #475569; line-height: 1.4; font-size: 0.85rem; }
  .entity-details { display: flex; flex-direction: column; gap: 0.15rem; font-size: 0.8rem; }
  .obho { color: #b45309; font-style: italic; font-size: 0.75rem; margin-top: 0.2rem; }

  /* SUBMISSION PANEL */
  .report-submission { background-color: #ffffff; }
  .submission-layout { display: flex; flex-direction: column; gap: 1rem; }
  .input-container { display: flex; flex-direction: column; gap: 0.4rem; }
  .input-container label { font-size: 0.85rem; font-weight: 600; color: #334155; }
  .input-container textarea { width: 100%; padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 8px; font-family: inherit; font-size: 0.9rem; box-sizing: border-box; }
  .input-container textarea:focus { outline: none; border-color: #0369a1; box-shadow: 0 0 0 3px rgba(3, 105, 161, 0.12); }

  .btn-submit-report { align-self: flex-end; background-color: #0f6e56; color: #ffffff; border: none; padding: 0.7rem 1.5rem; font-size: 0.9rem; font-weight: 600; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 0.25rem; transition: background-color 0.2s; }
  .btn-submit-report:hover:not(:disabled) { background-color: #0d5c48; }
  .btn-submit-report:disabled { opacity: 0.6; cursor: not-allowed; }

  .spinner { animation: rotate 1s linear infinite; }
  @keyframes rotate { to { transform: rotate(360deg); } }

  @media (max-width: 768px) {
    .calendar-navigator { flex-direction: column; gap: 1rem; align-items: flex-start; }
    .weeks-tabs { grid-template-columns: repeat(2, 1fr); }
    .btn-submit-report { width: 100%; justify-content: center; }
  }
</style>