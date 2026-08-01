<script lang="ts">
	let { children } = $props();
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	
	let searchQuery = $state('');
	let searchResults = $state<{
		cabinets: any[];
		sections: any[];
		items: any[];
	} | null>(null);
	let showDropdown = $state(false);
	
	let searchData = $state({
		cabinets: [] as any[],
		sections: [] as any[],
		items: [] as any[]
	});
	
	if (typeof window !== 'undefined') {
		(window as any).setSearchData = (data: any) => {
			searchData = data;
		};
	}
	
	function performSearch(query: string) {
		if (!query.trim()) {
			searchResults = null;
			showDropdown = false;
			return;
		}
		
		const lowerQuery = query.toLowerCase();
		
		const matchedCabinets = searchData.cabinets.filter((cabinet: any) => 
			cabinet.name?.toLowerCase().includes(lowerQuery) ||
			cabinet.id?.toString().includes(lowerQuery)
		);
		
		const matchedSections = searchData.sections.filter((section: any) => 
			section.name?.toLowerCase().includes(lowerQuery) ||
			section.type?.toLowerCase().includes(lowerQuery)
		);
		
		const matchedItems = searchData.items.filter((item: any) => {
			const searchableFields = [
				item.name,
				item.category,
				item.subCategory,
				item.serialNumber,
				item.location,
				item.sectionName,
				item.cabinetName,
				item.id?.toString()
			].filter(Boolean);
			
			return searchableFields.some(field => 
				field.toLowerCase().includes(lowerQuery)
			);
		});
		
		searchResults = {
			cabinets: matchedCabinets.slice(0, 5),
			sections: matchedSections.slice(0, 5),
			items: matchedItems.slice(0, 10)
		};
		showDropdown = true;
	}
	
	let searchTimeout: ReturnType<typeof setTimeout>;
	function handleSearchInput(e: Event) {
		const target = e.target as HTMLInputElement;
		searchQuery = target.value;
		
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			performSearch(searchQuery);
		}, 300);
	}
	
	function handleSearch(e: SubmitEvent) {
		e.preventDefault();
		clearTimeout(searchTimeout);
		performSearch(searchQuery);
	}
	
	function clearSearch() {
		searchQuery = '';
		searchResults = null;
		showDropdown = false;
	}
	
	async function navigateTo(type: string, id: number, cabinetId?: number, sectionId?: number) {
		clearSearch();
		
		switch(type) {
			case 'cabinet':
				await goto(`/showcase/${id}`);
				break;
				
			case 'section':
				if (cabinetId && id) {
					await goto(`/showcase/${cabinetId}/${id}`);
				} else if (cabinetId) {
					await goto(`/showcase/${cabinetId}`);
				}
				break;
				
			case 'item':
				if (cabinetId && sectionId) {
					await goto(`/showcase/${cabinetId}/${sectionId}`);
				} else {
					const item = searchData.items.find((i: any) => i.id === id);
					if (item && item.cabinetId && item.sectionId) {
						await goto(`/showcase/${item.cabinetId}/${item.sectionId}`);
					} else if (item && item.cabinetId) {
						await goto(`/showcase/${item.cabinetId}`);
					}
				}
				break;
		}
	}
	
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.nav-right')) {
			showDropdown = false;
		}
	}
	
	onMount(() => {
		document.addEventListener('click', handleClickOutside);
		return () => {
			document.removeEventListener('click', handleClickOutside);
			clearTimeout(searchTimeout);
		};
	});
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com">
	<link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700&display=swap" rel="stylesheet">
</svelte:head>

