// Entry point for userscript. Bootstraps worker, settings, scanner, and mutations.

import Worker from './worker/worker-bootstrap?worker&inline';
import { createMutationManager } from './dom/mutation-manager';
import { collectCandidateTextNodes } from './dom/scanner';
import { applyConversions } from './dom/updater';
import {
  loadSettings,
  registerMenu,
  type Settings,
  siteRuleFor
} from './storage/settings';
import { mountBadge } from './ui/badge';

let worker: Worker | null = null;
let settings: Settings = loadSettings();
registerMenu(settings, (s) => {
  settings = s;
  // Re-run a light scan if just enabled
  if (settings.enabled) bootstrap();
});
try {
  worker = new Worker();
  worker.onmessage = (e) => {
    console.log('worker', e.data);
  };
} catch (err) {
  console.warn('Worker unavailable; falling back to inline execution', err);
}

function shouldRunOnThisSite(): boolean {
  const rule = siteRuleFor(location.hostname, settings);
  if (rule === 'allow') return true;
  if (rule === 'block') return false;
  return true;
}

function scheduleIdle(fn: () => void) {
  const w = window as unknown as Partial<{
    requestIdleCallback: (cb: () => void) => number;
  }>;
  const ric = w.requestIdleCallback;
  if (typeof ric === 'function') {
    ric(fn);
  } else setTimeout(fn, 0);
}

function processNodes(nodes: Text[]) {
  if (!nodes.length) return;
  const inputs = nodes.map((n) => n.data);
  if (worker) {
    const id = Math.floor(Math.random() * 1e9);
    worker.addEventListener('message', function handler(e: MessageEvent) {
      const data = e.data as {
        id?: number;
        results?: Array<{ converted?: string }>;
      };
      if (!data || data.id !== id) return;
      worker?.removeEventListener('message', handler as EventListener);
      const outs = (data.results || []).map((r) => r.converted);
      applyConversions(nodes, outs);
    });
    worker.postMessage({
      id,
      method: 'detectAndConvert',
      payload: { inputs, convert: true }
    });
  }
}

function initialScan() {
  // Title conversion if needed
  try {
    if (document.title && worker) {
      const id = Math.floor(Math.random() * 1e9);
      const title = document.title;
      worker.addEventListener('message', function handler(e: MessageEvent) {
        const data = e.data as {
          id?: number;
          results?: Array<{ converted?: string; isZawgyi: boolean }>;
        };
        if (!data || data.id !== id) return;
        worker?.removeEventListener('message', handler as EventListener);
        const r = data.results?.[0];
        if (r?.isZawgyi && typeof r.converted === 'string')
          document.title = r.converted;
      });
      worker.postMessage({
        id,
        method: 'detectAndConvert',
        payload: { inputs: [title], convert: true }
      });
    }
  } catch {}

  const nodes = collectCandidateTextNodes(document);
  if (nodes.length === 0) return;
  // chunk by settings.batchSize
  for (let i = 0; i < nodes.length; i += settings.batchSize) {
    const chunk = nodes.slice(i, i + settings.batchSize);
    scheduleIdle(() => processNodes(chunk));
  }

  // open shadow roots
  const hostElems = document.querySelectorAll<HTMLElement>('*');
  hostElems.forEach((el) => {
    const sr = (el as HTMLElement & { shadowRoot?: ShadowRoot | null })
      .shadowRoot;
    if (sr && sr.mode === 'open') {
      const shadowNodes = collectCandidateTextNodes(sr);
      if (shadowNodes.length) scheduleIdle(() => processNodes(shadowNodes));
    }
  });

  // same-origin iframes
  document.querySelectorAll('iframe').forEach((frame) => {
    try {
      const doc = (frame as HTMLIFrameElement).contentDocument;
      if (doc?.location?.origin === location.origin) {
        const ns = collectCandidateTextNodes(doc);
        if (ns.length) scheduleIdle(() => processNodes(ns));
      }
    } catch {
      // cross-origin; skip
    }
  });
}

function attachMutations() {
  // document root
  createMutationManager(
    settings.debounceMs,
    (nodes) => {
      // Prefilter by Myanmar regex quickly
      const myanmar =
        /[\u1000-\u109F\uAA60-\uAA7F\u1031\u1036\u1037\u103b\u103c\u103d\u103e]/u;
      const cand = nodes.filter((t) => myanmar.test(t.data));
      if (cand.length) processNodes(cand);
    },
    document.documentElement
  );
  // shadow roots
  document.querySelectorAll<HTMLElement>('*').forEach((el) => {
    const sr = (el as HTMLElement & { shadowRoot?: ShadowRoot | null })
      .shadowRoot;
    if (sr && sr.mode === 'open') {
      createMutationManager(
        settings.debounceMs,
        (nodes) => {
          const myanmar =
            /[\u1000-\u109F\uAA60-\uAA7F\u1031\u1036\u1037\u103b\u103c\u103d\u103e]/u;
          const cand = nodes.filter((t) => myanmar.test(t.data));
          if (cand.length) processNodes(cand);
        },
        sr
      );
    }
  });
  // iframes (same-origin)
  document.querySelectorAll('iframe').forEach((frame) => {
    try {
      const doc = (frame as HTMLIFrameElement).contentDocument;
      if (doc?.location?.origin === location.origin) {
        createMutationManager(
          settings.debounceMs,
          (nodes) => {
            const myanmar =
              /[\u1000-\u109F\uAA60-\uAA7F\u1031\u1036\u1037\u103b\u103c\u103d\u103e]/u;
            const cand = nodes.filter((t) => myanmar.test(t.data));
            if (cand.length) processNodes(cand);
          },
          doc.documentElement
        );
      }
    } catch {}
  });
}

function bootstrap() {
  try {
    if (!settings.enabled) return;
    if (!shouldRunOnThisSite()) return;
    mountBadge();
    initialScan();
    attachMutations();
  } catch (err) {
    console.error('bootstrap error', err);
  }
}

bootstrap();
