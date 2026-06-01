<script lang="ts">
  import type { PageData } from './$types';
  
  let { data, form } = $props<{
    data: PageData;
    form: any;
  }>();
  
  let isLoading = false;
  let showPassword = $state(false);
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" />
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&family=Rajdhani:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
</svelte:head>

<main>
  <!-- Background Glossy Orbs / Efek Cahaya di Belakang -->
  <div class="glossy-orb orb-1"></div>
  <div class="glossy-orb orb-2"></div>

  <div class="login-container">
    <div class="login-card">
      <!-- Efek Kilatan Cahaya Diagonal (Glossy Overlay) -->
      <div class="glossy-overlay"></div>

      <div class="logo-section">
        <div class="logo-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="url(#cyberGradient)"/>
            <defs>
              <linearGradient id="cyberGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#00f2fe" />
                <stop offset="100%" stop-color="#4facfe" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h1>LOGIN</h1>
        <p class="subtitle">Akses dashboard administrator & stock audit</p>
      </div>

      {#if form?.message}
        <div class="error-message">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="#ff4444"/>
          </svg>
          <span>{form.message}</span>
        </div>
      {/if}

      <form method="POST">
        <div class="input-group">
          <label for="username">Username</label>
          <div class="input-wrapper">
            <span class="input-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#4facfe"/>
              </svg>
            </span>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="Masukkan username"
              required
              class:error={form?.errors?.username}
            />
          </div>
          {#if form?.errors?.username}
            <span class="field-error">{form.errors.username}</span>
          {/if}
        </div>

        <div class="input-group">
          <label for="password">Password</label>
          <div class="input-wrapper">
            <span class="input-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" fill="#4facfe"/>
              </svg>
            </span>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              placeholder="Masukkan password"
              required
              class:error={form?.errors?.password}
            />
            <button 
              type="button" 
              class="toggle-password" 
              onclick={() => showPassword = !showPassword}
              tabindex="-1"
            >
              {#if showPassword}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00f2fe" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              {:else}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              {/if}
            </button>
          </div>
          {#if form?.errors?.password}
            <span class="field-error">{form.errors.password}</span>
          {/if}
        </div>

        <button
          type="submit"
          class="login-btn"
          class:loading={isLoading}
          disabled={isLoading}
          onclick={() => isLoading = true}
        >
          {#if isLoading}
            <span class="loading-spinner"></span>
            Process...
          {:else}
            Login
          {/if}
        </button>
      </form>

      <div class="footer-note">
        <p>© 2026 Pokemon Collection System</p>
      </div>
    </div>
  </div>
</main>

<style>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  main {
    min-height: 100vh;
    width: 100%;
    background: #050b14; /* Gelap kebiruan premium */
    background-image:
      radial-gradient(circle at 50% -20%, rgba(79, 172, 254, 0.12) 0%, transparent 50%),
      radial-gradient(circle at 100% 100%, rgba(0, 242, 256, 0.05) 0%, transparent 40%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Rajdhani', sans-serif;
    position: relative;
    overflow: hidden;
  }

  /* Grid latar belakang yang disesuaikan ke warna biru samar */
  main::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background-image:
      linear-gradient(rgba(79, 172, 254, 0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(79, 172, 254, 0.02) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
  }

  /* Bola cahaya glossy di latar belakang */
  .glossy-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(100px);
    pointer-events: none;
    opacity: 0.6;
  }
  .orb-1 {
    width: 300px;
    height: 300px;
    background: rgba(0, 242, 254, 0.15);
    top: 20%;
    left: 15%;
  }
  .orb-2 {
    width: 250px;
    height: 250px;
    background: rgba(79, 172, 254, 0.12);
    bottom: 15%;
    right: 15%;
  }
  
  .login-container {
    width: 100%;
    max-width: 400px;
    padding: 1.5rem;
    position: relative;
    z-index: 2;
  }
  
  /* Card dengan efek Glassmorphism & Glossy */
  .login-card {
    background: rgba(13, 23, 42, 0.65); /* Transparan */
    border: 1px solid rgba(79, 172, 254, 0.25); /* Garis tepi semi transparan */
    border-radius: 24px;
    padding: 2.5rem;
    box-shadow:
      0 25px 50px -12px rgba(0, 0, 0, 0.7),
      inset 0 1px 0 rgba(255, 255, 255, 0.1), /* Highlight kaca atas */
      0 0 30px rgba(79, 172, 254, 0.15); /* Glow luar halus */
    backdrop-filter: blur(20px); /* Efek blur kaca blur tebal */
    -webkit-backdrop-filter: blur(20px);
    animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
    overflow: hidden;
  }

  /* Lapisan kilauan glossy (Pantulan Cahaya Diagonal) */
  .glossy-overlay {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: linear-gradient(
      135deg, 
      rgba(255, 255, 255, 0.05) 0%, 
      rgba(255, 255, 255, 0.01) 40%, 
      transparent 40.1%
    );
    pointer-events: none;
  }
  
  .login-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, #00f2fe, #4facfe, transparent);
    animation: scan 4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }
  
  @keyframes scan {
    0% { transform: translateX(-100%); }
    50%, 100% { transform: translateX(100%); }
  }
  
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(40px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .logo-section {
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .logo-icon {
    margin-bottom: 1rem;
    animation: pulse 3s ease-in-out infinite;
  }
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 0.9; }
    50% { transform: scale(1.03); opacity: 1; filter: drop-shadow(0 0 8px rgba(0, 242, 254, 0.5)); }
  }
  
  .logo-section h1 {
    font-family: 'Orbitron', sans-serif;
    font-size: 1.8rem;
    font-weight: 700;
    letter-spacing: 4px;
    background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 0.5rem;
  }
  
  .subtitle {
    color: #7a8b9e;
    font-size: 0.85rem;
    font-weight: 400;
    letter-spacing: 0.5px;
  }
  
  .input-group {
    margin-bottom: 1.5rem;
  }
  
  .input-group label {
    display: block;
    margin-bottom: 0.5rem;
    color: #abc1de;
    font-weight: 500;
    font-size: 0.95rem;
    letter-spacing: 0.5px;
  }
  
  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }
  
  .input-icon {
    position: absolute;
    left: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.6;
    transition: opacity 0.3s ease;
  }
  
  .input-wrapper:focus-within .input-icon {
    opacity: 1;
  }
  
  .input-group input {
    width: 100%;
    padding: 0.85rem 1rem 0.85rem 3rem;
    background: rgba(15, 23, 42, 0.5);
    border: 1.5px solid rgba(79, 172, 254, 0.2);
    border-radius: 12px;
    font-size: 1rem;
    font-family: 'Rajdhani', sans-serif;
    font-weight: 500;
    transition: all 0.3s ease;
    color: #00f2fe;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3);
  }
  
  .input-group input:focus {
    outline: none;
    border-color: #00f2fe;
    background: rgba(15, 23, 42, 0.8);
    box-shadow: 
      0 0 0 3px rgba(0, 242, 254, 0.15),
      inset 0 1px 2px rgba(0, 0, 0, 0.5);
  }

  .input-group input[name="password"] {
    padding-right: 3.5rem;
  }
  
  .input-group input::placeholder {
    color: #475569;
    font-weight: 400;
  }

  .toggle-password {
    position: absolute;
    right: 1rem;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s ease;
    z-index: 2;
  }

  .toggle-password:hover {
    transform: scale(1.1);
  }
  
  .login-btn {
    width: 100%;
    padding: 1rem;
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    color: #050b14;
    border: none;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 700;
    font-family: 'Orbitron', sans-serif;
    letter-spacing: 2px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    margin-top: 1rem;
    position: relative;
    overflow: hidden;
    box-shadow: 0 4px 15px rgba(79, 172, 254, 0.3);
  }
  
  .login-btn::before {
    content: '';
    position: absolute;
    top: 0; left: -100%;
    width: 100%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
    transition: left 0.6s ease;
  }
  
  .login-btn:hover::before {
    left: 100%;
  }
  
  .login-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 242, 254, 0.4);
    filter: brightness(1.1);
  }
  
  .login-btn:active {
    transform: translateY(0);
  }
  
  .login-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .login-btn.loading {
    background: #1e293b;
    color: #64748b;
  }
  
  .loading-spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid #64748b;
    border-radius: 50%;
    border-top-color: transparent;
    animation: spin 1s linear infinite;
    margin-right: 8px;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .error-message {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid #ef4444;
    border-radius: 8px;
    padding: 0.75rem 1rem;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: #ef4444;
    font-size: 0.9rem;
    animation: shake 0.5s ease-in-out;
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }

  .field-error {
    display: block;
    color: #ef4444;
    font-size: 0.8rem;
    margin-top: 0.3rem;
    padding-left: 0.5rem;
  }

  input.error {
    border-color: #ef4444 !important;
    background: rgba(239, 68, 68, 0.05) !important;
  }

  input.error:focus {
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
  }
  
  .footer-note {
    text-align: center;
    margin-top: 2rem;
    color: #475569;
    font-size: 0.8rem;
    letter-spacing: 0.5px;
    transition: color 0.3s;
  }
  
  .footer-note:hover p {
    color: #00f2fe;
  }
  
  @media (max-width: 480px) {
    .login-container { padding: 1rem; }
    .login-card { padding: 2rem; }
    .logo-section h1 { font-size: 1.5rem; }
  }
  
  :global(body) {
    background-color: #050b14;
    margin: 0;
    padding: 0;
  }
</style>