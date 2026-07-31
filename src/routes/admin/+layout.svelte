<script lang="ts">
    import { page } from '$app/stores'
    import { goto } from '$app/navigation'

    let { children } = $props()

    let isSidebarCollapsed = $state(false)
    let isMobileOpen = $state(false)
    let activeMenu = $state<string | null>(null)

    interface MenuItem {
        id: string
        label: string
        iconName: 'dashboard' | 'cabinets' | 'sections' | 'items' | 'list' | 'add' | 'category' | 'map' | 'input'
        href: string
        count?: number
        children?: MenuItem[]
    }

    // KEMBALI KE TOTAL DEFAULT ASLI (Semua label menu & sub-menu tidak disentuh)
    const menuItems: MenuItem[] = [
        {
            id: 'dashboard',
            label: 'Dashboard Overview',
            iconName: 'dashboard',
            href: '/admin'
        },
        {
            id: 'cabinets',
            label: 'Cabinets',
            iconName: 'cabinets',
            href: '/admin/cabinets',
            children: [
                { id: 'cabinets-list', label: 'Semua Cabinets', iconName: 'list', href: '/admin/cabinet' },
                { id: 'cabinets-add', label: 'Tambah Cabinets Baru', iconName: 'add', href: '/admin/cabinet/create' }
            ]
        },
        {
            id: 'sections',
            label: 'Sections',
            iconName: 'sections',
            href: '/admin/section',
            children: [
                { id: 'sections-list', label: 'Daftar Section', iconName: 'map', href: '/admin/section' },
                { id: 'sections-add', label: 'Tambah Section', iconName: 'add', href: '/admin/section/create' }
            ]
        },
        {
            id: 'items',
            label: 'Items',
            iconName: 'items',
            href: '/admin/item',
            children: [
                { id: 'items-list', label: 'Stok Items', iconName: 'list', href: '/admin/item' },
                { id: 'items-add', label: 'Input Items', iconName: 'input', href: '/admin/item/create' },
            ]
        },
        {
            id: 'incoming',
            label: 'Barang Masuk',
            iconName: 'input',
            href: '/admin/incoming',
            children: [
                { id: 'incoming-list', label: 'Daftar Barang Masuk', iconName: 'list', href: '/admin/incoming' }
            ]
        },
        {
            id: 'service-form',
            label: 'Service Form',
            iconName: 'list',
            href: '/admin/service-form'
        }
    ]

    function toggleSidebar() {
        isSidebarCollapsed = !isSidebarCollapsed
    }

    function toggleMobileMenu() {
        isMobileOpen = !isMobileOpen
    }

    function toggleSubMenu(menuId: string) {
        if (activeMenu === menuId) {
            activeMenu = null
        } else {
            activeMenu = menuId
        }
    }

    function isActive(href: string): boolean {
        if (href === '/admin') {
            return $page.url.pathname === '/admin'
        }
        return $page.url.pathname.startsWith(href)
    }

    function handleSubMenuKeydown(e: KeyboardEvent, menuId: string) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            toggleSubMenu(menuId)
        }
    }

    function handleLogout() {
        goto('/logout')
    }
</script>

