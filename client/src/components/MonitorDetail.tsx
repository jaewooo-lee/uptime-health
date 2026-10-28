import React, { useState } from 'react';
import {
  Play,
  Trash2,
  ArrowLeft,
  Clock,
  ShieldCheck,
  Zap,
  RotateCcw,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { HeartbeatBar } from './HeartbeatBar';
import { LatencyChart } from './LatencyChart';
import type { Monitor } from '../types';

interface MonitorDetailProps {
  monitor: Monitor;
  onBack?: () => void;
  onProbeNow: (id: number) => Promise<any>;
  onDelete: (id: number) => Promise<any>;
}

export const MonitorDetail: React.FC<MonitorDetailProps> = ({
  monitor,
  onBack,
  onProbeNow,
  onDelete,
}) => {
  const [probing, setProbing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [probeResultMsg, setProbeResultMsg] = useState<string | null>(null);

  const isUp = monitor.current_status === 'UP';

  const handleProbe = async () => {
    setProbing(true);
    setProbeResultMsg(null);
    try {
      const res = await onProbeNow(monitor.id);
      if (res) {
        setProbeResultMsg(`점검 완료: ${res.status} (${res.responseTime}ms)`);
        setTimeout(() => setProbeResultMsg(null), 4000);
      }
    } finally {
      setProbing(false);
    }
  };

  const handleDelete = async () => {
    if (confirm(`"${monitor.name}" 모니터를 정말 삭제하시겠습니까?`)) {
      setDeleting(true);
      try {
        await onDelete(monitor.id);
        if (onBack) onBack();
      } finally {
        setDeleting(false);
      }
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Bar / Navigation */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="lg:hidden p-2 -ml-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {monitor.type}
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {monitor.name}
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {monitor.target}
              {monitor.port ? `:${monitor.port}` : ''}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleProbe}
            disabled={probing}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Play className={`w-3.5 h-3.5 ${probing ? 'animate-spin' : ''}`} />
            <span>{probing ? '점검 중...' : '즉시 점검'}</span>
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 sm:p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg border border-rose-500/20 transition-all hover:border-rose-500/40 active:scale-95 cursor-pointer"
            title="모니터 삭제"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {probeResultMsg && (
        <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{probeResultMsg}</span>
        </div>
      )}

      {/* Status & Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>현재 상태</span>
          </div>
          <div
            className={`text-lg sm:text-xl font-bold font-mono flex items-center gap-1.5 ${
              isUp ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${isUp ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            {monitor.current_status}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <Zap className="w-3.5 h-3.5" />
            <span>24h 가동률</span>
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-emerald-400">
            {monitor.uptime24h ?? 100}%
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span>평균 지연시간</span>
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-slate-200">
            {monitor.avgLatency ? `${monitor.avgLatency}ms` : '--'}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>점검 주기 / 타임아웃</span>
          </div>
          <div className="text-sm sm:text-base font-bold font-mono text-slate-300">
            {monitor.interval}초 / {monitor.timeout}초
          </div>
        </div>
      </div>

      {/* Heartbeat Bar (Large / Responsive) */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-slate-300">
            최근 60회 하트비트 이력 (Uptime Kuma 스타일)
          </span>
          <span className="text-[11px] font-mono">가장 최근 점검 $\rightarrow$</span>
        </div>
        <HeartbeatBar heartbeats={monitor.heartbeats || []} maxCount={60} size="md" />
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <span>과거 점검 내역</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" /> UP
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-rose-500 inline-block" /> DOWN
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-slate-800 inline-block" /> 대기
            </span>
          </div>
        </div>
      </div>

      {/* Latency Line Chart */}
      <LatencyChart heartbeats={monitor.heartbeats || []} />

      {/* Detailed Probing Logs Table */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
        <h4 className="text-xs font-semibold text-slate-300">최근 프로빙 로그 내역</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800">
                <th className="pb-2 font-medium">상태</th>
                <th className="pb-2 font-medium">응답시간</th>
                <th className="pb-2 font-medium">메시지</th>
                <th className="pb-2 font-medium text-right">점검 일시</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {(monitor.heartbeats || []).slice(-8).reverse().map((hb, i) => (
                <tr key={i} className="hover:bg-slate-800/30">
                  <td className="py-2">
                    <span
                      className={`inline-flex items-center gap-1 font-bold text-[10px] px-1.5 py-0.5 rounded ${
                        hb.status === 'UP'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      {hb.status === 'UP' ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      {hb.status}
                    </span>
                  </td>
                  <td className="py-2 text-slate-300">{hb.response_time}ms</td>
                  <td className="py-2 text-slate-400 font-sans max-w-[200px] truncate">
                    {hb.message || 'OK'}
                  </td>
                  <td className="py-2 text-right text-slate-500 text-[11px]">
                    {hb.timestamp ? new Date(hb.timestamp).toLocaleTimeString() : '--'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
