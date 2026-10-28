import net from 'node:net';
import type { Monitor, ProbeResult } from '../types.js';

export function probeTcp(monitor: Monitor): Promise<ProbeResult> {
  return new Promise((resolve) => {
    let host = monitor.target.trim();
    let port = monitor.port;

    // target에 host:port 형태로 들어온 경우 처리
    if (host.includes(':') && !host.startsWith('[')) {
      const parts = host.split(':');
      host = parts[0];
      port = Number(parts[1]) || port;
    }

    if (!port || isNaN(port)) {
      return resolve({
        status: 'DOWN',
        responseTime: 0,
        message: 'Invalid or missing TCP port',
      });
    }

    const timeoutMs = (monitor.timeout || 10) * 1000;
    const start = performance.now();
    const socket = new net.Socket();

    let resolved = false;
    const done = (status: 'UP' | 'DOWN', message?: string) => {
      if (resolved) return;
      resolved = true;
      socket.destroy();
      const latency = Math.round(performance.now() - start);
      resolve({
        status,
        responseTime: latency,
        message: message || (status === 'UP' ? 'Port is open' : 'Connection failed'),
      });
    };

    socket.setTimeout(timeoutMs);

    socket.on('connect', () => {
      done('UP', 'Connection successful');
    });

    socket.on('timeout', () => {
      done('DOWN', `TCP connection timed out after ${monitor.timeout}s`);
    });

    socket.on('error', (err: any) => {
      done('DOWN', err.message || 'TCP socket error');
    });

    try {
      socket.connect(port, host);
    } catch (err: any) {
      done('DOWN', err.message || 'Failed to initiate TCP socket');
    }
  });
}
