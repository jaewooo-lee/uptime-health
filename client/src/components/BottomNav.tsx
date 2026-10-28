import React from 'react';
import { LayoutGrid, PlusCircle, Activity } from 'lucide-react';

interface BottomNavProps {
  currentTab: 'list' | 'detail' | 'stats';
  onTabChange: (tab: 'list' | 'detail' | 'stats') => void;
  onAddClick: () => void;
  hasSelectedMonitor: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
  onAddClick,
  hasSelectedMonitor,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0f172a]/95 backdrop-blur-lg border-t border-slate-800 px-6 py-2 flex items-center justify-around lg:hidden safe-area-bottom">
      <button
        onClick={() => onTabChange('list')}
        className={`flex flex-col items-center gap-1 py-1 px-3 text-xs font-medium transition-colors cursor-pointer ${
          currentTab === 'list' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <LayoutGrid className="w-5 h-5" />
        <span>목록</span>
      </button>

      {/* 중앙 추가 버튼 (플로팅 강조 효과) */}
      <button
        onClick={onAddClick}
        className="flex flex-col items-center gap-1 -mt-5 group cursor-pointer"
      >
        <div className="w-11 h-11 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center shadow-lg shadow-emerald-950 transition-transform active:scale-90">
          <PlusCircle className="w-6 h-6" />
        </div>
        <span className="text-[10px] font-medium text-slate-300">추가</span>
      </button>

      <button
        onClick={() => {
          if (hasSelectedMonitor) {
            onTabChange('detail');
          } else {
            onTabChange('list');
          }
        }}
        className={`flex flex-col items-center gap-1 py-1 px-3 text-xs font-medium transition-colors cursor-pointer ${
          currentTab === 'detail' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Activity className="w-5 h-5" />
        <span>상세</span>
      </button>
    </nav>
  );
};
