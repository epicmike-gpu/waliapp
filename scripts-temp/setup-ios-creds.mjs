// 用 ASC API key 编程生成 iOS 构建凭证：distribution cert (.p12) + App Store provisioning profile
// 产物放 /root/.app-storeconnect/build/，credentials.json 引用绝对路径
import crypto from 'node:crypto';
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const KEY_ID = 'T37379VGKP';
const ISSUER_ID = '7ea9a762-5e99-4381-a843-28ecb68fc77f';
const P8_PATH = '/root/.app-storeconnect/AuthKey_T37379VGKP.p8';
const BUNDLE_ID = 'com.wali.value';
const OUT = '/root/.app-storeconnect/build';
const API = 'https://api.appstoreconnect.apple.com';

function jwt() {
  const header = Buffer.from(JSON.stringify({ alg: 'ES256', kid: KEY_ID, typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({ iss: ISSUER_ID, iat: now, exp: now + 1200, aud: 'appstoreconnect-v1' })).toString('base64url');
  const data = `${header}.${payload}`;
  const sig = crypto.sign('sha256', Buffer.from(data), { key: fs.readFileSync(P8_PATH, 'utf8'), dsaEncoding: 'ieee-p1363' });
  return `${data}.${sig.toString('base64url')}`;
}

async function asc(path, method = 'GET', body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${jwt()}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok) throw new Error(`ASC ${method} ${path} -> ${res.status}: ${text.slice(0, 300)}`);
  return json;
}

fs.mkdirSync(OUT, { recursive: true });

// 1. 本地私钥 + CSR
const PRIV = `${OUT}/dist-key.pem`;
const CSR = `${OUT}/dist.csr`;
execSync(`openssl genrsa -out ${PRIV} 2048`);
execSync(`openssl req -new -key ${PRIV} -out ${CSR} -subj "/CN=value/"`);
const csrContent = fs.readFileSync(CSR, 'utf8');

// 2. 创建新 distribution certificate；若已有旧证书（无本地私钥无法复用），先吊销再建
let cert;
async function createCert() {
  const created = await asc('/v1/certificates', 'POST', {
    data: { type: 'certificates', attributes: { certificateType: 'DISTRIBUTION', csrContent } },
  });
  return created.data;
}
try {
  cert = await createCert();
  console.log('created cert:', cert.id);
} catch (e) {
  console.log('create failed, revoking existing:', e.message.slice(0, 120));
  const existing = await asc('/v1/certificates?filter[certificateType]=DISTRIBUTION&limit=10');
  for (const c of existing.data || []) {
    await asc(`/v1/certificates/${c.id}`, 'DELETE');
    console.log('revoked:', c.id);
  }
  cert = await createCert();
  console.log('created cert:', cert.id);
}
const certDerB64 = cert.attributes.certificateContent;
fs.writeFileSync(`${OUT}/dist.cer`, Buffer.from(certDerB64, 'base64'));
// DER -> PEM -> p12
execSync(`openssl x509 -inform DER -in ${OUT}/dist.cer -out ${OUT}/dist.pem`);
const P12_PASS = 'wali' + crypto.randomBytes(4).toString('hex');
execSync(`openssl pkcs12 -export -inkey ${PRIV} -in ${OUT}/dist.pem -out ${OUT}/dist.p12 -password pass:${P12_PASS}`);
fs.writeFileSync(`${OUT}/p12-password.txt`, P12_PASS);
console.log('p12 ok');

// 3. bundle id（先查后建）
let bundle;
const bidList = await asc(`/v1/bundleIds?filter[identifier]=${encodeURIComponent(BUNDLE_ID)}&limit=5`);
if (bidList.data && bidList.data.length) {
  bundle = bidList.data[0];
  console.log('reuse bundleId:', bundle.id);
} else {
  const created = await asc('/v1/bundleIds', 'POST', {
    data: { type: 'bundleIds', attributes: { identifier: BUNDLE_ID, name: 'value', platform: 'IOS' } },
  });
  bundle = created.data;
  console.log('created bundleId:', bundle.id);
}

// 4. App Store provisioning profile
const created = await asc('/v1/profiles', 'POST', {
  data: {
    type: 'profiles',
    attributes: { name: `value App Store ${Date.now()}`, profileType: 'IOS_APP_STORE' },
    relationships: {
      bundleId: { data: { type: 'bundleIds', id: bundle.id } },
      certificates: { data: [{ type: 'certificates', id: cert.id }] },
    },
  },
});
const profile = created.data;
console.log('created profile:', profile.id);
fs.writeFileSync(`${OUT}/profile.mobileprovision`, Buffer.from(profile.attributes.profileContent, 'base64'));
console.log('DONE', OUT);
