import React, { useState } from 'react';
import { X, Globe, MapPin, Check, AlertCircle, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';
import { StatDataset, RegionMapping, ConfidenceLevel } from '../types';
import { ALL_STANDARD_REGIONS, batchNormalizeRegions } from '../data/regionDictionary';

interface RegionStandardizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataset: StatDataset;
  onApplyStandardization: (updatedCategories: string[], mappings: Record<string, RegionMapping>) => void;
}

export const RegionStandardizationModal: React.FC<RegionStandardizationModalProps> = ({
  isOpen,
  onClose,
  dataset,
  onApplyStandardization,
}) => {
  if (!isOpen) return null;

  // Initialize or load current mappings
  const [mappings, setMappings] = useState<Record<string, RegionMapping>>(() => {
    if (dataset.regionMappings && Object.keys(dataset.regionMappings).length > 0) {
      return { ...dataset.regionMappings };
    }
    return batchNormalizeRegions(dataset.categories);
  });

  const [selectedToApply, setSelectedToApply] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    dataset.categories.forEach(cat => {
      init[cat] = true;
    });
    return init;
  });

  // Handle manual correction dropdown
  const handleSelectStandard = (original: string, code: string) => {
    const targetDef = ALL_STANDARD_REGIONS.find(r => r.code === code);
    if (!targetDef) return;

    setMappings(prev => ({
      ...prev,
      [original]: {
        originalName: original,
        standardName: targetDef.standardName,
        code: targetDef.code,
        regionType: targetDef.regionType,
        confidence: 'manual',
        isVerified: true
      }
    }));
  };

  const handleToggleSelect = (cat: string) => {
    setSelectedToApply(prev => ({
      ...prev,
      [cat]: !prev[cat]
    }));
  };

  const handleApplyAll = () => {
    const newCategories = dataset.categories.map(cat => {
      if (selectedToApply[cat] && mappings[cat]) {
        return mappings[cat].standardName;
      }
      return cat;
    });

    onApplyStandardization(newCategories, mappings);
    onClose();
  };

  const getConfidenceBadge = (confidence: ConfidenceLevel) => {
    if (confidence === 'high') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          🟢 고신뢰 자동 일치
        </span>
      );
    }
    if (confidence === 'medium') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          🟡 유사도 매칭 (확인 권장)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
        🟠 수동 지정 필요
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Globe className="w-6 h-6 text-blue-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg">지역 표준화 사전 (KOSIS / ISO 연동)</h3>
                <span className="text-[11px] bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded-full border border-blue-400/30">
                  통계청 공식 행정구역 표준
                </span>
              </div>
              <p className="text-xs text-blue-100/80">
                교과서식 약칭(예: 충남, 강원, 미국)을 공식 표준 명칭 및 코드로 자동 매칭하고 교정합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice Bar */}
        <div className="bg-blue-50/70 border-b border-blue-100 px-6 py-3 flex items-center justify-between text-xs text-blue-900">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              표준 명칭으로 변환 시 단계구분도 및 카토그램 등 통계지도와 100% 무결점 정밀 연동됩니다.
            </span>
          </div>
          <span className="font-semibold text-blue-700">총 {dataset.categories.length}개 항목 분석됨</span>
        </div>

        {/* Mappings Table */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="p-3 w-10 text-center">선택</th>
                <th className="p-3">업로드된 교과서 명칭</th>
                <th className="p-3 w-8 text-center"></th>
                <th className="p-3">매칭된 공식 표준명 (KOSIS/ISO 코드)</th>
                <th className="p-3">매칭 신뢰도</th>
                <th className="p-3">수동 교정 선택</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dataset.categories.map((cat) => {
                const map = mappings[cat] || {
                  originalName: cat,
                  standardName: cat,
                  code: 'UNKNOWN',
                  regionType: 'unknown',
                  confidence: 'manual',
                  isVerified: false
                };

                return (
                  <tr key={cat} className="hover:bg-slate-50 transition">
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={!!selectedToApply[cat]}
                        onChange={() => handleToggleSelect(cat)}
                        className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="p-3 font-semibold text-slate-900">
                      {cat}
                    </td>
                    <td className="p-3 text-center text-slate-400">
                      <ArrowRight className="w-3.5 h-3.5 mx-auto" />
                    </td>
                    <td className="p-3 font-bold text-blue-700">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>{map.standardName}</span>
                        <span className="text-[10px] text-slate-400 font-mono font-normal">
                          [{map.code}]
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      {getConfidenceBadge(map.confidence)}
                    </td>
                    <td className="p-3">
                      <select
                        value={map.code}
                        onChange={(e) => handleSelectStandard(cat, e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-800 focus:ring-1 focus:ring-blue-500 outline-none"
                      >
                        <option value="UNKNOWN">-- 직접 선택 또는 유지 --</option>
                        <optgroup label="대한민국 17개 시도">
                          {ALL_STANDARD_REGIONS.filter(r => r.regionType === 'korea_sido').map(r => (
                            <option key={r.code} value={r.code}>
                              {r.standardName} (코드: {r.code})
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="대한민국 주요 시군구">
                          {ALL_STANDARD_REGIONS.filter(r => r.regionType === 'korea_sigungu').map(r => (
                            <option key={r.code} value={r.code}>
                              {r.standardName} (코드: {r.code})
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="세계 주요 국가 (ISO-3166)">
                          {ALL_STANDARD_REGIONS.filter(r => r.regionType === 'world_country').map(r => (
                            <option key={r.code} value={r.code}>
                              {r.standardName} (ISO: {r.code})
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="대륙">
                          {ALL_STANDARD_REGIONS.filter(r => r.regionType === 'continent').map(r => (
                            <option key={r.code} value={r.code}>
                              {r.standardName}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            체크된 항목({Object.values(selectedToApply).filter(Boolean).length}개)의 명칭이 공식 표준으로 일괄 갱신됩니다.
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition"
            >
              취소
            </button>
            <button
              onClick={handleApplyAll}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              선택한 표준 명칭 일괄 적용하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
