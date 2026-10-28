import React, { useState } from 'react';
import type { Heartbeat } from '../types';

interface LatencyChartProps {
  heartbeats?: Heartbeat[];
}

export const LatencyChart: React.FC<LatencyChartProps> = ({ heartbeats = [] }) => {
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    latency: number;
    time: string;
  } | null>(null);

  // 최근 최대 40개 데이터 사용
  const data = heartbeats.slice(-40);

  if (data.length < 2) {
    return (
      <div className="h-40 flex items-center justify-center text-xs text-slate-500 bg-slate-900/50 rounded-xl border border-slate-800">
        최근 지연 시간 데이터가 충분하지 않습니다 (최소 2회 이상 측정 필요)
      </div>
    );
  }

  const latencies = data.map((d) => d.response_time);
  const maxLatency = Math.max(...latencies, 50); // 최소 상한 50ms
  const minLatency = 0;

  const width = 600;
  const height = 150;
  const padding = { top: 20, right: 15, bottom: 25, left: 45 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1)) * chartWidth;
    const y =
      padding.top +
      chartHeight -
      ((d.response_time - minLatency) / (maxLatency - minLatency)) * chartHeight;
    return { x, y, latency: d.response_time, time: d.timestamp || '', status: d.status };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  // 영역 채우기용 path
  const areaD = `${pathD} L ${points[points.length - 1].x} ${
    padding.top + chartHeight
  } L ${points[0].x} ${padding.top + chartHeight} Z`;

  return (
    <div className="relative w-full overflow-hidden bg-slate-900/70 rounded-xl border border-slate-800 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-300">최근 응답 시간 추이 (Latency RTT)</span>
        <span className="text-xs text-slate-400 font-mono">
          최대 {maxLatency}ms / 평균 {Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)}ms
        </span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-36 overflow-visible"
        onMouseLeave={() => setHoveredPoint(null)}
      >
        <defs>
          <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* 그리드 가이드라인 */}
        {[0, 0.5, 1].map((ratio, idx) => {
          const y = padding.top + chartHeight * ratio;
          const val = Math.round(maxLatency * (1 - ratio));
          return (
            <g key={idx}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#334155"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <text
                x={padding.left - 8}
                y={y + 3}
                fill="#64748b"
                fontSize="10"
                textAnchor="end"
                className="font-mono"
              >
                {val}ms
              </text>
            </g>
          );
        })}

        {/* Area & Line */}
        <path d={areaD} fill="url(#latencyGradient)" />
        <path
          d={pathD}
          fill="none"
          stroke="#10b981"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 데이터 포인트 */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={hoveredPoint?.x === p.x ? 5 : 2.5}
            fill={p.status === 'UP' ? '#34d399' : '#f43f5e'}
            stroke="#0f172a"
            strokeWidth="1.5"
            className="cursor-pointer transition-all duration-150"
            onMouseEnter={() =>
              setHoveredPoint({
                x: p.x,
                y: p.y,
                latency: p.latency,
                time: p.time ? new Date(p.time).toLocaleTimeString() : '',
              })
            }
          />
        ))}
      </svg>

      {hoveredPoint && (
        <div
          className="absolute z-20 px-2.5 py-1 text-xs rounded-md shadow-lg pointer-events-none bg-slate-950 border border-slate-700 text-slate-100 font-mono -translate-x-1/2 -translate-y-full mb-1"
          style={{
            left: `${(hoveredPoint.x / width) * 100}%`,
            top: `${(hoveredPoint.y / height) * 100}%`,
          }}
        >
          <div className="font-semibold text-emerald-400">{hoveredPoint.latency}ms</div>
          {hoveredPoint.time && <div className="text-[10px] text-slate-400">{hoveredPoint.time}</div>}
        </div>
      )}
    </div>
  );
};
