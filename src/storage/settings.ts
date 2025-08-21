import { gmGet, gmSet } from './gm-wrapper';

export interface Settings {
  enabled: boolean;
  convertToUnicode: boolean;
  perSite: Record<string, 'allow' | 'block' | 'default'>;
  ignoredSelectors: string[];
  allowedSelectors: string[];
  debounceMs: number;
  batchSize: number;
  debug: boolean;
  version: string;
}

const CURRENT_VERSION = '1';
const KEY = 'settings';

function defaults(): Settings {
  return {
    enabled: true,
    convertToUnicode: true,
    perSite: {},
    ignoredSelectors: [
      'script,style,code,pre,noscript,template',
      'input,textarea'
    ],
    allowedSelectors: [],
    debounceMs: 150,
    batchSize: 256,
    debug: false,
    version: CURRENT_VERSION
  };
}

export function loadSettings(): Settings {
  const d = defaults();
  const s = gmGet<Partial<Settings>>(KEY, {});
  const merged: Settings = { ...d, ...s } as Settings;
  if (merged.version !== CURRENT_VERSION) {
    // perform simple migrations here as needed
    merged.version = CURRENT_VERSION;
    saveSettings(merged);
  }
  return merged;
}

export function saveSettings(s: Settings) {
  gmSet(KEY, s);
}

export function siteRuleFor(
  hostname: string,
  settings: Settings
): 'allow' | 'block' | 'default' {
  return settings.perSite[hostname] ?? 'default';
}

// Optional userscript menu wiring (no-op if APIs are absent)
declare const GM_registerMenuCommand:
  | ((label: string, cb: () => void) => void)
  | undefined;

export function registerMenu(
  settings: Settings,
  onChange: (s: Settings) => void
) {
  if (typeof GM_registerMenuCommand !== 'function') return;
  GM_registerMenuCommand(
    settings.enabled ? 'Disable MUA' : 'Enable MUA',
    () => {
      const next = { ...settings, enabled: !settings.enabled };
      saveSettings(next);
      onChange(next);
    }
  );
  GM_registerMenuCommand('Ignore this site', () => {
    const host = location.hostname;
    const next = { ...settings };
    next.perSite[host] = 'block';
    saveSettings(next);
    onChange(next);
  });
  GM_registerMenuCommand('Allow this site', () => {
    const host = location.hostname;
    const next = { ...settings };
    next.perSite[host] = 'allow';
    saveSettings(next);
    onChange(next);
  });
}
