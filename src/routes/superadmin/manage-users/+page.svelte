<script lang="ts">
    import { enhance } from '$app/forms'
    import { invalidateAll } from '$app/navigation'

    let { data, form } = $props()

    let users = $state(data?.users ?? [])
    let stats = $state(data?.stats ?? {})

    let showCreateModal = $state(false)
    let showEditModal   = $state(false)
    let showDeleteModal = $state(false)
    let selectedUser    = $state<any>(null)
    let searchQuery     = $state('')
    let filterRole      = $state('')
    let filterStatus    = $state('')
    let isSubmitting    = $state(false)

    // Toast di BOTTOM
    let toast = $state<{ msg: string; type: 'success' | 'error' } | null>(null)
    let toastTimer: ReturnType<typeof setTimeout>

    function showToast(msg: string, type: 'success' | 'error' = 'success') {
        clearTimeout(toastTimer)
        toast = { msg, type }
        toastTimer = setTimeout(() => toast = null, 3500)
    }

    // Refresh data setelah action
    async function refreshData() {
        await invalidateAll()
        // Update state dari data baru
        users = data?.users ?? users
        stats = data?.stats ?? stats
    }

    function getRoleBadge(role: string) {
        const m: Record<string, { cls: string; icon: string; label: string }> = {
            SUPER_ADMIN: { cls: 'super-admin', icon: '👑', label: 'Super Admin' },
            ADMIN:       { cls: 'admin',       icon: '🛡️', label: 'Admin' },
            STOCK_AUDIT: { cls: 'audit',       icon: '📋', label: 'Stock Audit' },
            USER:        { cls: 'user',        icon: '👤', label: 'User' },
        }
        return m[role] ?? { cls: 'user', icon: '👤', label: role }
    }

    // Filtered users
    const filteredUsers = $derived(
        users.filter((u: any) => {
            const q = searchQuery.toLowerCase()
            const matchQ = !q || u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q)
            const matchR = !filterRole   || u.role === filterRole
            const matchS = !filterStatus ||
                (filterStatus === 'active'   &&  u.isActive) ||
                (filterStatus === 'inactive' && !u.isActive)
            return matchQ && matchR && matchS
        })
    )

    // Edit draft
    let editDraft = $state({ userId: '', name: '', role: 'ADMIN', isActive: true, newPassword: '' })

    function openEdit(u: any) {
        editDraft = { userId: u.id, name: u.name, role: u.role, isActive: u.isActive, newPassword: '' }
        showEditModal = true
    }

    function openDelete(u: any) { 
        selectedUser = u
        showDeleteModal = true 
    }

    // Handle form success
    function onFormSuccess(message: string, closeModal?: () => void) {
        showToast(message, 'success')
        if (closeModal) closeModal()
        refreshData()
    }
</script>

<svelte:head>
    <title>Manage Users - Super Admin</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
</svelte:head>

