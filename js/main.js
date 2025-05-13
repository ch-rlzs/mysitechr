import { initAuth } from './auth.js';
import { initChat } from './chat.js';
import { initAdmin } from './admin.js';

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  initChat();
  initAdmin();
});
