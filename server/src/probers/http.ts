import type { Monitor, ProbeResult } from '../types.js';

function isStatusAccepted(statusCode: number, pattern?: string | null): boolean {
  if (!pattern) return statusCode >= 200 && statusCode < 300;
  
  const tokens = pattern.split(',').map(s => s.trim());
  for (const token of tokens) {
    if (token.includes('-')) {
      const [start, end] = token.split('-').map(Number);
      if (statusCode >= start && statusCode <= end) return true;
    } else {
      if (statusCode === Number(token)) return true;
    }
  }
  return false;
}

export async function probeHttp(monitor: Monitor): Promise<ProbeResult> {
  let url = monitor.target;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `http://${url}`;
  }

  const timeoutMs = (monitor.timeout || 10) * 1000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const start = performance.now();
  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'UptimeHealth/1.0',
      },
    });
    const latency = Math.round(performance.now() - start);
    clearTimeout(timer);

    const isOkStatus = isStatusAccepted(res.status, monitor.expected_status);
    if (!isOkStatus) {
      return {
        status: 'DOWN',
        responseTime: latency,
        statusCode: res.status,
        message: `HTTP Status ${res.status} not matching expected (${monitor.expected_status || '200-299'})`,
      };
    }

    if (monitor.keyword) {
      const text = await res.text();
      if (!text.includes(monitor.keyword)) {
        return {
          status: 'DOWN',
          responseTime: latency,
          statusCode: res.status,
          message: `Keyword "${monitor.keyword}" not found in response body`,
        };
      }
    }

    return {
      status: 'UP',
      responseTime: latency,
      statusCode: res.status,
      message: 'OK',
    };
  } catch (err: any) {
    clearTimeout(timer);
    const latency = Math.round(performance.now() - start);
    let message = err.message || 'Unknown network error';
    if (err.name === 'AbortError') {
      message = `Request timed out after ${monitor.timeout}s`;
    }
    return {
      status: 'DOWN',
      responseTime: latency,
      message,
    };
  }
}
