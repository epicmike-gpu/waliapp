import * as esbuild from 'esbuild';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');
const dependencies = pkg.dependencies || {};
const externalList = Object.keys(dependencies).filter(dep => dep !== 'dayjs');
const mode = process.argv[2] || 'local';

try {
  if (mode === 'vercel') {
    // Vercel Serverless：esbuild 单文件打包成 CJS（.cjs），
    // 消除 ESM 相对扩展名 / 文件级编译的所有兼容性问题。
    await esbuild.build({
      entryPoints: ['functions-src/index.ts', 'functions-src/ping.ts', 'functions-src/healthz.ts'],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      outdir: 'api',
      outExtension: { '.js': '.cjs' },
      external: externalList,
      target: 'node20',
    });
    console.log('⚡ Vercel functions bundled!');
  } else {
    await esbuild.build({
      entryPoints: ['src/index.ts'],
      bundle: true,
      platform: 'node',
      format: 'esm',
      outdir: 'dist',
      external: externalList,
    });
    console.log('⚡ Build complete!');
  }
} catch (e) {
  console.error(e);
  process.exit(1);
}
