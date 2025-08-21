# MUA Userscript — Development Guide

This development guide explains how to set up the TypeScript project, build, test, and produce the final userscript bundle.

## Prerequisites

- Node.js LTS (>= 18) and npm/yarn installed.
- A userscript manager for testing (Tampermonkey, Violentmonkey, Greasemonkey) or Safari userscript runner.

## Project layout (recommended)

- package.json
- tsconfig.json
- src/
- test/
- docs/
- dist/

## Recommended tools

- esbuild (fast bundler) or rollup if you prefer more plugins.
- vitest or jest for unit tests.
- Playwright for integration tests.

## Local development workflow

1. Install dependencies

```bash
npm install
```

2. Build in watch mode (esbuild)

```bash
npm run build:watch
```

3. Load the generated userscript into Tampermonkey (use the dev header that points to local file or paste contents) and test on pages.

## Testing

- Unit tests: run `npm test` (runs vitest/jest) for converting functions and detection logic.
- Integration: Use Playwright to load `dist/mua.user.js` into a headful browser session and run smoke tests on fixtures.
- Performance: Add a Playwright scenario that measures time from `DOMContentLoaded` to first conversion of viewport nodes.

## Building the userscript

- Build steps (using esbuild):
  1. Compile TS into single JS bundle for main script.
  2. Compile worker TS to JS string and inline as Blob.
  3. Prepend userscript header with @name, @version, @grant lines, and GPL notice.
  4. Minify and write `dist/mua.user.js`.

Example `package.json` scripts (recommended)

```json
{
  "scripts": {
    "build": "node scripts/build.js",
    "build:watch": "node scripts/build.js --watch",
    "test": "vitest"
  }
}
```

## Userscript header template (must include GPL notice)

```text
// ==UserScript==
// @name        MUA Web Unicode Converter (userscript)
// @namespace   https://github.com/AungMyoKyaw/MUA-Web-Unicode-Converter
// @version     0.0.0-dev
// @description Convert Zawgyi-encoded Myanmar text to Unicode in web pages.
// @author      Aung Myo Kyaw
// @license     GPL-3.0
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_registerMenuCommand
// @grant       GM_addStyle
// @match       *://*/*
// ==/UserScript==
```

## Development tips

- Keep the converter pure and well-tested. This is the critical path for correctness.
- Use the worker for CPU-intensive tasks. Keep message sizes bounded.
- When debugging DOM updates, make a non-worker debug build to simplify stepping through code.

## Style and TypeScript config

- `tsconfig.json` with "strict": true, module: ESNext and target: ES2019.
- Lint with ESLint and Prettier rules adapted for userscripts.

## Packaging for release

- Bump version in package.json and header.
- Create `dist/mua.user.js` and `dist/mua.user.js.map` (optional).
- Publish the bundle as release attach or host script raw for Tampermonkey installs; ensure GPL obligations are visible in README and header.

---

End of DEVELOPMENT.md
