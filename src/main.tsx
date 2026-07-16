import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Version check function to auto-update on push
async function checkVersion() {
  try {
    const res = await fetch('/version.json?t=' + Date.now());
    if (res.ok) {
      const data = await res.json();
      const currentVersion = sessionStorage.getItem('app_version');
      if (!currentVersion) {
        sessionStorage.setItem('app_version', data.version);
      } else if (currentVersion !== data.version) {
        sessionStorage.setItem('app_version', data.version);
        window.location.reload();
      }
    }
  } catch (e) {
    console.error('Failed to check app version:', e);
  }
}

// Check on visibility change (e.g. unlocking phone, switching back to tab)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    checkVersion();
  }
});

// Periodic check (every 5 minutes)
setInterval(checkVersion, 5 * 60 * 1000);

// Global listener for script / chunk loading errors to reload and fetch the latest build
window.addEventListener('error', (e) => {
  if (e.message && (e.message.includes('chunk') || e.message.includes('Loading chunk') || e.message.includes('Failed to fetch dynamically imported module'))) {
    window.location.reload();
  }
}, true);

// Initial check
checkVersion();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
