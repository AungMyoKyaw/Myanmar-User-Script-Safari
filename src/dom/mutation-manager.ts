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
      if (m.type === 'characterData' && m.target.nodeType === Node.TEXT_NODE) {
        collectTextNodes(m.target, batch);
      } else if (m.type === 'childList') {
        for (const n of m.addedNodes) {
          // Only process nodes that are not contained in another added node.
          // This is a simple optimization to avoid processing the same nodes multiple times.
          if (
            !n.parentElement ||
            !isNodeContained(n.parentElement, m.addedNodes)
          ) {
            collectTextNodes(n, batch);
          }
        }
      }
    }
    if (batch.size > 0) {
      schedule();
    }
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

function isNodeContained(node: Node, nodes: NodeList): boolean {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].contains(node)) {
      return true;
    }
  }
  return false;
}

function collectTextNodes(node: Node, out: Set<Text>) {
  if (node.nodeType === Node.TEXT_NODE) {
    const parent = (node as Text).parentElement;
    if (!parent) return;
    if (
      ignoredTags.has(parent.tagName) ||
      parent.closest('[contenteditable="true"]')
    )
      return;
    if (parent.closest('input,textarea')) return;
    out.add(node as Text);
    return;
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as Element;
    if (ignoredTags.has(el.tagName) || el.closest('[contenteditable="true"]'))
      return;
    if (el.closest('input,textarea')) return;

    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let cur: Node | null = walker.nextNode();
    while (cur) {
      const parent = (cur as Text).parentElement;
      if (
        parent &&
        !ignoredTags.has(parent.tagName) &&
        !parent.closest('input,textarea') &&
        !parent.closest('[contenteditable="true"]')
      ) {
        out.add(cur as Text);
      }
      cur = walker.nextNode();
    }
  }
}
