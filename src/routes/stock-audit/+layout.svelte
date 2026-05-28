<script lang="ts">
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    let { children } = $props();

    let isSidebarCollapsed = $state(false);
    let statusDropdownOpen = $state(false);
    let selectedStatus = $state<string | null>(null);

    interface MenuItem {
        id: string;
        label: string;
        href: string;
    }

    const menuItems: MenuItem[] = [
        { id: 'dashboard', label: 'Dashboard', href: '/stock-audit' },
        { id: 'riwayat', label: 'Riwayat Audit', href: '/stock-audit/riwayat' },
        { id: 'laporan', label: 'Laporan', href: '/stock-audit/laporan' }
    ];

    const statusOptions = [
        { 
            id: 'DRAFT', 
            label: 'Draft', 
            color: '#f59e0b',
            description: 'Audit sedang berjalan / belum disubmit'
        },
        { 
            id: 'COMPLETED', 
            label: 'Completed', 
            color: '#10b981',
            description: 'Audit telah selesai & disubmit resmi'
        }
    ];

    function toggleSidebar() {
        isSidebarCollapsed = !isSidebarCollapsed;
    }

    function isActive(href: string): boolean {
        const currentPath = $page.url.pathname;
        if (href === '/stock-audit/laporan') {
            return currentPath.startsWith('/stock-audit/laporan');
        }
        return currentPath === href;
    }

    function handleMenuKeydown(e: KeyboardEvent, href: string) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            goto(href);
        }
    }

    function handleLogout() {
        goto('/logout');
    }

    function handleStatusSelect(statusId: string) {
        selectedStatus = statusId;
        statusDropdownOpen = false;
        goto(`/stock-audit/status/${statusId.toLowerCase()}`);
    }

    function startNewAudit() {
        goto('/stock-audit/new');
    }

    function toggleStatusDropdown() {
        statusDropdownOpen = !statusDropdownOpen;
    }

    onMount(() => {
        function handleDocumentClick(event: MouseEvent) {
            const target = event.target as HTMLElement;
            if (!target.closest('.status-sidebar-wrapper')) {
                statusDropdownOpen = false;
            }
        }
        document.addEventListener('click', handleDocumentClick);
        return () => document.removeEventListener('click', handleDocumentClick);
    });
</script>

<svelte:head>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</svelte:head>

