<script lang="ts">
    import { goto } from '$app/navigation';
    import { enhance } from '$app/forms';

    let { data, form } = $props();
    let cabinets = $derived(data.cabinets || []);
    let sections = $derived(data.sections || []);
    let items = $derived(data.items || []);
    let showCabinetModal = $state(false);
    let showSectionModal = $state(false);

    let newCabinet = $state({ name: '', maxSlots: 10 });
    let newSection = $state({ name: '', type: '', cabinetId: 0 });

    let errorMessage = $state('');
    let successMessage = $state('');

    $effect(() => {
        if (form?.error) {
            errorMessage = form.error;
            successMessage = '';
        }
        if (form?.success) {
            successMessage = 'Berhasil dibuat!';
            errorMessage = '';
        }
    });

    function closeCabinetModal() { showCabinetModal = false; newCabinet = { name: '', maxSlots: 10 }; }
    function closeSectionModal() { showSectionModal = false; newSection = { name: '', type: '', cabinetId: 0 }; }
</script>

<div class="page">
    <div class="header">
        <button class="back-btn" onclick={() => goto('/admin/service-form')}>← Kembali</button>
        <h1>Buat Service Form Baru</h1>
    </div>

    {#if errorMessage}
        <div class="alert error">{errorMessage}</div>
    {/if}
    {#if successMessage}
        <div class="alert success">{successMessage}</div>
    {/if}

    <form method="POST" use:enhance class="form-card">
        <h2>Data Customer</h2>
        <div class="form-grid">
            <div class="fg">
                <label class="fl">Nama Customer <span class="req">*</span></label>
                <input class="fi" type="text" name="customerName" required placeholder="Nama lengkap" />
            </div>
            <div class="fg">
                <label class="fl">No. HP</label>
                <input class="fi" type="text" name="customerPhone" placeholder="08xxx" />
            </div>
        </div>

        <h2>Data Device</h2>
        <div class="form-grid">
            <div class="fg">
                <label class="fl">Jenis Device <span class="req">*</span></label>
                <select class="fi" name="deviceType" required>
                    <option value="">Pilih...</option>
                    <option value="Handphone">Handphone</option>
                    <option value="Laptop">Laptop</option>
                    <option value="Tablet">Tablet</option>
                    <option value="PC">PC / Desktop</option>
                    <option value="Lainnya">Lainnya</option>
                </select>
            </div>
            <div class="fg">
                <label class="fl">Merek</label>
                <input class="fi" type="text" name="deviceBrand" placeholder="Samsung, Apple, dll" />
            </div>
            <div class="fg">
                <label class="fl">Model</label>
                <input class="fi" type="text" name="deviceModel" placeholder="Galaxy S24, iPhone 15, dll" />
            </div>
            <div class="fg">
                <label class="fl">IMEI / Serial</label>
                <input class="fi" type="text" name="deviceIMEI" placeholder="Nomor IMEI" />
            </div>
        </div>

        <h2>Deskripsi Masalah</h2>
        <div class="fg full">
            <textarea class="fi fta" name="problemDescription" rows="4" placeholder="Jelaskan masalah device customer..."></textarea>
        </div>

        <div class="form-actions">
            <button type="button" class="btn-cancel" onclick={() => goto('/admin/service-form')}>Batal</button>
            <button type="submit" class="btn-submit">Buat Service Form</button>
        </div>
    </form>

    <div class="quick-actions">
        <h3>Aksi Cepat</h3>
        <div class="quick-btns">
            <button class="quick-btn" onclick={() => showCabinetModal = true}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                Buat Cabinet Baru
            </button>
            <button class="quick-btn" onclick={() => showSectionModal = true}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                Buat Section Baru
            </button>
        </div>
    </div>
</div>

{#if showCabinetModal}
    <div class="modal-backdrop" onclick={closeCabinetModal}>
        <div class="modal-box" onclick={(e) => e.stopPropagation()}>
            <h3>Buat Cabinet Baru</h3>
            <form method="POST" action="?/createCabinet" use:enhance={() => { closeCabinetModal(); return async ({ update }) => { await update(); }; }}>
                <div class="fg">
                    <label class="fl">Nama Cabinet</label>
                    <input class="fi" type="text" name="name" required placeholder="Contoh: Cabinet Service HP" />
                </div>
                <div class="fg">
                    <label class="fl">Max Slots</label>
                    <input class="fi" type="number" name="maxSlots" value="10" min="1" />
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-cancel" onclick={closeCabinetModal}>Batal</button>
                    <button type="submit" class="btn-submit">Buat</button>
                </div>
            </form>
        </div>
    </div>
{/if}

{#if showSectionModal}
    <div class="modal-backdrop" onclick={closeSectionModal}>
        <div class="modal-box" onclick={(e) => e.stopPropagation()}>
            <h3>Buat Section Baru</h3>
            <form method="POST" action="?/createSection" use:enhance={() => { closeSectionModal(); return async ({ update }) => { await update(); }; }}>
                <div class="fg">
                    <label class="fl">Nama Section</label>
                    <input class="fi" type="text" name="name" required placeholder="Contoh: Sparepart LCD" />
                </div>
                <div class="fg">
                    <label class="fl">Tipe</label>
                    <input class="fi" type="text" name="type" required placeholder="Contoh: sparepart" />
                </div>
                <div class="fg">
                    <label class="fl">Cabinet</label>
                    <select class="fi" name="cabinetId" required>
                        <option value="">Pilih Cabinet...</option>
                        {#each cabinets as cab}
                            <option value={cab.id}>{cab.name}</option>
                        {/each}
                    </select>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-cancel" onclick={closeSectionModal}>Batal</button>
                    <button type="submit" class="btn-submit">Buat</button>
                </div>
            </form>
        </div>
    </div>
{/if}

<style>
    .page { padding: 2rem; max-width: 900px; margin: 0 auto; font-family: 'Inter', sans-serif; color: #e3e4e6; min-height: 100vh; background-color: #0b0b0c; }
    .header { display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; }
    .header h1 { margin: 0; font-size: 1.5rem; color: #fff; }
    .back-btn { padding: 0.5rem 1rem; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; background: rgba(20,20,22,0.6); color: #a1a1a5; cursor: pointer; font-size: 0.85rem; }
    .back-btn:hover { background: rgba(255,255,255,0.05); color: #fff; }

    .alert { padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.85rem; }
    .alert.error { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); color: #ef4444; }
    .alert.success { background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2); color: #10b981; }

    .form-card { background: rgba(20,20,22,0.6); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
    .form-card h2 { font-size: 1rem; color: #10b981; margin: 0 0 1rem 0; padding-bottom: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.04); }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
    .fg { display: flex; flex-direction: column; gap: 0.35rem; }
    .fg.full { grid-column: 1 / -1; }
    .fl { font-size: 0.8rem; color: #71717a; font-weight: 500; }
    .req { color: #ef4444; }
    .fi { background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; padding: 0.6rem 0.75rem; color: #e3e4e6; font-size: 0.9rem; outline: none; }
    .fi:focus { border-color: #10b981; }
    .fta { resize: vertical; min-height: 80px; }
    select.fi { cursor: pointer; }

    .form-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1rem; }
    .btn-cancel { padding: 0.6rem 1.25rem; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; background: transparent; color: #a1a1a5; cursor: pointer; font-size: 0.85rem; }
    .btn-cancel:hover { background: rgba(255,255,255,0.05); }
    .btn-submit { padding: 0.6rem 1.5rem; border: none; border-radius: 8px; background: #10b981; color: #fff; font-weight: 600; font-size: 0.85rem; cursor: pointer; }
    .btn-submit:hover { background: #059669; }

    .quick-actions { background: rgba(20,20,22,0.6); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 1.25rem; }
    .quick-actions h3 { font-size: 0.9rem; color: #a1a1a5; margin: 0 0 1rem 0; }
    .quick-btns { display: flex; gap: 1rem; }
    .quick-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; background: rgba(0,0,0,0.3); border: 1px dashed rgba(255,255,255,0.1); border-radius: 8px; color: #a1a1a5; cursor: pointer; font-size: 0.85rem; flex: 1; justify-content: center; }
    .quick-btn:hover { border-color: #10b981; color: #10b981; }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 2000; }
    .modal-box { background: #141416; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1.5rem; width: 100%; max-width: 450px; }
    .modal-box h3 { margin: 0 0 1.25rem 0; color: #fff; font-size: 1.1rem; }
</style>
