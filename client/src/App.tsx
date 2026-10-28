import { useState, useMemo } from 'react';
import { useMonitors } from './hooks/useMonitors';
import { Header } from './components/Header';
import { MonitorCard } from './components/MonitorCard';
import { MonitorDetail } from './components/MonitorDetail';
import { AddMonitorModal } from './components/AddMonitorModal';
import { BottomNav } from './components/BottomNav';
import { Search, Plus, ShieldAlert, Loader2 } from 'lucide-react';
import type { Monitor, MonitorType } from './types';

export function App() {
  const {
    monitors,
    loading,
    wsConnected,
    fetchMonitors,
    probeNow,
    createMonitor,
    deleteMonitor,
  } = useMonitors();

  const [selectedMonitorId, setSelectedMonitorId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UP' | 'DOWN'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | MonitorType>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'list' | 'detail' | 'stats'>('list');

  // 필터링된 모니터 목록
  const filteredMonitors = useMemo(() => {
    return monitors.filter((m) => {
      const matchSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.target.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus =
        statusFilter === 'ALL' || m.current_status === statusFilter;
      const matchType = typeFilter === 'ALL' || m.type === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [monitors, searchQuery, statusFilter, typeFilter]);

  // 선택된 모니터 객체
  const selectedMonitor = useMemo(() => {
    if (selectedMonitorId) {
      const found = monitors.find((m) => m.id === selectedMonitorId);
      if (found) return found;
    }
    return monitors.length > 0 ? monitors[0] : null;
  }, [monitors, selectedMonitorId]);

  const handleSelectMonitor = (monitor: Monitor) => {
    setSelectedMonitorId(monitor.id);
    setMobileTab('detail'); // 모바일에서 선택 시 상세 뷰로 자동 전환
  };

  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white pb-16 lg:pb-0">
      {/* Header */}
      <Header
        monitors={monitors}
        wsConnected={wsConnected}
        onAddClick={() => setIsAddModalOpen(true)}
        onRefresh={fetchMonitors}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 flex flex-col">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
            <p className="text-sm">시스템 모니터링 데이터를 불러오는 중...</p>
          </div>
        ) : monitors.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 mb-4">
              <ShieldAlert className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <h3 className="text-base font-bold text-white mb-1">등록된 모니터가 없습니다</h3>
              <p className="text-xs text-slate-400 max-w-sm mb-4">
                HTTP 웹사이트, TCP 데이터베이스 포트, ICMP Ping 주소를 등록하여 실시간 헬스체크를 시작하세요.
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-all shadow-lg shadow-emerald-950 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                첫 모니터 추가하기
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-start">
            {/* 좌측 사이드바: 모니터 목록 (모바일에서는 tab이 'list'일 때만 표시) */}
            <div
              className={`lg:col-span-5 xl:col-span-4 flex flex-col gap-3 ${
                mobileTab === 'detail' ? 'hidden lg:flex' : 'flex'
              }`}
            >
              {/* 검색 및 필터 바 */}
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="모니터 이름 또는 주소 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                {/* 상태 필터 탭 */}
                <div className="flex items-center justify-between gap-1 text-[11px] font-semibold">
                  <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700/80">
                    {(['ALL', 'UP', 'DOWN'] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                          statusFilter === s
                            ? 'bg-slate-700 text-white shadow-xs'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  {/* 프로토콜 타입 필터 */}
                  <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700/80">
                    {(['ALL', 'HTTP', 'TCP', 'PING'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTypeFilter(t)}
                        className={`px-1.5 py-1 rounded-md transition-all cursor-pointer ${
                          typeFilter === t
                            ? 'bg-slate-700 text-white shadow-xs'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 모니터 카드 리스트 */}
              <div className="space-y-2.5 overflow-y-auto max-h-[calc(100vh-230px)] pr-0.5">
                {filteredMonitors.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800/60">
                    검색 조건에 맞는 모니터가 없습니다
                  </div>
                ) : (
                  filteredMonitors.map((m) => (
                    <MonitorCard
                      key={m.id}
                      monitor={m}
                      isSelected={selectedMonitor?.id === m.id}
                      onSelect={handleSelectMonitor}
                    />
                  ))
                )}
              </div>
            </div>

            {/* 우측 메인 영역: 선택된 모니터 상세 (모바일에서는 tab이 'detail'일 때만 표시) */}
            <div
              className={`lg:col-span-7 xl:col-span-8 bg-slate-900/40 p-4 sm:p-6 rounded-2xl border border-slate-800/80 ${
                mobileTab === 'list' ? 'hidden lg:block' : 'block'
              }`}
            >
              {selectedMonitor ? (
                <MonitorDetail
                  monitor={selectedMonitor}
                  onBack={() => setMobileTab('list')}
                  onProbeNow={probeNow}
                  onDelete={deleteMonitor}
                />
              ) : (
                <div className="text-center py-20 text-xs text-slate-500">
                  모니터를 선택하여 상세 상태를 확인하세요
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* 모바일 하단 네비게이션 */}
      <BottomNav
        currentTab={mobileTab}
        onTabChange={(tab) => setMobileTab(tab)}
        onAddClick={() => setIsAddModalOpen(true)}
        hasSelectedMonitor={!!selectedMonitor}
      />

      {/* 새 모니터 추가 모달 */}
      <AddMonitorModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={createMonitor}
      />
    </div>
  );
}

export default App;
