<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    
    let { data } = $props();
    
    // Data dari server
    let audits = $state<any[]>(data?.audits || []);
    let stats = $state(data?.stats || { totalAudits: 0, completedAudits: 0, draftAudits: 0, totalItemsAudited: 0 });
    let chartData = $state(data?.chartData || { labels: [], datasets: [] });
    
    // State untuk filter
    let isLoading = $state(false);
    let filterStatus = $state('all');
    let filterDateRange = $state('all');
    let searchTerm = $state('');
    
    function getFilteredAudits() {
        let filtered = [...audits];
        
        // Filter status
        if (filterStatus !== 'all') {
            filtered = filtered.filter(a => a.status === filterStatus);
        }
        
        // Filter date range
        if (filterDateRange !== 'all') {
            const now = new Date();
            const ranges: Record<string, number> = {
                week: 7,
                month: 30,
                quarter: 90,
                year: 365
            };
            const days = ranges[filterDateRange];
            if (days) {
                const cutoffDate = new Date();
                cutoffDate.setDate(now.getDate() - days);
                filtered = filtered.filter(a => {
                    const auditDate = new Date(a.createdAt);
                    return auditDate >= cutoffDate;
                });
            }
        }
        
        // Search
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(a => 
                (a.section?.cabinet?.name?.toLowerCase().includes(term) || false) ||
                (a.section?.name?.toLowerCase().includes(term) || false) ||
                (a.auditor?.name?.toLowerCase().includes(term) || false) ||
                a.id.toLowerCase().includes(term)
            );
        }
        
        return filtered;
    }
    
    function resetFilters() {
        filterStatus = 'all';
        filterDateRange = 'all';
        searchTerm = '';
    }
    
    function viewAuditDetail(auditId: string) {
        goto(`/stock-audit/laporan/${auditId}`);
    }
    
    function exportToCSV() {
        const filtered = getFilteredAudits();
        const headers = ['ID Audit', 'Cabinet', 'Section', 'Tanggal', 'Status', 'Total Cards', 'Match', 'Mismatch', 'Missing', 'New Entry', 'Auditor'];
        const rows = filtered.map(a => [
            a.id,
            a.section?.cabinet?.name || '-',
            a.section?.name || '-',
            new Date(a.createdAt).toLocaleDateString('id-ID'),
            a.status,
            a.totalCards || 0,
            a.totalMatch || 0,
            a.totalMismatch || 0,
            a.totalMissing || 0,
            a.totalNewEntry || 0,
            a.auditor?.name || '-'
        ]);
        
        const csvContent = [headers, ...rows]
            .map(row => row.join(','))
            .join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `laporan-audit-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
   function getStatusBadge(status: string) {
        if (status === 'COMPLETED') {
            return { class: 'completed', text: 'Completed', type: 'COMPLETED' };
        }
        return { class: 'draft', text: 'Draft', type: 'DRAFT' };
    }
    
    function formatDate(dateStr: string) {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }
</script>

<svelte:head>
    <title>Laporan Audit Stock</title>
</svelte:head>

<div class="laporan-page">
    <!-- Header -->
    <div class="header">
        <div>
            <h1 class="title">Laporan Audit Stock</h1>
            <p class="subtitle">Rekap dan analisis seluruh kegiatan audit stock</p>
        </div>
    </div>
    
    <!-- Stats Cards -->
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-icon blue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            </div>
            <div class="stat-info">
            <div class="stat-value">{stats.totalAudits}</div>
            <div class="stat-label">Total Audit</div>
            </div>
        </div>

        <div class="stat-card">
            <div class="stat-icon green">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11" />
            </svg>
            </div>
            <div class="stat-info">
            <div class="stat-value">{stats.completedAudits}</div>
            <div class="stat-label">Completed</div>
            </div>
        </div>

        <div class="stat-card">
            <div class="stat-icon orange">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            </div>
            <div class="stat-info">
            <div class="stat-value">{stats.draftAudits}</div>
            <div class="stat-label">Draft</div>
            </div>
        </div>

        <div class="stat-card">
            <div class="stat-icon purple">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18" />
                <path d="M3 15h18" />
                <path d="M9 3v18" />
                <path d="M15 3v18" />
            </svg>
            </div>
            <div class="stat-info">
            <div class="stat-value">{stats.totalItemsAudited.toLocaleString()}</div>
            <div class="stat-label">Total Cards Diaudit</div>
            </div>
        </div>
        </div>
    
    <!-- Chart Section -->
    {#if audits.length > 0}
        <div class="chart-section">
            <div class="section-header">
                <h2>Tren Audit per Bulan</h2>
                <span class="badge">{new Date().getFullYear()}</span>
            </div>
            <div class="chart-container">
                <div class="bar-chart">
                    {#each chartData.datasets as value, index}
                        {@const maxValue = Math.max(...chartData.datasets, 1)}
                        {@const height = maxValue > 0 ? (value / maxValue) * 150 : 0}
                        <div class="bar-wrapper">
                            <div class="bar-label">{chartData.labels[index]}</div>
                            <div class="bar" style="height: {height}px;">
                                {#if value > 0}
                                    <span class="bar-value">{value}</span>
                                {/if}
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    {/if}
    
    <!-- Filter Bar -->
    <div class="filter-bar">
        <div class="filter-group">
            <svg class="filter-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
            </svg>
            <input 
                type="text" 
                class="search-input" 
                placeholder="Cari cabinet, section, auditor..." 
                bind:value={searchTerm}
            />
        </div>
        <div class="filter-group">
            <select class="filter-select" bind:value={filterStatus}>
                <option value="all">All Status</option>
                <option value="COMPLETED">Completed</option>
                <option value="DRAFT">Draft</option>
            </select>
        </div>
        
        <div class="filter-group">
            <select class="filter-select" bind:value={filterDateRange}>
                <option value="all">All Time</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="quarter">Last 90 Days</option>
                <option value="year">Last Year</option>
            </select>
        </div>
        
        {#if filterStatus !== 'all' || filterDateRange !== 'all' || searchTerm}
            <button class="btn-reset" onclick={resetFilters}>
                Reset Filters
            </button>
        {/if}
    </div>
    
    <!-- Results Info -->
    <div class="results-info">
        <span>Menampilkan {getFilteredAudits().length} dari {audits.length} audit</span>
    </div>
    
    <!-- Audit Table -->
    {#if getFilteredAudits().length === 0}
        <div class="empty-state">
            <div class="empty-icon-wrap">
                <svg class="empty-svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                <path d="M14 2v4a1 1 0 0 0 1 1h4" />
                
                <path d="m9 11 6 6" class="cross-line" stroke-width="1.8" />
                <path d="m15 11-6 6" class="cross-line" stroke-width="1.8" />
                </svg>
            </div>
        <h3>Tidak Ada Data</h3>
        <p>Tidak ditemukan audit yang sesuai dengan filter yang dipilih</p>
        <button class="btn-primary" onclick={resetFilters}>Reset Filters</button>
        </div>
    {:else}
        <div class="table-container">
            <table class="audit-table">
                <thead>
                    <tr>
                        <th>ID Audit</th>
                        <th>Cabinet / Section</th>
                        <th>Tanggal</th>
                        <th>Status</th>
                        <th>Total Cards</th>
                        <th>Match</th>
                        <th>Mismatch</th>
                        <th>Auditor</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    {#each getFilteredAudits() as audit}
                        <tr>
                            <td class="id-cell">{audit.id.slice(-8)}</td>
                            <td>
                                <div class="location-info">
                                    <div class="cabinet-name">📁 {audit.section?.cabinet?.name || '-'}</div>
                                    <div class="section-name">📂 {audit.section?.name || '-'}</div>
                                </div>
                            </td>
                            <td class="date-cell">{formatDate(audit.createdAt)}</td>
                            <td>
                                {#if audit.status}
                                    {@const badge = getStatusBadge(audit.status)}
                                    <span class="status-badge {badge.class}">
                                        {#if badge.type === 'COMPLETED'}
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                        {:else}
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                <polyline points="14 2 14 8 20 8"></polyline>
                                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                                <polyline points="10 9 9 9 8 9"></polyline>
                                            </svg>
                                        {/if}
                                        {badge.text}
                                    </span>
                                {/if}
                            </td>
                            <td class="number-cell">{audit.totalCards || 0}</td>
                            <td class="number-cell success">{audit.totalMatch || 0}</td>
                            <td class="number-cell warning">{audit.totalMismatch || 0}</td>
                            <td>{audit.auditor?.name || '-'}</td>
                            <td>
                                <button 
                                class="view-btn" 
                                onclick={() => viewAuditDetail(audit.id)}
                                title="Lihat detail"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                            </button>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
        
        <!-- Summary Footer -->
        <div class="summary-footer">
            <div class="summary-item">
                <span>Completion Rate:</span>
                <strong>{stats.totalAudits ? Math.round((stats.completedAudits / stats.totalAudits) * 100) : 0}%</strong>
            </div>
            <div class="summary-item">
                <span>Rata-rata Cards/Audit:</span>
                <strong>{stats.totalAudits ? Math.round(stats.totalItemsAudited / stats.totalAudits).toLocaleString() : 0}</strong>
            </div>
            <div class="summary-item">
                <span>Accuracy Rate:</span>
                <strong>{stats.totalItemsAudited ? Math.round((audits.reduce((sum, a) => sum + (a.totalMatch || 0), 0) / stats.totalItemsAudited) * 100) : 0}%</strong>
            </div>
        </div>
    {/if}
</div>

<style>
    .laporan-page {
        padding: 1.5rem;
        max-width: 1400px;
        margin: 0 auto;
    }
    
    .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
        gap: 1rem;
    }
    
    .title {
        font-size: 1.75rem;
        font-weight: 600;
        color: #ffffff;
        margin: 0 0 0.25rem;
    }
    
    .subtitle {
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.9rem;
    }
    
    .header-actions {
        display: flex;
        gap: 0.75rem;
    }
    
    .btn-export, .btn-print {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        color: #ffffff;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 0.85rem;
    }
    
    .btn-export:hover, .btn-print:hover {
        background: rgba(255, 255, 255, 0.1);
        transform: translateY(-2px);
    }
    
    .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
    }

    .stat-card {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 1.25rem;
        background: rgba(255, 255, 255, 0.02);
        border: 0.5px solid rgba(255, 255, 255, 0.05);
        border-radius: 12px;
    }

    .stat-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 10px;
        flex-shrink: 0;
    }

    /* --- Variasi Warna Aksen SVG --- */
    .stat-icon.blue {
        background: rgba(59, 130, 246, 0.1);
        color: #3b82f6;
    }

    .stat-icon.green {
        background: rgba(0, 255, 157, 0.1);
        color: #00ff9d;
    }

    .stat-icon.orange {
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
    }

    .stat-icon.purple {
        background: rgba(139, 92, 246, 0.1);
        color: #8b5cf6;
    }

    .stat-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .stat-value {
        font-size: 18px;
        font-weight: 600;
        color: #ffffff;
    }

    .stat-label {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.4);
    }
    
    .chart-section {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 16px;
        padding: 1.25rem;
        margin-bottom: 1.5rem;
    }
    
    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }
    
    .section-header h2 {
        font-size: 1rem;
        font-weight: 500;
        color: #ffffff;
        margin: 0;
    }
    
    .badge {
        padding: 0.25rem 0.75rem;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 20px;
        font-size: 0.7rem;
        color: rgba(255, 255, 255, 0.6);
    }
    
    .chart-container {
        overflow-x: auto;
    }
    
    .bar-chart {
        display: flex;
        align-items: flex-end;
        gap: 1rem;
        justify-content: space-around;
        min-width: 500px;
        padding: 0.5rem 0;
    }
    
    .bar-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        flex: 1;
    }
    
    .bar-label {
        font-size: 0.7rem;
        color: rgba(255, 255, 255, 0.6);
        text-align: center;
    }
    
    .bar {
        width: 100%;
        min-width: 30px;
        max-width: 50px;
        background: linear-gradient(180deg, #10b981 0%, #059669 100%);
        border-radius: 8px 8px 4px 4px;
        position: relative;
        cursor: pointer;
        transition: all 0.3s;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        align-items: center;
    }
    
    .bar:hover {
        transform: scaleX(1.1);
        background: linear-gradient(180deg, #34d399 0%, #10b981 100%);
    }
    
    .bar-value {
        font-size: 0.7rem;
        color: #ffffff;
        padding: 0.25rem;
        font-weight: 600;
    }
    
    .filter-bar {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        margin-bottom: 1rem;
        align-items: center;
        padding: 0.75rem 0;
    }
    
    .filter-group {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 10px;
        padding: 0.25rem 0.75rem;
    }
    
    .filter-icon {
        font-size: 0.9rem;
        opacity: 0.6;
    }
    
    .search-input {
        padding: 0.5rem;
        background: transparent;
        border: none;
        color: #ffffff;
        font-size: 0.85rem;
        min-width: 220px;
    }
    
    .search-input:focus {
        outline: none;
    }
    
    .search-input::placeholder {
        color: rgba(255, 255, 255, 0.4);
    }
    
    .filter-select {
        padding: 0.5rem 2rem 0.5rem 0.75rem;
        background: rgba(20, 20, 30, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 8px;
        color: #ffffff;
        font-size: 0.85rem;
        cursor: pointer;
        appearance: none;
        background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2310b981' stroke-width='2'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
        background-repeat: no-repeat;
        background-position: right 0.75rem center;
        background-size: 1rem;
        min-width: 140px;
    }
    
    .filter-select:hover {
        background-color: rgba(30, 30, 40, 0.9);
        border-color: rgba(255, 255, 255, 0.25);
    }
    
    .filter-select:focus {
        outline: none;
        border-color: #10b981;
        background-color: rgba(30, 30, 40, 0.95);
    }
    
    .filter-select option {
        background: #1a1a2a;
        color: #ffffff;
        padding: 0.5rem;
    }
    
    .btn-reset {
        padding: 0.5rem 1rem;
        background: rgba(245, 158, 11, 0.1);
        border: 1px solid rgba(245, 158, 11, 0.3);
        border-radius: 8px;
        color: #f59e0b;
        cursor: pointer;
        font-size: 0.8rem;
        transition: all 0.2s;
    }
    
    .btn-reset:hover {
        background: rgba(245, 158, 11, 0.2);
    }
    
    .results-info {
        margin-bottom: 1rem;
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.5);
    }
    
    .table-container {
        overflow-x: auto;
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.05);
    }
    
    .audit-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.85rem;
    }
    
    .audit-table thead {
        background: rgba(255, 255, 255, 0.03);
    }
    
    .audit-table th {
        text-align: left;
        padding: 1rem;
        color: rgba(255, 255, 255, 0.7);
        font-weight: 500;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    
    .audit-table td {
        padding: 0.875rem 1rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.03);
        color: rgba(255, 255, 255, 0.85);
    }
    
    .audit-table tr:hover {
        background: rgba(255, 255, 255, 0.02);
    }
    
    .id-cell {
        font-family: monospace;
        font-size: 0.8rem;
        color: #10b981;
    }
    
    .date-cell {
        white-space: nowrap;
    }
    
    .number-cell {
        font-family: monospace;
        text-align: center;
    }
    
    .number-cell.success {
        color: #10b981;
    }
    
    .number-cell.warning {
        color: #f59e0b;
    }
    
    .location-info {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }
    
    .cabinet-name {
        font-weight: 500;
        color: #ffffff;
    }
    
    .section-name {
        font-size: 0.7rem;
        color: rgba(255, 255, 255, 0.5);
    }
    
    .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem; 
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.7rem;
        font-weight: 500;
    }
    
    .status-badge.completed {
        background: rgba(16, 185, 129, 0.15);
        color: #10b981;
        border: 1px solid rgba(16, 185, 129, 0.3);
    }
    
    .status-badge.draft {
        background: rgba(245, 158, 11, 0.15);
        color: #f59e0b;
        border: 1px solid rgba(245, 158, 11, 0.3);
    }
    
    .view-btn {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1.2rem;
        padding: 0.25rem;
        border-radius: 6px;
        transition: all 0.2s;
    }
    
    .view-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        transform: scale(1.1);
    }
    
    .summary-footer {
        display: flex;
        justify-content: flex-end;
        gap: 2rem;
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
    }
    
    .summary-item {
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.6);
    }
    
    .summary-item strong {
        color: #ffffff;
        margin-left: 0.5rem;
    }
    
    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 4rem 2rem;
        color: rgba(255, 255, 255, 0.5);
    }

    .empty-icon-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 96px;
        height: 96px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.03);
        margin-bottom: 1.25rem;
        transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), background 0.2s;
    }

    /* Efek interaktif saat area empty state dilewati mouse */
    .empty-state:hover .empty-icon-wrap {
        transform: scale(1.05);
        background: rgba(0, 255, 157, 0.03);
        border-color: rgba(0, 255, 157, 0.1);
    }

    .empty-svg {
        color: rgba(255, 255, 255, 0.2);
        transition: color 0.2s;
    }

    .empty-state:hover .empty-svg {
        color: #00ff9d; /* Berubah jadi hijau neon khas tema kamu saat di-hover */
    }

    .empty-state h3 {
        font-size: 16px;
        font-weight: 600;
        color: #ffffff;
        margin: 0 0 6px 0;
    }

    .empty-state p {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.4);
        max-width: 280px;
        margin: 0 0 1.5rem 0;
        line-height: 1.5;
    }
    
    .btn-primary {
        padding: 0.75rem 1.5rem;
        background: rgba(16, 185, 129, 0.1);
        border: 1px solid rgba(16, 185, 129, 0.3);
        border-radius: 10px;
        color: #10b981;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .btn-primary:hover {
        background: rgba(16, 185, 129, 0.2);
    }
    
    @media print {
        .header-actions, .filter-bar, .btn-reset, .view-btn, .summary-footer {
            display: none;
        }
        
        .laporan-page {
            padding: 0;
        }
        
        .stat-card, .chart-section, .table-container {
            break-inside: avoid;
        }
    }
    
    @media (max-width: 768px) {
        .laporan-page {
            padding: 1rem;
        }
        
        .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 0.75rem;
        }
        
        .filter-bar {
            flex-direction: column;
            align-items: stretch;
        }
        
        .filter-group {
            justify-content: space-between;
        }
        
        .search-input {
            min-width: auto;
            flex: 1;
        }
        
        .audit-table th, .audit-table td {
            padding: 0.75rem;
        }
        
        .summary-footer {
            flex-direction: column;
            gap: 0.5rem;
            align-items: flex-start;
        }
    }
</style>