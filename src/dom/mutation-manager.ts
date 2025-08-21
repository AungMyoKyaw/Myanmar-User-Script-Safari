type EnqueueFn = (nodes: Text[]) => void;

const ignoredTags = new Set([
  'SCRIPT',
  'STYLE',
  'CODE',
  'PRE',
  'NOSCRIPT',
  'TEMPLATE'
]);

export function createMutationManager(
  debounceMs: number,
  enqueue: EnqueueFn,
  root: Node = document.documentElement
) {
  let timer: number | undefined;
  const batch = new Set<Text>();

  const schedule = () => {
    if (timer !== undefined) return;
    timer = setTimeout(() => {
      const items = Array.from(batch);
      batch.clear();
      timer = undefined;
      if (items.length) enqueue(items);
    }, debounceMs) as unknown as number;
  };

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      const nodes: Node[] = [];
      if (m.type === 'characterData' && m.target.nodeType === Node.TEXT_NODE) {
        nodes.push(m.target);
      }
      for (const n of m.addedNodes) nodes.push(n);
      for (const n of nodes) {
        collectTextNodes(n, batch);
      }
    }
    schedule();
  });

  observer.observe(root, {
    characterData: true,
    subtree: true,
    childList: true
  });

  return {
    disconnect() {
      observer.disconnect();
    }
  };
}

function collectTextNodes(node: Node, out: Set<Text>) {
  if (node.nodeType === Node.TEXT_NODE) {
    const parent = (node as Text).parentElement;
    if (!parent) return;
    if (ignoredTags.has(parent.tagName)) return;
    if (parent.closest('input,textarea')) return;
    out.add(node as Text);
    return;
  }
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as Element;
    if (ignoredTags.has(el.tagName)) return;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let cur: Node | null = walker.nextNode();
    while (cur) {
      const parent = (cur as Text).parentElement;
      if (!parent) continue;
      if (ignoredTags.has(parent.tagName)) continue;
      if (parent.closest('input,textarea')) continue;
      out.add(cur as Text);
      cur = walker.nextNode();
    }
  }
}
