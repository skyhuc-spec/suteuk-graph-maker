import React, { useState } from 'react';
import { Table, ArrowLeftRight, EyeOff, Plus, Trash2, RefreshCw, Sparkles, Check, FileSpreadsheet, ShieldCheck, Globe } from 'lucide-react';
import { StatDataset, RegionMapping } from '../types';
import * as XLSX from 'xlsx';
import { RegionStandardizationModal } from './RegionStandardizationModal';

interface DataGridSectionProps {
  dataset: StatDataset | null;
  onUpdateDataset: (updated: StatDataset) => void;
  onGoToChart: () => void;
}

export const DataGridSection: React.FC<DataGridSectionProps> = ({ dataset, onUpdateDataset, onGoToChart }) => {
  if (!dataset) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Table className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">등록된 통계 데이터가 없습니다</h3>
        <p className="text-sm text-slate-500 mb-6">
          1번 '다중 입력' 탭에서 교과서 PDF나 이미지를 분석하거나 프리셋 샘플을 먼저 불러와주세요.
        </p>
      </div>
    );
  }

  const [showAddModal, setShowAddModal] = useState(false);
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [newSeriesName, setNewSeriesName] = useState('');
  const [newSeriesDefaultVal, setNewSeriesDefaultVal] = useState('0');

  const handleApplyStandardization = (updatedCategories: string[], mappings: Record<string, RegionMapping>) => {
    onUpdateDataset({
      ...dataset,
      categories: updatedCategories,
      regionMappings: mappings,
    });
  };

  // Handle cell value edit
  const handleCellChange = (seriesIndex: number, catIndex: number, value: string) => {
    const numValue = value === '' || value === '미확인(공식 데이터 없음)' ? null : Number(value);
    const updatedSeries = [...dataset.series];
    updatedSeries[seriesIndex] = {
      ...updatedSeries[seriesIndex],
      data: updatedSeries[seriesIndex].data.map((val, idx) => (idx === catIndex ? numValue : val))
    };
    onUpdateDataset({ ...dataset, series: updatedSeries });
  };

  // Handle category name edit
  const handleCategoryChange = (catIndex: number, newName: string) => {
    const updatedCategories = [...dataset.categories];
    updatedCategories[catIndex] = newName;
    onUpdateDataset({ ...dataset, categories: updatedCategories });
  };

  // Handle series name edit
  const handleSeriesNameChange = (seriesIndex: number, newName: string) => {
    const updatedSeries = [...dataset.series];
    updatedSeries[seriesIndex] = {
      ...updatedSeries[seriesIndex],
      name: newName
    };
    onUpdateDataset({ ...dataset, series: updatedSeries });
  };

  // Axis Transpose (Rows <-> Columns)
  const handleTranspose = () => {
    const isTransposed = !dataset.isTransposed;
    onUpdateDataset({ ...dataset, isTransposed });
  };

  // Region Selective Removal toggle
  const toggleExcludeRegion = (category: string) => {
    const excluded = dataset.excludedRegions || [];
    const newExcluded = excluded.includes(category)
      ? excluded.filter(r => r !== category)
      : [...excluded, category];
    onUpdateDataset({ ...dataset, excludedRegions: newExcluded });
  };

  const restoreAllRegions = () => {
    onUpdateDataset({ ...dataset, excludedRegions: [] });
  };

  // Add Multi-Statistic Combination column
  const handleAddSeries = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSeriesName.trim()) return;
    const defaultNum = Number(newSeriesDefaultVal) || 0;
    const newData = new Array(dataset.categories.length).fill(defaultNum);
    const updatedSeries = [...dataset.series, { name: newSeriesName.trim(), data: newData }];
    onUpdateDataset({ ...dataset, series: updatedSeries });
    setNewSeriesName('');
    setShowAddModal(false);
  };

  // Delete Series
  const handleDeleteSeries = (seriesIndex: number) => {
    if (dataset.series.length <= 1) {
      alert('최소 1개의 통계 시리즈는 유지해야 합니다.');
      return;
    }
    const updatedSeries = dataset.series.filter((_, idx) => idx !== seriesIndex);
    onUpdateDataset({ ...dataset, series: updatedSeries });
  };

  // Export to Excel / CSV
  const exportToExcel = () => {
    const wsData: any[][] = [
      [dataset.title],
      [`단위: ${dataset.unit} | 출처: ${dataset.originalSource}`],
      [],
      ['지역/항목', ...dataset.series.map(s => s.name)]
    ];

    dataset.categories.forEach((cat, cIdx) => {
      const row = [cat, ...dataset.series.map(s => s.data[cIdx] ?? '미확인')];
      wsData.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '통계데이터');
    XLSX.writeFile(wb, `${dataset.title.replace(/[\s\[\]]/g, '_')}_통계.xlsx`);
  };

  const excluded = dataset.excludedRegions || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header Info Bar */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full">
              단위: {dataset.unit}
            </span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              {dataset.sourceSubstitution}
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900">{dataset.title}</h2>
          <p className="text-xs text-slate-500 mt-1">원출처: {dataset.originalSource}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleTranspose}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              dataset.isTransposed 
                ? 'bg-amber-600 text-white shadow-sm' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
            }`}
            title="행과 열(X축 ↔ Y축)을 즉시 교체합니다"
          >
            <ArrowLeftRight className="w-4 h-4" />
            축 전환 (Transpose)
          </button>

          <button
            onClick={() => setShowRegionModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
            title="교과서식 지역명을 통계청 KOSIS 및 ISO 공식 표준명으로 자동 매칭 및 수동 교정"
          >
            <Globe className="w-4 h-4" />
            지역 표준화 사전 (KOSIS/ISO)
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            통계 조합 추가
          </button>

          <button
            onClick={exportToExcel}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            엑셀(Excel) 내보내기
          </button>

          <button
            onClick={onGoToChart}
            className="px-5 py-2 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            도표·지도 변환으로 이동
          </button>
        </div>
      </div>

      {/* Region Selective Removal Control Panel */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-blue-600" />
            지역·항목별 선택적 제외 및 복원 (체크 해제 시 도표·지도에서 즉시 제외됨)
          </h3>
          {excluded.length > 0 && (
            <button
              onClick={restoreAllRegions}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              제외된 지역 모두 복원 ({excluded.length}개 제외됨)
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {dataset.categories.map((cat) => {
            const isExcluded = excluded.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleExcludeRegion(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 border ${
                  isExcluded
                    ? 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                    : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 shadow-2xs'
                }`}
              >
                <Check className={`w-3.5 h-3.5 ${isExcluded ? 'opacity-30' : 'text-blue-600'}`} />
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Excel-like Data Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-900 text-white text-xs font-bold">
                <th className="p-4 border-b border-slate-800">지역 / 항목명</th>
                {dataset.series.map((series, sIdx) => (
                  <th key={sIdx} className="p-4 border-b border-slate-800">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={series.name}
                        onChange={(e) => handleSeriesNameChange(sIdx, e.target.value)}
                        className="bg-slate-800 text-white px-2 py-1 rounded text-xs border border-slate-700 focus:border-blue-400 outline-none w-full"
                      />
                      {dataset.series.length > 1 && (
                        <button
                          onClick={() => handleDeleteSeries(sIdx)}
                          className="text-slate-400 hover:text-rose-400 p-1 rounded transition"
                          title="시리즈 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {dataset.categories.map((cat, cIdx) => {
                const isExcluded = excluded.includes(cat);
                return (
                  <tr key={cat} className={`hover:bg-slate-50/80 transition ${isExcluded ? 'opacity-40 bg-slate-50' : ''}`}>
                    <td className="p-4 font-semibold text-slate-800 bg-slate-50/50 flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={cat}
                        onChange={(e) => handleCategoryChange(cIdx, e.target.value)}
                        className="bg-transparent text-slate-800 font-semibold px-2 py-1 rounded hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 outline-none w-full"
                      />
                      {isExcluded && <span className="text-[10px] text-rose-500 font-bold whitespace-hidden sm:whitespace-normal">제외됨</span>}
                    </td>
                    {dataset.series.map((series, sIdx) => {
                      const val = series.data[cIdx];
                      return (
                        <td key={sIdx} className="p-4">
                          <input
                            type="number"
                            step="any"
                            value={val !== null && val !== undefined ? val : ''}
                            placeholder="미확인"
                            onChange={(e) => handleCellChange(sIdx, cIdx, e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs bg-white outline-none transition font-mono"
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Series Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base">통계 조합 / 새 지표 추가</h3>
              <button onClick={() => setShowAddModal(false)} className="text-white/80 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleAddSeries} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">새 지표 이름 (예: 2025년 전망, 증가율 등)</label>
                <input
                  type="text"
                  required
                  value={newSeriesName}
                  onChange={(e) => setNewSeriesName(e.target.value)}
                  placeholder="지표명 입력"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">초기 기본값</label>
                <input
                  type="number"
                  step="any"
                  value={newSeriesDefaultVal}
                  onChange={(e) => setNewSeriesDefaultVal(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
                >
                  추가하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Region Standardization Modal */}
      {showRegionModal && (
        <RegionStandardizationModal
          isOpen={showRegionModal}
          onClose={() => setShowRegionModal(false)}
          dataset={dataset}
          onApplyStandardization={handleApplyStandardization}
        />
      )}
    </div>
  );
};
