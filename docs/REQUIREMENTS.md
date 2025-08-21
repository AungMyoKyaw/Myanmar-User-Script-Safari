# MUA Userscript — Requirements

This document contains the detailed functional and non-functional requirements for converting the existing Chrome extension (MUA-Web-Unicode-Converter) into a high-performance TypeScript userscript for Tampermonkey/Violentmonkey/Greasemonkey and Safari userscript environments.

## Assumptions

- Users will install the final artifact as a single userscript file via common managers (Tampermonkey, Violentmonkey, Greasemonkey, Safari's userscript runner).
- The Parabaik converter (GPL) is used; GPL attribution must be preserved.
- Runtime environment is modern browsers (ES2019+) but compatibility fallback is provided where possible.

## Functional requirements (summary)

1. Core detection and conversion of Zawgyi → Unicode for visible Myanmar text.
2. Fast, incremental DOM discovery using a combination of viewport-first scanning and MutationObserver batching.
3. Conversion engine runs inside a WebWorker (or equivalent) and exposes a simple batch RPC.
4. Safe in-place DOM updates with reversibility and minimal DOM pollution.
5. Persistent settings (enable/disable, per-site rules, ignored selectors), persisted via GM\_\* APIs or fallback.
6. Lightweight UI: on-page badge and userscript menu commands for quick toggles.
7. Desktop and mobile performance targets; minimal main-thread blocking.

## Functional requirements (detailed)

See the project's top-level analysis for full requirement coverage. The following are the essential details implementers must follow:

- Detection behavior
  - Only operate on nodes likely to contain Myanmar text (quick prefilter using a fast RegExp for Myanmar codepoints).
  - Do not convert inside `SCRIPT`, `STYLE`, `CODE`, `PRE`, `NOSCRIPT`, `TEMPLATE` nodes, or inputs (`INPUT`, `TEXTAREA`) unless user explicitly opts in.
  - Document title should be converted when it contains Zawgyi markup.

- Conversion behavior
  - Use the Parabaik algorithm ported to TypeScript — logic runs inside a worker.
  - Batch conversions to minimize worker IPC overhead (configurable batch size).
  - Convert text nodes by replacing `Text.data` when possible. Preserve originals in a WeakMap for revert.

- DOM & Mutation handling
  - Initial scan: viewport-first, chunked with requestIdleCallback or setTimeout fallback.
  - Observers: use MutationObserver with a debounce window (configurable). Batch mutated nodes and process them together.
  - Shadow DOM: process open shadowRoots; skip closed shadowRoots.
  - Iframes: process same-origin iframes; skip cross-origin with graceful logging.

- Settings & persistence
  - Settings stored under a single JSON object; schema versioning supported.
  - Provide menu commands to toggle global enable/disable and to ignore current site.
  - Settings apply immediately when changed.

- UI
  - Minimal CSS and DOM footprint. Accessible and dismissible.
  - Notification shown optionally when conversions occur.

## Non-functional requirements

- Performance
  - Small pages (1–5KB Myanmar): visible conversion < 200ms.
  - Medium pages (20–50KB): visible conversion < 500ms.
  - Large pages: progressive conversion; visible area prioritized.
  - Memory overhead: additional memory < 10MB on large pages.

- Reliability
  - Deterministic conversion results for given inputs.
  - Unit tests cover 100% of conversion critical paths.

- Security
  - No remote code fetching at runtime.
  - Respect cross-origin frames.

- Maintainability
  - TypeScript with strict flags. Clear module separation and testable units.

## Acceptance criteria

- Unit test pass (converter module and detection module).
- Integration smoke tests across representative pages.
- Performance targets met in automated benchmarks.

## Settings schema

```ts
interface Settings {
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
```

---

End of REQUIREMENTS.md
