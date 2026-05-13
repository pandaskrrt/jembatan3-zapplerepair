<script lang="ts">
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    
    let { data, children } = $props();
    let user = data?.user;
    
    let isSidebarCollapsed = $state(false);
    let activeMenu = $state<string | null>(null);
    
    const menuItems = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>',
            href: '/superadmin'
        },
        {
            id: 'users',
            label: 'Kelola User',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
            href: '/superadmin/manage-users'
        },
        {
            id: 'reports',
            label: 'Laporan Audit',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
            href: '/superadmin/reports'
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
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
</svelte:head>

<div class="superadmin-layout">
    <!-- Sidebar -->
    <aside class="sidebar" class:collapsed={isSidebarCollapsed}>
        <div class="sidebar-header">
            <div class="logo-area">
                {#if !isSidebarCollapsed}
                    <span class="logo-text">Super Admin</span>
                {/if}
            </div>
            <button class="collapse-btn" onclick={toggleSidebar}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    {#if isSidebarCollapsed}
                        <polyline points="15 18 9 12 15 6"/>
                    {:else}
                        <polyline points="9 18 15 12 9 6"/>
                    {/if}
                </svg>
            </button>
        </div>
        
        <div class="sidebar-content">
            {#each menuItems as item (item.id)}
                <a 
                    href={item.href}
                    class="menu-item {isActive(item.href) ? 'active' : ''}"
                    onclick={(e) => {
                        e.preventDefault();
                        goto(item.href);
                    }}
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
                <div class="user-avatar">👤</div>
                {#if !isSidebarCollapsed}
                    <div class="user-details">
                        <span class="user-name">{user?.username || 'Admin'}</span>
                        <span class="user-role">Super Administrator</span>
                    </div>
                {/if}
            </div>
            <button class="logout-btn" onclick={handleLogout}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                {#if !isSidebarCollapsed}
                    <span>Logout</span>
                {/if}
            </button>
        </div>
    </aside>
    
    <!-- Main Content -->
    <main class="main-content">
        <!-- Top Bar -->
        <div class="top-bar">
            <div class="page-title">
                <h1>
                    {#if $page.url.pathname === '/superadmin'}
                        Dashboard
                    {:else if $page.url.pathname === '/superadmin/users'}
                        Kelola User
                    {:else if $page.url.pathname === '/superadmin/reports'}
                        Laporan Audit
                    {:else}
                        Super Admin Panel
                    {/if}
                </h1>
            </div>
            <div class="top-bar-right">
                <div class="admin-badge">
                    <span class="badge-dot"></span>
                    SUPER ADMIN
                </div>
            </div>
        </div>
        
        <!-- Content -->
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
        font-family: 'Poppins', sans-serif;
        background: #0a0a0f;
        color: #ffffff;
        overflow: hidden;
    }
    
    .superadmin-layout {
        display: flex;
        height: 100vh;
        overflow: hidden;
    }
    
    /* Sidebar */
    .sidebar {
        width: 260px;
        background: #0d0d14;
        border-right: 1px solid rgba(255, 255, 255, 0.06);
        display: flex;
        flex-direction: column;
        transition: width 0.3s ease;
        overflow-y: auto;
        overflow-x: hidden;
    }
    
    .sidebar.collapsed {
        width: 70px;
    }
    
    .sidebar-header {
        padding: 1.2rem 1rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    
    .logo-area {
        display: flex;
        align-items: center;
        gap: 0.6rem;
    }
    
    .logo-icon {
        font-size: 1.6rem;
    }
    
    .logo-text {
        font-size: 1.1rem;
        font-weight: 700;
        background: linear-gradient(135deg, #00ff9d, #00ccff);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }
    
    .collapse-btn {
        width: 28px;
        height: 28px;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #fff;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
    }
    
    .collapse-btn:hover {
        background: rgba(255, 255, 255, 0.1);
    }
    
    .sidebar-content {
        flex: 1;
        padding: 1rem 0;
    }
    
    .menu-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.7rem 1rem;
        margin: 0 0.5rem;
        border-radius: 8px;
        color: rgba(255, 255, 255, 0.6);
        text-decoration: none;
        transition: all 0.2s;
        cursor: pointer;
    }
    
    .menu-item:hover {
        background: rgba(255, 255, 255, 0.05);
        color: #fff;
    }
    
    .menu-item.active {
        background: rgba(0, 255, 157, 0.1);
        color: #00ff9d;
    }
    
    .menu-icon {
        width: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .menu-label {
        font-size: 0.85rem;
        font-weight: 500;
    }
    
    .sidebar-footer {
        padding: 1rem;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
    }
    
    .user-info {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        margin-bottom: 0.8rem;
    }
    
    .user-avatar {
        width: 32px;
        height: 32px;
        background: rgba(0, 255, 157, 0.1);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1rem;
    }
    
    .user-name {
        display: block;
        font-size: 0.8rem;
        font-weight: 500;
        color: #fff;
    }
    
    .user-role {
        font-size: 0.6rem;
        color: rgba(255, 255, 255, 0.4);
    }
    
    .logout-btn {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        width: 100%;
        padding: 0.6rem;
        background: rgba(255, 107, 107, 0.08);
        border: 1px solid rgba(255, 107, 107, 0.2);
        border-radius: 8px;
        color: #ff6b6b;
        font-size: 0.8rem;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .logout-btn:hover {
        background: rgba(255, 107, 107, 0.15);
        border-color: rgba(255, 107, 107, 0.4);
    }
    
    /* Main Content */
    .main-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }
    
    .top-bar {
        height: 60px;
        background: rgba(255, 255, 255, 0.01);
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 2rem;
    }
    
    .page-title h1 {
        font-size: 1.2rem;
        font-weight: 600;
        color: #fff;
    }
    
    .admin-badge {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.3rem 1rem;
        background: rgba(0, 255, 157, 0.1);
        border: 1px solid rgba(0, 255, 157, 0.2);
        border-radius: 20px;
        font-size: 0.7rem;
        color: #00ff9d;
        font-weight: 500;
    }
    
    .badge-dot {
        width: 6px;
        height: 6px;
        background: #00ff9d;
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
        padding: 1.5rem;
    }
    
    .content-area::-webkit-scrollbar {
        width: 6px;
    }
    
    .content-area::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.02);
    }
    
    .content-area::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
    }
    
    /* Responsive */
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