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
            <div class="stat-icon">👥</div>
            <div class="stat-info">
                <span class="stat-value">{stats?.totalUsers || 0}</span>
                <span class="stat-label">Total Users</span>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">👑</div>
            <div class="stat-info">
                <span class="stat-value">{stats?.totalAdmins || 0}</span>
                <span class="stat-label">Admin</span>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">📋</div>
            <div class="stat-info">
                <span class="stat-value">{stats?.totalAuditors || 0}</span>
                <span class="stat-label">Stock Auditor</span>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-info">
                <span class="stat-value">{stats?.totalAudits || 0}</span>
                <span class="stat-label">Total Audit</span>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">✅</div>
            <div class="stat-info">
                <span class="stat-value">{stats?.completedAudits || 0}</span>
                <span class="stat-label">Selesai</span>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">📝</div>
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
                                <span>oleh {audit.auditorName || 'Unknown'}</span>
                                <span>•</span>
                                <span>{formatDate(audit.createdAt)}</span>
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
    }
    
    .welcome-section {
        margin-bottom: 2rem;
    }
    
    .welcome-section h2 {
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 0.25rem;
    }
    
    .welcome-section p {
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.5);
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
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 12px;
    }
    
    .stat-icon {
        font-size: 1.5rem;
    }
    
    .stat-value {
        display: block;
        font-size: 1.2rem;
        font-weight: 700;
        color: #fff;
    }
    
    .stat-label {
        font-size: 0.65rem;
        color: rgba(255, 255, 255, 0.5);
    }
    
    .recent-section {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 16px;
        padding: 1rem;
    }
    
    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }
    
    .section-header h3 {
        font-size: 0.9rem;
        font-weight: 600;
    }
    
    .view-all {
        background: none;
        border: none;
        color: #00ff9d;
        font-size: 0.7rem;
        cursor: pointer;
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
        padding: 0.6rem 0.8rem;
        background: rgba(255, 255, 255, 0.01);
        border-radius: 8px;
    }
    
    .audit-location {
        font-size: 0.75rem;
        font-weight: 500;
        margin-bottom: 0.2rem;
    }
    
    .cabinet {
        color: rgba(255, 255, 255, 0.5);
    }
    
    .separator {
        color: rgba(255, 255, 255, 0.2);
        margin: 0 0.25rem;
    }
    
    .section {
        color: #00ff9d;
    }
    
    .audit-meta {
        font-size: 0.6rem;
        color: rgba(255, 255, 255, 0.4);
        display: flex;
        gap: 0.3rem;
        align-items: center;
    }
    
    .status-badge {
        font-size: 0.6rem;
        padding: 0.2rem 0.6rem;
        border-radius: 20px;
    }
    
    .status-badge.draft {
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
    }
    
    .status-badge.completed {
        background: rgba(0, 255, 157, 0.1);
        color: #00ff9d;
    }
    
    .empty-state {
        text-align: center;
        padding: 2rem;
        color: rgba(255, 255, 255, 0.4);
    }
    
    @media (max-width: 1000px) {
        .stats-grid {
            grid-template-columns: repeat(3, 1fr);
        }
    }
    
    @media (max-width: 600px) {
        .stats-grid {
            grid-template-columns: repeat(2, 1fr);
        }
        
        .welcome-section h2 {
            font-size: 1.2rem;
        }
    }
</style>