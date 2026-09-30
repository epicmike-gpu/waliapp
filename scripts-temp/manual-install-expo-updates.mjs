// v2: 补装 expo-updates 依赖树到嵌套 node_modules；cp 覆盖模式（不 rm dest）
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CLIENT = '/workspace/projects/client';
const NESTED = path.join(CLIENT, 'node_modules', 'expo-updates', 'node_modules');
const REG = 'https://registry.npmmirror.com';
const ROOT_PKG = { name: 'expo-updates', range: '57.0.24' };

const seen = new Set();
const errors = [];

function meta(name, range) {
  const out = execSync(`curl -sL --max-time 30 "${REG}/${name}/${range}"`, { maxBuffer: 20 * 1024 * 1024 });
  return JSON.parse(out.toString());
}

function install(name, range, destBase) {
  const key = `${name}@${range}`;
  if (seen.has(key)) return;
  seen.add(key);
  const dest = path.join(destBase, name);
  if (fs.existsSync(path.join(dest, 'package.json'))) {
    console.log(`skip-exists ${name}`);
    return;
  }
  let m;
  try { m = meta(name, range); } catch (e) { errors.push(`meta-fail ${key}`); return; }
  const version = m.version;
  const tgzName = name.startsWith('@') ? `${name.split('/')[1]}-${version}.tgz` : `${name}-${version}.tgz`;
  const tmpTgz = `/tmp/._mi2_${tgzName}`;
  const tmpDir = `/tmp/._mi2_${tgzName}.dir`;
  try {
    execSync(`curl -sL --max-time 60 "${REG}/${name}/-/${tgzName}" -o ${tmpTgz}`, { maxBuffer: 50 * 1024 * 1024 });
    execSync(`rm -rf ${tmpDir} && mkdir -p ${tmpDir} && tar -xzf ${tmpTgz} -C ${tmpDir}`);
    fs.mkdirSync(dest, { recursive: true });
    execSync(`cp -a "${tmpDir}/package/." "${dest}/"`);
    console.log(`installed ${name}@${version}`);
  } catch (e) { errors.push(`tgz-fail ${key}`); return; }
  finally { try { fs.unlinkSync(tmpTgz); } catch {} try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {} }
  const deps = m.dependencies || {};
  for (const [dn, dr] of Object.entries(deps)) install(dn, dr, NESTED);
}

fs.mkdirSync(NESTED, { recursive: true });
install(ROOT_PKG.name, ROOT_PKG.range, NESTED); // 起点也装一份到 NESTED（skip-exists 后递归依赖）
console.log('--- done ---');
if (errors.length) { console.log('ERRORS:'); for (const e of errors) console.log('  ' + e); }
console.log(`total resolved: ${seen.size}`);
