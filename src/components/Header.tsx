import React from 'react';
import { BarChart3, Map, Table, UploadCloud, FileText, Settings, Sparkles, Download } from 'lucide-react';

interface HeaderProps {
  activeTab: 'input' | 'grid' | 'chart' | 'map' | 'exam';
  setActiveTab: (tab: 'input' | 'grid' | 'chart' | 'map' | 'exam') => void;
  onOpenSettings: () => void;
  hasData: boolean;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onOpenSettings, hasData }) => {
  return (
    <header className="bg-slate-900 text-white shadow-xl sticky top-0 z-40 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-500 p-2.5 rounded-xl shadow-lg ring-2 ring-blue-400/30">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight bg-gradient-to-r from-white via-blue-100 to-indigo-200 bg-clip-text text-transparent">
                  통계변환 스튜디오
                </span>
                <span className="text-xs bg-blue-500/20 text-blue-300 font-medium px-2 py-0.5 rounded-full border border-blue-400/30">
                  제작: 황의천T
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                중·고등학교 사회·지리 교사 전용 스마트 통계·도표·지도 변환 및 출제 솔루션
              </p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setActiveTab('input')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'input'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              1. 다중 입력 (PDF/이미지/카메라)
            </button>

            <button
              onClick={() => setActiveTab('grid')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'grid'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Table className="w-4 h-4" />
              2. 데이터 편집 및 조합
              {hasData && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>}
            </button>

            <button
              onClick={() => setActiveTab('chart')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'chart'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              3. 도표(Chart) 스튜디오
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'map'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Map className="w-4 h-4" />
              4. 통계지도(Map) 스튜디오
            </button>

            <button
              onClick={() => setActiveTab('exam')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'exam'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <FileText className="w-4 h-4" />
              5. 시험문항 출제
            </button>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition shadow-xs"
              title="API Key 및 설정"
            >
              <Settings className="w-4 h-4 text-blue-400" />
              <span className="hidden sm:inline">설정</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden overflow-x-auto py-2.5 space-x-1.5 border-t border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('input')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium flex items-center gap-1 ${
              activeTab === 'input' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" /> 1.입력
          </button>
          <button
            onClick={() => setActiveTab('grid')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium flex items-center gap-1 ${
              activeTab === 'grid' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
            }`}
          >
            <Table className="w-3.5 h-3.5" /> 2.편집
          </button>
          <button
            onClick={() => setActiveTab('chart')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium flex items-center gap-1 ${
              activeTab === 'chart' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" /> 3.도표
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium flex items-center gap-1 ${
              activeTab === 'map' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
            }`}
          >
            <Map className="w-3.5 h-3.5" /> 4.지도
          </button>
          <button
            onClick={() => setActiveTab('exam')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium flex items-center gap-1 ${
              activeTab === 'exam' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> 5.출제
          </button>
        </div>
      </div>
    </header>
  );
};
