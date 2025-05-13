import { initAuth, cleanupAuth } from './auth.js';
import { initChat } from './chat.js';

document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  initChat();
});

// Cleanup when leaving page
window.addEventListener('beforeunload', () => {
  cleanupAuth();
});