<div class="admin-layout">
    <aside class="sidebar" class:collapsed={isSidebarCollapsed}>
        <div class="sidebar-header">
            <div class="logo-area">
                <span class="logo-icon">
                   <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        <path d="M12 8v8"/>
                        <path d="M8 11v5"/>
                        <path d="M16 13v3"/>
                    </svg>
                </span>
                {#if !isSidebarCollapsed}
                    <span class="logo-text">ROXY<span class="accent-text">audit</span></span>
                {/if}
            </div>
            <button 
                class="collapse-btn" 
                onclick={toggleSidebar}
                aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="arrow-icon" class:rotated={isSidebarCollapsed}>
                    <polyline points="11 17 6 12 11 7"/>
                    <polyline points="18 17 13 12 18 7"/>
                </svg>
            </button>
        </div>

        <div class="sidebar-content">
            <div class="menu-group">
                {#if !isSidebarCollapsed}
                    <span class="group-title">Menu Utama</span>
                {/if}
                
                {#each menuItems as item (item.id)}
                    <a 
                        href={item.href}
                        class="menu-item"
                        class:active={isActive(item.href)}
                        onclick={(e) => {
                            e.preventDefault();
                            goto(item.href);
                        }}
                        onkeydown={(e) => handleMenuKeydown(e, item.href)}
                        role="button"
                        tabindex="0"
                        aria-label={item.label}
                    >
                        <span class="menu-icon">
                            {#if item.id === 'dashboard'}
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
                            {:else if item.id === 'riwayat'}
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="9"/><path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5"/></svg>
                            {:else}
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
                            {/if}
                        </span>
                        {#if !isSidebarCollapsed}
                            <span class="menu-label">{item.label}</span>
                        {/if}
                    </a>
                {/each}
            </div>

            <div class="status-sidebar-wrapper">
                <div class="menu-group">
                    {#if !isSidebarCollapsed}
                        <span class="group-title">Filter Cepat</span>
                    {/if}
                    <button 
                        class="menu-item status-trigger"
                        class:active={statusDropdownOpen}
                        onclick={toggleStatusDropdown}
                        onkeydown={(e) => e.key === 'Enter' && toggleStatusDropdown()}
                        aria-label="Quick status filter"
                        aria-expanded={statusDropdownOpen}
                    >
                        <span class="menu-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>
                            </svg>
                        </span>
                        {#if !isSidebarCollapsed}
                            <span class="menu-label">Status Klasifikasi</span>
                            <span class="dropdown-arrow" class:open={statusDropdownOpen}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="6 9 12 15 18 9"/>
                                </svg>
                            </span>
                        {/if}
                    </button>

                    {#if !isSidebarCollapsed && statusDropdownOpen}
                        <div class="status-submenu">
                            {#each statusOptions as status}
                                <button 
                                    class="submenu-item"
                                    class:active={selectedStatus === status.id}
                                    onclick={() => handleStatusSelect(status.id)}
                                    onkeydown={(e) => e.key === 'Enter' && handleStatusSelect(status.id)}
                                    style="--status-color: {status.color}"
                                >
                                    <span class="status-indicator-dot"></span>
                                    <div class="submenu-content">
                                        <span class="submenu-label">{status.label}</span>
                                        <span class="status-desc">{status.description}</span>
                                    </div>
                                </button>
                            {/each}
                        </div>
                    {/if}
                </div>
            </div>

            {#if !isSidebarCollapsed}
                <div class="new-audit-section">
                    <button class="new-audit-sidebar-btn" onclick={startNewAudit}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        <span>Mulai Audit Baru</span>
                    </button>
                </div>
            {/if}
        </div>

        <div class="sidebar-footer">
            <div class="user-info">
                <div class="user-avatar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                </div>
                {#if !isSidebarCollapsed}
                    <div class="user-details">
                        <span class="user-name">Audit Staff</span>
                        <span class="user-role">Internal Auditor</span>
                    </div>
                {/if}
            </div>
            
            <button class="logout-btn" onclick={handleLogout} aria-label="Logout">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                {#if !isSidebarCollapsed}
                    <span>Log Keluar</span>
                {/if}
            </button>
        </div>
    </aside>

    <main class="main-content">
        <header class="top-bar">
            <div class="page-title">
                <h1>
                    {#if $page.url.pathname === '/stock-audit'}
                        Dashboard Pemantauan Stock
                    {:else if $page.url.pathname === '/stock-audit/riwayat'}
                        Daftar Riwayat Pergerakan
                    {:else if $page.url.pathname.includes('/status/draft')}
                        Berkas Draft Audit
                    {:else if $page.url.pathname.includes('/status/completed')}
                        Berkas Selesai Audit
                    {:else if $page.url.pathname === '/stock-audit/new'}
                        Form Registrasi Audit Baru
                    {:else if $page.url.pathname.startsWith('/stock-audit/laporan')}
                        Evaluasi Laporan Berkala
                    {:else}
                        Stock Audit System
                    {/if}
                </h1>
            </div>

            {#if $page.url.pathname === '/stock-audit'}
                <div class="status-badge-group">
                    <span class="status-badge indicator-draft">
                        <span class="status-dot"></span>
                        Draft Modifikasi
                    </span>
                    <span class="status-badge indicator-completed">
                        <span class="status-dot"></span>
                        Arsip Selesai
                    </span>
                </div>
            {/if}
        </header>

        <div class="content-area">
            {@render children?.()}
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
        font-family: 'Plus Jakarta Sans', sans-serif;
        background-color: #050506;
        color: #f4f4f6;
        overflow: hidden;
    }

    .admin-layout {
        display: flex;
        height: 100vh;
        width: 100vw;
        overflow: hidden;
        background-color: #050506;
    }

    /* --- SIDEBAR BACKPLATE STYLE --- */
    .sidebar {
        width: 270px;
        background: #0a0a0c;
        border-right: 1px solid rgba(255, 255, 255, 0.06);
        display: flex;
        flex-direction: column;
        transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        flex-shrink: 0;
    }

    .sidebar.collapsed {
        width: 78px;
    }

    .sidebar-header {
        height: 70px;
        padding: 0 1.25rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .logo-area {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .logo-icon {
        color: #ffffff;
        display: flex;
        align-items: center;
    }

    .logo-text {
        font-size: 0.95rem;
        font-weight: 700;
        letter-spacing: 1.5px;
        color: #ffffff;
    }

    .accent-text {
        color: rgba(255, 255, 255, 0.4);
        font-weight: 400;
    }

    .collapse-btn {
        width: 28px;
        height: 28px;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.06);
        color: rgba(255, 255, 255, 0.6);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
    }

    .collapse-btn:hover {
        background: rgba(255, 255, 255, 0.08);
        color: #ffffff;
    }

    .arrow-icon {
        transition: transform 0.25s ease;
    }

    .arrow-icon.rotated {
        transform: rotate(180deg);
    }

    /* --- SIDEBAR NAVIGATION --- */
    .sidebar-content {
        flex: 1;
        padding: 1.25rem 0;
        overflow-y: auto;
    }

    .menu-group {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        margin-bottom: 1.5rem;
    }

    .group-title {
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: rgba(255, 255, 255, 0.3);
        padding: 0 1.5rem;
        margin-bottom: 0.5rem;
        font-weight: 600;
    }

    .menu-item {
        display: flex;
        align-items: center;
        padding: 0.7rem 1.25rem;
        margin: 0 0.75rem;
        border-radius: 8px;
        color: rgba(255, 255, 255, 0.65);
        text-decoration: none;
        transition: all 0.15s ease;
        cursor: pointer;
        background: transparent;
        border: none;
        width: calc(100% - 1.5rem);
        font-family: inherit;
        font-size: 0.9rem;
        font-weight: 500;
        position: relative;
    }

    .menu-item:hover {
        background: rgba(255, 255, 255, 0.04);
        color: #ffffff;
    }

    .menu-item.active {
        background: rgba(255, 255, 255, 0.07);
        color: #ffffff;
        font-weight: 600;
    }

    .menu-item.active::before {
        content: '';
        position: absolute;
        left: 0;
        top: 25%;
        height: 50%;
        width: 3px;
        background-color: #ffffff;
        border-radius: 0 4px 4px 0;
    }

    .menu-icon {
        min-width: 24px;
        margin-right: 0.75rem;
        display: flex;
        align-items: center;
        color: inherit;
    }

    .sidebar.collapsed .menu-icon {
        margin-right: 0;
        justify-content: center;
        width: 100%;
    }

    .sidebar.collapsed .menu-item {
        justify-content: center;
        padding: 0.75rem;
    }

    .menu-label {
        flex: 1;
        text-align: left;
    }

    .dropdown-arrow {
        display: flex;
        align-items: center;
        transition: transform 0.2s ease;
        opacity: 0.6;
    }

    .dropdown-arrow.open {
        transform: rotate(180deg);
    }

    /* --- STATUS FILTER COLLAPSIBLE --- */
    .status-submenu {
        margin: 0.25rem 0.75rem 0 0.75rem;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 8px;
        padding: 0.25rem;
        border: 1px solid rgba(255, 255, 255, 0.03);
    }

    .submenu-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.6rem 0.75rem;
        border-radius: 6px;
        color: rgba(255, 255, 255, 0.55);
        cursor: pointer;
        background: transparent;
        border: none;
        width: 100%;
        font-family: inherit;
        transition: all 0.15s ease;
    }

    .submenu-item:hover {
        background: rgba(255, 255, 255, 0.03);
        color: #ffffff;
    }

    .submenu-item.active {
        color: #ffffff;
        background: rgba(255, 255, 255, 0.05);
    }

    .status-indicator-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background-color: var(--status-color, #ffffff);
        box-shadow: 0 0 8px var(--status-color);
        flex-shrink: 0;
    }

    .submenu-content {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 1px;
    }

    .submenu-label {
        font-size: 0.85rem;
        font-weight: 500;
    }

    .status-desc {
        font-size: 0.7rem;
        color: rgba(255, 255, 255, 0.35);
        text-align: left;
    }

    /* --- ACTION REGISTRATION BUTTON --- */
    .new-audit-section {
        padding: 0.5rem 0.75rem;
    }

    .new-audit-sidebar-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.65rem;
        background: #ffffff;
        border: 1px solid #ffffff;
        border-radius: 8px;
        color: #000000;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        width: 100%;
        font-family: inherit;
        font-size: 0.85rem;
        font-weight: 600;
    }

    .new-audit-sidebar-btn:hover {
        background: rgba(255, 255, 255, 0.9);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(255, 255, 255, 0.15);
    }

    /* --- SIDEBAR FOOTER COMPONENT --- */
    .sidebar-footer {
        padding: 1rem 0.75rem;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .user-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0 0.5rem;
    }

    .user-avatar {
        width: 32px;
        height: 32px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(255, 255, 255, 0.8);
    }

    .user-details {
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .user-name {
        font-size: 0.85rem;
        font-weight: 600;
        color: #ffffff;
    }

    .user-role {
        font-size: 0.7rem;
        color: rgba(255, 255, 255, 0.4);
    }

    .logout-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.6rem;
        background: rgba(239, 68, 68, 0.03);
        border: 1px solid rgba(239, 68, 68, 0.1);
        border-radius: 6px;
        color: #ef4444;
        cursor: pointer;
        transition: all 0.15s ease;
        width: 100%;
        font-family: inherit;
        font-size: 0.85rem;
        font-weight: 500;
    }

    .logout-btn:hover {
        background: rgba(239, 68, 68, 0.08);
        border-color: #ef4444;
    }

    /* --- MAIN BODY & TOPBAR WORKSPACE --- */
    .main-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        background: #050506;
    }

    .top-bar {
        height: 70px;
        background: #0a0a0c;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 2rem;
        flex-shrink: 0;
    }

    .page-title h1 {
        font-size: 1.15rem;
        font-weight: 600;
        color: #ffffff;
        letter-spacing: -0.3px;
    }

    .status-badge-group {
        display: flex;
        gap: 0.75rem;
    }

    .status-badge {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.35rem 0.75rem;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 500;
    }

    .status-badge.indicator-draft {
        background: rgba(245, 158, 11, 0.05);
        border: 1px solid rgba(245, 158, 11, 0.15);
        color: #f59e0b;
    }

    .status-badge.indicator-completed {
        background: rgba(16, 185, 129, 0.05);
        border: 1px solid rgba(16, 185, 129, 0.15);
        color: #10b981;
    }

    .status-dot {
        width: 5px;
        height: 5px;
        border-radius: 50%;
    }

    .indicator-draft .status-dot {
        background: #f59e0b;
        box-shadow: 0 0 6px #f59e0b;
    }

    .indicator-completed .status-dot {
        background: #10b981;
        box-shadow: 0 0 6px #10b981;
    }

    .content-area {
        flex: 1;
        overflow-y: auto;
        padding: 2rem;
    }

    /* --- RESPONSIVE WORKSPACE OVERLAY --- */
    @media (max-width: 768px) {
        .sidebar {
            position: fixed;
            z-index: 100;
            height: 100vh;
        }
        .sidebar.collapsed {
            transform: translateX(-100%);
        }
        .top-bar {
            padding: 0 1rem;
        }
    }
</style>