import type { Monitor, ProbeResult } from '../types.js';
import { probeHttp } from './http.js';
import { probeTcp } from './tcp.js';
import { probePing } from './ping.js';

export async function probeMonitor(monitor: Monitor): Promise<ProbeResult> {
  switch (monitor.type) {
    case 'HTTP':
      return probeHttp(monitor);
    case 'TCP':
      return probeTcp(monitor);
    case 'PING':
      return probePing(monitor);
    default:
      return {
        status: 'DOWN',
        responseTime: 0,
        message: `Unsupported monitor type: ${(monitor as any).type}`,
      };
  }
}
