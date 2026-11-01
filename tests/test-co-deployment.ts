import { spawn } from 'child_process';
import path from 'path';

async function waitForServer(url: string, timeout = 30000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return;
    } catch {
      // waiting
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Timeout waiting for ${url}`);
}

async function runTest() {
  console.log('Testing Next.js Co-Deployment Serverless API (/api/[[...slug]])...');
  const nextCli = path.resolve(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');
  const server = spawn(process.execPath, [nextCli, 'start', 'apps/web', '-p', '3005'], {
    stdio: 'inherit',
    env: { ...process.env, PORT: '3005' }
  });

  try {
    await waitForServer('http://127.0.0.1:3005/api/health');

    // 1. Test /api/health
    const healthRes = await fetch('http://127.0.0.1:3005/api/health');
    const healthContentType = healthRes.headers.get('content-type') || '';
    if (!healthContentType.includes('application/json')) {
      throw new Error(`Expected JSON but got ${healthContentType}`);
    }
    const health = await healthRes.json();
    console.log('✅ Co-Deployed Health check:', health.service, '| Status:', health.status);

    // 2. Test /api/knowledge/guidelines
    const gRes = await fetch('http://127.0.0.1:3005/api/knowledge/guidelines');
    const gData = await gRes.json();
    console.log('✅ Co-Deployed Guidelines retrieved:', gData.guidelines?.length);

    // 3. Test /api/audit/analyze
    const auditRes = await fetch('http://127.0.0.1:3005/api/audit/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Vercel Deployment Copy',
        text: 'Inkloom is the best and cheapest tool that provides 100% guarantee.'
      })
    });
    const auditContentType = auditRes.headers.get('content-type') || '';
    if (!auditContentType.includes('application/json')) {
      const text = await auditRes.text();
      throw new Error(`Audit did not return JSON: ${text.slice(0, 100)}`);
    }
    const auditData = await auditRes.json();
    console.log('✅ Co-Deployed Audit successful:');
    console.log('   - Score:', auditData.report?.overallComplianceScore);
    console.log('   - Violations count:', auditData.report?.violations?.length);

    console.log('\n🎉 NEXT.JS CO-DEPLOYMENT SERVERLESS API VERIFIED WITH 100% SUCCESS!');
  } finally {
    server.kill();
  }
}

runTest()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Test failed:', e);
    process.exit(1);
  });
