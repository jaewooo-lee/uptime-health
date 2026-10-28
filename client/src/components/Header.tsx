import React from 'react';
import { Activity, Plus, RefreshCw } from 'lucide-react';
import type { Monitor } from '../types';

interface HeaderProps {
  monitors: Monitor[];
  wsConnected: boolean;
  onAddClick: () => void;
  onRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  monitors,
  wsConnected,
  onAddClick,
  onRefresh,
}) => {
  const upCount = monitors.filter((m) => m.current_status === 'UP').length;
  const downCount = monitors.filter((m) => m.current_status === 'DOWN').length;
  const totalCount = monitors.length;
  const overallUptime =
    totalCount > 0
      ? Math.round(
          (monitors.reduce((acc, m) => acc + (m.uptime24h ?? 100), 0) / totalCount) * 10
        ) / 10
      : 100;

  return (
    <header className="sticky top-0 z-30 bg-[#0f172a]/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
                Uptime-Health
              </h1>
              {/* WS Indicator */}
              <div
                title={wsConnected ? '실시간 WebSocket 연결됨' : 'WebSocket 재연결 중'}
                className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium border bg-slate-900 border-slate-700"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    wsConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
                  }`}
                />
                <span className={wsConnected ? 'text-emerald-400 hidden sm:inline' : 'text-amber-400 hidden sm:inline'}>
                  {wsConnected ? 'LIVE' : 'SYNCING'}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              경량 시스템 Health Check & 상태 모니터링
            </p>
          </div>
        </div>

        {/* System Summary (Desktop & Tablet) */}
        <div className="flex items-center gap-3 sm:gap-6">
          <div className="flex items-center gap-2 sm:gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-slate-300 font-mono">{upCount}</span>
              <span className="text-slate-500 text-[10px]">UP</span>
            </div>
            {downCount > 0 && (
              <div className="flex items-center gap-1.5 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/30 text-rose-400 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span className="font-mono font-bold">{downCount}</span>
                <span className="text-[10px]">DOWN</span>
              </div>
            )}
            <div className="hidden md:flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[11px]">24h 가동률:</span>
              <span className="text-emerald-400 font-mono font-bold">{overallUptime}%</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onRefresh}
              title="새로고침"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700 active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onAddClick}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs sm:text-sm px-3 py-2 rounded-lg transition-all shadow-lg shadow-emerald-950 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">모니터 추가</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
