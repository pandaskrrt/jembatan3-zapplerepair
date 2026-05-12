<script lang="ts">
  import type { PageData } from './$types';
  
  let { data, form } = $props<{
    data: PageData;
    form: any;
  }>();
  
  let isLoading = false;
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" />
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&family=Rajdhani:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
</svelte:head>

<main>
  <div class="login-container">
    <div class="login-card">
      <div class="logo-section">
        <div class="logo-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="#00ff87"/>
          </svg>
        </div>
        <h1>LOGIN</h1>
        <p class="subtitle">Akses dashboard administrator & stock audit</p>
      </div>

      <!-- Tampilkan pesan error global jika ada -->
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
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#00b894"/>
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
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" fill="#00b894"/>
              </svg>
            </span>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Masukkan password"
              required
              class:error={form?.errors?.password}
            />
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
  .error-message {
    background: rgba(255, 68, 68, 0.1);
    border: 1px solid #ff4444;
    border-radius: 8px;
    padding: 0.75rem 1rem;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: #ff4444;
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
    color: #ff4444;
    font-size: 0.8rem;
    margin-top: 0.3rem;
    padding-left: 0.5rem;
  }

  input.error {
    border-color: #ff4444 !important;
    background: rgba(255, 68, 68, 0.05) !important;
  }

  input.error:focus {
    box-shadow: 0 0 0 3px rgba(255, 68, 68, 0.1) !important;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  main {
    min-height: 100vh;
    width: 100%;
    background: #000000;
    background-image:
      radial-gradient(circle at 10% 20%, rgba(0, 255, 135, 0.03) 0%, transparent 20%),
      radial-gradient(circle at 90% 50%, rgba(0, 255, 135, 0.03) 0%, transparent 25%),
      radial-gradient(circle at 30% 80%, rgba(0, 255, 135, 0.02) 0%, transparent 30%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Rajdhani', sans-serif;
    position: relative;
    overflow: hidden;
  }
  
  main::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    background-image:
      linear-gradient(rgba(0, 255, 135, 0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 255, 135, 0.02) 1px, transparent 1px);
    background-size: 50px 50px;
    pointer-events: none;
  }
  
  .login-container {
    width: 100%;
    max-width: 400px;
    padding: 1.5rem;
    position: relative;
    z-index: 1;
  }
  
  .login-card {
    background: #111111;
    border: 1px solid rgba(0, 255, 135, 0.15);
    border-radius: 24px;
    padding: 2.5rem;
    box-shadow:
      0 20px 40px rgba(0, 0, 0, 0.8),
      0 0 0 1px rgba(0, 255, 135, 0.1),
      0 0 20px rgba(0, 255, 135, 0.1);
    backdrop-filter: blur(10px);
    animation: slideUp 0.5s ease-out;
    position: relative;
    overflow: hidden;
  }
  
  .login-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, #00ff87, transparent);
    animation: scan 3s linear infinite;
  }
  
  @keyframes scan {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .logo-section {
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .logo-icon {
    margin-bottom: 1rem;
    animation: pulse 2s ease-in-out infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 0.8; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.05); }
  }
  
  .logo-section h1 {
    font-family: 'Orbitron', sans-serif;
    font-size: 1.8rem;
    font-weight: 700;
    letter-spacing: 3px;
    background: linear-gradient(135deg, #00ff87 0%, #00b894 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 0.5rem;
  }
  
  .subtitle {
    color: #888;
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
    color: #ccc;
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
    color: #00b894;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.7;
    transition: opacity 0.3s ease;
  }
  
  .input-wrapper:focus-within .input-icon {
    opacity: 1;
  }
  
  .input-group input {
    width: 100%;
    padding: 0.85rem 1rem 0.85rem 3rem;
    background: #1a1a1a;
    border: 2px solid #2a2a2a;
    border-radius: 12px;
    font-size: 1rem;
    font-family: 'Rajdhani', sans-serif;
    font-weight: 400;
    transition: all 0.3s ease;
    color: #00ff87;
  }
  
  .input-group input:focus {
    outline: none;
    border-color: #00ff87;
    background: #222;
    box-shadow: 0 0 0 3px rgba(0, 255, 135, 0.1);
  }
  
  .input-group input::placeholder {
    color: #444;
    font-weight: 300;
    font-size: 0.95rem;
  }
  
  .login-btn {
    width: 100%;
    padding: 1rem;
    background: linear-gradient(135deg, #00b894 0%, #00a37b 100%);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 600;
    font-family: 'Orbitron', sans-serif;
    letter-spacing: 2px;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-top: 1rem;
    position: relative;
    overflow: hidden;
  }
  
  .login-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s ease;
  }
  
  .login-btn:hover::before {
    left: 100%;
  }
  
  .login-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 255, 135, 0.3);
  }
  
  .login-btn:active {
    transform: translateY(0);
  }
  
  .login-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  .login-btn.loading {
    background: linear-gradient(135deg, #1a4a3a 0%, #1a4a3a 100%);
  }
  
  .loading-spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid #fff;
    border-radius: 50%;
    border-top-color: transparent;
    animation: spin 1s linear infinite;
    margin-right: 8px;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .footer-note {
    text-align: center;
    margin-top: 2rem;
    color: #444;
    font-size: 0.8rem;
    font-family: 'Rajdhani', sans-serif;
    letter-spacing: 0.5px;
  }
  
  .footer-note:hover p {
    color: #00b894;
  }
  
  @media (max-width: 480px) {
    .login-container {
      padding: 1rem;
    }
   
    .login-card {
      padding: 2rem;
    }
   
    .logo-section h1 {
      font-size: 1.5rem;
    }
  }
  
  :global(body) {
    background-color: #000000;
    margin: 0;
    padding: 0;
  }
</style>