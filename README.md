# MUA Web Unicode Converter — Userscript

TypeScript rewrite of the MUA Web Unicode Converter as a high-performance userscript for Tampermonkey/Violentmonkey/Greasemonkey and Safari userscript environments.

See `docs/` for detailed Requirements, Architecture, and Development guides.

## Quick start

Prereqs: Node.js 18+

- Install deps: `npm install`
- Run tests: `npm test`
- Build bundle: `npm run build` (outputs `dist/mua.user.js` with userscript header)

Load `dist/mua.user.js` into your userscript manager. Menu commands allow enabling/disabling globally and per-site allow/block rules. A small badge appears in the corner and can be dismissed.

## License

GPL-3.0. Parabaik converter logic attribution preserved within the code and header.
