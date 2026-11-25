import React, { useState } from 'react';
import { X, Key, Cpu, ShieldCheck, Sparkles } from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [modelName, setModelName] = useState(settings.modelName || 'gemini-4-hydrogen');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...settings,
      apiKey: apiKey.trim(),
      modelName,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-blue-200" />
            <h3 className="font-bold text-lg">AI API 설정 및 모델 선택</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-blue-600" />
              Gemini API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AI Studio 또는 Google Cloud API Key 입력"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm outline-none transition"
            />
            <p className="text-xs text-slate-500 mt-1">
              입력하신 API Key는 브라우저의 <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-mono">localStorage</code>에 안전하게 저장되며 서버로 전송되어 구글 검색 그라운딩 분석에 사용됩니다.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-indigo-600" />
              사용할 Gemini 모델 선택
            </label>
            <select
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white outline-none transition"
            >
              <option value="gemini-4-hydrogen">Gemini 4 Hydrogen (권장: 강력한 비전 인식 및 출처 검증)</option>
              <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (초고속 경량 응답)</option>
              <option value="gemini-3.8-flash">Gemini 3.8 Flash (최신 멀티모달 비전 모델)</option>
            </select>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-800 space-y-1.5">
            <div className="font-semibold flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              제로-할루시네이션 및 출처 추적 보장
            </div>
            <p>
              본 스튜디오는 통계청 KOSIS, World Bank, FAO 등 원출처를 구글 검색 그라운딩(Google Search Grounding)과 교차 검증하여 교과서 출제 오류를 원천 차단합니다.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium transition"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm transition flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              저장하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
