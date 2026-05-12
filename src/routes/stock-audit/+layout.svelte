<script lang="ts">
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';

	let { children } = $props();

    let isSidebarCollapsed = $state(false);
    let activeMenu = $state<string | null>(null);
    let statusDropdownOpen = $state(false);

    // New menu structure for audit user
    interface MenuItem {
        id: string;
        label: string;
        icon: string;
        href: string;
        count?: number;
        children?: MenuItem[];
    }

    const menuItems: MenuItem[] = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><title xmlns="">empty-dashboard-outline-rounded</title><path fill="#ffffff" d="M7.116 17.692h3.423q.343 0 .575-.232t.232-.575V14.96q0-.343-.232-.575t-.575-.232H7.116q-.344 0-.576.232t-.232.576v1.923q0 .343.232.575t.576.232m0-4.846h3.423q.343 0 .575-.232t.232-.575V7.116q0-.344-.232-.576t-.576-.232H7.116q-.344 0-.576.232t-.232.576v4.923q0 .343.232.575t.576.232m6.346 4.846h3.423q.343 0 .575-.232t.232-.575V11.96q0-.343-.232-.575t-.576-.232h-3.422q-.344 0-.576.232t-.232.576v4.923q0 .343.232.575t.576.232m0-7.846h3.423q.343 0 .575-.232t.232-.575V7.116q0-.344-.232-.576t-.575-.232H13.46q-.343 0-.575.232t-.232.575v1.923q0 .344.232.576t.576.232M5.616 20q-.691 0-1.153-.462T4 18.384V5.616q0-.691.463-1.153T5.616 4h12.769q.69 0 1.153.463T20 5.616v2.153h1.039q.212 0 .356.144q.143.144.143.357t-.143.356t-.357.143H20V11.5h1.039q.212 0 .356.144t.143.357t-.143.356t-.357.143H20v2.73h1.039q.212 0 .356.145t.143.357t-.143.356t-.357.143H20v2.153q0 .691-.462 1.153T18.384 20zm0-1h12.769q.23 0 .423-.192t.192-.424V5.616q0-.231-.192-.424T18.384 5H5.616q-.231 0-.424.192T5 5.616v12.769q0 .23.192.423t.423.192M5 5v14z"/></svg>',
            href: '/audit/dashboard'
        },
        {
            id: 'riwayat',
            label: 'Riwayat Audit',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
            href: '/audit/riwayat'
        }
    ];

    // Status options for quick status dropdown
    const statusOptions = [
        { id: 'pending', label: 'Pending', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>', color: '#f59e0b' },
        { id: 'approve', label: 'Approve', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>', color: '#10b981' },
        { id: 'reject', label: 'Reject', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>', color: '#ef4444' }
    ];

    let selectedStatus = $state<string | null>(null);

    function toggleSidebar() {
        isSidebarCollapsed = !isSidebarCollapsed;
    }

    function toggleSubMenu(menuId: string) {
        if (activeMenu === menuId) {
            activeMenu = null;
        } else {
            activeMenu = menuId;
        }
    }

    function isActive(href: string): boolean {
        return $page.url.pathname === href;
    }

    function handleMenuKeydown(e: KeyboardEvent, href: string) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            goto(href);
        }
    }

    function handleLogout() {
        console.log('Logout clicked');
        goto('/logout');
    }

    function handleStatusSelect(statusId: string) {
        selectedStatus = statusId;
        statusDropdownOpen = false;
        console.log(`Selected status: ${statusId}`);
        goto(`/audit/status/${statusId}`);
    }

    function startNewAudit() {
        console.log('Starting new audit');
        goto('/audit/new');
    }

    function toggleStatusDropdown() {
        statusDropdownOpen = !statusDropdownOpen;
    }

    // Close dropdown when clicking outside
    function handleDocumentClick(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (!target.closest('.status-sidebar-wrapper')) {
            statusDropdownOpen = false;
        }
    }

    if (typeof window !== 'undefined') {
        document.addEventListener('click', handleDocumentClick);
    }

    // Helper to render SVG from string
    function renderSVG(svgString: string) {
        return new DOMParser().parseFromString(svgString, 'text/html').body.firstChild;
    }
</script>

<svelte:head>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</svelte:head>

<div class="admin-layout">
    <!-- Sidebar -->
    <aside class="sidebar" class:collapsed={isSidebarCollapsed}>
        <!-- Sidebar Header -->
        <div class="sidebar-header">
            <div class="logo-area">
                <span class="logo-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><title xmlns="">audit-02</title><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5">
                        <path stroke-linejoin="round" d="M19 11v-1c0-3.771 0-5.657-1.172-6.828S14.771 2 11 2S5.343 2 4.172 3.172S3 6.229 3 10v4c0 3.771 0 5.657 1.172 6.828S7.229 22 11 22"/>
                        <path d="m21 22l-1.714-1.714m.571-2.857a3.429 3.429 0 1 1-6.857 0a3.429 3.429 0 0 1 6.857 0Z"/>
                        <path stroke-linejoin="round" d="M7 7h8m-8 4h4"/></g>
                    </svg>
                </span>
                {#if !isSidebarCollapsed}
                    <span class="logo-text">Audit System</span>
                {/if}
            </div>
            <button 
                class="collapse-btn" 
                onclick={toggleSidebar}
                aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
                <span class="collapse-icon">
                    {#if isSidebarCollapsed}
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                    {:else}
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                    {/if}
                </span>
            </button>
        </div>

        <!-- Sidebar Content -->
        <div class="sidebar-content">
            <!-- Main Navigation Menu -->
            {#each menuItems as item (item.id)}
                <div class="menu-section">
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
                        <span class="menu-icon" dangerouslySetInnerHTML={{ html: item.icon }}></span>
                        {#if !isSidebarCollapsed}
                            <span class="menu-label">{item.label}</span>
                        {/if}
                    </a>
                </div>
            {/each}

            <!-- Divider -->
            {#if !isSidebarCollapsed}
                <div class="sidebar-divider"></div>
            {/if}

            <!-- Quick Status Dropdown (Sidebar) -->
            <div class="status-sidebar-wrapper">
                <div class="menu-section">
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
                                <path d="M3 6h18"/><path d="M7 12h10"/><path d="M10 18h4"/>
                                <circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/>
                                <circle cx="10" cy="12" r="2"/><circle cx="18" cy="12" r="2"/>
                                <circle cx="10" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>
                            </svg>
                        </span>
                        {#if !isSidebarCollapsed}
                            <span class="menu-label">Status Cepat</span>
                            <span class="dropdown-arrow" class:open={statusDropdownOpen}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="6 9 12 15 18 9"/>
                                </svg>
                            </span>
                        {/if}
                    </button>

                    <!-- Submenu for status options -->
                    {#if !isSidebarCollapsed && statusDropdownOpen}
                        <div class="status-submenu">
                            {#each statusOptions as status}
                                <button 
                                    class="submenu-item status-item"
                                    class:active={selectedStatus === status.id}
                                    onclick={() => handleStatusSelect(status.id)}
                                    onkeydown={(e) => e.key === 'Enter' && handleStatusSelect(status.id)}
                                    style="--status-color: {status.color}"
                                >
                                    <span class="submenu-icon" dangerouslySetInnerHTML={{ html: status.icon }}></span>
                                    <span class="submenu-label">{status.label}</span>
                                </button>
                            {/each}
                        </div>
                    {/if}
                </div>
            </div>

            <!-- Start New Audit Button (Sidebar) -->
            {#if !isSidebarCollapsed}
                <div class="menu-section new-audit-section">
                    <button 
                        class="new-audit-sidebar-btn" 
                        onclick={startNewAudit}
                        onkeydown={(e) => e.key === 'Enter' && startNewAudit()}
                        aria-label="Start new audit"
                    >
                        <span class="new-audit-sidebar-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 5v14M5 12h14"/>
                            </svg>
                        </span>
                        <span class="new-audit-sidebar-text">Mulai Audit Baru</span>
                    </button>
                </div>
            {/if}
        </div>

        <!-- Sidebar Footer dengan Logout Button -->
        <div class="sidebar-footer">
            <div class="user-info">
                <span class="user-avatar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                    </svg>
                </span>
                {#if !isSidebarCollapsed}
                    <div class="user-details">
                        <span class="user-name">Audit User</span>
                        <span class="user-role">Internal Auditor</span>
                    </div>
                {/if}
            </div>
            
            <!-- Logout Button -->
            <button 
                class="logout-btn" 
                onclick={handleLogout}
                onkeydown={(e) => e.key === 'Enter' && handleLogout()}
                aria-label="Logout"
            >
                <span class="logout-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16 17 21 12 16 7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                </span>
                {#if !isSidebarCollapsed}
                    <span class="logout-text">Logout</span>
                {/if}
            </button>
        </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content" class:sidebar-collapsed={isSidebarCollapsed}>
        <!-- Top Bar - Simplified (no actions here anymore) -->
        <div class="top-bar">
            <div class="page-title">
                <h1>
                    {#if $page.url.pathname === '/audit/dashboard'}
                        Dashboard
                    {:else if $page.url.pathname === '/audit/riwayat'}
                        Riwayat Audit
                    {:else if $page.url.pathname.includes('/status/')}
                        Status: {selectedStatus ? selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1) : 'Filter'}
                    {:else if $page.url.pathname === '/audit/new'}
                        Audit Baru
                    {:else}
                        Audit System
                    {/if}
                </h1>
            </div>
        </div>

        <!-- Page Content -->
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
        font-family: 'Poppins', sans-serif;
        background: #000000;
        color: #ffffff;
        overflow: hidden;
    }

    :global(svg) {
        vertical-align: middle;
    }

    .admin-layout {
        display: flex;
        height: 100vh;
        overflow: hidden;
    }

    /* Sidebar - Pure Black */
    .sidebar {
        width: 280px;
        background: #000000;
        border-right: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        flex-direction: column;
        transition: width 0.3s ease;
        position: relative;
        overflow-y: auto;
        overflow-x: hidden;
    }

    .sidebar.collapsed {
        width: 80px;
    }

    /* Sidebar Header */
    .sidebar-header {
        padding: 1.5rem 1rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .logo-area {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .logo-icon {
        font-size: 2rem;
        filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.2));
        display: flex;
        align-items: center;
        color: #ffffff;
    }

    .logo-text {
        font-family: 'Poppins', sans-serif;
        font-size: 1.2rem;
        font-weight: 600;
        color: #ffffff;
        letter-spacing: 1px;
    }

    .collapse-btn {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #ffffff;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
    }

    .collapse-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.2);
    }

    .collapse-icon {
        display: flex;
        align-items: center;
    }

    /* Sidebar Content */
    .sidebar-content {
        flex: 1;
        padding: 1rem 0;
        overflow-y: auto;
    }

    .sidebar-content::-webkit-scrollbar {
        width: 4px;
    }

    .sidebar-content::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.02);
    }

    .sidebar-content::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
    }

    .sidebar-divider {
        height: 1px;
        background: rgba(255, 255, 255, 0.08);
        margin: 0.75rem 1rem;
    }

    .menu-section {
        margin-bottom: 0.5rem;
    }

    .menu-item {
        display: flex;
        align-items: center;
        padding: 0.75rem 1rem;
        margin: 0 0.5rem;
        border-radius: 10px;
        color: rgba(255, 255, 255, 0.7);
        text-decoration: none;
        transition: all 0.2s ease;
        cursor: pointer;
        outline: none;
        position: relative;
        background: transparent;
        border: none;
        width: calc(100% - 1rem);
        font-family: 'Poppins', sans-serif;
        font-size: 0.95rem;
    }

    .menu-item:hover {
        background: rgba(255, 255, 255, 0.05);
        color: #ffffff;
    }

    .menu-item.active {
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
        border-left: 3px solid #ffffff;
    }

    .menu-item:focus-visible {
        outline: 2px solid #ffffff;
        outline-offset: 2px;
    }

    .menu-icon {
        min-width: 24px;
        margin-right: 0.75rem;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .menu-icon :global(svg) {
        width: 20px;
        height: 20px;
    }

    .menu-label {
        flex: 1;
        font-size: 0.95rem;
        font-weight: 400;
        text-align: left;
    }

    .dropdown-arrow {
        display: flex;
        align-items: center;
        transition: transform 0.2s ease;
    }

    .dropdown-arrow.open {
        transform: rotate(180deg);
    }

    /* Status Submenu */
    .status-submenu {
        margin-left: 2rem;
        padding: 0.25rem 0;
    }

    .submenu-item {
        display: flex;
        align-items: center;
        padding: 0.5rem 1rem;
        margin: 0.25rem 0.5rem;
        border-radius: 8px;
        color: rgba(255, 255, 255, 0.6);
        text-decoration: none;
        transition: all 0.2s ease;
        cursor: pointer;
        outline: none;
        font-size: 0.9rem;
        background: transparent;
        border: none;
        width: calc(100% - 1rem);
        font-family: 'Poppins', sans-serif;
    }

    .submenu-item:hover {
        background: rgba(255, 255, 255, 0.03);
        color: #ffffff;
    }

    .submenu-item.active {
        color: #ffffff;
        background: rgba(255, 255, 255, 0.08);
        border-left: 2px solid var(--status-color, #ffffff);
    }

    .submenu-item:focus-visible {
        outline: 2px solid #ffffff;
        outline-offset: 2px;
    }

    .submenu-icon {
        min-width: 20px;
        margin-right: 0.5rem;
        display: flex;
        align-items: center;
    }

    .submenu-icon :global(svg) {
        width: 18px;
        height: 18px;
    }

    .submenu-label {
        flex: 1;
        text-align: left;
    }

    /* Status trigger active state */
    .status-trigger.active {
        background: rgba(255, 255, 255, 0.08);
        color: #ffffff;
    }

    /* New Audit Sidebar Button */
    .new-audit-section {
        margin-top: 0.5rem;
    }

    .new-audit-sidebar-btn {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        margin: 0 0.5rem;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.05) 100%);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 10px;
        color: #ffffff;
        cursor: pointer;
        transition: all 0.2s ease;
        width: calc(100% - 1rem);
        font-family: 'Poppins', sans-serif;
        font-size: 0.95rem;
        font-weight: 500;
        outline: none;
    }

    .new-audit-sidebar-btn:hover {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.08) 100%);
        border-color: rgba(255, 255, 255, 0.25);
        transform: translateX(2px);
    }

    .new-audit-sidebar-btn:focus-visible {
        outline: 2px solid #ffffff;
        outline-offset: 2px;
    }

    .new-audit-sidebar-icon {
        display: flex;
        align-items: center;
    }

    .new-audit-sidebar-icon :global(svg) {
        width: 20px;
        height: 20px;
    }

    .new-audit-sidebar-text {
        flex: 1;
        text-align: left;
        font-weight: 500;
    }

    /* Sidebar Footer */
    .sidebar-footer {
        padding: 1rem;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .user-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .user-avatar {
        width: 36px;
        height: 36px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(255, 255, 255, 0.7);
    }

    .user-details {
        display: flex;
        flex-direction: column;
    }

    .user-name {
        font-weight: 500;
        color: #ffffff;
        font-size: 0.95rem;
    }

    .user-role {
        font-size: 0.7rem;
        color: rgba(255, 255, 255, 0.5);
    }

    /* Logout Button */
    .logout-btn {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        color: #ff6b6b;
        cursor: pointer;
        transition: all 0.2s ease;
        width: 100%;
        font-family: 'Poppins', sans-serif;
        font-size: 0.95rem;
        outline: none;
    }

    .logout-btn:hover {
        background: rgba(255, 107, 107, 0.1);
        border-color: #ff6b6b;
    }

    .logout-btn:focus-visible {
        outline: 2px solid #ff6b6b;
        outline-offset: 2px;
    }

    .logout-icon {
        display: flex;
        align-items: center;
    }

    .logout-text {
        flex: 1;
        text-align: left;
    }

    /* Main Content */
    .main-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        background: #000000;
        transition: margin-left 0.3s ease;
    }

    /* Top Bar */
    .top-bar {
        height: 70px;
        background: rgba(255, 255, 255, 0.02);
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 2rem;
    }

    .page-title h1 {
        font-family: 'Poppins', sans-serif;
        font-size: 1.5rem;
        font-weight: 600;
        color: #ffffff;
        text-transform: capitalize;
    }

    /* Content Area */
    .content-area {
        flex: 1;
        overflow-y: auto;
        padding: 2rem;
    }

    .content-area::-webkit-scrollbar {
        width: 6px;
    }

    .content-area::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.02);
    }

    .content-area::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 6px;
    }

    /* Collapsed Sidebar Styles */
    .sidebar.collapsed .menu-icon {
        margin-right: 0;
    }

    .sidebar.collapsed .menu-item {
        justify-content: center;
        padding: 0.75rem;
    }

    .sidebar.collapsed .status-trigger {
        justify-content: center;
    }

    /* Responsive */
    @media (max-width: 768px) {
        .sidebar {
            position: fixed;
            z-index: 1000;
            height: 100vh;
        }

        .sidebar.collapsed {
            transform: translateX(-100%);
        }

        .main-content {
            margin-left: 0;
        }

        .top-bar {
            padding: 0 1rem;
        }
    }
</style>