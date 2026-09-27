import * as esbuild from 'esbuild';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');
const dependencies = pkg.dependencies || {};
const externalList = Object.keys(dependencies).filter(dep => dep !== 'dayjs');
const mode = process.argv[2] || 'local';

try {
  if (mode === 'vercel') {
    // Vercel Serverless：esbuild 全量打包成单文件 CJS（.js + api/package.json type=commonjs）
    // - 全 bundle：仅 node 内置模块外置，运行时零依赖解析（绕开 pnpm 符号链接问题）
    // - .js 扩展名：确保 @vercel/node 识别函数入口；api/package.json 锁定 CJS 加载语义
    await esbuild.build({
      entryPoints: ['functions-src/index.ts', 'functions-src/ping.ts', 'functions-src/healthz.ts'],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      outdir: 'api',
      external: ['node:*'],
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
