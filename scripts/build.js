const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

(async function build() {
  try {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8')
    );
    const version = pkg.version || '0.0.0-dev';
    const description =
      pkg.description || 'MUA - Web Unicode Converter userscript';
    // Build worker first
    const workerResult = await esbuild.build({
      entryPoints: [path.join(__dirname, '../src/worker/worker-bootstrap.ts')],
      bundle: true,
      platform: 'browser',
      write: false,
      minify: true,
      sourcemap: false
    });
    let workerCode = workerResult.outputFiles[0].text;
    // Remove a top-level "use strict" directive from the generated worker code.
    // Some userscript hosts (or browsers) wrap the whole script in a function
    // with a non-simple parameter list which makes an inner "use strict" illegal
    // (SyntaxError). Strip only the leading directive to avoid accidental removal
    // of string usages elsewhere.
    workerCode = workerCode.replace(
      /^\s*(?:"use strict"|'use strict')\s*;?\s*/i,
      ''
    );

    // Build main script and inject worker code as a Blob string
    const banner =
      `// ==UserScript==\n` +
      `// @name        MUA Web Unicode Converter (userscript)\n` +
      `// @namespace   https://github.com/AungMyoKyaw/MUA-Web-Unicode-Converter\n` +
      `// @version     ${version}\n` +
      `// @description ${description}\n` +
      `// @author      Aung Myo Kyaw\n` +
      `// @license     GPL-3.0\n` +
      `// @grant       GM_getValue\n` +
      `// @grant       GM_setValue\n` +
      `// @grant       GM_registerMenuCommand\n` +
      `// @grant       GM_addStyle\n` +
      `// @match       *://*/*\n` +
      `// ==/UserScript==\n\n`;

    const mainResult = await esbuild.build({
      entryPoints: [path.join(__dirname, '../src/index.ts')],
      bundle: true,
      platform: 'browser',
      write: false,
      minify: true,
      sourcemap: false,
      define: {
        INLINE_WORKER: JSON.stringify(workerCode)
      }
    });

    // Strip a leading "use strict" from the main bundle as well for the same
    // reason (userscript hosts may wrap the script in functions with
    // non-simple parameter lists).
    let mainText = mainResult.outputFiles[0].text;
    mainText = mainText.replace(
      /^\s*(?:"use strict"|'use strict')\s*;?\s*/i,
      ''
    );

    const out = banner + mainText;
    fs.mkdirSync(path.join(__dirname, '../dist'), { recursive: true });
    fs.writeFileSync(path.join(__dirname, '../dist/mua.user.js'), out);
    console.log('Built dist/mua.user.js');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
