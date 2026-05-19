<script lang="ts">
	import { page } from '$app/stores'
	import { goto } from '$app/navigation'

	let { children } = $props()

	let isSidebarCollapsed = $state(false)
	let activeMenu = $state<string | null>(null)

	interface MenuItem {
		id: string
		label: string
		icon: string
		href: string
		count?: number
		children?: MenuItem[]
	}

	const menuItems: MenuItem[] = [
		{
			id: 'dashboard',
			label: 'Dashboard',
			icon: '📊',
			href: '/admin'
		},
		{
			id: 'cabinets',
			label: 'Cabinets',
			icon: '📦',
			href: '/admin/cabinets',
			children: [
				{ id: 'cabinets-list', label: 'All Cabinets', icon: '📋', href: '/admin/cabinet' },
				{ id: 'cabinets-add', label: 'Add Cabinet', icon: '➕', href: '/admin/cabinet/create' }
			]
		},
		{
			id: 'sections',
			label: 'Sections',
			icon: '📁',
			href: '/admin/section',
			children: [
				{ id: 'sections-list', label: 'All Sections', icon: '📋', href: '/admin/section' },
				{ id: 'sections-add', label: 'Add Section', icon: '➕', href: '/admin/section/create' }
			]
		},
		{
			id: 'items',
			label: 'Items',
			icon: '📦',
			href: '/admin/item',
			children: [
				{ id: 'items-list', label: 'All Items', icon: '📋', href: '/admin/item' },
				{ id: 'items-add', label: 'Add Item', icon: '➕', href: '/admin/item/create' },
				{ id: 'items-categories', label: 'Categories', icon: '🏷️', href: '/admin/item/categories' }
			]
		}
	]

	function toggleSidebar() {
		isSidebarCollapsed = !isSidebarCollapsed
	}

	function toggleSubMenu(menuId: string) {
		if (activeMenu === menuId) {
			activeMenu = null
		} else {
			activeMenu = menuId
		}
	}

	function isActive(href: string): boolean {
		return $page.url.pathname === href
	}

	function handleMenuKeydown(e: KeyboardEvent, href: string) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault()
			goto(href)
		}
	}

	function handleSubMenuKeydown(e: KeyboardEvent, menuId: string) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault()
			toggleSubMenu(menuId)
		}
	}

	function handleLogout() {
		console.log('Logout clicked')
		goto('/logout')
	}
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" />
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="admin-layout">
	<!-- Sidebar -->
	<aside class="sidebar" class:collapsed={isSidebarCollapsed}>
		<!-- Sidebar Header -->
		<div class="sidebar-header">
			<div class="logo-area">
				<span class="logo-icon">📦</span>
				{#if !isSidebarCollapsed}
					<span class="logo-text">Stock Manager</span>
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

		<!-- Sidebar Content -->
		<div class="sidebar-content">
			{#each menuItems as item (item.id)}
				<div class="menu-section">
					{#if item.children}
						<div class="menu-parent">
							<div
								class="menu-item"
								class:active={isActive(item.href)}
								class:has-children={true}
								class:expanded={activeMenu === item.id}
								onclick={() => toggleSubMenu(item.id)}
								onkeydown={(e) => handleSubMenuKeydown(e, item.id)}
								role="button"
								tabindex="0"
								aria-label={`${item.label} menu`}
								aria-expanded={activeMenu === item.id}
							>
								<span class="menu-icon">{item.icon}</span>
								{#if !isSidebarCollapsed}
									<span class="menu-label">{item.label}</span>
									{#if item.count !== undefined}
										<span class="menu-count">{item.count}</span>
									{/if}
									<span class="menu-arrow" class:rotated={activeMenu === item.id}> ▼ </span>
								{/if}
							</div>

							{#if !isSidebarCollapsed && activeMenu === item.id}
								<div class="submenu">
									{#each item.children as child (child.id)}
										<a
											href={child.href}
											class="submenu-item"
											class:active={isActive(child.href)}
											onclick={(e) => {
												e.preventDefault()
												goto(child.href)
											}}
											onkeydown={(e) => handleMenuKeydown(e, child.href)}
											role="button"
											tabindex="0"
											aria-label={child.label}
										>
											<span class="submenu-icon">{child.icon}</span>
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
							onclick={(e) => {
								e.preventDefault()
								goto(item.href)
							}}
							onkeydown={(e) => handleMenuKeydown(e, item.href)}
							role="button"
							tabindex="0"
							aria-label={item.label}
						>
							<span class="menu-icon">{item.icon}</span>
							{#if !isSidebarCollapsed}
								<span class="menu-label">{item.label}</span>
							{/if}
						</a>
					{/if}
				</div>
			{/each}
		</div>

		<!-- Sidebar Footer -->
		<div class="sidebar-footer">
			<div class="user-info">
				<span class="user-avatar">👤</span>
				{#if !isSidebarCollapsed}
					<div class="user-details">
						<span class="user-name">Admin User</span>
						<span class="user-role">Administrator</span>
					</div>
				{/if}
			</div>

			<button
				class="logout-btn"
				onclick={handleLogout}
				onkeydown={(e) => e.key === 'Enter' && handleLogout()}
				aria-label="Logout"
			>
				<span class="logout-icon">🚪</span>
				{#if !isSidebarCollapsed}
					<span class="logout-text">Logout</span>
				{/if}
			</button>
		</div>
	</aside>

	<!-- Main Content -->
	<main class="main-content" class:sidebar-collapsed={isSidebarCollapsed}>
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
		font-family: 'Inter', sans-serif;
		background: #f5f5f5;
		color: #333333;
		overflow: hidden;
	}

	.admin-layout {
		display: flex;
		height: 100vh;
		overflow: hidden;
	}

	/* Sidebar - White Theme */
	.sidebar {
		width: 280px;
		background: #ffffff;
		border-right: 1px solid #e0e0e0;
		display: flex;
		flex-direction: column;
		transition: width 0.3s ease;
		position: relative;
		overflow-y: auto;
		overflow-x: hidden;
		box-shadow: 2px 0 8px rgba(0, 0, 0, 0.02);
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
		border-bottom: 1px solid #e0e0e0;
	}

	.logo-area {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.logo-icon {
		font-size: 2rem;
	}

	.logo-text {
		font-family: 'Inter', sans-serif;
		font-size: 1.2rem;
		font-weight: 600;
		color: #333333;
		letter-spacing: 0.5px;
	}

	.collapse-btn {
		width: 32px;
		height: 32px;
		border-radius: 6px;
		background: #f5f5f5;
		border: 1px solid #e0e0e0;
		color: #666666;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.collapse-btn:hover {
		background: #e0e0e0;
		border-color: #cccccc;
	}

	.collapse-icon {
		font-size: 1.2rem;
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
		background: #f5f5f5;
	}

	.sidebar-content::-webkit-scrollbar-thumb {
		background: #cccccc;
		border-radius: 4px;
	}

	.menu-section {
		margin-bottom: 0.5rem;
	}

	.menu-item {
		display: flex;
		align-items: center;
		padding: 0.75rem 1rem;
		margin: 0 0.5rem;
		border-radius: 8px;
		color: #666666;
		text-decoration: none;
		transition: all 0.2s ease;
		cursor: pointer;
		outline: none;
		position: relative;
	}

	.menu-item:hover {
		background: #f5f5f5;
		color: #333333;
	}

	.menu-item.active {
		background: #e3f2fd;
		color: #1976d2;
		border-left: 3px solid #1976d2;
	}

	.menu-item:focus-visible {
		outline: 2px solid #1976d2;
		outline-offset: 2px;
	}

	.menu-item.has-children {
		padding-right: 2rem;
	}

	.menu-icon {
		font-size: 1.3rem;
		min-width: 24px;
		margin-right: 0.75rem;
	}

	.menu-label {
		flex: 1;
		font-size: 0.95rem;
		font-weight: 500;
	}

	.menu-count {
		background: #f5f5f5;
		padding: 0.2rem 0.5rem;
		border-radius: 12px;
		font-size: 0.75rem;
		margin-right: 0.5rem;
		color: #666666;
	}

	.menu-arrow {
		font-size: 0.7rem;
		transition: transform 0.2s ease;
		color: #999999;
	}

	.menu-arrow.rotated {
		transform: rotate(180deg);
	}

	/* Submenu */
	.submenu {
		margin-left: 2rem;
		padding: 0.25rem 0;
	}

	.submenu-item {
		display: flex;
		align-items: center;
		padding: 0.5rem 1rem;
		margin: 0.25rem 0.5rem;
		border-radius: 6px;
		color: #777777;
		text-decoration: none;
		transition: all 0.2s ease;
		cursor: pointer;
		outline: none;
		font-size: 0.9rem;
	}

	.submenu-item:hover {
		background: #f5f5f5;
		color: #333333;
	}

	.submenu-item.active {
		color: #1976d2;
		background: #e3f2fd;
	}

	.submenu-item:focus-visible {
		outline: 2px solid #1976d2;
		outline-offset: 2px;
	}

	.submenu-icon {
		font-size: 0.95rem;
		min-width: 20px;
		margin-right: 0.5rem;
	}

	.submenu-label {
		flex: 1;
	}

	/* Sidebar Footer */
	.sidebar-footer {
		padding: 1rem;
		border-top: 1px solid #e0e0e0;
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
		font-size: 1.3rem;
		background: #f5f5f5;
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 8px;
	}

	.user-details {
		display: flex;
		flex-direction: column;
	}

	.user-name {
		font-weight: 600;
		color: #333333;
		font-size: 0.95rem;
	}

	.user-role {
		font-size: 0.7rem;
		color: #999999;
	}

	/* Logout Button */
	.logout-btn {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background: #f5f5f5;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		color: #d32f2f;
		cursor: pointer;
		transition: all 0.2s ease;
		width: 100%;
		font-family: 'Inter', sans-serif;
		font-size: 0.95rem;
		font-weight: 500;
		outline: none;
	}

	.logout-btn:hover {
		background: #ffebee;
		border-color: #d32f2f;
	}

	.logout-btn:focus-visible {
		outline: 2px solid #d32f2f;
		outline-offset: 2px;
	}

	.logout-icon {
		font-size: 1.2rem;
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
		background: #f5f5f5;
		transition: margin-left 0.3s ease;
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
		background: #f5f5f5;
	}

	.content-area::-webkit-scrollbar-thumb {
		background: #cccccc;
		border-radius: 6px;
	}

	.content-area::-webkit-scrollbar-thumb:hover {
		background: #aaaaaa;
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

		.content-area {
			padding: 1rem;
		}
	}
</style>
