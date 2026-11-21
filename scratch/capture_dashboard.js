const fs = require('fs');
const http = require('http');
const crypto = require('crypto');
const { spawn } = require('child_process');

function createAdminToken() {
  const secret = 'ElectroSL_Super_Secret_Key_At_Least_32_Characters_Long_For_Jwt_Security!';
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': '1',
    sub: '1',
    email: 'admin@electrosl.lk',
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'Admin',
    role: 'Admin',
    nbf: now,
    exp: now + 7200,
    iat: now,
    iss: 'ElectroSL',
    aud: 'ElectroSL_Clients'
  })).toString('base64url');
  const toSign = `${header}.${payload}`;
  const sig = crypto.createHmac('sha256', secret).update(toSign).digest('base64url');
  return `${toSign}.${sig}`;
}

async function run() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const tempProfile = 'C:\\Users\\DELL\\AppData\\Local\\Temp\\edge_cdp_profile_' + Date.now();
  
  console.log('Launching Edge headless with debugging on port 9222...');
  const browserProc = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    `--user-data-dir=${tempProfile}`,
    '--window-size=1280,820',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ]);

  // Wait 1.5s for CDP port
  await new Promise(r => setTimeout(r, 1500));

  // Get existing target via /json/list (GET)
  const targets = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json/list', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const targetInfo = targets[0];
  console.log('Connected to target:', targetInfo.id);
  const ws = new globalThis.WebSocket(targetInfo.webSocketDebuggerUrl);

  let msgId = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  };

  const send = (method, params = {}) => {
    const id = msgId++;
    return new Promise((resolve) => {
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  };

  await new Promise(r => ws.onopen = r);
  console.log('WebSocket connected. Initializing page...');

  await send('Page.enable');
  await send('Runtime.enable');

  const token = createAdminToken();
  const userJson = JSON.stringify({ userId: 1, name: 'Administrator', email: 'admin@electrosl.lk', role: 'Admin' });

  // Navigate to login first to establish localhost origin
  console.log('Navigating to origin...');
  await send('Page.navigate', { url: 'http://localhost:5173/admin-portal/login' });
  await new Promise(r => setTimeout(r, 1500));

  // Set localStorage authentication credentials
  const injectScript = `
    localStorage.setItem('token', ${JSON.stringify(token)});
    localStorage.setItem('jwt', ${JSON.stringify(token)});
    localStorage.setItem('role', 'Admin');
    localStorage.setItem('user', ${JSON.stringify(userJson)});
    window.location.href = '/admin/dashboard';
  `;
  await send('Runtime.evaluate', { expression: injectScript });

  // Wait for Dashboard to fetch data and render
  console.log('Navigating to Dashboard and waiting for data render...');
  await new Promise(r => setTimeout(r, 2500));

  // Capture screenshot
  console.log('Capturing screenshot...');
  const res = await send('Page.captureScreenshot', { format: 'png' });
  
  const destPath = 'C:\\Users\\DELL\\.gemini\\antigravity\\brain\\6ee6c205-4013-48bc-98f1-5266d2b8913f\\admin_dashboard_simplified.png';
  fs.writeFileSync(destPath, Buffer.from(res.result.data, 'base64'));
  console.log('Screenshot successfully saved to:', destPath);

  ws.close();
  browserProc.kill();

  // Clean temp profile
  try {
    fs.rmSync(tempProfile, { recursive: true, force: true });
  } catch (e) {}

  console.log('Done!');
}

run().catch(err => {
  console.error('Error capturing screenshot:', err);
  process.exit(1);
});
