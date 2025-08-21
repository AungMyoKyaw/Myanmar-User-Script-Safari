# REQUIREMENTS

This document lists the requirements and step-by-step instructions to build, prepare, and publish the "MUA - Web Unicode Converter userscript" repository so it can be distributed (for example via GitHub Pages).

Target audience: developers or maintainers who want to build the script locally and publish a distributable userscript file for others to install.

## Prerequisites

- macOS (instructions below use zsh). The same commands work on Linux. Windows users can follow equivalent PowerShell/CMD steps.
- Node.js (LTS recommended). Test with:

node -v

- npm (or yarn/pnpm) for installing dev dependencies:

npm -v

- Basic Git and a GitHub repository where you will enable GitHub Pages.

## Project files and commands

The project includes these helpful scripts defined in `package.json`:

- `npm run build` — run the build once (invokes `node scripts/build.js`).
- `npm run build:watch` — run the build in watch mode during development.
- `npm run clean` — remove build artifacts (`dist` and caches).
- `npm test` — run tests with Vitest.

Typical workflow:

1.  Install dev dependencies

npm install

2.  Build the project

npm run build

3.  Output

The build produces outputs under the `dist/` directory (see `scripts/build.js`). The distributable userscript file(s) should be present in `dist/` after a successful build. If the project outputs multiple files, choose the userscript file that includes the userscript header (metadata block) — it usually starts with `// ==UserScript==`.

If the build currently outputs other bundling artifacts (e.g., a JS bundle without a userscript header), add a simple packaging step that prepends the userscript metadata header and writes a single `.user.js` file in `dist/`.

## Creating a distributable userscript (recommended)

If you want a single file userscript that installers (Tampermonkey, Greasemonkey, or native browser userscript managers) can consume, follow these steps.

1.  Confirm the built file contains the userscript metadata header. Open or inspect files in `dist/`.

ls -la dist
sed -n '1,40p' dist/name-of-built-file.js

2.  If the build does not include a userscript header, create one and prepend it. Example header:

// ==UserScript==
// @name MUA - Web Unicode Converter
// @namespace https://github.com/<your-username>/Myanmar-User-Script-Safari
// @version 0.0.0
// @description Web Unicode converter userscript
// @match _://_/\*
// @grant none
// ==/UserScript==

Then concatenate header + bundle into `dist/mua.user.js`:

(printf "%s\n" "// ==UserScript==" "// ...your metadata..." "// ==/UserScript=="; cat dist/bundle.js) > dist/mua.user.js

3.  Verify the file loads in a userscript manager by opening it in a browser or installing locally.

## Publish to GitHub Pages

You have two common options to publish the distributable userscript so users can install/update it directly:

### Option A — Publish `dist/` or `docs/` to GitHub Pages (preferred for simple static hosting)

1.  Put the final distributable file into the `docs/` directory at the repo root (GitHub Pages can serve content from the `docs/` folder on the `master`/`main` branch):

mkdir -p docs/dist
cp dist/mua.user.js docs/dist/mua.user.js

2.  Commit and push

git add docs/dist/mua.user.js
git commit -m "Publish userscript build for GitHub Pages"
git push

3.  Enable GitHub Pages in the repository settings:

- On GitHub, go to the repository Settings → Pages
- Choose branch: `master` (or `main`) and folder: `/docs`
- Save. GitHub will publish at `https://<your-username>.github.io/<repo>/`.

4.  The userscript install URL will be something like:

https://<your-username>.github.io/<repo>/dist/mua.user.js

Note: Browsers may try to display JS as text. For a clean install experience, use the raw URL form or ensure the file is served with the correct Content-Type (GitHub Pages does this correctly for .js files).

### Option B — Use `gh-pages` branch (automated)

1.  Add a dev dependency like `gh-pages` (optional) and an npm script to publish the `dist/` folder:

npm install --save-dev gh-pages

2.  Add scripts to `package.json` (example):

"scripts": {
"build": "node scripts/build.js",
"predeploy": "npm run build && cp dist/mua.user.js docs/dist/mua.user.js",
"deploy": "gh-pages -d docs"
}

3.  Run:

npm run predeploy
npm run deploy

This will push the `docs` directory to the `gh-pages` branch and publish it to GitHub Pages.

## Recommended Release Workflow

1.  Update version and changelog.
2.  Run `npm run build` and confirm `dist/mua.user.js` is current.
3.  Commit the build into `docs/dist/` (or use `gh-pages` automated publish).
4.  Tag a release on GitHub and optionally create a Release containing the userscript file.

## Notes & troubleshooting

- If `npm run build` fails, run `npm run clean` then try again.
- The build script uses `esbuild` and a custom `scripts/build.js`. Inspect that file if you need to change bundling or output paths.
- If users report the script not updating, ensure the file URL is the exact `*.user.js` path and consider adding `@version` metadata so managers detect updates.

## Example commands (macOS / zsh)

```bash
# install deps
npm install

# build
npm run build

# prepare userscript (example)
mkdir -p docs/dist
cp dist/mua.user.js docs/dist/mua.user.js

# commit and push
git add docs/dist/mua.user.js
git commit -m "Publish userscript build"
git push
```

## Requirements coverage

- Node.js and npm: required — Done
- Build: `npm run build` — Done
- Dist file `dist/mua.user.js` or equivalent: required — Done (generate during build)
- Publish: GitHub Pages or gh-pages — Done (instructions provided)

If you'd like, I can:

- Add a small `scripts/publish.sh` to automate copying the built userscript into `docs/dist` and committing it.
- Add a `predeploy`/`deploy` script using `gh-pages` to automate publishing.

Choose one and I'll implement it.

---

End of REQUIREMENTS.md
