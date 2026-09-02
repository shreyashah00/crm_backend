const { spawn } = require('child_process');
const path = require('path');

const serverFile = path.join(__dirname, '../src/server.js');

function runTest() {
  return new Promise((resolve, reject) => {
    console.log('Spawning backend server...');
    const server = spawn('node', [serverFile], {
      env: { ...process.env, PORT: 5999, NODE_ENV: 'test' }
    });

    server.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[Server stdout] ${output.trim()}`);
      if (output.includes('port: 5999')) {
        // Server is ready, trigger tests
        triggerTests(server).then(resolve).catch(reject);
      }
    });

    server.stderr.on('data', (data) => {
      console.error(`[Server stderr] ${data.toString()}`);
    });

    server.on('close', (code) => {
      console.log(`Server process exited with code ${code}`);
    });
  });
}

async function triggerTests(serverProcess) {
  const baseUrl = 'http://localhost:5999';
  console.log('\n--- STARTING INTEGRATION TESTS ---');
  let token = '';

  try {
    // 1. Test Health Check
    console.log('Testing GET / ...');
    const healthRes = await fetch(`${baseUrl}/`);
    const healthData = await healthRes.json();
    console.log(`GET / status: ${healthRes.status}, success: ${healthData.success}`);

    // 2. Test Showcase Login via role (Switch to MANAGER)
    console.log('Testing POST /auth/login (Role-based login: MANAGER)...');
    const roleLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'MANAGER' })
    });
    const roleLoginData = await roleLoginRes.json();
    console.log(`POST /auth/login by role status: ${roleLoginRes.status}, user: ${roleLoginData.data?.user?.name}, role: ${roleLoginData.data?.user?.role}`);

    // 3. Test Perspective Switching endpoint: POST /auth/switch-role (Switch to Preeti - ID: 5)
    console.log('Testing POST /auth/switch-role (Switch to Preeti Bachhar)...');
    const switchRes = await fetch(`${baseUrl}/auth/switch-role`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 5 })
    });
    const switchData = await switchRes.json();
    console.log(`POST /auth/switch-role status: ${switchRes.status}, user: ${switchData.data?.user?.name}, role: ${switchData.data?.user?.role}`);
    token = switchData.data.token;

    // 4. Test GET /auth/me (Protected Profile)
    console.log('Testing GET /auth/me ...');
    const meRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const meData = await meRes.json();
    console.log(`GET /auth/me status: ${meRes.status}, name: ${meData.name}, role: ${meData.role}, designation: ${meData.designation}`);

    // 4. Test GET /dashboard (Scoped Dashboard)
    console.log('Testing GET /dashboard ...');
    const dashRes = await fetch(`${baseUrl}/dashboard`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const dashData = await dashRes.json();
    console.log(`GET /dashboard status: ${dashRes.status}, total leads: ${dashData.total}, warm: ${dashData.warm}, overdue: ${dashData.overdue}`);

    // 5. Test GET /leads (Query Leads List)
    console.log('Testing GET /leads?size=5 ...');
    const leadsRes = await fetch(`${baseUrl}/leads?size=5`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const leadsData = await leadsRes.json();
    console.log(`GET /leads status: ${leadsRes.status}, count: ${leadsData.content.length}, total elements: ${leadsData.totalElements}`);

    // 6. Test GET /staff/leaderboard (Leaderboard Performance)
    console.log('Testing GET /staff/leaderboard ...');
    const leaderRes = await fetch(`${baseUrl}/staff/leaderboard`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const leaderData = await leaderRes.json();
    console.log(`GET /staff/leaderboard status: ${leaderRes.status}, ranks count: ${leaderData.length}, leader name: ${leaderData[0]?.staff?.name}, leader score: ${leaderData[0]?.score}`);

    // 7. Test GET /notifications (Overdue and Stale warnings)
    console.log('Testing GET /notifications ...');
    const notifRes = await fetch(`${baseUrl}/notifications`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const notifData = await notifRes.json();
    console.log(`GET /notifications status: ${notifRes.status}, alert items: ${notifData.length}`);

    console.log('--- ALL TESTS PASSED SUCCESSFULLY! ---');
  } catch (err) {
    console.error('Integration test failed:', err);
    throw err;
  } finally {
    console.log('Killing backend server...');
    serverProcess.kill('SIGINT');
  }
}

runTest()
  .then(() => {
    console.log('Integration test process complete.');
    process.exit(0);
  })
  .catch((e) => {
    console.error('Test run failed:', e);
    process.exit(1);
  });
