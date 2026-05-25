<script lang="ts">
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    
    let { data, children } = $props();
    let user = data?.user;
    
    let isSidebarCollapsed = $state(false);
    
    // Perbarui daftar menu untuk menyertakan tautan navigasi Deleted Items dan Laporan Periodik
    const menuItems = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>',
            href: '/superadmin'
        },
        {
            id: 'users',
            label: 'Kelola User',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
            href: '/superadmin/manage-users'
        },
        {
            id: 'deleted-items',
            label: 'Tong Sampah Barang',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>',
            href: '/superadmin/deleted-items'
        },
        {
            id: 'periodic-reports',
            label: 'Laporan Periodik',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
            href: '/superadmin/laporan-periodik'
        }
    ];
    
    function toggleSidebar() {
        isSidebarCollapsed = !isSidebarCollapsed;
    }
    
    function isActive(href: string): boolean {
        return $page.url.pathname === href;
    }
    
    function handleLogout() {
        goto('/logout');
    }
</script>

<svelte:head>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
</svelte:head>

<div class="superadmin-layout">
    <aside class="sidebar" class:collapsed={isSidebarCollapsed}>
        <div class="sidebar-header">
            <div class="logo-area">
                <div class="logo-box">SA</div>
                {#if !isSidebarCollapsed}
                    <span class="logo-text">SuperAdmin</span>
                {/if}
            </div>
            <button class="collapse-btn" onclick={toggleSidebar} aria-label="Toggle Sidebar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    {#if isSidebarCollapsed}
                        <polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/>
                    {:else}
                        <polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/>
                    {/if}
                </svg>
            </button>
        </div>
        
        <div class="sidebar-content">
            {#each menuItems as item (item.id)}
                <a 
                    href={item.href}
                    class="menu-item {isActive(item.href) ? 'active' : ''}"
                >
                    <span class="menu-icon">{@html item.icon}</span>
                    {#if !isSidebarCollapsed}
                        <span class="menu-label">{item.label}</span>
                    {/if}
                </a>
            {/each}
        </div>
        
        <div class="sidebar-footer">
            <div class="user-info">
                <div class="user-avatar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                {#if !isSidebarCollapsed}
                    <div class="user-details">
                        <span class="user-name">{user?.name || user?.username || 'Administrator'}</span>
                        <span class="user-role">Super Admin</span>
                    </div>
                {/if}
            </div>
            <button class="logout-btn" onclick={handleLogout}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                {#if !isSidebarCollapsed}
                    <span>Keluar Sistem</span>
                {/if}
            </button>
        </div>
    </aside>
    
    <main class="main-content">
        <div class="top-bar">
            <div class="page-title">
                <h1>
                    {#if $page.url.pathname === '/superadmin'}
                        Ringkasan Dashboard
                    {:else if $page.url.pathname === '/superadmin/manage-users'}
                        Manajemen Hak Akses User
                    {:else if $page.url.pathname === '/superadmin/deleted-items'}
                        Log Pemulihan & Soft-Delete Barang
                    {:else if $page.url.pathname === '/superadmin/laporan-periodik'}
                        Laporan Evaluasi Berkala
                    {:else}
                        Panel Kontrol Super Admin
                    {/if}
                </h1>
            </div>
            <div class="top-bar-right">
                <div class="admin-badge">
                    <span class="badge-dot"></span>
                    Otoritas Super Admin
                </div>
            </div>
        </div>
        
        <div class="content-area">
            {@render children()}
        </div>
    </main>
</div>

<style>
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }
    
    :global(body) {
        font-family: 'Poppins', system-ui, -apple-system, sans-serif;
        background: #f1f5f9; /* Soft light gray canvas */
        color: #1e293b; /* Slate dark text */
        overflow: hidden;
    }
    
    .superadmin-layout {
        display: flex;
        height: 100vh;
        overflow: hidden;
        background-color: #f4f6f9;
    }
    
    /* LIGHT THEME SIDEBAR PANELS */
    .sidebar {
        width: 260px;
        background: #ffffff;
        border-right: 1px solid #e2e8f0;
        display: flex;
        flex-direction: column;
        transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        overflow-y: auto;
        overflow-x: hidden;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.03);
    }
    
    .sidebar.collapsed {
        width: 72px;
    }
    
    .sidebar-header {
        padding: 1.2rem 1rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid #f1f5f9;
    }
    
    .logo-area {
        display: flex;
        align-items: center;
        gap: 0.6rem;
    }
    
    .logo-box {
        width: 32px;
        height: 32px;
        background: #0369a1;
        color: #ffffff;
        font-weight: 700;
        font-size: 0.85rem;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .logo-text {
        font-size: 1rem;
        font-weight: 700;
        color: #0f172a;
        letter-spacing: -0.025em;
    }
    
    .collapse-btn {
        width: 28px;
        height: 28px;
        border-radius: 6px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        color: #64748b;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
    }
    
    .collapse-btn:hover {
        background: #f1f5f9;
        color: #1e293b;
    }
    
    .sidebar-content {
        flex: 1;
        padding: 1rem 0.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }
    
    .menu-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.65rem 0.75rem;
        border-radius: 8px;
        color: #475569;
        text-decoration: none;
        transition: all 0.2s;
        font-weight: 500;
    }
    
    .menu-item:hover {
        background: #f8fafc;
        color: #0f172a;
    }
    
    .menu-item.active {
        background: #e0f2fe; /* Light blue accent background */
        color: #0369a1; /* Primary theme corporate text color */
    }
    
    .menu-icon {
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }
    
    .menu-label {
        font-size: 0.85rem;
        white-space: nowrap;
    }
    
    .sidebar-footer {
        padding: 1rem 0.75rem;
        border-top: 1px solid #f1f5f9;
        background: #f8fafc;
    }
    
    .user-info {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        margin-bottom: 0.75rem;
    }
    
    .user-avatar {
        width: 32px;
        height: 32px;
        background: #cbd5e1;
        color: #334155;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .user-details {
        display: flex;
        flex-direction: column;
        line-height: 1.3;
    }
    
    .user-name {
        font-size: 0.8rem;
        font-weight: 600;
        color: #0f172a;
        white-space: nowrap;
        max-width: 140px;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    .user-role {
        font-size: 0.7rem;
        color: #64748b;
    }
    
    .logout-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        width: 100%;
        padding: 0.55rem;
        background: #fee2e2;
        border: 1px solid #fca5a5;
        border-radius: 8px;
        color: #c2410c;
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .logout-btn:hover {
        background: #fca5a5;
        color: #9a3412;
    }
    
    /* WORKSPACE CONTENT LAYOUT */
    .main-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }
    
    .top-bar {
        height: 60px;
        background: #ffffff;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 2rem;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.01);
    }
    
    .page-title h1 {
        font-size: 1.15rem;
        font-weight: 600;
        color: #0f172a;
    }
    
    .admin-badge {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.3rem 0.85rem;
        background: #dcfce7;
        border: 1px solid #bbf7d0;
        border-radius: 20px;
        font-size: 0.7rem;
        color: #0f6e56;
        font-weight: 600;
        letter-spacing: 0.025em;
    }
    
    .badge-dot {
        width: 6px;
        height: 6px;
        background: #0f6e56;
        border-radius: 50%;
        animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
    }
    
    .content-area {
        flex: 1;
        overflow-y: auto;
        padding: 1.75rem;
        background-color: #f8fafc; /* Canvas background area */
    }
    
    /* Responsive Viewport Queries */
    @media (max-width: 768px) {
        .sidebar {
            position: fixed;
            z-index: 100;
            height: 100vh;
            transform: translateX(-100%);
        }
        
        .sidebar.collapsed {
            width: 260px;
            transform: translateX(0);
        }
        
        .top-bar {
            padding: 0 1rem;
        }
        
        .content-area {
            padding: 1rem;
        }
    }
</style>