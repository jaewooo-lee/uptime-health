import { MonitorService } from './monitor.service.js';
import { probeMonitor } from '../probers/index.js';
import type { Monitor, Heartbeat, ProbeResult } from '../types.js';

type BroadcastCallback = (event: string, data: any) => void;

export class SchedulerService {
  private static timers = new Map<number, NodeJS.Timeout>();
  private static retryCounters = new Map<number, number>();
  private static broadcast: BroadcastCallback | null = null;

  static setBroadcaster(cb: BroadcastCallback) {
    this.broadcast = cb;
  }

  static async startAll() {
    const monitors = MonitorService.getAllMonitors();
    console.log(`[Scheduler] Initializing ${monitors.length} monitors...`);
    for (const monitor of monitors) {
      if (monitor.active) {
        this.scheduleMonitor(monitor);
        // 서버 기동 즉시 첫 프로빙 실행 (약간의 딜레이를 주어 순차적 시작)
        setTimeout(() => this.runProbe(monitor.id), Math.random() * 2000);
      }
    }
  }

  static stopAll() {
    for (const [id, timer] of this.timers.entries()) {
      clearInterval(timer);
    }
    this.timers.clear();
    this.retryCounters.clear();
  }

  static scheduleMonitor(monitor: Monitor) {
    this.stopMonitor(monitor.id);

    if (!monitor.active) return;

    const intervalMs = Math.max(monitor.interval, 5) * 1000;
    const timer = setInterval(() => {
      this.runProbe(monitor.id);
    }, intervalMs);

    this.timers.set(monitor.id, timer);
    console.log(`[Scheduler] Scheduled monitor "${monitor.name}" (${monitor.id}) every ${monitor.interval}s`);
  }

  static stopMonitor(monitorId: number) {
    const timer = this.timers.get(monitorId);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(monitorId);
    }
    this.retryCounters.delete(monitorId);
  }

  static async runProbe(monitorId: number): Promise<ProbeResult | null> {
    const monitor = MonitorService.getMonitorById(monitorId);
    if (!monitor || !monitor.active) {
      this.stopMonitor(monitorId);
      return null;
    }

    const probeResult = await probeMonitor(monitor);
    const prevStatus = monitor.current_status;
    let newStatus: 'UP' | 'DOWN' | 'PENDING' | 'PAUSED' = monitor.current_status;

    let retries = this.retryCounters.get(monitorId) || 0;

    if (probeResult.status === 'DOWN') {
      retries += 1;
      this.retryCounters.set(monitorId, retries);

      if (retries >= monitor.max_retries) {
        newStatus = 'DOWN';
      }
    } else {
      // 성공 시 retry 카운터 초기화 및 UP
      this.retryCounters.set(monitorId, 0);
      newStatus = 'UP';
    }

    // 하트비트 저장
    const heartbeat: Heartbeat = {
      monitor_id: monitorId,
      status: probeResult.status,
      response_time: probeResult.responseTime,
      status_code: probeResult.statusCode,
      message: probeResult.message,
    };
    MonitorService.recordHeartbeat(heartbeat);

    // 상태 변경 감지
    if (newStatus !== prevStatus) {
      console.log(`[Scheduler] Monitor "${monitor.name}" state changed: ${prevStatus} -> ${newStatus}`);
      MonitorService.updateMonitorStatus(monitorId, newStatus);
      if (newStatus === 'UP' || newStatus === 'DOWN') {
        MonitorService.handleIncident(monitorId, newStatus, probeResult.message);
      }

      if (this.broadcast) {
        this.broadcast('monitor:status', {
          monitorId,
          status: newStatus,
          message: probeResult.message,
        });
      }
    }

    // 하트비트 실시간 브로드캐스트
    if (this.broadcast) {
      this.broadcast('heartbeat:new', {
        monitorId,
        heartbeat,
        currentStatus: newStatus,
      });
    }

    return probeResult;
  }
}
