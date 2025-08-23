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
    lib: {
      entry: 'src/index.ts',
      name: 'mua-userscript'
    },
    rollupOptions: {
      output: {
        extend: true,
        format: 'umd',
        entryFileNames: 'mua.user.js'
      }
    }
  }
});
