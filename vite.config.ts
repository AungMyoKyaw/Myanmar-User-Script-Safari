import { defineConfig } from 'vite';
import { metablock } from 'vite-plugin-userscript';
import {
  name,
  version,
  description,
  author,
  license,
  homepage
} from './package.json';

export default defineConfig({
  plugins: [
    metablock({
      override: {
        name: 'MUA Web Unicode Converter (userscript)',
        namespace: homepage,
        version,
        description,
        author,
        license,
        grant: [
          'GM_getValue',
          'GM_setValue',
          'GM_registerMenuCommand',
          'GM_addStyle'
        ],
        match: '*://*/*',
        updateURL: `${homepage}/raw/master/dist/mua.user.js`,
        downloadURL: `${homepage}/raw/master/dist/mua.user.js`
      }
    })
  ],
  build: {
    outDir: 'docs/dist',
    emptyOutDir: true,
    assetsInlineLimit: 100000000,
    rollupOptions: {
      input: 'src/index.ts',
      output: {
        entryFileNames: 'mua.user.js'
      }
    }
  }
});
