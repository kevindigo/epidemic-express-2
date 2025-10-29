import { GameBoard } from './ui/GameBoard.ts';

// Initialize the game when DOM is loaded
function initializeApp() {
  console.log('Initializing app...');
  
  // Handle redirect from 404.html
  if (sessionStorage['redirect']) {
    const redirect = sessionStorage['redirect'];
    delete sessionStorage['redirect'];
    
    // You could handle the redirect path here if needed
    // For now, we just clear it and continue with normal app initialization
    console.log('Redirected from:', redirect);
  }
  
  const app = document.getElementById('app');
  if (app) {
    console.log('Found app element, creating GameBoard...');
    new GameBoard(app);
    console.log('GameBoard created successfully');
  } else {
    console.error('Could not find app element');
  }
}

// Check if DOM is already loaded
if (document.readyState === 'loading') {
  // DOM is still loading, wait for DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded fired - initializing app...');
    initializeApp();
  });
} else {
  // DOM is already loaded, initialize immediately
  console.log('DOM already loaded - initializing app immediately...');
  initializeApp();
}

// Handle service worker updates
if ('serviceWorker' in navigator) {
  console.log('Service Worker API available, registering immediately...');
  
  // Register service worker immediately, don't wait for load event
  navigator.serviceWorker.register('./service-worker.js')
    .then((registration) => {
      console.log('ServiceWorker registration successful:', registration);
      
      // Check if service worker is already controlling the page
      if (navigator.serviceWorker.controller) {
        console.log('Service Worker is already controlling the page');
      } else {
        console.log('Service Worker is not yet controlling the page');
      }
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('Service Worker update found:', newWorker);
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            console.log('Service Worker state changed:', newWorker.state);
            
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available - auto-reload for seamless update
              console.log('New version detected, auto-reloading...');
              globalThis.location.reload();
            }
          });
        }
      });
    })
    .catch((error) => {
      console.log('ServiceWorker registration failed: ', error);
    });
}

// Handle app installation
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

globalThis.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e as BeforeInstallPromptEvent;
  
  // Show install button (you could add this to your UI here)
  showInstallButton();
});

function showInstallButton(): void {
  // You could add an install button to your UI here
  console.log('App can be installed');
}

function installApp(): void {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      deferredPrompt = null;
    });
  }
}

// Make install function globally available
(globalThis as { installApp?: typeof installApp }).installApp = installApp;