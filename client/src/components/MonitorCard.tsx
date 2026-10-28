import React from 'react';
import { Globe, Server, Radio } from 'lucide-react';
import { HeartbeatBar } from './HeartbeatBar';
import type { Monitor } from '../types';

interface MonitorCardProps {
  monitor: Monitor;
  isSelected?: boolean;
  onSelect: (monitor: Monitor) => void;
}

export const MonitorCard: React.FC<MonitorCardProps> = ({
  monitor,
  isSelected = false,
  onSelect,
}) => {
  const getProtocolBadge = (type: Monitor['type']) => {
    switch (type) {
      case 'HTTP':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Globe className="w-2.5 h-2.5" />
            HTTP
          </span>
        );
      case 'TCP':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Server className="w-2.5 h-2.5" />
            TCP
          </span>
        );
      case 'PING':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Radio className="w-2.5 h-2.5" />
            PING
          </span>
        );
    }
  };

  const isUp = monitor.current_status === 'UP';

  return (
    <div
      onClick={() => onSelect(monitor)}
      className={`p-3.5 sm:p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
        isSelected
          ? 'bg-slate-800/90 border-emerald-500/60 shadow-lg shadow-emerald-950/20'
          : 'bg-slate-900/60 hover:bg-slate-800/60 border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {getProtocolBadge(monitor.type)}
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isUp
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30 animate-pulse'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${isUp ? 'bg-emerald-400' : 'bg-rose-400'}`}
              />
              {monitor.current_status}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-white truncate">{monitor.name}</h3>
          <p className="text-xs text-slate-400 truncate font-mono mt-0.5">
            {monitor.target}
            {monitor.port ? `:${monitor.port}` : ''}
          </p>
        </div>

        {/* Uptime & Latency Metric */}
        <div className="text-right shrink-0">
          <div className="text-xs font-mono font-bold text-emerald-400">
            {monitor.uptime24h ?? 100}%
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-0.5">
            {monitor.avgLatency !== undefined ? `${monitor.avgLatency}ms` : '--'}
          </div>
        </div>
      </div>

      {/* Heartbeat Bar (모바일에서는 간결한 30개, 데스크톱에서는 35~40개) */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80">
        <HeartbeatBar
          heartbeats={monitor.heartbeats || []}
          maxCount={32}
          size="sm"
        />
      </div>
    </div>
  );
};
