/**
 * Talk.me Main Application Entry Point
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize i18n system first
  if (typeof initI18n === 'function') {
    initI18n();
  }

  // Initialize Canvas Starfield animation
  if (typeof initStarfield === 'function') {
    initStarfield();
  }

  // Initialize 3D Hero intro & scroll controller
  if (typeof initIntro3D === 'function') {
    initIntro3D();
  }

  // Initialize UI interactions, scroll observers & form handlers
  if (typeof initUIInteractions === 'function') {
    initUIInteractions();
  }
});
