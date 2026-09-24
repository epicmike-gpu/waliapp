import ngrok from '@expo/ngrok';

try {
  const url = await ngrok.connect(9091);
  console.log('BACKEND_TUNNEL=' + url);
  setInterval(() => {}, 1 << 30);
} catch (err) {
  console.error('TUNNEL_FAIL=' + (err?.message || String(err)));
  process.exit(1);
}
