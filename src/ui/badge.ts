declare const GM_addStyle: ((css: string) => void) | undefined;

export function mountBadge() {
  const css = `
.mua-badge{position:fixed;z-index:2147483647;right:8px;bottom:8px;background:#111;color:#fff;font:12px/1.4 system-ui,sans-serif;padding:6px 8px;border-radius:6px;opacity:.75}
.mua-badge button{all:unset;color:#9cf;cursor:pointer;margin-left:6px}
`;
  if (typeof GM_addStyle === 'function') GM_addStyle(css);
  else {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }
  const el = document.createElement('div');
  el.className = 'mua-badge';
  el.setAttribute('role', 'status');
  el.textContent = 'MUA: active';
  const close = document.createElement('button');
  close.setAttribute('aria-label', 'Hide badge');
  close.textContent = '✕';
  close.addEventListener('click', () => el.remove());
  el.appendChild(close);
  document.body.appendChild(el);
  return el;
}
