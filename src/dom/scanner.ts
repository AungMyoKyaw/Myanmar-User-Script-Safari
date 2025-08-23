// Incremental DOM scanner: collects text nodes likely containing Myanmar text
// Skips SCRIPT/STYLE/etc and inputs unless opted in. Intended to be scheduled
// in chunks (viewport-first can be layered by passing document or a root).

const IGNORED = new Set([
  'SCRIPT',
  'STYLE',
  'CODE',
  'PRE',
  'NOSCRIPT',
  'TEMPLATE'
]);

export function collectCandidateTextNodes(root: ParentNode = document): Text[] {
  const myanmarPrefilter =
    /[\u1000-\u109F\uAA60-\uAA7F\u1031\u1036\u1037\u103b\u103c\u103d\u103e]/u;
  const walkerFilter: NodeFilter = {
    acceptNode(node: Node) {
      const parent = (node as Text).parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (IGNORED.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
      if (parent.closest('input,textarea')) return NodeFilter.FILTER_REJECT;
      const txt = (node as Text).data;
      if (!txt || txt.trim().length === 0) return NodeFilter.FILTER_REJECT;
      if (!myanmarPrefilter.test(txt)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  };
  const walker = document.createTreeWalker(
    root as Node,
    NodeFilter.SHOW_TEXT,
    walkerFilter
  );
  const nodes: Text[] = [];
  let cur: Node | null = walker.nextNode();
  while (cur) {
    nodes.push(cur as Text);
    cur = walker.nextNode();
  }
  return nodes;
}
