import React, { useState } from 'react';
import type { Heartbeat } from '../types';

interface HeartbeatBarProps {
  heartbeats?: Heartbeat[];
  maxCount?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const HeartbeatBar: React.FC<HeartbeatBarProps> = ({
  heartbeats = [],
  maxCount = 60,
  className = '',
  size = 'md',
}) => {
  const [activeTooltip, setActiveTooltip] = useState<{
    heartbeat: Heartbeat;
    index: number;
    x: number;
    y: number;
  } | null>(null);

  // 최근 maxCount개 채우기 (데이터가 부족하면 빈 슬롯으로 채움)
  const sliced = heartbeats.slice(-maxCount);
  const emptySlotsCount = Math.max(0, maxCount - sliced.length);
  const slots: (Heartbeat | null)[] = [
    ...Array(emptySlotsCount).fill(null),
    ...sliced,
  ];

  const barHeight = size === 'sm' ? 'h-6' : size === 'lg' ? 'h-9' : 'h-7';

  const handlePointer = (
    e: React.SyntheticEvent<HTMLDivElement>,
    hb: Heartbeat | null,
    idx: number
  ) => {
    if (!hb) {
      setActiveTooltip(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setActiveTooltip({
      heartbeat: hb,
      index: idx,
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  };

  return (
    <div className={`relative flex items-center gap-1 ${className}`}>
      {slots.map((hb, idx) => {
        let colorClass = 'bg-slate-800 border-slate-700/50';
        if (hb) {
          if (hb.status === 'UP') {
            colorClass = 'bg-emerald-500 hover:bg-emerald-400 border-emerald-400/40 shadow-emerald-500/20';
          } else {
            colorClass = 'bg-rose-500 hover:bg-rose-400 border-rose-400/40 shadow-rose-500/20 animate-pulse';
          }
        }

        return (
          <div
            key={idx}
            onPointerEnter={(e) => handlePointer(e, hb, idx)}
            onPointerLeave={() => setActiveTooltip(null)}
            onClick={(e) => handlePointer(e, hb, idx)}
            className={`flex-1 min-w-[3px] max-w-[8px] ${barHeight} rounded-sm transition-all duration-150 cursor-pointer ${colorClass}`}
          />
        );
      })}

      {/* 터치 및 호버 툴팁 */}
      {activeTooltip && (
        <div
          className="fixed z-50 px-3 py-1.5 text-xs rounded-lg shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 bg-slate-900 border border-slate-700 text-slate-100 whitespace-nowrap backdrop-blur-md"
          style={{
            left: `${activeTooltip.x}px`,
            top: `${activeTooltip.y - 8}px`,
          }}
        >
          <div className="flex items-center gap-2 font-medium">
            <span
              className={`w-2 h-2 rounded-full ${
                activeTooltip.heartbeat.status === 'UP' ? 'bg-emerald-400' : 'bg-rose-400'
              }`}
            />
            <span>{activeTooltip.heartbeat.status}</span>
            <span className="text-slate-400">•</span>
            <span className="text-emerald-300 font-mono">
              {activeTooltip.heartbeat.response_time}ms
            </span>
            {activeTooltip.heartbeat.status_code && (
              <>
                <span className="text-slate-400">•</span>
                <span className="text-slate-300">HTTP {activeTooltip.heartbeat.status_code}</span>
              </>
            )}
          </div>
          {activeTooltip.heartbeat.message && (
            <div className="text-[11px] text-slate-400 mt-0.5 max-w-[200px] truncate">
              {activeTooltip.heartbeat.message}
            </div>
          )}
          {activeTooltip.heartbeat.timestamp && (
            <div className="text-[10px] text-slate-500 mt-0.5">
              {new Date(activeTooltip.heartbeat.timestamp).toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
