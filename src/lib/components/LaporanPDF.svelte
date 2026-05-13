<script lang="ts">
    export let audit: any;
    export let report: any;
    export let summary: any;

    function formatDate(date: string | Date) {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
    }

    function formatCurrency(amount: number, currency: string) {
        if (!amount) return '-';
        if (currency === 'IDR') {
            return `Rp ${amount.toLocaleString('id-ID')}`;
        }
        return `SGD ${amount.toLocaleString()}`;
    }
</script>

<div class="pdf-report">
    <!-- Header -->
    <div class="header">
        <div class="title-section">
            <h1 class="title">LAPORAN STOCK AUDIT</h1>
            <div class="subtitle">Pokemon Collection System</div>
        </div>
        <div class="report-id">
            <span class="label">No. Laporan:</span>
            <span class="value">#{audit.id.slice(-8).toUpperCase()}</span>
        </div>
    </div>

    <!-- Info Audit -->
    <div class="info-section">
        <div class="info-row">
            <div class="info-label">Cabinet / Section</div>
            <div class="info-value">{audit.cabinetName} / {audit.sectionName}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Tipe Section</div>
            <div class="info-value">{audit.sectionType}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Auditor</div>
            <div class="info-value">{audit.auditorName}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Tanggal Audit</div>
            <div class="info-value">{formatDate(audit.createdAt)}</div>
        </div>
        {#if audit.completedAt}
            <div class="info-row">
                <div class="info-label">Tanggal Selesai</div>
                <div class="info-value">{formatDate(audit.completedAt)}</div>
            </div>
        {/if}
        {#if audit.note}
            <div class="info-row">
                <div class="info-label">Catatan</div>
                <div class="info-value note">{audit.note}</div>
            </div>
        {/if}
    </div>

    <!-- Ringkasan Stok -->
    <div class="summary-section">
        <h2 class="section-title">RINGKASAN STOK</h2>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">{audit.totalCards || 0}</div>
                <div class="stat-label">Total Card</div>
            </div>
            <div class="stat-card match">
                <div class="stat-value">{audit.totalMatch || 0}</div>
                <div class="stat-label">Match</div>
            </div>
            <div class="stat-card mismatch">
                <div class="stat-value">{audit.totalMismatch || 0}</div>
                <div class="stat-label">Mismatch</div>
            </div>
            <div class="stat-card missing">
                <div class="stat-value">{audit.totalMissing || 0}</div>
                <div class="stat-label">Missing</div>
            </div>
            <div class="stat-card new">
                <div class="stat-value">{audit.totalNewEntry || 0}</div>
                <div class="stat-label">New Entry</div>
            </div>
        </div>
    </div>

    <!-- Perubahan Stok -->
    {#if summary.mismatches.length > 0}
        <div class="changes-section">
            <h2 class="section-title">PERUBAHAN STOK</h2>
            <div class="changes-table">
                <div class="table-header">
                    <div class="col-name">Nama Card</div>
                    <div class="col-stock">Sistem</div>
                    <div class="col-stock">Fisik</div>
                    <div class="col-note">Catatan</div>
                </div>
                {#each summary.mismatches as item}
                    <div class="table-row mismatch">
                        <div class="col-name">{item.cardName}</div>
                        <div class="col-stock">{item.systemStock}</div>
                        <div class="col-stock">{item.physicalStock}</div>
                        <div class="col-note">{item.note || '-'}</div>
                    </div>
                {/each}
            </div>
        </div>
    {/if}

    <!-- Card Hilang -->
    {#if summary.missing.length > 0}
        <div class="changes-section">
            <h2 class="section-title">CARD TIDAK DITEMUKAN</h2>
            <div class="changes-table">
                <div class="table-header">
                    <div class="col-name">Nama Card</div>
                    <div class="col-stock">Stok Sistem</div>
                    <div class="col-note">Catatan</div>
                </div>
                {#each summary.missing as item}
                    <div class="table-row missing">
                        <div class="col-name">{item.cardName}</div>
                        <div class="col-stock">{item.stock}</div>
                        <div class="col-note">{item.note || '-'}</div>
                    </div>
                {/each}
            </div>
        </div>
    {/if}

    <!-- Card Baru -->
    {#if summary.newEntries.length > 0}
        <div class="changes-section">
            <h2 class="section-title">CARD BARU DITAMBAHKAN</h2>
            <div class="changes-table">
                <div class="table-header">
                    <div class="col-name">Nama Card</div>
                    <div class="col-category">Kategori</div>
                    <div class="col-price">Harga IDR</div>
                    <div class="col-price">Harga SGD</div>
                </div>
                {#each summary.newEntries as item}
                    <div class="table-row new">
                        <div class="col-name">{item.cardName}</div>
                        <div class="col-category">{item.category} / {item.subCategory}</div>
                        <div class="col-price">{formatCurrency(item.priceIDR, 'IDR')}</div>
                        <div class="col-price">{formatCurrency(item.priceSGD, 'SGD')}</div>
                    </div>
                {/each}
            </div>
        </div>
    {/if}

    <!-- Tanda Tangan -->
    <div class="signature-section">
        <h2 class="section-title">TANDA TANGAN</h2>
        <div class="signatures">
            <div class="signature-item">
                <div class="signature-label">Auditor</div>
                <div class="signature-line">
                    {#if report.auditorSignature}
                        <img src={report.auditorSignature} alt="Tanda tangan auditor" class="signature-img" />
                    {:else}
                        <div class="signature-placeholder">(Belum ditandatangani)</div>
                    {/if}
                </div>
                <div class="signature-name">{audit.auditorName}</div>
                <div class="signature-date">{report.auditorSignedAt ? formatDate(report.auditorSignedAt) : '_________'}</div>
            </div>
            
            {#each report.responsiblePersons as resp, idx}
                <div class="signature-item">
                    <div class="signature-label">Penanggung Jawab {idx + 1}</div>
                    <div class="signature-line">
                        {#if report.signatures?.find(s => s.signerId === resp.id)?.signature}
                            <img src={report.signatures.find(s => s.signerId === resp.id).signature} alt="Tanda tangan {resp.name}" class="signature-img" />
                        {:else}
                            <div class="signature-placeholder">(Belum ditandatangani)</div>
                        {/if}
                    </div>
                    <div class="signature-name">{resp.name}</div>
                    <div class="signature-date">{report.signatures?.find(s => s.signerId === resp.id)?.signedAt ? formatDate(report.signatures.find(s => s.signerId === resp.id).signedAt) : '_________'}</div>
                </div>
            {/each}
        </div>
    </div>

    <div class="footer">
        <div class="footer-text">Laporan ini dibuat secara otomatis oleh sistem</div>
        <div class="footer-date">Dicetak: {formatDate(new Date())}</div>
    </div>
</div>

<style>
    .pdf-report {
        font-family: 'Inter', sans-serif;
        background: white;
        padding: 2rem;
        max-width: 800px;
        margin: 0 auto;
    }

    /* Header */
    .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        border-bottom: 2px solid #00ff9d;
        padding-bottom: 1rem;
        margin-bottom: 1.5rem;
    }

    .title-section {
        text-align: left;
    }

    .title {
        font-size: 1.5rem;
        font-weight: 700;
        color: #000;
        margin: 0 0 0.25rem;
    }

    .subtitle {
        font-size: 0.7rem;
        color: #666;
    }

    .report-id {
        text-align: right;
    }

    .report-id .label {
        font-size: 0.7rem;
        color: #666;
    }

    .report-id .value {
        font-size: 0.8rem;
        font-weight: 600;
        color: #000;
    }

    /* Info Section */
    .info-section {
        background: #f5f5f5;
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 1.5rem;
    }

    .info-row {
        display: flex;
        justify-content: space-between;
        padding: 0.25rem 0;
        font-size: 0.8rem;
    }

    .info-label {
        font-weight: 600;
        color: #333;
    }

    .info-value {
        color: #555;
    }

    .info-value.note {
        font-style: italic;
        max-width: 60%;
        text-align: right;
    }

    /* Section Title */
    .section-title {
        font-size: 0.9rem;
        font-weight: 700;
        color: #000;
        border-left: 3px solid #00ff9d;
        padding-left: 0.5rem;
        margin-bottom: 0.75rem;
    }

    /* Stats Grid */
    .stats-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 0.5rem;
        margin-bottom: 1rem;
    }

    .stat-card {
        text-align: center;
        padding: 0.5rem;
        background: #f9f9f9;
        border-radius: 8px;
    }

    .stat-value {
        font-size: 1.2rem;
        font-weight: 700;
    }

    .stat-card.match .stat-value { color: #00ff9d; }
    .stat-card.mismatch .stat-value { color: #ffaa00; }
    .stat-card.missing .stat-value { color: #ff6b6b; }
    .stat-card.new .stat-value { color: #00ccff; }

    .stat-label {
        font-size: 0.6rem;
        color: #666;
    }

    /* Changes Table */
    .changes-section {
        margin-bottom: 1rem;
    }

    .changes-table {
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        overflow: hidden;
    }

    .table-header {
        display: grid;
        grid-template-columns: 2fr 0.8fr 0.8fr 2fr;
        background: #f0f0f0;
        padding: 0.5rem;
        font-size: 0.7rem;
        font-weight: 600;
        border-bottom: 1px solid #e0e0e0;
    }

    .table-row {
        display: grid;
        grid-template-columns: 2fr 0.8fr 0.8fr 2fr;
        padding: 0.5rem;
        font-size: 0.7rem;
        border-bottom: 1px solid #f0f0f0;
    }

    .table-row:last-child {
        border-bottom: none;
    }

    .table-row.mismatch {
        background: rgba(255, 170, 0, 0.05);
    }

    .table-row.missing {
        background: rgba(255, 107, 107, 0.05);
    }

    .table-row.new {
        background: rgba(0, 204, 255, 0.05);
    }

    .col-name { font-weight: 500; }
    .col-stock { text-align: center; }
    .col-note { color: #666; font-style: italic; }
    .col-category { font-size: 0.65rem; }
    .col-price { text-align: right; }

    /* Signature Section */
    .signature-section {
        margin-top: 1.5rem;
        border-top: 1px solid #e0e0e0;
        padding-top: 1rem;
    }

    .signatures {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
    }

    .signature-item {
        text-align: center;
    }

    .signature-label {
        font-size: 0.7rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
    }

    .signature-line {
        min-height: 60px;
        border-bottom: 1px solid #ccc;
        margin-bottom: 0.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .signature-img {
        max-width: 150px;
        max-height: 50px;
    }

    .signature-placeholder {
        font-size: 0.6rem;
        color: #999;
        font-style: italic;
    }

    .signature-name {
        font-size: 0.65rem;
        font-weight: 500;
    }

    .signature-date {
        font-size: 0.6rem;
        color: #888;
    }

    /* Footer */
    .footer {
        margin-top: 2rem;
        text-align: center;
        font-size: 0.6rem;
        color: #999;
        border-top: 1px solid #e0e0e0;
        padding-top: 1rem;
    }
</style>