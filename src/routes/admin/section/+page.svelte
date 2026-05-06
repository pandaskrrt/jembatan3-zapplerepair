<script lang="ts">
    import { goto } from '$app/navigation';
    
    let { data } = $props();
    
    let sections = data?.sections || [];
    let cabinets = data?.cabinets || [];

    let searchTerm = $state('');
    let filterType = $state('');
    let filterCabinet = $state('');
    
    let selectedSection = $state<number | null>(null);
    let showDeleteModal = $state(false);
    let isDeleting = $state(false);
    
    let showSuccessMessage = $state(false);
    let showErrorMessage = $state(false);
    let messageText = $state('');

    // Filter sections berdasarkan pencarian dan filter (HAPUS layout)
    let filteredSections = $derived(() => {
        return sections.filter(section => {
            const matchesSearch = !searchTerm || 
                section.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                section.id.toString().includes(searchTerm) ||
                section.type.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesType = !filterType || filterType === '' || section.type === filterType;
            
            const matchesCabinet = !filterCabinet || filterCabinet === '' || 
                section.cabinetId.toString() === filterCabinet.toString();
            
            return matchesSearch && matchesType && matchesCabinet;
        });
    });

    // Unique types untuk filter dropdown
    let uniqueTypes = $derived(() => {
        return [...new Set(sections.map(s => s.type))];
    });

    let totalSections = sections.length;

    async function navigateToAdd() {
        await goto('/admin/section/create');
    }

    function openDeleteModal(id: number) {
        selectedSection = id;
        showDeleteModal = true;
    }

    function closeDeleteModal() {
        selectedSection = null;
        showDeleteModal = false;
    }

    function showNotification(type: 'success' | 'error', message: string) {
        showSuccessMessage = type === 'success';
        showErrorMessage = type === 'error';
        messageText = message;
        
        setTimeout(() => {
            showSuccessMessage = false;
            showErrorMessage = false;
        }, 3000);
    }

    async function handleDelete() {
        if (!selectedSection) return;
        
        isDeleting = true;
        
        try {
            const formData = new FormData();
            formData.append('id', selectedSection.toString());
            
            const response = await fetch('/admin/section', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                showNotification('success', 'Section deleted successfully');
                
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                showNotification('error', result.message || 'Failed to delete section');
                isDeleting = false;
                closeDeleteModal();
            }
        } catch (error) {
            console.error('Delete error:', error);
            showNotification('error', 'Network error! Please try again.');
            isDeleting = false;
            closeDeleteModal();
        }
    }

    function handleModalKeydown(e: KeyboardEvent) {
        if (e.key === 'Escape') {
            closeDeleteModal();
        }
    }

    function getCabinetName(cabinetId: number) {
        const cabinet = cabinets.find(c => c.id === cabinetId);
        return cabinet ? cabinet.name : 'Unknown';
    }

    function resetFilters() {
        searchTerm = '';
        filterType = '';
        filterCabinet = '';
    }
</script>

<svelte:head>
    <title>Admin - Sections</title>
</svelte:head>

