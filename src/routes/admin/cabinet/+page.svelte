<script lang="ts">
    import { goto } from '$app/navigation';
    
    let { data } = $props();
    
    let cabinets = data?.cabinets || [];

    let searchTerm = $state('');
    let selectedCabinet = $state<number | null>(null);
    let showDeleteModal = $state(false);
    let isDeleting = $state(false);
    
    let showSuccessMessage = $state(false);
    let showErrorMessage = $state(false);
    let messageText = $state('');

    let filteredCabinets = $derived(() => {
        if (!searchTerm) return cabinets;
        return cabinets.filter(cabinet => 
            cabinet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cabinet.id.toString().includes(searchTerm)
        );
    });

    let totalCabinets = cabinets.length;

    // Fungsi navigasi
    async function navigateToAdd() {
        await goto('/admin/cabinet/create');
    }

    function openDeleteModal(id: number) {
        selectedCabinet = id;
        showDeleteModal = true;
    }

    function closeDeleteModal() {
        selectedCabinet = null;
        showDeleteModal = false;
    }

    async function handleDelete() {
        if (!selectedCabinet) return;
        
        isDeleting = true;
        
        try {
            const formData = new FormData();
            formData.append('id', selectedCabinet.toString());
            
            const response = await fetch('/admin/cabinet', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (response.ok) {
                showSuccessMessage = true;
                messageText = 'Cabinet deleted successfully';
                
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                showErrorMessage = true;
                messageText = result.message || 'Failed to delete cabinet';
                isDeleting = false;
                closeDeleteModal();
                
                setTimeout(() => {
                    showErrorMessage = false;
                }, 3000);
            }
        } catch (error) {
            console.error('Delete error:', error);
            showErrorMessage = true;
            messageText = 'Network error! Please try again.';
            isDeleting = false;
            closeDeleteModal();
            
            setTimeout(() => {
                showErrorMessage = false;
            }, 3000);
        }
    }

    function handleModalKeydown(e: KeyboardEvent) {
        if (e.key === 'Escape') {
            closeDeleteModal();
        }
    }
</script>

<svelte:head>
    <title>Admin - Cabinets</title>
</svelte:head>

<div class="page">
    <!-- Header Section -->
    <div class="header">
        <div class="header-left">
            <h1 class="page-title">Cabinets</h1>
            <p class="page-subtitle">Manage your storage cabinets</p>
        </div>
        <div class="header-right">
            <button class="add-btn" onclick={navigateToAdd}>
                <span class="add-icon">➕</span>
                <span>Add New Cabinet</span>
            </button>
        </div>
    </div>

    <!-- Stats Cards - Hanya Total Cabinets -->
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-icon">📦</div>
            <div class="stat-content">
                <span class="stat-label">Total Cabinets</span>
                <span class="stat-value">{totalCabinets}</span>
            </div>
        </div>
    </div>

    <!-- Search Bar -->
    <div class="search-container">
        <div class="search-wrapper">
            <span class="search-icon">🔍</span>
            <input 
                type="text" 
                class="search-input" 
                placeholder="Search cabinets by name or ID..."
                bind:value={searchTerm}
                aria-label="Search cabinets"
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

    <!-- Cabinets Grid -->
    {#if filteredCabinets().length === 0}
        <div class="empty-state">
            <span class="empty-icon">📦</span>
            <h3 class="empty-title">No Cabinets Found</h3>
            <p class="empty-description">
                {#if searchTerm}
                    No cabinets match your search criteria. Try a different search term.
                {:else}
                    Get started by creating your first cabinet.
                {/if}
            </p>
            {#if searchTerm}
                <button class="empty-btn" onclick={() => searchTerm = ''}>Clear Search</button>
            {:else}
                <button class="empty-btn" onclick={navigateToAdd}>Add Cabinet</button>
            {/if}
        </div>
    {:else}
        <div class="cabinets-grid">
            {#each filteredCabinets() as cabinet (cabinet.id)}
                <div class="cabinet-card">
                    <!-- Card Header -->
                    <div class="card-header">
                        <span class="cabinet-id">#{cabinet.id}</span>
                        <div class="card-actions">
                            <!-- PERBAIKAN: Ubah button jadi a href -->
                            <a 
								href={`/admin/cabinet/edit?id=${cabinet.id}`}
								class="action-btn edit"
								data-sveltekit-reload
								aria-label="Edit cabinet"
							>
                                ✏️
                            </a>
                            <button 
                                class="action-btn delete" 
                                onclick={() => openDeleteModal(cabinet.id)}
                                aria-label="Delete cabinet"
                            >
                                🗑️
                            </button>
                        </div>
                    </div>

                    <!-- Card Body -->
                    <div class="card-body">
                        <h3 class="cabinet-name">{cabinet.name}</h3>
                        
                        <div class="cabinet-stats">
                            <div class="stat-row">
                                <span class="stat-label">Max Slots</span>
                                <span class="stat-value">{cabinet.maxSlots}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Card Footer -->
                    <div class="card-footer">
                        <span class="footer-text">ID: {cabinet.id}</span>
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
                <h2 class="modal-title">Delete Cabinet</h2>
                <p class="modal-description">
                    Are you sure you want to delete this cabinet? 
                    This action cannot be undone.
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
                            Delete Cabinet
                        {/if}
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .page {
        padding: 1.5rem;
        max-width: 1400px;
        margin: 0 auto;
    }

    /* Header */
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
        display: flex;
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
        grid-template-columns: repeat(1, 1fr);
        max-width: 300px;
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

    .search-container {
        margin-bottom: 2rem;
    }

    .search-wrapper {
        position: relative;
        max-width: 400px;
    }

    .search-icon {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: rgba(255, 255, 255, 0.4);
        font-size: 1.1rem;
    }

    .search-input {
        width: 100%;
        padding: 0.75rem 1rem 0.75rem 2.5rem;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        color: #ffffff;
        font-family: 'Poppins', sans-serif;
        font-size: 0.95rem;
        transition: all 0.2s ease;
    }

    .search-input:focus {
        outline: none;
        border-color: rgba(255, 255, 255, 0.3);
        background: rgba(255, 255, 255, 0.03);
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

    .cabinets-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
    }

    .cabinet-card {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 16px;
        overflow: hidden;
        transition: all 0.3s ease;
    }

    .cabinet-card:hover {
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
    }

    .cabinet-id {
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

    .cabinet-name {
        font-family: 'Poppins', sans-serif;
        font-size: 1.2rem;
        font-weight: 600;
        color: #ffffff;
        margin: 0 0 1rem 0;
    }

    .cabinet-stats {
        margin-bottom: 1rem;
    }

    .stat-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.9rem;
    }

    .stat-row .stat-label {
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.9rem;
    }

    .stat-row .stat-value {
        font-family: 'Poppins', sans-serif;
        font-size: 1rem;
        font-weight: 500;
        color: #ffffff;
    }

    .card-footer {
        padding: 1rem;
        background: rgba(255, 255, 255, 0.02);
        border-top: 1px solid rgba(255, 255, 255, 0.05);
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.4);
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

    /* Responsive */
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

        .cabinets-grid {
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