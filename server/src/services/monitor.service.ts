import { db } from '../db/index.js';
import type { Monitor, Heartbeat, MonitorStatus } from '../types.js';

export class MonitorService {
  static getAllMonitors(): Monitor[] {
    const stmt = db.prepare('SELECT * FROM monitors ORDER BY id DESC');
    return stmt.all() as unknown as Monitor[];
  }

  static getMonitorById(id: number): Monitor | null {
    const stmt = db.prepare('SELECT * FROM monitors WHERE id = ?');
    const result = stmt.get(id);
    return (result as unknown as Monitor) || null;
  }

  static createMonitor(data: {
    name: string;
    type: 'HTTP' | 'TCP' | 'PING';
    target: string;
    port?: number | null;
    interval?: number;
    timeout?: number;
    max_retries?: number;
    expected_status?: string | null;
    keyword?: string | null;
  }): Monitor {
    const stmt = db.prepare(`
      INSERT INTO monitors (name, type, target, port, interval, timeout, max_retries, expected_status, keyword, active, current_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'PENDING')
    `);

    const result = stmt.run(
      data.name,
      data.type,
      data.target,
      data.port || null,
      data.interval || 60,
      data.timeout || 10,
      data.max_retries || 1,
      data.expected_status || '200-299',
      data.keyword || null
    );

    const createdId = Number(result.lastInsertRowid);
    return this.getMonitorById(createdId)!;
  }

  static updateMonitor(id: number, data: Partial<Monitor>): Monitor | null {
    const current = this.getMonitorById(id);
    if (!current) return null;

    const updated = { ...current, ...data };
    const stmt = db.prepare(`
      UPDATE monitors
      SET name = ?, type = ?, target = ?, port = ?, interval = ?, timeout = ?,
          max_retries = ?, expected_status = ?, keyword = ?, active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      updated.name,
      updated.type,
      updated.target,
      updated.port ?? null,
      updated.interval,
      updated.timeout,
      updated.max_retries,
      updated.expected_status ?? null,
      updated.keyword ?? null,
      updated.active,
      id
    );

    return this.getMonitorById(id);
  }

  static updateMonitorStatus(id: number, status: MonitorStatus) {
    const stmt = db.prepare(`
      UPDATE monitors SET current_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `);
    stmt.run(status, id);
  }

  static deleteMonitor(id: number): boolean {
    const stmt = db.prepare('DELETE FROM monitors WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  static recordHeartbeat(heartbeat: Heartbeat) {
    const stmt = db.prepare(`
      INSERT INTO heartbeats (monitor_id, status, response_time, status_code, message)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(
      heartbeat.monitor_id,
      heartbeat.status,
      heartbeat.response_time,
      heartbeat.status_code ?? null,
      heartbeat.message ?? null
    );

    // Keep database compact: retain only last 2000 heartbeats per monitor
    db.prepare(`
      DELETE FROM heartbeats 
      WHERE monitor_id = ? AND id NOT IN (
        SELECT id FROM heartbeats WHERE monitor_id = ? ORDER BY timestamp DESC LIMIT 2000
      )
    `).run(heartbeat.monitor_id, heartbeat.monitor_id);
  }

  static getRecentHeartbeats(monitorId: number, limit: number = 60): Heartbeat[] {
    const stmt = db.prepare(`
      SELECT * FROM heartbeats
      WHERE monitor_id = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `);
    const results = stmt.all(monitorId, limit) as unknown as Heartbeat[];
    return results.reverse(); // 시간 오름차순으로 반환
  }

  static getMonitorStats(monitorId: number) {
    const heartbeats = this.getRecentHeartbeats(monitorId, 60);
    
    // 24시간 가동률 계산 (최근 24시간 기준)
    const uptimeStmt = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'UP' THEN 1 ELSE 0 END) as up_count,
        AVG(CASE WHEN status = 'UP' THEN response_time ELSE NULL END) as avg_latency
      FROM heartbeats
      WHERE monitor_id = ? AND datetime(timestamp) >= datetime('now', '-24 hours')
    `);
    const stats: any = uptimeStmt.get(monitorId) || { total: 0, up_count: 0, avg_latency: 0 };
    const uptimePercentage = stats.total > 0 ? (stats.up_count / stats.total) * 100 : 100;

    return {
      heartbeats,
      uptime24h: Math.round(uptimePercentage * 100) / 100,
      avgLatency: Math.round(stats.avg_latency || 0),
    };
  }

  static handleIncident(monitorId: number, newStatus: 'UP' | 'DOWN', cause?: string) {
    if (newStatus === 'DOWN') {
      // 진행 중인 미해결 인시던트가 있는지 확인
      const activeIncident = db.prepare(`
        SELECT * FROM incidents WHERE monitor_id = ? AND status = 'DOWN'
      `).get(monitorId);

      if (!activeIncident) {
        db.prepare(`
          INSERT INTO incidents (monitor_id, status, cause)
          VALUES (?, 'DOWN', ?)
        `).run(monitorId, cause || 'Health check failed');
      }
    } else if (newStatus === 'UP') {
      // 복구 처리
      const activeIncident: any = db.prepare(`
        SELECT * FROM incidents WHERE monitor_id = ? AND status = 'DOWN' ORDER BY id DESC LIMIT 1
      `).get(monitorId);

      if (activeIncident) {
        db.prepare(`
          UPDATE incidents
          SET status = 'RESOLVED',
              resolved_at = CURRENT_TIMESTAMP,
              duration = ROUND((strftime('%s', 'now') - strftime('%s', started_at)))
          WHERE id = ?
        `).run(activeIncident.id);
      }
    }
  }
}