{#snippet renderIcon(name: string)}
    {#if name === 'dashboard'}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
    {:else if name === 'cabinets'}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
    {:else if name === 'sections'}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
    {:else if name === 'list'}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
    {:else if name === 'add'}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
    {:else if name === 'category'}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
    {:else if name === 'map'}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon><line x1="9" y1="3" x2="9" y2="18"></line><line x1="15" y1="6" x2="15" y2="21"></line></svg>
    {:else if name === 'input'}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 10 20 15 15 20"></polyline><path d="M4 4v7a4 4 0 0 0 4 4h12"></path></svg>
    {/if}
{/snippet}

<svelte:head>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
</svelte:head>

<div class="admin-layout">
    <header class="mobile-navbar">
        <div class="logo-area">
            <span class="logo-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1"></path>
                    <path d="M18 8h4a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-4"></path>
                    <circle cx="8" cy="12" r="2"></circle>
                </svg>
            </span>
            <span class="logo-text">JEMBATAN 3</span>
        </div>
        <button class="hamburger-btn" onclick={toggleMobileMenu} aria-label="Toggle Menu">
            {#if isMobileOpen}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            {:else}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="6" x2="20" y2="6"></line><line x1="4" y1="18" x2="20" y2="18"></line></svg>
            {/if}
        </button>
    </header>

    {#if isMobileOpen}
        <div class="sidebar-overlay" onclick={toggleMobileMenu} role="presentation"></div>
    {/if}

    <aside class="sidebar" class:collapsed={isSidebarCollapsed} class:mobile-open={isMobileOpen}>
        <div class="glossy-overlay"></div>

        <div class="sidebar-header">
            <div class="logo-area">
                <span class="logo-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1"></path>
                        <path d="M18 8h4a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-4"></path>
                        <circle cx="8" cy="12" r="2"></circle>
                    </svg>
                </span>
                {#if !isSidebarCollapsed}
                    <span class="logo-text">JEMBATAN 3</span>
                {/if}
            </div>
            <button
                class="collapse-btn"
                onclick={toggleSidebar}
                aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
                <span class="collapse-icon">{isSidebarCollapsed ? '→' : '←'}</span>
            </button>
        </div>

        <div class="sidebar-content">
            {#each menuItems as item (item.id)}
                <div class="menu-section">
                    {#if item.children}
                        <div class="menu-parent">
                            <div
                                class="menu-item has-children"
                                class:active={isActive(item.href)}
                                class:expanded={activeMenu === item.id}
                                onclick={() => toggleSubMenu(item.id)}
                                onkeydown={(e) => handleSubMenuKeydown(e, item.id)}
                                role="button"
                                tabindex="0"
                                aria-label={`${item.label} menu`}
                                aria-expanded={activeMenu === item.id}
                            >
                                <span class="menu-icon">
                                    {@render renderIcon(item.iconName)}
                                </span>
                                {#if !isSidebarCollapsed}
                                    <span class="menu-label">{item.label}</span>
                                    {#if item.count !== undefined}
                                        <span class="menu-count">{item.count}</span>
                                    {/if}
                                    <span class="menu-arrow" class:rotated={activeMenu === item.id}>
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                    </span>
                                {/if}
                            </div>

                            {#if !isSidebarCollapsed && activeMenu === item.id}
                                <div class="submenu">
                                    {#each item.children as child (child.id)}
                                        <a
                                            href={child.href}
                                            class="submenu-item"
                                            class:active={isActive(child.href)}
                                            onclick={() => { isMobileOpen = false }}
                                        >
                                            <span class="submenu-icon">
                                                {@render renderIcon(child.iconName)}
                                            </span>
                                            <span class="submenu-label">{child.label}</span>
                                        </a>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                    {:else}
                        <a
                            href={item.href}
                            class="menu-item"
                            class:active={isActive(item.href)}
                            aria-label={item.label}
                        >
                            <span class="menu-icon">
                                {@render renderIcon(item.iconName)}
                            </span>
                            {#if !isSidebarCollapsed}
                                <span class="menu-label">{item.label}</span>
                            {/if}
                        </a>
                    {/if}
                </div>
            {/each}
        </div>

        <div class="sidebar-footer">
            <div class="user-info">
                <div class="user-avatar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </div>
                {#if !isSidebarCollapsed}
                    <div class="user-details">
                        <span class="user-name">Logistics Admin</span>
                        <span class="user-role">Gudang Utama</span>
                    </div>
                {/if}
            </div>

            <button
                class="logout-btn"
                onclick={handleLogout}
                aria-label="Logout"
            >
                <span class="logout-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                </span>
                {#if !isSidebarCollapsed}
                    <span class="logout-text">LOGOUT</span>
                {/if}
            </button>
        </div>
    </aside>

    <main class="main-content">
        <div class="content-area">
            {@render children?.()}
        </div>
    </main>
</div>

<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    :global(body) {
        font-family: 'Inter', sans-serif;
        background-color: #0b0b0c;
        color: #e3e4e6;
        overflow: hidden;
    }

    .admin-layout {
        display: flex;
        height: 100vh;
        overflow: hidden;
        background: #0b0b0c;
        position: relative;
    }

    .mobile-navbar {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 64px;
        background: rgba(18, 18, 20, 0.95);
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        padding: 0 1.25rem;
        align-items: center;
        justify-content: space-between;
        z-index: 999;
        backdrop-filter: blur(16px);
    }

    .hamburger-btn {
        background: none;
        border: none;
        color: #a1a1a5;
        cursor: pointer;
        padding: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .sidebar-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
        z-index: 1001;
    }

    .sidebar {
        width: 260px;
        background: rgba(18, 18, 20, 0.7);
        border-right: 1px solid rgba(255, 255, 255, 0.06);
        display: flex;
        flex-direction: column;
        transition: width 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
        position: relative;
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        box-shadow: 15px 0 35px rgba(0, 0, 0, 0.6);
        z-index: 10;
    }

    .sidebar.collapsed { width: 70px; }

    .glossy-overlay {
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: linear-gradient(140deg, rgba(255, 255, 255, 0.02) 0%, transparent 60%);
        pointer-events: none;
    }

    .sidebar-header {
        padding: 1.5rem 1rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    .logo-area { display: flex; align-items: center; gap: 0.75rem; }
    .logo-icon { display: flex; align-items: center; color: #ffffff; }
    .logo-text { font-size: 0.95rem; font-weight: 700; letter-spacing: 1.5px; color: #ffffff; }

    .collapse-btn {
        width: 26px; height: 26px; border-radius: 6px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        color: #88888c;
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        font-size: 0.75rem;
        transition: all 0.2s ease;
    }

    .collapse-btn:hover {
        background: rgba(255, 255, 255, 0.08);
        color: #ffffff;
        border-color: rgba(255, 255, 255, 0.2);
    }

    .sidebar-content { flex: 1; padding: 1rem 0; overflow-y: auto; }
    .sidebar-content::-webkit-scrollbar { width: 3px; }
    .sidebar-content::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 4px; }

    .menu-section { margin-bottom: 0.25rem; }

    .menu-item {
        display: flex; align-items: center;
        padding: 0.75rem 1rem; margin: 0 0.5rem;
        border-radius: 8px; color: #a1a1a5;
        text-decoration: none; transition: all 0.2s ease;
        cursor: pointer; outline: none; border: 1px solid transparent;
        font-weight: 500;
    }

    .menu-item:hover { background: rgba(255, 255, 255, 0.04); color: #ffffff; }

    .menu-item.active {
        background: #ffffff;
        color: #000000;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(255, 255, 255, 0.15);
    }

    .menu-icon { min-width: 22px; margin-right: 0.75rem; display: flex; align-items: center; justify-content: center; }
    .menu-label { flex: 1; font-size: 0.9rem; letter-spacing: 0.2px; }

    .menu-count {
        background: rgba(255, 255, 255, 0.08);
        padding: 0.1rem 0.4rem; border-radius: 6px;
        font-size: 0.75rem; margin-right: 0.5rem; color: #ffffff;
    }
    .menu-item.active .menu-count { background: rgba(0, 0, 0, 0.1); color: #000000; }

    .menu-arrow { display: flex; align-items: center; transition: transform 0.2s ease; color: #66666c; }
    .menu-arrow.rotated { transform: rotate(180deg); color: inherit; }

    .submenu { margin-left: 1.5rem; padding: 0.25rem 0; border-left: 1px solid rgba(255, 255, 255, 0.06); }
    .submenu-item {
        display: flex; align-items: center;
        padding: 0.5rem 1rem; margin: 0.25rem 0.5rem 0.25rem 0.75rem;
        border-radius: 6px; color: #71717a; text-decoration: none;
        transition: all 0.2s ease; font-size: 0.85rem; font-weight: 500;
    }

    .submenu-item:hover { color: #ffffff; background: rgba(255, 255, 255, 0.03); }
    .submenu-item.active { color: #ffffff; font-weight: 600; }
    .submenu-icon { min-width: 20px; margin-right: 0.5rem; opacity: 0.6; display: flex; align-items: center; }

    .sidebar-footer { 
        padding: 1rem; 
        border-top: 1px solid rgba(255, 255, 255, 0.06); 
        display: flex; flex-direction: column; gap: 0.75rem; 
        background: rgba(14, 14, 16, 0.5); 
    }
    .user-info { display: flex; align-items: center; gap: 0.75rem; }
    
    .user-avatar {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
        border-radius: 8px; color: #a1a1a5;
    }

    .user-details { display: flex; flex-direction: column; }
    .user-name { font-weight: 600; color: #ffffff; font-size: 0.85rem; }
    .user-role { font-size: 0.75rem; color: #71717a; }

    .logout-btn {
        display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.6rem;
        background: transparent; border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px; color: #ffffff; cursor: pointer; transition: all 0.2s ease;
        width: 100%; font-size: 0.8rem; font-weight: 600; letter-spacing: 1px;
    }
    .logout-btn:hover { background: #ffffff; color: #000000; border-color: #ffffff; }
    .logout-icon { display: flex; align-items: center; }

    .main-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; position: relative; z-index: 1; }
    .content-area { flex: 1; overflow-y: auto; padding: 2rem; background: #0b0b0c; }
    
    .content-area::-webkit-scrollbar { width: 5px; }
    .content-area::-webkit-scrollbar-track { background: #0b0b0c; }
    .content-area::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 6px; }
    .content-area::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.15); }

    @media (max-width: 768px) {
        .admin-layout {
            flex-direction: column;
        }

        .mobile-navbar {
            display: flex;
        }

        .sidebar {
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            height: 100vh;
            width: 260px;
            transform: translateX(-100%);
            z-index: 1002;
        }

        .sidebar.mobile-open {
            transform: translateX(0);
        }

        .sidebar.collapsed .menu-label,
        .sidebar.collapsed .menu-arrow,
        .sidebar.collapsed .menu-count,
        .sidebar.collapsed .user-details,
        .sidebar.collapsed .logout-text {
            display: flex;
        }

        .sidebar-header {
            display: none;
        }

        .main-content {
            margin-left: 0;
            padding-top: 64px;
            height: calc(100vh - 64px);
        }

        .content-area { padding: 1.25rem; }
    }
</style>