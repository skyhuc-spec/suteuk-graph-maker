import React, { useState, useEffect } from 'react';
import { 
  Palette, Type, Maximize2, Sliders, Bookmark, Save, Trash2, 
  RotateCcw, Check, Sparkles, ChevronDown, ChevronRight, Lock, Unlock,
  Layers, FileText
} from 'lucide-react';
import { StyleConfig, KoreanFontFamily, ColorThemePalette, DimensionPreset, LessonPreset } from '../types';
import { BUILT_IN_LESSON_PRESETS, COLOR_PALETTES, DEFAULT_STYLE_CONFIG } from '../data/presetTemplates';

interface StyleInspectorProps {
  styleConfig: StyleConfig;
  onChangeStyle: (newStyle: StyleConfig) => void;
  seriesNames: string[];
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const StyleInspector: React.FC<StyleInspectorProps> = ({
  styleConfig,
  onChangeStyle,
  seriesNames,
  isOpen,
  onToggleOpen,
}) => {
  // Collapsible section states
  const [sectionOpen, setSectionOpen] = useState({
    presets: true,
    typography: true,
    colors: true,
    dimensions: true,
    geometry: false,
    layout: false,
  });

  // Custom User Presets stored in localStorage
  const [customPresets, setCustomPresets] = useState<LessonPreset[]>(() => {
    try {
      const saved = localStorage.getItem('stat_studio_custom_presets');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [newPresetName, setNewPresetName] = useState('');
  const [showSavePresetInput, setShowSavePresetInput] = useState(false);

  const toggleSection = (sec: keyof typeof sectionOpen) => {
    setSectionOpen(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  // Preset Selection
  const applyPreset = (preset: LessonPreset) => {
    onChangeStyle({ ...preset.style });
  };

  // Save new custom preset
  const handleSaveCustomPreset = () => {
    if (!newPresetName.trim()) return;
    const newPreset: LessonPreset = {
      id: 'custom-' + Date.now(),
      name: newPresetName.trim(),
      description: '선생님 맞춤형 사용자 지정 서식',
      isBuiltIn: false,
      style: { ...styleConfig }
    };
    const updated = [newPreset, ...customPresets];
    setCustomPresets(updated);
    try {
      localStorage.setItem('stat_studio_custom_presets', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    setNewPresetName('');
    setShowSavePresetInput(false);
  };

  // Delete custom preset
  const handleDeletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customPresets.filter(p => p.id !== id);
    setCustomPresets(updated);
    try {
      localStorage.setItem('stat_studio_custom_presets', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Dimension Preset change
  const handleDimensionPresetChange = (preset: DimensionPreset) => {
    let w = styleConfig.width;
    let h = styleConfig.height;

    switch (preset) {
      case 'a4-half':
        w = 400; h = 300;
        break;
      case 'a4-full':
        w = 800; h = 450;
        break;
      case 'b5-half':
        w = 350; h = 280;
        break;
      case 'b5-full':
        w = 700; h = 400;
        break;
      case 'ppt-16-9':
        w = 1280; h = 720;
        break;
      case 'card-1-1':
        w = 800; h = 800;
        break;
      case 'card-4-5':
        w = 800; h = 1000;
        break;
      case 'custom':
        break;
    }

    onChangeStyle({
      ...styleConfig,
      dimensionPreset: preset,
      width: w,
      height: h,
      aspectRatio: w / h
    });
  };

  // Handle Width change with Lock Aspect Ratio
  const handleWidthChange = (val: number) => {
    const newW = Math.max(200, Math.min(2400, val));
    const newH = styleConfig.lockAspectRatio 
      ? Math.round(newW / (styleConfig.aspectRatio || 1)) 
      : styleConfig.height;

    onChangeStyle({
      ...styleConfig,
      dimensionPreset: 'custom',
      width: newW,
      height: newH,
    });
  };

  // Handle Height change with Lock Aspect Ratio
  const handleHeightChange = (val: number) => {
    const newH = Math.max(150, Math.min(2400, val));
    const newW = styleConfig.lockAspectRatio 
      ? Math.round(newH * (styleConfig.aspectRatio || 1)) 
      : styleConfig.width;

    onChangeStyle({
      ...styleConfig,
      dimensionPreset: 'custom',
      width: newW,
      height: newH,
    });
  };

  // Handle Palette theme change
  const handlePaletteChange = (paletteTheme: ColorThemePalette) => {
    const colors = COLOR_PALETTES[paletteTheme] || COLOR_PALETTES.pastel;
    onChangeStyle({
      ...styleConfig,
      paletteTheme,
      customSeriesColors: [...colors],
    });
  };

  // Handle individual series color change
  const handleSeriesColorChange = (idx: number, hexColor: string) => {
    const newColors = [...styleConfig.customSeriesColors];
    newColors[idx] = hexColor;
    onChangeStyle({
      ...styleConfig,
      customSeriesColors: newColors,
    });
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggleOpen}
        className="fixed right-0 top-36 z-30 bg-blue-600 hover:bg-blue-700 text-white py-3 px-2 rounded-l-2xl shadow-xl flex flex-col items-center gap-2 text-xs font-bold transition transform hover:-translate-x-1"
        title="디자인·서식 인스펙터 열기"
      >
        <Sliders className="w-5 h-5" />
        <span className="writing-vertical text-[11px] tracking-wider py-1">디자인 서식 설정</span>
      </button>
    );
  }

  return (
    <div className="w-80 sm:w-96 bg-white border-l border-slate-200 shadow-2xl flex flex-col h-full z-30 text-xs overflow-hidden">
      {/* Top Header */}
      <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-400" />
          <h3 className="font-bold text-sm tracking-tight">디자인·서식 설정 (Inspector)</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onChangeStyle({ ...DEFAULT_STYLE_CONFIG })}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition"
            title="기본 서식으로 초기화"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onToggleOpen}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition font-bold"
            title="닫기"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Inspector Scroll Area */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-4 space-y-4">
        
        {/* SECTION 1: Lesson Presets (수업 자료 템플릿) */}
        <div className="space-y-3">
          <button
            onClick={() => toggleSection('presets')}
            className="w-full flex items-center justify-between font-bold text-slate-900 text-xs text-left"
          >
            <span className="flex items-center gap-1.5 text-blue-700">
              <Bookmark className="w-4 h-4 text-blue-600" />
              수업·시험 자료 템플릿 프리셋
            </span>
            {sectionOpen.presets ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {sectionOpen.presets && (
            <div className="space-y-2 pt-1 animate-in fade-in duration-150">
              {/* Built-in Presets */}
              <div className="space-y-1.5">
                {BUILT_IN_LESSON_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset)}
                    className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition group flex flex-col gap-0.5"
                  >
                    <div className="font-bold text-slate-800 group-hover:text-blue-700 flex items-center justify-between">
                      <span>{preset.name}</span>
                      <span className="text-[10px] text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded font-mono">
                        {preset.style.width}×{preset.style.height}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 line-clamp-1">{preset.description}</div>
                  </button>
                ))}

                {/* Custom User Presets */}
                {customPresets.map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => applyPreset(preset)}
                    className="p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50 hover:border-indigo-400 transition cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-bold text-indigo-900 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-indigo-500" />
                        <span>{preset.name}</span>
                      </div>
                      <div className="text-[10px] text-indigo-600">{preset.style.width}×{preset.style.height} | {preset.style.fontFamily}</div>
                    </div>
                    <button
                      onClick={(e) => handleDeletePreset(preset.id, e)}
                      className="text-slate-400 hover:text-rose-500 p-1"
                      title="프리셋 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Save current style as new preset */}
              {showSavePresetInput ? (
                <div className="pt-2 flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    placeholder="프리셋 이름 (예: 2학기 기말고사용)"
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={handleSaveCustomPreset}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-bold text-xs shrink-0"
                  >
                    저장
                  </button>
                  <button
                    onClick={() => setShowSavePresetInput(false)}
                    className="px-2 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs"
                  >
                    취소
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowSavePresetInput(true)}
                  className="w-full mt-1 py-2 rounded-xl border border-dashed border-slate-300 hover:border-blue-400 text-slate-600 hover:text-blue-600 font-semibold flex items-center justify-center gap-1 transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  현재 설정을 내 프리셋으로 저장
                </button>
              )}
            </div>
          )}
        </div>

        {/* SECTION 2: Typography & Font Controls */}
        <div className="pt-3 space-y-3">
          <button
            onClick={() => toggleSection('typography')}
            className="w-full flex items-center justify-between font-bold text-slate-900 text-xs text-left"
          >
            <span className="flex items-center gap-1.5 text-slate-800">
              <Type className="w-4 h-4 text-indigo-600" />
              한국어 글씨체 및 폰트 크기 설정
            </span>
            {sectionOpen.typography ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {sectionOpen.typography && (
            <div className="space-y-3 pt-1 animate-in fade-in duration-150">
              {/* Font Family Selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">글꼴 (Font Family)</label>
                <select
                  value={styleConfig.fontFamily}
                  onChange={(e) => onChangeStyle({ ...styleConfig, fontFamily: e.target.value as KoreanFontFamily })}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 outline-none"
                >
                  <option value="Noto Serif KR">Noto Serif KR (본명조 - 수능/시험지 추천 ⭐)</option>
                  <option value="Pretendard">Pretendard (프리텐다드 - 모던 UI/수업)</option>
                  <option value="Noto Sans KR">Noto Sans KR (본고딕 - 깔끔한 고딕)</option>
                  <option value="Nanum Myeongjo">Nanum Myeongjo (나눔명조 - 고전 명조)</option>
                  <option value="Nanum Gothic">Nanum Gothic (나눔고딕)</option>
                  <option value="IBM Plex Sans KR">IBM Plex Sans KR</option>
                  <option value="GmarketSansMedium">Gmarket Sans (지마켓산스 - 제목 강조)</option>
                </select>
              </div>

              {/* Title Font Size & Bold */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-slate-600">
                  <span>차트/지도 제목 크기: <strong className="text-slate-900">{styleConfig.fontSizeTitle}px</strong></span>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={styleConfig.isBoldTitle}
                      onChange={(e) => onChangeStyle({ ...styleConfig, isBoldTitle: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    <span className="font-bold">굵게(B)</span>
                  </label>
                </div>
                <input
                  type="range"
                  min="12"
                  max="32"
                  value={styleConfig.fontSizeTitle}
                  onChange={(e) => onChangeStyle({ ...styleConfig, fontSizeTitle: Number(e.target.value) })}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Axis & Region Labels Size */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-slate-600">
                  <span>축·지역 라벨 크기: <strong className="text-slate-900">{styleConfig.fontSizeAxis}px</strong></span>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={styleConfig.isBoldAxis}
                      onChange={(e) => onChangeStyle({ ...styleConfig, isBoldAxis: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    <span className="font-bold">굵게(B)</span>
                  </label>
                </div>
                <input
                  type="range"
                  min="8"
                  max="20"
                  value={styleConfig.fontSizeAxis}
                  onChange={(e) => onChangeStyle({ ...styleConfig, fontSizeAxis: Number(e.target.value) })}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Data Values Font Size */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-slate-600">
                  <span>데이터 수치 라벨 크기: <strong className="text-slate-900">{styleConfig.fontSizeDataValues}px</strong></span>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={styleConfig.isBoldDataValues}
                      onChange={(e) => onChangeStyle({ ...styleConfig, isBoldDataValues: e.target.checked })}
                      className="rounded text-blue-600"
                    />
                    <span className="font-bold">굵게(B)</span>
                  </label>
                </div>
                <input
                  type="range"
                  min="7"
                  max="18"
                  value={styleConfig.fontSizeDataValues}
                  onChange={(e) => onChangeStyle({ ...styleConfig, fontSizeDataValues: Number(e.target.value) })}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Legend & Footer Size */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 mb-0.5">범례 크기 ({styleConfig.fontSizeLegend}px)</label>
                  <input
                    type="range"
                    min="8"
                    max="18"
                    value={styleConfig.fontSizeLegend}
                    onChange={(e) => onChangeStyle({ ...styleConfig, fontSizeLegend: Number(e.target.value) })}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-0.5">출처 크기 ({styleConfig.fontSizeFooter}px)</label>
                  <input
                    type="range"
                    min="7"
                    max="16"
                    value={styleConfig.fontSizeFooter}
                    onChange={(e) => onChangeStyle({ ...styleConfig, fontSizeFooter: Number(e.target.value) })}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 3: Color Palette & Series Color Customizer */}
        <div className="pt-3 space-y-3">
          <button
            onClick={() => toggleSection('colors')}
            className="w-full flex items-center justify-between font-bold text-slate-900 text-xs text-left"
          >
            <span className="flex items-center gap-1.5 text-slate-800">
              <Palette className="w-4 h-4 text-emerald-600" />
              색상 테마 팔레트 및 개별 색상 지정
            </span>
            {sectionOpen.colors ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {sectionOpen.colors && (
            <div className="space-y-3 pt-1 animate-in fade-in duration-150">
              {/* Preset Palettes */}
              <div className="space-y-1.5">
                {[
                  { id: 'pastel', label: '교과서 파스텔 (Textbook Pastel)' },
                  { id: 'monochrome', label: '수능·시험지 흑백 인쇄 (Monochrome)' },
                  { id: 'vivid', label: '고대비 비비드 (High-Contrast Vivid)' },
                  { id: 'colorblind', label: '색약자 배려 (Okabe-Ito / Viridis)' },
                  { id: 'sequentialBlue', label: '블루 단색 계열 (Sequential Blue)' },
                  { id: 'sequentialGreen', label: '그린 단색 계열 (Sequential Green)' },
                ].map((pal) => (
                  <button
                    key={pal.id}
                    onClick={() => handlePaletteChange(pal.id as ColorThemePalette)}
                    className={`w-full p-2 rounded-xl border text-left flex items-center justify-between transition ${
                      styleConfig.paletteTheme === pal.id
                        ? 'border-emerald-500 bg-emerald-50/50 font-bold text-emerald-900 shadow-2xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>{pal.label}</span>
                    <div className="flex gap-0.5">
                      {(COLOR_PALETTES[pal.id as ColorThemePalette] || []).slice(0, 4).map((c, i) => (
                        <span key={i} className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: c }}></span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>

              {/* Individual Series Color Pickers */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="font-semibold text-slate-700 block">개별 지표/시리즈 색상 사용자 지정:</span>
                <div className="space-y-1.5">
                  {seriesNames.map((name, sIdx) => {
                    const currentColor = styleConfig.customSeriesColors[sIdx % styleConfig.customSeriesColors.length] || '#3b82f6';
                    return (
                      <div key={sIdx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="font-medium text-slate-800 truncate max-w-[150px]">{name}</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={currentColor}
                            onChange={(e) => handleSeriesColorChange(sIdx, e.target.value)}
                            className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                          />
                          <span className="font-mono text-[10px] text-slate-500 uppercase">{currentColor}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Fill Opacity & Stroke Width */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-slate-600 mb-0.5">투명도 ({Math.round(styleConfig.fillOpacity * 100)}%)</label>
                  <input
                    type="range"
                    min="0.2"
                    max="1.0"
                    step="0.05"
                    value={styleConfig.fillOpacity}
                    onChange={(e) => onChangeStyle({ ...styleConfig, fillOpacity: Number(e.target.value) })}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-0.5">외곽선 두께 ({styleConfig.borderWidth}px)</label>
                  <input
                    type="range"
                    min="0.5"
                    max="5"
                    step="0.5"
                    value={styleConfig.borderWidth}
                    onChange={(e) => onChangeStyle({ ...styleConfig, borderWidth: Number(e.target.value) })}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 4: Canvas Dimensions & Aspect Ratio Controls */}
        <div className="pt-3 space-y-3">
          <button
            onClick={() => toggleSection('dimensions')}
            className="w-full flex items-center justify-between font-bold text-slate-900 text-xs text-left"
          >
            <span className="flex items-center gap-1.5 text-slate-800">
              <Maximize2 className="w-4 h-4 text-blue-600" />
              캔버스 규격 및 한글(HWP) 자동 맞춤
            </span>
            {sectionOpen.dimensions ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {sectionOpen.dimensions && (
            <div className="space-y-3 pt-1 animate-in fade-in duration-150">
              {/* Document Presets Grid */}
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'a4-half', label: 'HWP A4 반단', size: '400×300' },
                  { id: 'a4-full', label: 'HWP A4 전단', size: '800×450' },
                  { id: 'b5-half', label: 'B5 학습지 반단', size: '350×280' },
                  { id: 'b5-full', label: 'B5 학습지 전단', size: '700×400' },
                  { id: 'ppt-16-9', label: 'PPT 와이드 16:9', size: '1280×720' },
                  { id: 'card-1-1', label: '카드뉴스 1:1', size: '800×800' },
                  { id: 'card-4-5', label: '카드뉴스 4:5', size: '800×1000' },
                ].map((d) => (
                  <button
                    key={d.id}
                    onClick={() => handleDimensionPresetChange(d.id as DimensionPreset)}
                    className={`p-2 rounded-xl border text-left transition ${
                      styleConfig.dimensionPreset === d.id
                        ? 'border-blue-600 bg-blue-50/50 font-bold text-blue-900 shadow-2xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="text-[11px] font-semibold">{d.label}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{d.size}</div>
                  </button>
                ))}
              </div>

              {/* Custom Width & Height Inputs */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">해상도 직접 입력 (px):</span>
                  <button
                    onClick={() => onChangeStyle({ ...styleConfig, lockAspectRatio: !styleConfig.lockAspectRatio, aspectRatio: styleConfig.width / styleConfig.height })}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 border transition ${
                      styleConfig.lockAspectRatio ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-slate-100 text-slate-600 border-slate-300'
                    }`}
                  >
                    {styleConfig.lockAspectRatio ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    비율 고정
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">너비 (Width)</label>
                    <input
                      type="number"
                      step="10"
                      value={styleConfig.width}
                      onChange={(e) => handleWidthChange(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-xs outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">높이 (Height)</label>
                    <input
                      type="number"
                      step="10"
                      value={styleConfig.height}
                      onChange={(e) => handleHeightChange(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-xs outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 5: Geometry Controls */}
        <div className="pt-3 space-y-3">
          <button
            onClick={() => toggleSection('geometry')}
            className="w-full flex items-center justify-between font-bold text-slate-900 text-xs text-left"
          >
            <span className="flex items-center gap-1.5 text-slate-800">
              <Layers className="w-4 h-4 text-amber-600" />
              차트 기하학적 형상 (막대 두께·선 두께)
            </span>
            {sectionOpen.geometry ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {sectionOpen.geometry && (
            <div className="space-y-3 pt-1 animate-in fade-in duration-150">
              <div>
                <div className="flex justify-between text-slate-600 mb-0.5">
                  <span>막대 두께 비율: {Math.round(styleConfig.barThicknessRatio * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="0.95"
                  step="0.05"
                  value={styleConfig.barThicknessRatio}
                  onChange={(e) => onChangeStyle({ ...styleConfig, barThicknessRatio: Number(e.target.value) })}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-600 mb-0.5">
                  <span>꺾은선 두께: {styleConfig.lineStrokeWidth}px</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="8"
                  step="0.5"
                  value={styleConfig.lineStrokeWidth}
                  onChange={(e) => onChangeStyle({ ...styleConfig, lineStrokeWidth: Number(e.target.value) })}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-600 mb-0.5">
                  <span>도넛 내부 홀 크기: {styleConfig.donutCutoutPercent}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="80"
                  step="5"
                  value={styleConfig.donutCutoutPercent}
                  onChange={(e) => onChangeStyle({ ...styleConfig, donutCutoutPercent: Number(e.target.value) })}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* SECTION 6: Layout & Placement Controls */}
        <div className="pt-3 space-y-3">
          <button
            onClick={() => toggleSection('layout')}
            className="w-full flex items-center justify-between font-bold text-slate-900 text-xs text-left"
          >
            <span className="flex items-center gap-1.5 text-slate-800">
              <FileText className="w-4 h-4 text-purple-600" />
              배치 위치 및 수치 라벨 토글
            </span>
            {sectionOpen.layout ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {sectionOpen.layout && (
            <div className="space-y-3 pt-1 animate-in fade-in duration-150">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">제목 위치</label>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { id: 'top-left', label: '상단 좌측' },
                    { id: 'top-center', label: '상단 중앙' },
                    { id: 'hidden', label: '숨김' },
                  ].map((pos) => (
                    <button
                      key={pos.id}
                      onClick={() => onChangeStyle({ ...styleConfig, titlePosition: pos.id as any })}
                      className={`p-1.5 rounded-lg border text-center transition ${
                        styleConfig.titlePosition === pos.id ? 'border-purple-600 bg-purple-50 font-bold text-purple-900' : 'border-slate-200'
                      }`}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">범례 배치</label>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { id: 'top', label: '상단' },
                    { id: 'bottom', label: '하단' },
                    { id: 'right', label: '우측' },
                    { id: 'hidden', label: '숨김' },
                  ].map((pos) => (
                    <button
                      key={pos.id}
                      onClick={() => onChangeStyle({ ...styleConfig, legendPosition: pos.id as any })}
                      className={`p-1.5 rounded-lg border text-center transition ${
                        styleConfig.legendPosition === pos.id ? 'border-purple-600 bg-purple-50 font-bold text-purple-900' : 'border-slate-200'
                      }`}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="font-semibold text-slate-700">데이터 수치 라벨 표시</span>
                <input
                  type="checkbox"
                  checked={styleConfig.showDataLabels}
                  onChange={(e) => onChangeStyle({ ...styleConfig, showDataLabels: e.target.checked })}
                  className="rounded text-purple-600 w-4 h-4"
                />
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