<!-- Toast di BOTTOM RIGHT -->
{#if toast}
    <div class="toast" class:toast-error={toast.type === 'error'}>
        <span class="toast-icon">
            {#if toast.type === 'success'}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
            {:else}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
            {/if}
        </span>
        <span>{toast.msg}</span>
    </div>
{/if}

<div class="page">

    <!-- Header -->
    <div class="header">
        <div>
            <h1 class="title">Manage Users</h1>
            <p class="subtitle">Kelola akses dan role pengguna sistem</p>
        </div>
        <button class="btn-primary" onclick={() => showCreateModal = true}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 5v14M5 12h14"/>
            </svg>
            Tambah User
        </button>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
        <div class="stat-card">
            <span class="stat-value">{stats.total ?? 0}</span>
            <span class="stat-label">Total User</span>
        </div>
        <div class="stat-card super">
            <span class="stat-value">{stats.superAdmin ?? 0}</span>
            <span class="stat-label">Super Admin</span>
        </div>
        <div class="stat-card admin">
            <span class="stat-value">{stats.admin ?? 0}</span>
            <span class="stat-label">Admin</span>
        </div>
        <div class="stat-card audit">
            <span class="stat-value">{stats.stockAudit ?? 0}</span>
            <span class="stat-label">Stock Audit</span>
        </div>
        <div class="stat-card active">
            <span class="stat-value">{stats.active ?? 0}</span>
            <span class="stat-label">Aktif</span>
        </div>
        <div class="stat-card inactive">
            <span class="stat-value">{stats.inactive ?? 0}</span>
            <span class="stat-label">Nonaktif</span>
        </div>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar">
        <div class="search-wrap">
            <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input type="text" class="search-input" bind:value={searchQuery} placeholder="Cari nama atau username..." />
            {#if searchQuery}
                <button class="clear-search" onclick={() => searchQuery = ''}>✕</button>
            {/if}
        </div>
        <select class="filter-select" bind:value={filterRole}>
            <option value="">Semua Role</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="ADMIN">Admin</option>
            <option value="STOCK_AUDIT">Stock Audit</option>
            <option value="USER">User</option>
        </select>
        <select class="filter-select" bind:value={filterStatus}>
            <option value="">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
        </select>
    </div>

    <!-- Users Table -->
    <div class="table-container">
        <table class="user-table">
            <thead>
                <tr>
                    <th>User</th>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Audit</th>
                    <th>Aksi</th>
                </tr>
            </thead>
            <tbody>
                {#each filteredUsers as user (user.id)}
                    {@const badge = getRoleBadge(user.role)}
                    <tr class="user-row">
                        <td>
                            <div class="user-cell">
                                <div class="user-avatar">{badge.icon}</div>
                                <div>
                                    <div class="user-name">{user.name}</div>
                                </div>
                            </div>
                        </td>
                        <td class="username-mono">{user.username}</td>
                        <td>
                            <span class="role-badge {badge.cls}">
                                {badge.icon} {badge.label}
                            </span>
                        </td>
                        <td>
                            <form method="POST" action="?/toggleStatus" use:enhance={() => {
                                return async ({ result }) => {
                                    if (result.type === 'success') {
                                        showToast(user.isActive ? 'User dinonaktifkan' : 'User diaktifkan', 'success')
                                        await refreshData()
                                    } else if (result.data?.message) {
                                        showToast(result.data.message, 'error')
                                    }
                                }
                            }}>
                                <input type="hidden" name="userId" value={user.id} />
                                <input type="hidden" name="isActive" value={(!user.isActive).toString()} />
                                <button type="submit" class="status-badge {user.isActive ? 'active' : 'inactive'}">
                                    {user.isActive ? 'Aktif' : 'Nonaktif'}
                                </button>
                            </form>
                        </td>
                        <td class="audit-count">{user._count?.audits ?? 0}</td>
                        <td>
                            <div class="action-buttons">
                                <button class="action-btn edit" onclick={() => openEdit(user)} title="Edit">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M17 3l4 4-7 7H10v-4l7-7z"/>
                                        <path d="M4 20h16"/>
                                    </svg>
                                </button>
                                {#if user.role !== 'SUPER_ADMIN' || (stats.superAdmin ?? 0) > 1}
                                    <button class="action-btn delete" onclick={() => openDelete(user)} title="Hapus">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                        </svg>
                                    </button>
                                {/if}
                            </div>
                        </td>
                    </tr>
                {:else}
                    <tr>
                        <td colspan="6" class="empty-state">
                            <div class="empty-icon">👥</div>
                            <p>Tidak ada user ditemukan</p>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</div>

<!-- Modal Create User -->
{#if showCreateModal}
<div class="modal-overlay" onclick={() => showCreateModal = false}>
    <div class="modal" onclick={(e) => e.stopPropagation()}>
        <div class="modal-header">
            <h2>Tambah User Baru</h2>
            <button class="modal-close" onclick={() => showCreateModal = false}>✕</button>
        </div>
        <form method="POST" action="?/create" use:enhance={() => {
            isSubmitting = true
            return async ({ result }) => {
                isSubmitting = false
                if (result.type === 'success') {
                    showCreateModal = false
                    showToast('User berhasil ditambahkan!', 'success')
                    await refreshData()
                } else if (result.data?.message) {
                    showToast(result.data.message, 'error')
                }
            }
        }}>
            {#if form?.success === false && showCreateModal}
                <div class="form-error">{form.message}</div>
            {/if}
            <div class="form-group">
                <label>Username <span class="required">*</span></label>
                <input type="text" name="username" required placeholder="username" />
            </div>
            <div class="form-group">
                <label>Nama Lengkap <span class="required">*</span></label>
                <input type="text" name="name" required placeholder="John Doe" />
            </div>
            <div class="form-group">
                <label>Password <span class="required">*</span></label>
                <input type="password" name="password" required placeholder="••••••••" />
            </div>
            <div class="form-group">
                <label>Role <span class="required">*</span></label>
                <select name="role">
                    <option value="ADMIN">Admin</option>
                    <option value="STOCK_AUDIT">Stock Audit</option>
                    <option value="USER">User</option>
                </select>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn-secondary" onclick={() => showCreateModal = false}>Batal</button>
                <button type="submit" class="btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                </button>
            </div>
        </form>
    </div>
</div>
{/if}

<!-- Modal Edit User -->
{#if showEditModal}
<div class="modal-overlay" onclick={() => showEditModal = false}>
    <div class="modal" onclick={(e) => e.stopPropagation()}>
        <div class="modal-header">
            <h2>Edit User</h2>
            <button class="modal-close" onclick={() => showEditModal = false}>✕</button>
        </div>
        <form method="POST" action="?/update" use:enhance={() => {
            isSubmitting = true
            return async ({ result }) => {
                isSubmitting = false
                if (result.type === 'success') {
                    showEditModal = false
                    showToast('User berhasil diupdate!', 'success')
                    await refreshData()
                } else if (result.data?.message) {
                    showToast(result.data.message, 'error')
                }
            }
        }}>
            <input type="hidden" name="userId" value={editDraft.userId} />
            <div class="form-group">
                <label>Nama Lengkap <span class="required">*</span></label>
                <input type="text" name="name" bind:value={editDraft.name} required />
            </div>
            <div class="form-group">
                <label>Role</label>
                <select name="role" bind:value={editDraft.role}>
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="ADMIN">Admin</option>
                    <option value="STOCK_AUDIT">Stock Audit</option>
                    <option value="USER">User</option>
                </select>
            </div>
            <div class="form-group">
                <label>Status</label>
                <select name="isActive" bind:value={editDraft.isActive}>
                    <option value={true}>Aktif</option>
                    <option value={false}>Nonaktif</option>
                </select>
            </div>
            <div class="form-group">
                <label>Password Baru</label>
                <input type="password" name="newPassword" bind:value={editDraft.newPassword} placeholder="Kosongkan jika tidak diubah" />
                <span class="hint">Kosongkan jika tidak ingin mengubah password</span>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn-secondary" onclick={() => showEditModal = false}>Batal</button>
                <button type="submit" class="btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
            </div>
        </form>
    </div>
</div>
{/if}

<!-- Modal Delete User -->
{#if showDeleteModal && selectedUser}
<div class="modal-overlay" onclick={() => showDeleteModal = false}>
    <div class="modal modal-sm" onclick={(e) => e.stopPropagation()}>
        <div class="modal-icon">⚠️</div>
        <h2 class="modal-title">Hapus User</h2>
        <p class="modal-description">
            Apakah Anda yakin ingin menghapus <strong>{selectedUser.name}</strong>?
            Tindakan ini tidak dapat dibatalkan.
        </p>
        <form method="POST" action="?/delete" use:enhance={() => {
            isSubmitting = true
            return async ({ result }) => {
                isSubmitting = false
                if (result.type === 'success') {
                    showDeleteModal = false
                    showToast('User berhasil dihapus!', 'success')
                    await refreshData()
                } else if (result.data?.message) {
                    showToast(result.data.message, 'error')
                }
            }
        }}>
            <input type="hidden" name="userId" value={selectedUser.id} />
            <div class="modal-actions">
                <button type="button" class="btn-secondary" onclick={() => showDeleteModal = false}>Batal</button>
                <button type="submit" class="btn-danger" disabled={isSubmitting}>
                    {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
            </div>
        </form>
    </div>
</div>
{/if}

<style>
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

    :global(body) {
        font-family: 'Inter', sans-serif;
        background: #0a0a0f;
    }

    /* Toast - BOTTOM RIGHT */
    .toast {
        position: fixed;
        bottom: 1.5rem;
        right: 1.5rem;
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 20px;
        background: #14141f;
        border-radius: 12px;
        font-size: 0.85rem;
        font-weight: 500;
        animation: slideUp 0.3s ease;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .toast:not(.toast-error) {
        background: rgba(0, 255, 157, 0.1);
        border-color: rgba(0, 255, 157, 0.3);
        color: #00ff9d;
    }

    .toast.toast-error {
        background: rgba(255, 107, 107, 0.1);
        border-color: rgba(255, 107, 107, 0.3);
        color: #ff6b6b;
    }

    .toast-icon {
        display: flex;
        align-items: center;
    }

    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    /* Page */
    .page {
        max-width: 1200px;
        margin: 0 auto;
        padding: 1.5rem;
    }

    /* Header */
    .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
        gap: 1rem;
    }

    .title {
        font-size: 1.5rem;
        font-weight: 700;
        background: linear-gradient(135deg, #fff, #00ff9d);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin-bottom: 0.25rem;
    }

    .subtitle {
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.5);
    }

    /* Stats Grid */
    .stats-grid {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 0.75rem;
        margin-bottom: 1.5rem;
    }

    .stat-card {
        text-align: center;
        padding: 1rem;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 12px;
    }

    .stat-value {
        display: block;
        font-size: 1.3rem;
        font-weight: 700;
        color: #fff;
    }

    .stat-label {
        font-size: 0.6rem;
        color: rgba(255, 255, 255, 0.4);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .stat-card.super .stat-value { color: #d946ef; }
    .stat-card.admin .stat-value { color: #00ff9d; }
    .stat-card.audit .stat-value { color: #00ccff; }
    .stat-card.active .stat-value { color: #00ff9d; }
    .stat-card.inactive .stat-value { color: #ff6b6b; }

    /* Filter Bar */
    .filter-bar {
        display: flex;
        gap: 0.75rem;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
    }

    .search-wrap {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 40px;
        padding: 0.5rem 1rem;
    }

    .search-icon {
        color: rgba(255, 255, 255, 0.4);
    }

    .search-input {
        flex: 1;
        background: none;
        border: none;
        color: #fff;
        font-size: 0.8rem;
        outline: none;
    }

    .search-input::placeholder {
        color: rgba(255, 255, 255, 0.3);
    }

    .clear-search {
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.4);
        cursor: pointer;
        font-size: 0.8rem;
    }

    .filter-select {
        padding: 0.5rem 1rem;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 40px;
        color: #fff;
        font-size: 0.8rem;
        cursor: pointer;
    }

    /* Table */
    .table-container {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 16px;
        overflow-x: auto;
    }

    .user-table {
        width: 100%;
        border-collapse: collapse;
    }

    .user-table th {
        text-align: left;
        padding: 1rem;
        font-size: 0.65rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.4);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .user-table td {
        padding: 0.8rem 1rem;
        font-size: 0.8rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.03);
    }

    .user-row:hover td {
        background: rgba(255, 255, 255, 0.02);
    }

    /* User Cell */
    .user-cell {
        display: flex;
        align-items: center;
        gap: 0.6rem;
    }

    .user-avatar {
        width: 32px;
        height: 32px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1rem;
    }

    .user-name {
        font-weight: 500;
        color: #fff;
    }

    .username-mono {
        font-family: monospace;
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.6);
    }

    /* Role Badge */
    .role-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 0.2rem 0.7rem;
        border-radius: 20px;
        font-size: 0.65rem;
        font-weight: 500;
    }

    .role-badge.super-admin { background: rgba(217, 70, 239, 0.12); color: #d946ef; }
    .role-badge.admin { background: rgba(0, 255, 157, 0.1); color: #00ff9d; }
    .role-badge.audit { background: rgba(0, 204, 255, 0.1); color: #00ccff; }
    .role-badge.user { background: rgba(255, 255, 255, 0.05); color: rgba(255, 255, 255, 0.6); }

    /* Status Badge Button */
    .status-badge {
        display: inline-block;
        padding: 0.2rem 0.8rem;
        border-radius: 20px;
        font-size: 0.65rem;
        font-weight: 500;
        cursor: pointer;
        border: none;
        font-family: inherit;
    }

    .status-badge.active {
        background: rgba(0, 255, 157, 0.1);
        color: #00ff9d;
        border: 1px solid rgba(0, 255, 157, 0.2);
    }

    .status-badge.inactive {
        background: rgba(255, 107, 107, 0.1);
        color: #ff6b6b;
        border: 1px solid rgba(255, 107, 107, 0.2);
    }

    .status-badge:hover {
        opacity: 0.8;
    }

    .audit-count {
        text-align: center;
        color: rgba(255, 255, 255, 0.6);
        font-family: monospace;
    }

    /* Action Buttons */
    .action-buttons {
        display: flex;
        gap: 0.5rem;
    }

    .action-btn {
        width: 28px;
        height: 28px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        color: rgba(255, 255, 255, 0.5);
    }

    .action-btn.edit:hover {
        background: rgba(0, 255, 157, 0.15);
        border-color: rgba(0, 255, 157, 0.3);
        color: #00ff9d;
    }

    .action-btn.delete:hover {
        background: rgba(255, 107, 107, 0.15);
        border-color: rgba(255, 107, 107, 0.3);
        color: #ff6b6b;
    }

    /* Empty State */
    .empty-state {
        text-align: center;
        padding: 3rem;
        color: rgba(255, 255, 255, 0.4);
    }

    .empty-icon {
        font-size: 2rem;
        margin-bottom: 0.5rem;
        opacity: 0.5;
    }

    /* Modal */
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .modal {
        background: #14141f;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        padding: 1.5rem;
        width: 420px;
        max-width: 92vw;
        max-height: 90vh;
        overflow-y: auto;
    }

    .modal-sm {
        width: 380px;
        text-align: center;
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.2rem;
    }

    .modal-header h2 {
        font-size: 1.1rem;
        font-weight: 600;
        color: #fff;
    }

    .modal-close {
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.5);
        font-size: 1.2rem;
        cursor: pointer;
    }

    .modal-close:hover {
        color: #fff;
    }

    .modal-icon {
        font-size: 2.5rem;
        margin-bottom: 0.75rem;
    }

    .modal-title {
        font-size: 1.1rem;
        font-weight: 600;
        color: #fff;
        margin-bottom: 0.5rem;
    }

    .modal-description {
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.5);
        margin-bottom: 1rem;
    }

    /* Form */
    .form-group {
        margin-bottom: 1rem;
    }

    .form-group label {
        display: block;
        font-size: 0.7rem;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.6);
        margin-bottom: 0.25rem;
    }

    .form-group input, .form-group select {
        width: 100%;
        padding: 0.6rem 0.8rem;
        background: #1a1a2a;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        color: #fff;
        font-size: 0.8rem;
        font-family: inherit;
    }

    .form-group input:focus, .form-group select:focus {
        outline: none;
        border-color: #00ff9d;
    }

    .required {
        color: #ff6b6b;
    }

    .hint {
        display: block;
        font-size: 0.6rem;
        color: rgba(255, 255, 255, 0.35);
        margin-top: 0.25rem;
    }

    .form-error {
        padding: 0.6rem;
        background: rgba(255, 107, 107, 0.1);
        border: 1px solid rgba(255, 107, 107, 0.2);
        border-radius: 10px;
        color: #ff6b6b;
        font-size: 0.7rem;
        margin-bottom: 1rem;
    }

    /* Modal Actions */
    .modal-actions {
        display: flex;
        gap: 0.75rem;
        margin-top: 1rem;
    }

    .btn-secondary, .btn-danger {
        flex: 1;
        padding: 0.6rem;
        border-radius: 10px;
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
        font-family: inherit;
    }

    /* Button Primary */
    .btn-primary {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1.2rem;
        background: linear-gradient(135deg, #00ff9d, #00ccff);
        border: none;
        border-radius: 40px;
        color: #000;
        font-weight: 600;
        font-size: 0.8rem;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.2s;
    }

    .btn-primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 255, 157, 0.2);
    }

    .btn-primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .btn-secondary {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.7);
    }

    .btn-secondary:hover {
        background: rgba(255, 255, 255, 0.1);
    }

    .btn-danger {
        background: #ff6b6b;
        border: none;
        color: #fff;
    }

    .btn-danger:hover:not(:disabled) {
        background: #ff5252;
    }

    /* Responsive */
    @media (max-width: 900px) {
        .stats-grid {
            grid-template-columns: repeat(3, 1fr);
        }
    }

    @media (max-width: 700px) {
        .stats-grid {
            grid-template-columns: repeat(2, 1fr);
        }

        .filter-bar {
            flex-direction: column;
        }

        .user-table th:nth-child(2),
        .user-table td:nth-child(2) {
            display: none;
        }
    }

    @media (max-width: 480px) {
        .page {
            padding: 1rem;
        }

        .stats-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }
</style>