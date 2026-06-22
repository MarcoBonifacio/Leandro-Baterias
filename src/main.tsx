// Fix potential iframe browser sandbox issues where fetch is on Window's prototype as read-only.
try {
  if (typeof window !== 'undefined' && window.fetch) {
    const originalFetch = window.fetch;
    let currentFetch = originalFetch;
    const descriptor = {
      get() {
        return currentFetch;
      },
      set(val) {
        currentFetch = val;
      },
      configurable: true,
      enumerable: true
    };

    const targets = [window, self, globalThis];
    targets.forEach(target => {
      if (target) {
        try {
          Object.defineProperty(target, 'fetch', descriptor);
        } catch (e) {
          // ignore
        }
      }
    });

    if (typeof Window !== 'undefined' && Window.prototype) {
      try {
        Object.defineProperty(Window.prototype, 'fetch', descriptor);
      } catch (e) {
        // ignore
      }
    }
  }
} catch (err) {
  console.warn('Sandbox fetch main polyfill error:', err);
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
