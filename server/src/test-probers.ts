import { probeHttp } from './probers/http.js';
import { probeTcp } from './probers/tcp.js';
import { probePing } from './probers/ping.js';
import type { Monitor } from './types.js';

async function runTests() {
  console.log('--- Probers Verification Test ---');

  // 1. HTTP Test
  const httpMonitor: Monitor = {
    id: 1,
    name: 'Google HTTP',
    type: 'HTTP',
    target: 'https://www.google.com',
    interval: 60,
    timeout: 5,
    max_retries: 1,
    active: 1,
    current_status: 'PENDING',
    created_at: '',
    updated_at: '',
  };
  console.log('Testing HTTP (https://www.google.com)...');
  const httpResult = await probeHttp(httpMonitor);
  console.log('HTTP Result:', httpResult);

  // 2. TCP Test (Cloudflare DNS Port 53)
  const tcpMonitor: Monitor = {
    id: 2,
    name: 'Cloudflare DNS TCP',
    type: 'TCP',
    target: '1.1.1.1',
    port: 53,
    interval: 60,
    timeout: 5,
    max_retries: 1,
    active: 1,
    current_status: 'PENDING',
    created_at: '',
    updated_at: '',
  };
  console.log('\nTesting TCP (1.1.1.1:53)...');
  const tcpResult = await probeTcp(tcpMonitor);
  console.log('TCP Result:', tcpResult);

  // 3. TCP Fail Test (Closed Port)
  const tcpFailMonitor: Monitor = {
    ...tcpMonitor,
    port: 49123,
    timeout: 2,
  };
  console.log('\nTesting TCP Fail (127.0.0.1:49123)...');
  const tcpFailResult = await probeTcp({ ...tcpFailMonitor, target: '127.0.0.1' });
  console.log('TCP Fail Result:', tcpFailResult);

  // 4. Ping Test (127.0.0.1)
  const pingMonitor: Monitor = {
    id: 3,
    name: 'Localhost Ping',
    type: 'PING',
    target: '127.0.0.1',
    interval: 60,
    timeout: 3,
    max_retries: 1,
    active: 1,
    current_status: 'PENDING',
    created_at: '',
    updated_at: '',
  };
  console.log('\nTesting Ping (127.0.0.1)...');
  const pingResult = await probePing(pingMonitor);
  console.log('Ping Result:', pingResult);

  console.log('\n--- All Prober Tests Completed ---');
}

runTests();
