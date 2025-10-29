import { GameBoard } from './ui/GameBoard.ts';

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Handle redirect from 404.html
  if (sessionStorage.redirect) {
    const redirect = sessionStorage.redirect;
    delete sessionStorage.redirect;
    
    // You could handle the redirect path here if needed
    // For now, we just clear it and continue with normal app initialization
    console.log('Redirected from:', redirect);
  }
  
  const app = document.getElementById('app');
  if (app) {
    new GameBoard(app);
  } else {
    console.error('Could not find app element');
  }
});

// Handle service worker updates
if ('serviceWorker' in navigator) {
  globalThis.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('ServiceWorker registration successful');
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
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