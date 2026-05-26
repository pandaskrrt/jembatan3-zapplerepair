<script lang="ts">
    import { goto } from '$app/navigation';
    
    let { data } = $props();
    let stats = data?.stats;
    let recentAudits = data?.recentAudits || [];
    
    function formatDate(date: string | Date) {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }
</script>

<div class="dashboard">
    <div class="welcome-section">
        <h2>Welcome Back, Super Admin!</h2>
        <p>Kelola sistem stock audit dan user management</p>
    </div>
    
    <!-- Stats Grid -->
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
            </div>
            <div class="stat-info">
                <span class="stat-value">{stats?.totalUsers || 0}</span>
                <span class="stat-label">Total Users</span>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
            </div>
            <div class="stat-info">
                <span class="stat-value">{stats?.totalAdmins || 0}</span>
                <span class="stat-label">Admin</span>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
            </div>
            <div class="stat-info">
                <span class="stat-value">{stats?.totalAuditors || 0}</span>
                <span class="stat-label">Stock Auditor</span>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.66 0 3-4 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4-3-9s1.34-9 3-9"/>
                </svg>
            </div>
            <div class="stat-info">
                <span class="stat-value">{stats?.totalAudits || 0}</span>
                <span class="stat-label">Total Audit</span>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
            </div>
            <div class="stat-info">
                <span class="stat-value">{stats?.completedAudits || 0}</span>
                <span class="stat-label">Selesai</span>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                </svg>
            </div>
            <div class="stat-info">
                <span class="stat-value">{stats?.draftAudits || 0}</span>
                <span class="stat-label">Draft</span>
            </div>
        </div>
    </div>
    
    <!-- Recent Audits -->
    <div class="recent-section">
        <div class="section-header">
            <h3>Audit Terbaru</h3>
            <button class="view-all" onclick={() => goto('/superadmin/reports')}>Lihat semua →</button>
        </div>
        
        {#if recentAudits.length === 0}
            <div class="empty-state">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                <p>Belum ada audit yang dilakukan</p>
            </div>
        {:else}
            <div class="audit-list">
                {#each recentAudits as audit}
                    <div class="audit-item">
                        <div class="audit-info">
                            <div class="audit-location">
                                <span class="cabinet">{audit.cabinetName}</span>
                                <span class="separator">/</span>
                                <span class="section">{audit.sectionName}</span>
                            </div>
                            <div class="audit-meta">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <polyline points="12 6 12 12 16 14"/>
                                </svg>
                                <span>{formatDate(audit.createdAt)}</span>
                                <span class="dot">•</span>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                    <circle cx="12" cy="7" r="4"/>
                                </svg>
                                <span>{audit.auditorName || 'Unknown'}</span>
                            </div>
                        </div>
                        <div class="audit-status">
                            <span class="status-badge {audit.status === 'DRAFT' ? 'draft' : 'completed'}">
                                {audit.status === 'DRAFT' ? 'Draft' : 'Selesai'}
                            </span>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>

<style>
    .dashboard {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 1rem;
    }
    
    .welcome-section {
        margin-bottom: 2rem;
    }
    
    .welcome-section h2 {
        font-size: 1.5rem;
        font-weight: 600;
        color: #0f172a;
        margin-bottom: 0.25rem;
    }
    
    .welcome-section p {
        font-size: 0.85rem;
        color: #64748b;
    }
    
    .stats-grid {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 1rem;
        margin-bottom: 2rem;
    }
    
    .stat-card {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        transition: all 0.2s ease;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    }
    
    .stat-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        border-color: #cbd5e1;
    }
    
    .stat-icon {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f1f5f9;
        border-radius: 10px;
        color: #10b981;
    }
    
    .stat-value {
        display: block;
        font-size: 1.3rem;
        font-weight: 700;
        color: #0f172a;
        line-height: 1.2;
    }
    
    .stat-label {
        font-size: 0.65rem;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.3px;
    }
    
    .recent-section {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        padding: 1.25rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    }
    
    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid #f1f5f9;
    }
    
    .section-header h3 {
        font-size: 0.9rem;
        font-weight: 700;
        color: #0f172a;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .view-all {
        background: none;
        border: none;
        color: #10b981;
        font-size: 0.7rem;
        font-weight: 600;
        cursor: pointer;
        transition: color 0.2s;
    }
    
    .view-all:hover {
        color: #059669;
    }
    
    .audit-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .audit-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 0.8rem;
        background: #f8fafc;
        border-radius: 10px;
        transition: all 0.2s;
        border: 1px solid transparent;
    }
    
    .audit-item:hover {
        background: #f1f5f9;
        border-color: #e2e8f0;
    }
    
    .audit-info {
        flex: 1;
    }
    
    .audit-location {
        font-size: 0.8rem;
        font-weight: 600;
        margin-bottom: 0.25rem;
    }
    
    .cabinet {
        color: #475569;
    }
    
    .separator {
        color: #cbd5e1;
        margin: 0 0.3rem;
    }
    
    .section {
        color: #10b981;
    }
    
    .audit-meta {
        font-size: 0.65rem;
        color: #94a3b8;
        display: flex;
        gap: 0.4rem;
        align-items: center;
    }
    
    .audit-meta svg {
        color: #94a3b8;
    }
    
    .dot {
        color: #cbd5e1;
    }
    
    .status-badge {
        font-size: 0.65rem;
        font-weight: 600;
        padding: 0.25rem 0.7rem;
        border-radius: 30px;
    }
    
    .status-badge.draft {
        background: #fef3c7;
        color: #d97706;
    }
    
    .status-badge.completed {
        background: #d1fae5;
        color: #059669;
    }
    
    .empty-state {
        text-align: center;
        padding: 2.5rem;
        color: #94a3b8;
    }
    
    .empty-state svg {
        margin-bottom: 0.75rem;
        color: #cbd5e1;
    }
    
    .empty-state p {
        font-size: 0.8rem;
    }
    
    @media (max-width: 1000px) {
        .stats-grid {
            grid-template-columns: repeat(3, 1fr);
        }
    }
    
    @media (max-width: 640px) {
        .dashboard {
            padding: 0 0.5rem;
        }
        
        .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 0.75rem;
        }
        
        .stat-card {
            padding: 0.75rem;
        }
        
        .stat-icon {
            width: 32px;
            height: 32px;
        }
        
        .welcome-section h2 {
            font-size: 1.2rem;
        }
        
        .recent-section {
            padding: 1rem;
        }
        
        .audit-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
        }
        
        .audit-status {
            align-self: flex-start;
        }
    }
</style>