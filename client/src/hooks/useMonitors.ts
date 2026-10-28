import { useState, useEffect, useCallback, useRef } from 'react';
import type { Monitor, Heartbeat } from '../types';

export function useMonitors() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<any>(null);

  const fetchMonitors = useCallback(async () => {
    try {
      const res = await fetch('/api/monitors');
      if (res.ok) {
        const data: Monitor[] = await res.json();
        setMonitors(data);
      }
    } catch (err) {
      console.error('Failed to fetch monitors', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMonitors();
  }, [fetchMonitors]);

  // WebSocket 실시간 연동
  useEffect(() => {
    let ws: WebSocket | null = null;
    let isSubscribed = true;

    function connect() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        if (!isSubscribed) return;
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        if (!isSubscribed) return;
        try {
          const payload = JSON.parse(event.data);
          
          if (payload.type === 'heartbeat:new') {
            const { monitorId, heartbeat, currentStatus } = payload.data as {
              monitorId: number;
              heartbeat: Heartbeat;
              currentStatus: Monitor['current_status'];
            };

            setMonitors((prev) =>
              prev.map((m) => {
                if (m.id !== monitorId) return m;

                const updatedHeartbeats = [...(m.heartbeats || []), heartbeat].slice(-60);
                const total = updatedHeartbeats.length;
                const upCount = updatedHeartbeats.filter((h) => h.status === 'UP').length;
                const uptime24h = total > 0 ? Math.round((upCount / total) * 10000) / 100 : 100;
                
                const upHeartbeats = updatedHeartbeats.filter((h) => h.status === 'UP');
                const avgLatency = upHeartbeats.length > 0 
                  ? Math.round(upHeartbeats.reduce((acc, h) => acc + h.response_time, 0) / upHeartbeats.length)
                  : m.avgLatency;

                return {
                  ...m,
                  current_status: currentStatus,
                  heartbeats: updatedHeartbeats,
                  uptime24h,
                  avgLatency,
                };
              })
            );
          } else if (payload.type === 'monitor:status') {
            const { monitorId, status } = payload.data;
            setMonitors((prev) =>
              prev.map((m) => (m.id === monitorId ? { ...m, current_status: status } : m))
            );
          }
        } catch (err) {
          console.error('WS parse error', err);
        }
      };

      ws.onclose = () => {
        if (!isSubscribed) return;
        setWsConnected(false);
        // 3초 후 재연결 시도
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws?.close();
      };
    }

    connect();

    return () => {
      isSubscribed = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (ws) ws.close();
    };
  }, []);

  const probeNow = async (id: number) => {
    try {
      const res = await fetch(`/api/monitors/${id}/probe`, { method: 'POST' });
      return await res.json();
    } catch (err) {
      console.error('Probe failed', err);
      return null;
    }
  };

  const createMonitor = async (data: any) => {
    const res = await fetch('/api/monitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create monitor');
    }
    await fetchMonitors();
  };

  const deleteMonitor = async (id: number) => {
    const res = await fetch(`/api/monitors/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete monitor');
    setMonitors((prev) => prev.filter((m) => m.id !== id));
  };

  return {
    monitors,
    loading,
    wsConnected,
    fetchMonitors,
    probeNow,
    createMonitor,
    deleteMonitor,
  };
}
