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
        users = data?.users ?? users
        stats = data?.stats ?? stats
    }

    function getRoleBadge(role: string) {
        const m: Record<string, { cls: string; icon: string; label: string }> = {
        SUPER_ADMIN: { 
            cls: 'super-admin', 
            icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L15 8.5L22 9.5L17 14L18.5 21L12 17.5L5.5 21L7 14L2 9.5L9 8.5L12 2Z"/></svg>`,
            label: 'Super Admin' 
        },
        ADMIN: { 
            cls: 'admin', 
            icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>`,
            label: 'Admin' 
        },
        STOCK_AUDIT: { 
            cls: 'audit', 
            icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
            label: 'Stock Audit' 
        },
        USER: { 
            cls: 'user', 
            icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
            label: 'User' 
        },
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
</script>

<svelte:head>
    <title>Manage Users - Super Admin</title>
</svelte:head>

{#if toast}
    <div class="toast" class:toast-error={toast.type === 'error'}>
        <span class="toast-icon">
            {#if toast.type === 'success'}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
            {:else}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
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

    <div class="header">
        <div class="header-left">
            <div class="badge-system">
                <span class="badge-icon">⚡</span>
                <span>SECURITY CENTRAL</span>
            </div>
            <h1 class="title">Manage Users</h1>
            <p class="subtitle">Kelola tingkat kredensial hak akses & peran pengguna sistem</p>
        </div>
        <button class="btn-primary" onclick={() => showCreateModal = true}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 5v14M5 12h14"/>
            </svg>
            Tambah User
        </button>
    </div>

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
            <span class="stat-label">Active</span>
        </div>
        <div class="stat-card inactive">
            <span class="stat-value">{stats.inactive ?? 0}</span>
            <span class="stat-label">Nonactive</span>
        </div>
    </div>

    <div class="filter-bar">
        <div class="search-wrap">
            <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input type="text" class="search-input" bind:value={searchQuery} placeholder="Cari nama atau username..." />
            {#if searchQuery}
                <button class="clear-search" onclick={() => searchQuery = ''}>✕</button>
            {/if}
        </div>
        
        <div class="select-group">
            <select class="filter-select" bind:value={filterRole}>
                <option value="">Semua Peran / Role</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="ADMIN">Admin</option>
                <option value="STOCK_AUDIT">Stock Audit</option>
                <option value="USER">User</option>
            </select>
            
            <select class="filter-select" bind:value={filterStatus}>
                <option value="">Semua Status Akses</option>
                <option value="active">Status: Aktif</option>
                <option value="inactive">Status: Nonaktif</option>
            </select>
        </div>
    </div>

    <div class="table-container">
        <table class="user-table">
            <thead>
                <tr>
                    <th>User & Identitas</th>
                    <th>Username</th>
                    <th>Hak Akses</th>
                    <th>Status Registrasi</th>
                    <th style="text-align: center;">Total Audit Log</th>
                    <th style="text-align: center;">Konfigurasi</th>
                </tr>
            </thead>
            <tbody>
                {#each filteredUsers as user (user.id)}
                    {@const badge = getRoleBadge(user.role)}
                    <tr class="user-row">
                        <td>
                            <div class="user-cell">
                                <div class="user-avatar" 
                                    class:super-av={user.role === 'SUPER_ADMIN'} 
                                    class:admin-av={user.role === 'ADMIN'} 
                                    class:audit-av={user.role === 'STOCK_AUDIT'}>
                                    {@html badge.icon}
                                </div>
                                <div>
                                    <div class="user-name">{user.name}</div>
                                    <div class="user-id-sub">UID-{user.id.slice(0, 7)}</div>
                                </div>
                            </div>
                        </td>
                        <td>
                            <span class="username-mono">@{user.username}</span>
                        </td>
                        <td>
                            <span class="role-badge {badge.cls}">
                                {badge.label}
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
                                <button type="submit" class="status-badge {user.isActive ? 'active' : 'inactive'}">
                                    <span class="dot-status"></span>
                                    {user.isActive ? 'Aktif' : 'Nonaktif'}
                                </button>
                            </form>
                        </td>
                        <td class="audit-count">{user._count?.audits ?? 0}</td>
                        <td class="action-cell">
                            <div class="action-buttons">
                                <button class="action-btn edit" onclick={() => openEdit(user)} title="Sunting Parameter">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                        <path d="M17 3l4 4-7 7H10v-4l7-7z"/>
                                        <path d="M4 20h16"/>
                                    </svg>
                                </button>
                                {#if user.role !== 'SUPER_ADMIN' || (stats.superAdmin ?? 0) > 1}
                                    <button class="action-btn delete" onclick={() => openDelete(user)} title="Terminasi User">
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
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
                            <div class="empty-icon">📂</div>
                            <p class="empty-title">Data Kosong / Tidak Ditemukan</p>
                            <p class="empty-sub">Coba ubah kata kunci pencarian atau filter pilihan Anda</p>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</div>

{#if showCreateModal}
<div class="modal-overlay" onclick={() => showCreateModal = false}>
    <div class="modal" onclick={(e) => e.stopPropagation()}>
        <div class="modal-header">
            <div>
                <h2>Tambah User Baru</h2>
                <p class="modal-subtitle-form">Daftarkan otentikasi akun ke dalam database</p>
            </div>
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
                <label>Username Account <span class="required">*</span></label>
                <input type="text" name="username" required placeholder="Contoh: alex_audit" />
            </div>
            <div class="form-group">
                <label>Nama Lengkap Identitas <span class="required">*</span></label>
                <input type="text" name="name" required placeholder="Contoh: Alex Suprapto" />
            </div>
            <div class="form-group">
                <label>Sandi Keamanan Autentikasi <span class="required">*</span></label>
                <input type="password" name="password" required placeholder="••••••••" />
            </div>
            <div class="form-group">
                <label>Otoritas Penugasan (Role) <span class="required">*</span></label>
                <select name="role">
                    <option value="ADMIN">Admin Penanggung Jawab</option>
                    <option value="STOCK_AUDIT">Stock Audit Lapangan</option>
                    <option value="USER">User Umum / Peninjau</option>
                </select>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn-secondary" onclick={() => showCreateModal = false}>Batalkan</button>
                <button type="submit" class="btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Proses Menyimpan...' : 'Simpan Kredensial'}
                </button>
            </div>
        </form>
    </div>
</div>
{/if}

{#if showEditModal}
<div class="modal-overlay" onclick={() => showEditModal = false}>
    <div class="modal" onclick={(e) => e.stopPropagation()}>
        <div class="modal-header">
            <div>
                <h2>Modifikasi Direktori User</h2>
                <p class="modal-subtitle-form">Sesuaikan hak operasional pengguna</p>
            </div>
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
                <label>Nama Lengkap Identitas <span class="required">*</span></label>
                <input type="text" name="name" bind:value={editDraft.name} required />
            </div>
            <div class="form-group">
                <label>Pemberian Peran Baru</label>
                <select name="role" bind:value={editDraft.role}>
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="ADMIN">Admin</option>
                    <option value="STOCK_AUDIT">Stock Audit</option>
                    <option value="USER">User</option>
                </select>
            </div>
            <div class="form-group">
                <label>Status Sistem</label>
                <select name="isActive" bind:value={editDraft.isActive}>
                    <option value={true}>Izinkan Akses Masuk (Aktif)</option>
                    <option value={false}>Blokir Seluruh Akses (Nonaktif)</option>
                </select>
            </div>
            <div class="form-group">
                <label>Ganti Password Baru (Opsional)</label>
                <input type="password" name="newPassword" bind:value={editDraft.newPassword} placeholder="Tinggalkan kosong jika tidak ada pergantian" />
                <span class="hint">Kosongkan jika tidak ingin mengubah password keamanan yang aktif saat ini</span>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn-secondary" onclick={() => showEditModal = false}>Batalkan</button>
                <button type="submit" class="btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Memperbarui...' : 'Simpan Perubahan'}
                </button>
            </div>
        </form>
    </div>
</div>
{/if}

{#if showDeleteModal && selectedUser}
<div class="modal-overlay" onclick={() => showDeleteModal = false}>
    <div class="modal modal-sm" onclick={(e) => e.stopPropagation()}>
        <div class="modal-icon">⚠️</div>
        <h2 class="modal-title">Terminasi Kredensial</h2>
        <p class="modal-description">
            Apakah Anda sepenuhnya yakin ingin menghapus permanen akun milik <strong>{selectedUser.name}</strong>? Seluruh integrasi data log berkaitan akan terpengaruh.
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
                    {isSubmitting ? 'Menghapus Akun...' : 'Ya, Eksekusi Hapus'}
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
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Fira Code', monospace;
    }

    :global(body) {
        background: #f0f2f5;
        color: #1a1f2e;
    }

    /* TOAST */
    .toast {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 20px;
        background: #1e293b;
        border-radius: 40px;
        font-size: 0.75rem;
        font-weight: 500;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        border: 1px solid rgba(34, 197, 94, 0.3);
        color: #86efac;
    }
    .toast.toast-error {
        border-color: rgba(239, 68, 68, 0.4);
        color: #fca5a5;
        background: #2d1a1f;
    }

    /* PAGE */
    .page {
        max-width: 1100px;
        margin: 0 auto;
        padding: 1.8rem 1.5rem;
    }

    /* HEADER */
    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        flex-wrap: wrap;
        gap: 1rem;
    }
    .header-left {
        flex: 1;
    }
    .badge-system {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: #e8edf5;
        padding: 6px 14px;
        border-radius: 40px;
        font-size: 0.7rem;
        font-weight: 700;
        color: #0f3b2c;
        border: 1px solid #cbd5e1;
        margin-bottom: 1rem;
        letter-spacing: 0.5px;
    }
    .badge-icon {
        font-size: 0.85rem;
    }
    .title {
        font-size: 1.8rem;
        font-weight: 800;
        color: #0f172a;
        letter-spacing: -0.3px;
        margin-bottom: 0.3rem;
    }
    .subtitle {
        font-size: 0.8rem;
        color: #475569;
        font-weight: 400;
    }

    /* STATS GRID - WARNA TERANG */
    .stats-grid {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 0.8rem;
        margin-bottom: 2rem;
    }
    .stat-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        padding: 0.9rem 0.7rem;
        text-align: center;
        transition: all 0.2s;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    }
    .stat-card:hover {
        background: #f8fafc;
        border-color: #cbd5e1;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
    .stat-value {
        display: block;
        font-size: 1.5rem;
        font-weight: 800;
        color: #0f172a;
        line-height: 1.2;
        margin-bottom: 0.2rem;
    }
    .stat-label {
        font-size: 0.6rem;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.3px;
    }
    .stat-card.super .stat-value { color: #7c3aed; }
    .stat-card.admin .stat-value { color: #059669; }
    .stat-card.audit .stat-value { color: #0284c7; }
    .stat-card.active .stat-value { color: #059669; }
    .stat-card.inactive .stat-value { color: #dc2626; }

    /* FILTER */
    .filter-bar {
        display: flex;
        gap: 0.8rem;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
    }
    .search-wrap {
        flex: 2;
        min-width: 220px;
        display: flex;
        align-items: center;
        gap: 8px;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 0.5rem 0.9rem;
    }
    .search-wrap:focus-within {
        border-color: #10b981;
        box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
    }
    .search-input {
        flex: 1;
        background: transparent;
        border: none;
        color: #0f172a;
        font-size: 0.8rem;
        outline: none;
    }
    .search-input::placeholder {
        color: #94a3b8;
    }
    .search-icon {
        color: #94a3b8;
    }
    .clear-search {
        background: none;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        font-size: 0.7rem;
    }
    .select-group {
        display: flex;
        gap: 0.6rem;
    }
    .filter-select {
        padding: 0.5rem 1rem;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        color: #1e293b;
        font-size: 0.75rem;
        cursor: pointer;
    }
    .filter-select:focus {
        border-color: #10b981;
        outline: none;
    }

    /* TABLE - WARNA TERANG, BUKAN HITAM */
    .table-container {
        background: #ffffff;
        border-radius: 16px;
        border: 1px solid #e2e8f0;
        overflow-x: auto;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }
    .user-table {
        width: 100%;
        border-collapse: collapse;
        min-width: 700px;
    }
    .user-table th {
        padding: 0.9rem 1rem;
        font-size: 0.65rem;
        font-weight: 700;
        color: #475569;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
    }
    .user-table td {
        padding: 0.8rem 1rem;
        font-size: 0.8rem;
        border-bottom: 1px solid #f1f5f9;
        color: #334155;
    }
    .user-row:hover td {
        background: #f8fafc;
    }

    /* USER CELL */
    .user-cell {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .user-avatar {
        width: 34px;
        height: 34px;
        background: #f1f5f9;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1rem;
        border: 1px solid #e2e8f0;
    }
    .user-avatar.super-av { background: #ede9fe; border-color: #c4b5fd; }
    .user-avatar.admin-av { background: #d1fae5; border-color: #a7f3d0; }
    .user-avatar.audit-av { background: #e0f2fe; border-color: #bae6fd; }
    .user-name {
        font-weight: 700;
        color: #0f172a;
        font-size: 0.85rem;
    }
    .user-id-sub {
        font-size: 0.6rem;
        color: #64748b;
        margin-top: 2px;
    }
    .username-mono {
        font-family: monospace;
        color: #0f3b2c;
        font-weight: 500;
        background: #ecfdf5;
        padding: 3px 8px;
        border-radius: 20px;
        font-size: 0.7rem;
    }

    /* ROLE BADGE */
    .role-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 30px;
        font-size: 0.65rem;
        font-weight: 700;
    }
    .role-badge.super-admin { background: #ede9fe; color: #6d28d9; border: 1px solid #c4b5fd; }
    .role-badge.admin { background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
    .role-badge.audit { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
    .role-badge.user { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }

    /* STATUS BADGE */
    .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 12px;
        border-radius: 30px;
        font-size: 0.65rem;
        font-weight: 600;
        cursor: pointer;
        border: 1px solid transparent;
        transition: 0.1s;
        background: none;
    }
    .dot-status {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        display: inline-block;
    }
    .status-badge.active {
        background: #d1fae5;
        color: #065f46;
        border-color: #a7f3d0;
    }
    .status-badge.active .dot-status { background: #059669; }
    .status-badge.inactive {
        background: #fee2e2;
        color: #991b1b;
        border-color: #fecaca;
    }
    .status-badge.inactive .dot-status { background: #dc2626; }
    .status-badge:hover {
        filter: brightness(0.97);
    }

    .audit-count {
        text-align: center;
        font-weight: 600;
        color: #475569;
        font-size: 0.8rem;
    }
    .action-cell {
        text-align: center;
    }
    .action-buttons {
        display: flex;
        gap: 6px;
        justify-content: center;
    }
    .action-btn {
        width: 28px;
        height: 28px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: #64748b;
        transition: 0.15s;
    }
    .action-btn.edit:hover { background: #d1fae5; border-color: #10b981; color: #059669; }
    .action-btn.delete:hover { background: #fee2e2; border-color: #ef4444; color: #dc2626; }

    /* EMPTY STATE */
    .empty-state {
        text-align: center;
        padding: 2.5rem !important;
    }
    .empty-icon { font-size: 1.8rem; opacity: 0.5; margin-bottom: 0.5rem; }
    .empty-title { font-size: 0.85rem; font-weight: 700; color: #334155; }
    .empty-sub { font-size: 0.65rem; color: #64748b; }

    /* MODAL */
    .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1100;
        padding: 1rem;
    }
    .modal {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 20px;
        padding: 1.5rem;
        width: 440px;
        max-width: 100%;
        box-shadow: 0 20px 35px rgba(0, 0, 0, 0.15);
    }
    .modal-sm {
        text-align: center;
        width: 380px;
    }
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        border-bottom: 1px solid #e2e8f0;
        padding-bottom: 0.8rem;
        margin-bottom: 1.2rem;
    }
    .modal-header h2 {
        font-size: 1.1rem;
        color: #0f172a;
    }
    .modal-subtitle-form {
        color: #64748b;
        font-size: 0.65rem;
        margin-top: 4px;
    }
    .modal-close {
        background: none;
        border: none;
        color: #94a3b8;
        font-size: 1.2rem;
        cursor: pointer;
    }
    .modal-icon {
        font-size: 2rem;
        margin-bottom: 0.8rem;
    }
    .modal-title {
        font-size: 1rem;
        font-weight: 700;
        color: #0f172a;
        margin-bottom: 0.5rem;
    }
    .modal-description {
        font-size: 0.75rem;
        color: #475569;
        margin-bottom: 1.2rem;
        line-height: 1.4;
    }
    .form-group {
        margin-bottom: 1rem;
    }
    .form-group label {
        font-size: 0.65rem;
        font-weight: 600;
        color: #475569;
        margin-bottom: 0.3rem;
        display: block;
    }
    .form-group input,
    .form-group select {
        width: 100%;
        padding: 0.6rem 0.8rem;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        color: #0f172a;
        font-size: 0.75rem;
    }
    .form-group input:focus,
    .form-group select:focus {
        border-color: #10b981;
        outline: none;
        box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
    }
    .required {
        color: #ef4444;
    }
    .hint {
        font-size: 0.55rem;
        color: #94a3b8;
        margin-top: 0.2rem;
        display: block;
    }
    .form-error {
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 8px;
        padding: 0.5rem;
        font-size: 0.7rem;
        color: #dc2626;
        margin-bottom: 1rem;
    }
    .modal-actions {
        display: flex;
        gap: 10px;
        margin-top: 1.2rem;
    }
    .btn-primary {
    background: #10b981;
    border: none;
    padding: 0.55rem 1.2rem;
    border-radius: 30px;
    font-weight: 700;
    font-size: 0.75rem;
    color: #ffffff;
    cursor: pointer;
    transition: 0.2s;
    display: inline-flex;      /* Tambahkan ini */
    align-items: center;       /* Tambahkan ini */
    gap: 8px;                  /* Tambahkan ini (jarak antara icon dan teks) */
    }
    .btn-primary:hover {
        background: #059669;
        transform: translateY(-1px);
    }
    .btn-primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    .btn-secondary {
        background: #f1f5f9;
        border: 1px solid #e2e8f0;
        padding: 0.55rem 1.2rem;
        border-radius: 30px;
        font-size: 0.75rem;
        color: #475569;
        cursor: pointer;
    }
    .btn-secondary:hover {
        background: #e2e8f0;
    }
    .btn-danger {
        background: #ef4444;
        border: none;
        padding: 0.55rem 1.2rem;
        border-radius: 30px;
        font-weight: 700;
        font-size: 0.75rem;
        color: #ffffff;
        cursor: pointer;
    }
    .btn-danger:hover {
        background: #dc2626;
    }

    /* RESPONSIVE */
    @media (max-width: 900px) {
        .stats-grid {
            grid-template-columns: repeat(3, 1fr);
        }
        .page {
            padding: 1.2rem;
        }
        .title {
            font-size: 1.5rem;
        }
    }
    @media (max-width: 640px) {
        .stats-grid {
            grid-template-columns: repeat(2, 1fr);
        }
        .filter-bar {
            flex-direction: column;
        }
        .header {
            flex-direction: column;
            align-items: flex-start;
        }
        .btn-primary {
            width: 100%;
            justify-content: center;
        }
    }
</style>