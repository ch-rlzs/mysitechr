import { initAuth, cleanupAuth, login, logout } from './auth.js';
import { initChat } from './chat.js';

// Initialize app when DOM loads
document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  initChat();
  
  // Example of binding login/logout buttons (if you have them)
  document.getElementById('loginBtn')?.addEventListener('click', handleLogin);
  document.getElementById('logoutBtn')?.addEventListener('click', logout);
});

// Cleanup when page unloads
window.addEventListener('beforeunload', cleanupAuth);

// Example login handler
async function handleLogin() {
  const email = document.getElementById('adminEmail').value;
  const password = document.getElementById('adminPassword').value;
  try {
    await login(email, password);
  } catch (error) {
    alert("Login failed: " + error.message);
  }
}
