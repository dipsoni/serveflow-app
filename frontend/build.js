import * as esbuild from 'esbuild-wasm';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

async function build() {
  console.log('[ServeFlow Build] Starting production build...');

  if (!fs.existsSync('dist/assets')) {
    fs.mkdirSync('dist/assets', { recursive: true });
  }

  // 1. Bundle React application with esbuild-wasm
  console.log('[ServeFlow Build] Bundling React with esbuild-wasm...');
  await esbuild.build({
    entryPoints: ['src/main.jsx'],
    bundle: true,
    outfile: 'dist/assets/index.js',
    format: 'esm',
    minify: false,
    sourcemap: 'inline',
    loader: { '.js': 'jsx', '.jsx': 'jsx' },
    define: {
      'process.env.NODE_ENV': '"production"',
      'global': 'window'
    },
    jsx: 'automatic'
  });

  // 2. Compile Tailwind CSS (runs after esbuild so it generates full utilities)
  console.log('[ServeFlow Build] Compiling full Tailwind CSS...');
  execSync('node ./node_modules/tailwindcss/lib/cli.js -i ./src/index.css -o dist/assets/index.css --minify', { stdio: 'inherit' });

  const cssStat = fs.statSync('dist/assets/index.css');
  console.log(`[ServeFlow Build] Compiled CSS size: ${cssStat.size} bytes`);

  // 3. Prepare index.html in dist with cache-busting
  const timestamp = Date.now();
  let html = fs.readFileSync('index.html', 'utf8');
  html = html.replace('/src/main.jsx', `/assets/index.js?t=${timestamp}`);
  if (!html.includes('/assets/index.css')) {
    html = html.replace('</head>', `  <link rel="stylesheet" href="/assets/index.css?t=${timestamp}" />\n  </head>`);
  } else {
    html = html.replace(/\/assets\/index\.css(\?t=\d+)?/g, `/assets/index.css?t=${timestamp}`);
  }
  fs.writeFileSync('dist/index.html', html);

  console.log('\n======================================================');
  console.log(`  ServeFlow Frontend built successfully into dist/`);
  console.log(`  CSS Bundle: dist/assets/index.css (${(cssStat.size / 1024).toFixed(1)} KB)`);
  console.log('======================================================\n');
}

build().catch((err) => {
  console.error('[ServeFlow Build Error]', err);
  process.exit(1);
});
