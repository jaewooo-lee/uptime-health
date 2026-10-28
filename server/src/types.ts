export type MonitorType = 'HTTP' | 'TCP' | 'PING';
export type MonitorStatus = 'UP' | 'DOWN' | 'PENDING' | 'PAUSED';

export interface Monitor {
  id: number;
  name: string;
  type: MonitorType;
  target: string;
  port?: number | null;
  interval: number;
  timeout: number;
  max_retries: number;
  expected_status?: string | null;
  keyword?: string | null;
  active: number;
  current_status: MonitorStatus;
  created_at: string;
  updated_at: string;
}

export interface Heartbeat {
  id?: number;
  monitor_id: number;
  status: 'UP' | 'DOWN';
  response_time: number;
  status_code?: number | null;
  message?: string | null;
  timestamp?: string;
}

export interface ProbeResult {
  status: 'UP' | 'DOWN';
  responseTime: number;
  statusCode?: number;
  message?: string;
}