<!-- Navbar -->
<nav class="navbar">
	<div class="navbar-container">
		<!-- Left Section - Brand -->
		<div class="nav-left">
			<div class="brand-wrapper">
				<div class="icon-box">
					<svg class="store-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M20 7L12 3L4 7L12 11L20 7Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
						<path d="M4 7V17L12 21L20 17V7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
						<path d="M12 11V21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				</div>
			<h1 class="brand-title">
				JEMBATAN 3<br>
				<span>SHOWCASE</span>
			</h1>
			</div>
		</div>

		<!-- Right Section - Search Bar -->
		<div class="nav-right">
			<form class="search-form" onsubmit={handleSearch}>
				<div class="search-wrapper">
					<svg class="search-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
						<path d="M21 21L16.65 16.65" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
					<input 
						type="text" 
						bind:value={searchQuery}
						oninput={handleSearchInput}
						onfocus={() => {
							if (searchQuery && searchResults) {
								showDropdown = true;
							}
						}}
						class="search-input" 
						placeholder="Cari cabinet, section, atau item..."
						aria-label="Kolom pencarian"
					/>
					{#if searchQuery}
						<button 
							type="button" 
							class="search-clear" 
							onclick={clearSearch}
							aria-label="Hapus pencarian"
						>
							<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
						</button>
					{/if}
				</div>
			</form>

			<!-- Dropdown Hasil Pencarian -->
			{#if showDropdown && searchQuery.trim() && searchResults}
				<div class="search-dropdown">
					{#if searchResults.cabinets.length > 0 || searchResults.sections.length > 0 || searchResults.items.length > 0}
						<!-- Hasil Cabinet -->
						{#if searchResults.cabinets.length > 0}
							<div class="result-group">
								<div class="result-group-title">
									<svg class="group-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
									<span>Cabinet</span>
									<span class="result-count">{searchResults.cabinets.length}</span>
								</div>
								{#each searchResults.cabinets as cabinet}
									<div class="result-item" onclick={() => navigateTo('cabinet', cabinet.id)}>
										<div class="result-info">
											<div class="result-name">{cabinet.name}</div>
											<div class="result-description">
												{cabinet.sections?.length || 0} sections • {cabinet.filled || 0}/{cabinet.slots || 0} items
											</div>
										</div>
									</div>
								{/each}
							</div>
						{/if}
						
						<!-- Hasil Section -->
						{#if searchResults.sections.length > 0}
							<div class="result-group">
								<div class="result-group-title">
									<svg class="group-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
									<span>Section</span>
									<span class="result-count">{searchResults.sections.length}</span>
								</div>
								{#each searchResults.sections as section}
									<div class="result-item" onclick={() => navigateTo('section', section.id, section.cabinetId)}>
										<div class="result-info">
											<div class="result-name">{section.name}</div>
											<div class="result-description">
												Type: {section.type} • Cabinet: {section.cabinetName}
											</div>
										</div>
									</div>
								{/each}
							</div>
						{/if}
						
						<!-- Hasil Item -->
						{#if searchResults.items.length > 0}
							<div class="result-group">
								<div class="result-group-title">
									<svg class="group-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
									<span>Item</span>
									<span class="result-count">{searchResults.items.length}</span>
								</div>
								{#each searchResults.items as item}
									<!-- 🔥 PERBAIKAN: Kirim cabinetId dan sectionId -->
									<div class="result-item" onclick={() => navigateTo('item', item.id, item.cabinetId, item.sectionId)}>
										<div class="result-info">
											<div class="result-name">{item.name}</div>
											<div class="result-description">
												Stock: {item.stock || 0} • {item.category || 'Uncategorized'}
												{#if item.location} • Location: {item.location}{/if}
												{#if item.sectionName} • Section: {item.sectionName}{/if}
												{#if item.cabinetName} • Cabinet: {item.cabinetName}{/if}
											</div>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					{:else}
						<div class="no-results">
							<span>Tidak ditemukan hasil untuk "<strong>{searchQuery}</strong>"</span>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</nav>

<!-- Page Content -->
<main class="main-content">
	{@render children()}
</main>

<style>
	* {
		margin: 0;
		padding: 0;
		box-sizing: border-box;
	}

	:global(body) {
		background: #06090f;
		margin: 0;
		padding: 0;
		overflow-x: hidden;
		font-family: 'Inter', sans-serif;
	}

	/* Navbar */
	.navbar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 1000;
		background: rgba(6, 9, 15, 0.92);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}

	.navbar-container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 0.75rem 2rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 2rem;
	}

	/* Left Section - Brand */
	.nav-left {
		flex-shrink: 0;
	}

	.brand-wrapper {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.icon-box {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 42px;
		height: 42px;
		background: rgba(16, 185, 129, 0.12);
		border: 1px solid rgba(16, 185, 129, 0.25);
		border-radius: 10px;
		transition: all 0.2s ease;
	}

	.icon-box:hover {
		background: rgba(16, 185, 129, 0.2);
		transform: scale(1.02);
	}

	.store-icon {
		width: 24px;
		height: 24px;
		color: #10b981;
	}

	.brand-title {
		font-family: 'Inter', sans-serif;
		font-size: 1rem;
		font-weight: 600;
		color: #f1f5f9;
		margin: 0;
		line-height: 1.3;
	}

	.brand-title span {
		font-size: 0.7rem;
		font-weight: 500;
		color: #34d399;
		letter-spacing: 0.08em;
	}

	/* Right Section - Search */
	.nav-right {
		position: relative;
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.search-form {
		display: flex;
		align-items: center;
	}

	.search-wrapper {
		position: relative;
		display: flex;
		align-items: center;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		padding: 0 0.75rem;
		transition: all 0.2s ease;
	}

	.search-wrapper:focus-within {
		background: rgba(255, 255, 255, 0.08);
		border-color: #10b981;
		box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
	}

	.search-icon {
		width: 16px;
		height: 16px;
		color: #8f8f96;
		flex-shrink: 0;
	}

	.search-input {
		width: 250px;
		padding: 0.55rem 0.6rem;
		border: none;
		background: transparent;
		font-family: 'Inter', sans-serif;
		font-size: 0.85rem;
		color: #e3e4e6;
		outline: none;
		transition: width 0.2s ease;
	}

	.search-input::placeholder {
		color: #8f8f96;
	}

	.search-input:focus {
		width: 300px;
	}

	.search-clear {
		background: transparent;
		border: none;
		padding: 0.25rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #8f8f96;
		border-radius: 4px;
		transition: background 0.2s ease;
	}

	.search-clear:hover {
		background: rgba(255, 255, 255, 0.1);
		color: #e3e4e6;
	}

	.search-clear svg {
		width: 13px;
		height: 13px;
	}

	/* Search Dropdown */
	.search-dropdown {
		position: absolute;
		top: calc(100% + 8px);
		right: 0;
		width: 400px;
		max-height: 500px;
		overflow-y: auto;
		background: #161618;
		border-radius: 12px;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
		border: 1px solid rgba(255, 255, 255, 0.1);
		z-index: 1001;
	}

	.result-group {
		margin-bottom: 1rem;
		padding: 0 0.75rem;
	}

	.result-group-title {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		color: #8f8f96;
		padding: 0.5rem 0.75rem;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 6px;
		margin-bottom: 0.5rem;
	}

	.group-icon {
		width: 14px;
		height: 14px;
		color: #34d399;
		flex-shrink: 0;
	}

	.result-count {
		background: rgba(255, 255, 255, 0.1);
		padding: 0.15rem 0.4rem;
		border-radius: 999px;
		font-size: 0.65rem;
	}

	.result-item {
		padding: 0.6rem 0.75rem;
		cursor: pointer;
		border-radius: 8px;
		transition: all 0.15s ease;
	}

	.result-item:hover {
		background: rgba(255, 255, 255, 0.06);
	}

	.result-info {
		flex: 1;
	}

	.result-name {
		font-size: 0.85rem;
		font-weight: 500;
		color: #e3e4e6;
		margin-bottom: 0.15rem;
	}

	.result-description {
		font-size: 0.7rem;
		color: #8f8f96;
	}

	.no-results {
		padding: 2rem;
		text-align: center;
		color: #8f8f96;
	}

	/* Main Content */
	.main-content {
		min-height: 100vh;
		padding-top: 72px;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.navbar-container {
			padding: 0.6rem 1rem;
			gap: 1rem;
		}

		.brand-title {
			font-size: 0.8rem;
		}

		.brand-title span {
			font-size: 0.6rem;
		}

		.icon-box {
			width: 36px;
			height: 36px;
		}

		.store-icon {
			width: 20px;
		}

		.search-input {
			width: 160px;
			font-size: 0.8rem;
		}

		.search-input:focus {
			width: 200px;
		}

		.search-dropdown {
			width: calc(100vw - 2rem);
			right: -1rem;
			max-height: 450px;
		}
	}

	@media (max-width: 480px) {
		.search-input {
			width: 130px;
		}

		.search-input:focus {
			width: 160px;
		}
	}
</style>