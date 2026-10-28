import { execFile } from 'node:child_process';
import os from 'node:os';
import type { Monitor, ProbeResult } from '../types.js';

export function probePing(monitor: Monitor): Promise<ProbeResult> {
  return new Promise((resolve) => {
    let host = monitor.target.trim();
    // URL 형태로 들어왔다면 hostname만 추출
    try {
      if (host.includes('://')) {
        host = new URL(host).hostname;
      }
    } catch {
      // 그대로 유지
    }

    const isWin = os.platform() === 'win32';
    const timeoutSec = monitor.timeout || 5;
    const timeoutMs = timeoutSec * 1000;

    const args = isWin
      ? ['-n', '1', '-w', String(timeoutMs), host]
      : ['-c', '1', '-W', String(timeoutSec), host];

    const start = performance.now();

    execFile('ping', args, { timeout: timeoutMs + 1000 }, (error, stdout, stderr) => {
      const latencyFallback = Math.round(performance.now() - start);

      if (error) {
        return resolve({
          status: 'DOWN',
          responseTime: latencyFallback,
          message: error.message || 'Host unreachable / Ping failed',
        });
      }

      const output = stdout.toString();

      // Check packet loss
      if (
        output.includes('100% loss') ||
        output.includes('100% 손실') ||
        output.includes('Destination host unreachable') ||
        output.includes('대상 호스트에 연결할 수 없습니다') ||
        output.includes('Request timed out') ||
        output.includes('요청 시간이 만료되었습니다')
      ) {
        return resolve({
          status: 'DOWN',
          responseTime: latencyFallback,
          message: 'Ping packet lost or host unreachable',
        });
      }

      // Regex to extract ping time: time=12ms, time<1ms, 시간=12ms, time=12.4 ms
      const timeMatch = output.match(/(?:time|시간)[=<]([\d\.]+)\s*ms/i);
      let pingTime = latencyFallback;
      if (timeMatch && timeMatch[1]) {
        pingTime = Math.round(parseFloat(timeMatch[1]));
      }

      resolve({
        status: 'UP',
        responseTime: pingTime,
        message: `Ping reply received (${pingTime}ms)`,
      });
    });
  });
}
