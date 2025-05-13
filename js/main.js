import { initAuth } from './auth.js';
import { initChat } from './chat.js';

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  initChat();
});
