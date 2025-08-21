// Safely update Text nodes with conversion results and allow revert.

const originals = new WeakMap<Text, string>();
const updated = new Set<Text>();

export function applyConversions(
  nodes: Text[],
  outputs: (string | undefined)[]
) {
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    const out = outputs[i];
    if (typeof out === 'string' && n.data !== out) {
      if (!originals.has(n)) originals.set(n, n.data);
      n.data = out;
      updated.add(n);
    }
  }
}

export function revertAll() {
  for (const n of updated) {
    const orig = originals.get(n);
    if (typeof orig === 'string') n.data = orig;
  }
  updated.clear();
}