<div class="page">
    <!-- Header Section -->
    <div class="header">
        <div class="header-left">
            <h1 class="page-title">Sections</h1>
            <p class="page-subtitle">Manage your sections</p>
        </div>
        <div class="header-right">
            <a href="/admin/section/create" class="add-btn" data-sveltekit-reload>
                <span class="add-icon">➕</span>
                <span>Add New Section</span>
            </a>
        </div>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-icon">📁</div>
            <div class="stat-content">
                <span class="stat-label">Total Sections</span>
                <span class="stat-value">{totalSections}</span>
            </div>
        </div>
        
        <div class="stat-card">
            <div class="stat-icon">🏷️</div>
            <div class="stat-content">
                <span class="stat-label">Types</span>
                <span class="stat-value">{uniqueTypes().length}</span>
            </div>
        </div>
        
        <div class="stat-card">
            <div class="stat-icon">📦</div>
            <div class="stat-content">
                <span class="stat-label">Cabinets</span>
                <span class="stat-value">{cabinets.length}</span>
            </div>
        </div>
    </div>

    <!-- Search and Filter Bar -->
    <div class="filter-container">
        <div class="search-wrapper">
            <span class="search-icon">🔍</span>
            <input 
                type="text" 
                class="search-input" 
                placeholder="Search sections by name, ID, or type..."
                bind:value={searchTerm}
                aria-label="Search sections"
            />
            {#if searchTerm}
                <button 
                    class="clear-search" 
                    onclick={() => searchTerm = ''}
                    aria-label="Clear search"
                >
                    ✕
                </button>
            {/if}
        </div>

        <div class="filter-wrapper">
            <div class="filter-group">
                <span class="filter-label">Type</span>
                <select class="filter-select" bind:value={filterType}>
                    <option value="">All Types</option>
                    {#each uniqueTypes() as type}
                        <option value={type}>{type}</option>
                    {/each}
                </select>
            </div>

            <div class="filter-group">
                <span class="filter-label">Cabinet</span>
                <select class="filter-select" bind:value={filterCabinet}>
                    <option value="">All Cabinets</option>
                    {#each cabinets as cabinet}
                        <option value={cabinet.id}>
                            #{cabinet.id} - {cabinet.name}
                        </option>
                    {/each}
                </select>
            </div>

            <div class="active-filters">
                {#if searchTerm || filterType || filterCabinet}
                    <div class="filter-badge">
                        <span>
                            {#if searchTerm}🔍 "{searchTerm}" {/if}
                            {#if filterType}🏷️ {filterType} {/if}
                            {#if filterCabinet}📦 Cabinet {filterCabinet} {/if}
                        </span>
                        <button class="reset-filters" onclick={resetFilters} aria-label="Reset filters">
                            ✕
                        </button>
                    </div>
                {/if}
            </div>
        </div>
    </div>

    <!-- Success Message -->
    {#if showSuccessMessage}
        <div class="global-success">
            <span class="success-icon">✅</span>
            <span>{messageText}</span>
        </div>
    {/if}

    <!-- Error Message -->
    {#if showErrorMessage}
        <div class="global-error">
            <span class="error-icon">⚠️</span>
            <span>{messageText}</span>
        </div>
    {/if}

    <!-- Sections Grid -->
    {#if filteredSections().length === 0}
        <div class="empty-state">
            <span class="empty-icon">📁</span>
            <h3 class="empty-title">No Sections Found</h3>
            <p class="empty-description">
                {#if searchTerm || filterType || filterCabinet}
                    No sections match your filters. 
                    {#if sections.length === 0}
                        There are no sections in the database yet.
                    {:else}
                        Try different search criteria.
                    {/if}
                {:else}
                    Get started by creating your first section.
                {/if}
            </p>
            <div class="empty-actions">
                {#if searchTerm || filterType || filterCabinet}
                    <button class="empty-btn" onclick={resetFilters}>
                        Clear Filters
                    </button>
                {:else}
                    <a href="/admin/section/create" class="empty-btn" data-sveltekit-reload>
                        Add Section
                    </a>
                {/if}
            </div>
        </div>
    {:else}
        <div class="sections-grid">
            {#each filteredSections() as section (section.id)}
                <div class="section-card">
                    <div class="card-header" style:border-left-color={section.type === 'display' ? '#00ff00' : section.type === 'storage' ? '#ffaa00' : '#00ccff'}>
                        <span class="section-id">#{section.id}</span>
                        <div class="card-actions">
                            <a 
                                href={`/admin/section/edit?id=${section.id}`}
                                class="action-btn edit"
                                data-sveltekit-reload
                                aria-label="Edit section"
                            >
                                ✏️
                            </a>
                            <button 
                                class="action-btn delete" 
                                onclick={() => openDeleteModal(section.id)}
                                aria-label="Delete section"
                            >
                                🗑️
                            </button>
                        </div>
                    </div>

                    <div class="card-body">
                        <div class="section-type-badge" style:background={section.type === 'display' ? 'rgba(0, 255, 0, 0.1)' : section.type === 'storage' ? 'rgba(255, 170, 0, 0.1)' : 'rgba(0, 204, 255, 0.1)'}>
                            {section.type}
                        </div>
                        
                        <h3 class="section-name">{section.name}</h3>
                        
                        <div class="section-details">
                            <div class="detail-row">
                                <span class="detail-label">Cabinet</span>
                                <span class="detail-value">
                                    <a href={`/admin/cabinet/edit?id=${section.cabinetId}`} class="cabinet-link">
                                        #{section.cabinetId}: {getCabinetName(section.cabinetId)}
                                    </a>
                                </span>
                            </div>
                        </div>
                    </div>

                    <div class="card-footer">
                        <span class="footer-text">ID: {section.id}</span>
                        <span class="footer-badge" style:background={section.type === 'display' ? 'rgba(0, 255, 0, 0.2)' : section.type === 'storage' ? 'rgba(255, 170, 0, 0.2)' : 'rgba(0, 204, 255, 0.2)'}>
                            {section.type}
                        </span>
                    </div>
                </div>
            {/each}
        </div>
    {/if}

    <!-- Delete Confirmation Modal -->
    {#if showDeleteModal}
        <div 
            class="modal-overlay" 
            onclick={closeDeleteModal}
            onkeydown={handleModalKeydown}
            role="button"
            tabindex="0"
            aria-label="Close modal"
        >
            <div class="modal-content" onclick={(e) => e.stopPropagation()}>
                <button class="modal-close" onclick={closeDeleteModal}>×</button>
                
                <div class="modal-icon">⚠️</div>
                <h2 class="modal-title">Delete Section</h2>
                <p class="modal-description">
                    Are you sure you want to delete this section? 
                    This action cannot be undone and will delete all cards inside.
                </p>
                
                <div class="modal-actions">
                    <button 
                        class="modal-btn cancel" 
                        onclick={closeDeleteModal}
                        disabled={isDeleting}
                    >
                        Cancel
                    </button>
                    <button 
                        class="modal-btn delete" 
                        onclick={handleDelete}
                        disabled={isDeleting}
                    >
                        {#if isDeleting}
                            Deleting...
                        {:else}
                            Delete Section
                        {/if}
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    /* Styles sama seperti sebelumnya, tidak berubah */
    .page {
        padding: 1.5rem;
        max-width: 1400px;
        margin: 0 auto;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
    }

    .page-title {
        font-family: 'Poppins', sans-serif;
        font-size: 2rem;
        font-weight: 600;
        color: #ffffff;
        margin: 0 0 0.25rem 0;
    }

    .page-subtitle {
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.95rem;
    }

    .add-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 10px;
        color: #ffffff;
        font-family: 'Poppins', sans-serif;
        font-size: 0.95rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        text-decoration: none;
    }

    .add-btn:hover {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.3);
        transform: translateY(-2px);
    }

    .add-icon {
        font-size: 1.2rem;
    }

    .stats-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1.5rem;
        margin-bottom: 2rem;
    }

    .stat-card {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1.25rem;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        transition: all 0.2s ease;
    }

    .stat-card:hover {
        background: rgba(255, 255, 255, 0.03);
        border-color: rgba(255, 255, 255, 0.1);
        transform: translateY(-2px);
    }

    .stat-icon {
        font-size: 2rem;
        filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.1));
    }

    .stat-content {
        display: flex;
        flex-direction: column;
    }

    .stat-label {
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.5);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .stat-value {
        font-family: 'Poppins', sans-serif;
        font-size: 1.5rem;
        font-weight: 600;
        color: #ffffff;
        line-height: 1.2;
    }

    .filter-container {
        margin-bottom: 2rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .search-wrapper {
        position: relative;
        max-width: 500px;
    }

    .search-icon {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: rgba(255, 255, 255, 0.4);
        font-size: 1.1rem;
        z-index: 1;
    }

    .search-input {
        width: 100%;
        padding: 0.9rem 1rem 0.9rem 2.8rem;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        color: #ffffff;
        font-family: 'Poppins', sans-serif;
        font-size: 0.95rem;
        transition: all 0.2s ease;
    }

    .search-input:focus {
        outline: none;
        border-color: #00ff00;
        background: rgba(255, 255, 255, 0.05);
        box-shadow: 0 0 0 3px rgba(0, 255, 0, 0.1);
    }

    .search-input::placeholder {
        color: rgba(255, 255, 255, 0.3);
    }

    .clear-search {
        position: absolute;
        right: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.4);
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 50%;
        transition: all 0.2s ease;
    }

    .clear-search:hover {
        color: #ffffff;
        background: rgba(255, 255, 255, 0.1);
    }

    .filter-wrapper {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 1rem;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        padding: 1rem;
    }

    .filter-group {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: rgba(0, 0, 0, 0.2);
        padding: 0.5rem;
        border-radius: 8px;
    }

    .filter-label {
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.5);
        padding: 0 0.5rem;
    }

    .filter-select {
        padding: 0.6rem 2rem 0.6rem 1rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        color: #ffffff;
        font-family: 'Poppins', sans-serif;
        font-size: 0.9rem;
        cursor: pointer;
        min-width: 150px;
        appearance: none;
        background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2300ff00' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
        background-repeat: no-repeat;
        background-position: right 0.5rem center;
        background-size: 1rem;
    }

    .filter-select:focus {
        outline: none;
        border-color: #00ff00;
    }

    .filter-select option {
        background: #1a1a2a;
        color: #ffffff;
    }

    .active-filters {
        flex: 1;
        display: flex;
        justify-content: flex-end;
    }

    .filter-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: rgba(0, 255, 0, 0.1);
        border: 1px solid rgba(0, 255, 0, 0.3);
        border-radius: 20px;
        color: #00ff00;
        font-size: 0.9rem;
    }

    .reset-filters {
        background: none;
        border: none;
        color: #00ff00;
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
    }

    .reset-filters:hover {
        background: rgba(255, 255, 255, 0.1);
        transform: scale(1.1);
    }

    .global-success {
        position: fixed;
        top: 100px;
        right: 2rem;
        background: rgba(0, 255, 0, 0.1);
        border: 1px solid #00ff00;
        color: #00ff00;
        padding: 1rem 2rem;
        border-radius: 10px;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        z-index: 1100;
        animation: slideInRight 0.3s ease;
        backdrop-filter: blur(5px);
    }

    .global-error {
        position: fixed;
        top: 100px;
        right: 2rem;
        background: rgba(255, 0, 0, 0.1);
        border: 1px solid #ff6b6b;
        color: #ff6b6b;
        padding: 1rem 2rem;
        border-radius: 10px;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        z-index: 1100;
        animation: slideInRight 0.3s ease;
        backdrop-filter: blur(5px);
    }

    .success-icon, .error-icon {
        font-size: 1.2rem;
    }

    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    .sections-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 1.5rem;
    }

    .section-card {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 16px;
        overflow: hidden;
        transition: all 0.3s ease;
    }

    .section-card:hover {
        transform: translateY(-4px);
        border-color: rgba(255, 255, 255, 0.15);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background: rgba(255, 255, 255, 0.03);
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        border-left: 4px solid transparent;
    }

    .section-id {
        font-family: 'Poppins', sans-serif;
        font-size: 0.9rem;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.5);
        background: rgba(255, 255, 255, 0.05);
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
    }

    .card-actions {
        display: flex;
        gap: 0.5rem;
    }

    .action-btn {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 1rem;
        text-decoration: none;
        color: #ffffff;
    }

    .action-btn.edit:hover {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.3);
        transform: scale(1.05);
    }

    .action-btn.delete:hover {
        background: rgba(255, 107, 107, 0.2);
        border-color: #ff6b6b;
        transform: scale(1.05);
    }

    .card-body {
        padding: 1.25rem;
    }

    .section-type-badge {
        display: inline-block;
        padding: 0.25rem 1rem;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 500;
        color: #ffffff;
        margin-bottom: 0.75rem;
    }

    .section-name {
        font-family: 'Poppins', sans-serif;
        font-size: 1.3rem;
        font-weight: 600;
        color: #ffffff;
        margin: 0 0 1rem 0;
    }

    .section-details {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 10px;
        padding: 0.75rem;
        margin-bottom: 1rem;
    }

    .detail-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 0;
    }

    .detail-row:not(:last-child) {
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .detail-label {
        color: rgba(255, 255, 255, 0.5);
        font-size: 0.9rem;
    }

    .detail-value {
        font-family: 'Poppins', sans-serif;
        color: #ffffff;
        font-size: 0.9rem;
        font-weight: 500;
    }

    .cabinet-link {
        color: #00ff00;
        text-decoration: none;
        transition: all 0.2s ease;
    }

    .cabinet-link:hover {
        text-decoration: underline;
    }

    .card-footer {
        padding: 1rem;
        background: rgba(255, 255, 255, 0.02);
        border-top: 1px solid rgba(255, 255, 255, 0.05);
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.8rem;
    }

    .footer-text {
        color: rgba(255, 255, 255, 0.4);
    }

    .footer-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        color: #ffffff;
    }

    .empty-state {
        text-align: center;
        padding: 4rem 2rem;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 16px;
    }

    .empty-icon {
        font-size: 4rem;
        display: block;
        margin-bottom: 1rem;
        filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.1));
    }

    .empty-title {
        font-family: 'Poppins', sans-serif;
        font-size: 1.5rem;
        font-weight: 500;
        color: #ffffff;
        margin-bottom: 0.5rem;
    }

    .empty-description {
        color: rgba(255, 255, 255, 0.5);
        margin-bottom: 1.5rem;
    }

    .empty-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
    }

    .empty-btn {
        padding: 0.75rem 2rem;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        color: #ffffff;
        font-family: 'Poppins', sans-serif;
        font-size: 0.95rem;
        cursor: pointer;
        transition: all 0.2s ease;
        text-decoration: none;
        display: inline-block;
    }

    .empty-btn:hover {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.3);
    }

    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(5px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .modal-content {
        background: #1a1a2a;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 2rem;
        max-width: 400px;
        width: 90%;
        position: relative;
        text-align: center;
    }

    .modal-close {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.5);
        font-size: 1.5rem;
        cursor: pointer;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.2s ease;
    }

    .modal-close:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
    }

    .modal-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
    }

    .modal-title {
        font-family: 'Poppins', sans-serif;
        font-size: 1.5rem;
        font-weight: 600;
        color: #ffffff;
        margin-bottom: 0.5rem;
    }

    .modal-description {
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.95rem;
        margin-bottom: 1.5rem;
        line-height: 1.5;
    }

    .modal-actions {
        display: flex;
        gap: 1rem;
    }

    .modal-btn {
        flex: 1;
        padding: 0.75rem;
        border-radius: 8px;
        font-family: 'Poppins', sans-serif;
        font-size: 0.95rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        border: none;
    }

    .modal-btn.cancel {
        background: rgba(255, 255, 255, 0.05);
        color: rgba(255, 255, 255, 0.7);
    }

    .modal-btn.cancel:hover {
        background: rgba(255, 255, 255, 0.1);
    }

    .modal-btn.delete {
        background: #ff6b6b;
        color: #ffffff;
    }

    .modal-btn.delete:hover {
        background: #ff5252;
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(255, 107, 107, 0.3);
    }

    .modal-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    @media (max-width: 768px) {
        .page {
            padding: 1rem;
        }

        .header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
        }

        .page-title {
            font-size: 1.8rem;
        }

        .add-btn {
            width: 100%;
            justify-content: center;
        }

        .stats-grid {
            grid-template-columns: 1fr;
        }

        .filter-wrapper {
            flex-direction: column;
            align-items: stretch;
        }

        .filter-group {
            width: 100%;
        }

        .filter-select {
            flex: 1;
        }

        .active-filters {
            justify-content: flex-start;
        }

        .sections-grid {
            grid-template-columns: 1fr;
        }

        .global-success,
        .global-error {
            top: auto;
            bottom: 2rem;
            right: 1rem;
            left: 1rem;
        }
    }
</style>