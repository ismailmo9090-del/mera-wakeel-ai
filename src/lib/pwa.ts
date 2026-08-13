/**
 * PWA (item 9) helpers — service-worker registration and low-bandwidth mode.
 */

const LOW_BANDWIDTH_KEY = 'mw_low_bandwidth_mode';

export type LowBandwidthListener = (enabled: boolean) => void;

/**
 * Register the service worker for offline support.
 * Safe to call in development too; the SW only precaches the shell.
 */
export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('ServiceWorker registration notice:', err);
    });
  });
}

/** Whether low-bandwidth (data-saver) mode is currently enabled. */
export function isLowBandwidth(): boolean {
  try {
    return localStorage.getItem(LOW_BANDWIDTH_KEY) === '1';
  } catch (_e) {
    return false;
  }
}

/** Enable or disable low-bandwidth mode and notify listeners. */
export function setLowBandwidth(enabled: boolean): void {
  try {
    if (enabled) localStorage.setItem(LOW_BANDWIDTH_KEY, '1');
    else localStorage.removeItem(LOW_BANDWIDTH_KEY);
  } catch (_e) { /* storage unavailable */ }
  listeners.forEach((fn) => {
    try { fn(enabled); } catch (_e) { /* ignore */ }
  });
}

const listeners: LowBandwidthListener[] = [];

/** Subscribe to low-bandwidth mode changes. Returns an unsubscribe fn. */
export function onLowBandwidthChange(fn: LowBandwidthListener): () => void {
  listeners.push(fn);
  return () => {
    const idx = listeners.indexOf(fn);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}