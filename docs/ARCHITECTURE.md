# MUA Userscript — Architecture

This document describes the recommended architecture, module boundaries, types and runtime flow for the TypeScript userscript rewrite.

## Goals

- Maximize runtime performance and minimal main-thread work.
- Keep the converter pure and testable.
- Keep the DOM scanning incremental and respectful of page performance.
- Provide a small, well-documented public API between modules.

## High level components

1. Converter (core)
   - Pure TypeScript module implementing the Parabaik algorithm.
   - Export functions:
     - `detectZawgyi(input: string): boolean`
     - `isMyanmar(input: string): boolean`
     - `convertZ1ToUni(input: string): string`
   - Unit-testable (no DOM, no browser APIs).

2. Worker wrapper
   - Dedicated WebWorker that imports the converter module.
   - RPC-like interface: `postMessage({id, method, payload})` and `onmessage` responses.
   - Batch detection/convert: `detectAndConvert(inputs: string[], convert: boolean)`.

3. DOM Scanner
   - Viewport-first initial scanner that iterates nodes in chunks.
   - Prefilter nodes by short Myanmar presence test before sending to the worker.
   - Use WeakSet to track processed nodes.

4. Mutation Manager
   - MutationObserver with batching and debounce.
   - Converts mutated/added text nodes using same worker batch pipeline.
   - Throttling per container for high-frequency mutation sources.

5. DOM Updater
   - Safely performs node updates given `Text` nodes and converted strings.
   - Uses a WeakMap<Text, Original> to store original values for revert.
   - Ensures selection/caret preservation for editable fields when user opts in.

6. Settings & Storage
   - Wrapper that abstracts GM\_\* APIs (`GM_getValue`/`GM_setValue`) and falls back to localStorage.
   - Performs migrations when version changes.

7. UI & Menu
   - Minimal on-page badge component.
   - Userscript menu commands registration using `GM_registerMenuCommand` when available.

8. Logger & Metrics
   - Small debug logger gated by settings.
   - Optional metrics collector for debug builds.

## Dataflow

Document load → bootstrap → read settings → create worker → initial viewport-first scan → send batch to worker → worker responds → DOM Updater applies conversions → attach MutationObserver → on mutations: debounce → batch → worker → DOM update

## Concurrency and scheduling

- All heavy text processing sits inside the worker.
- Main thread does only the following: detecting candidate nodes (fast regex), scheduling conversion batches, and applying small `Text.data` updates.
- Use requestIdleCallback for non-critical scanning; fallback to setTimeout.
- Worker batches should be limited by message size and total number of strings per message (configurable; default 256 strings per message).

## Performance patterns and optimizations

- Avoid creating many short-lived objects; reuse arrays and buffers when possible.
- Precompile RegExp patterns used for detection.
- For repeated strings, use an LRU cache of recent conversions.
- Use Blob URL to create worker script so bundling keeps top-level bootstrap small.

## File/module layout (suggested)

- src/
  - converter/
    - index.ts (exports detect/convert)
    - tests/
  - worker/
    - worker-bootstrap.ts (worker entry, imports converter)
    - rpc.ts
  - dom/
    - scanner.ts
    - updater.ts
    - mutation-manager.ts
  - storage/
    - gm-wrapper.ts
    - settings.ts
  - ui/
    - badge.ts
  - index.ts (userscript bootstrap)

## Build & bundle strategy

- Use `esbuild` or `rollup` to produce:
  - A minified single-file userscript (`dist/mua.user.js`) with userscript header.
  - Worker code compiled to a separate blob and inlined as a Blob URL.
- Keep dev builds unminified with source maps.

## Worker packaging approaches

1. Inline worker via Blob URL: bundle worker code as a string, create Blob, then `new Worker( URL.createObjectURL(blob) )`.
2. Separate worker file with @resource header (less portable across userscript managers).

Choose inline Blob approach for best portability.

---

End of ARCHITECTURE.md
