import { LessonPreset, StyleConfig } from '../types';

export const DEFAULT_STYLE_CONFIG: StyleConfig = {
  fontFamily: 'Noto Sans KR',
  fontSizeTitle: 16,
  fontSizeAxis: 11,
  fontSizeDataValues: 10,
  fontSizeLegend: 11,
  fontSizeFooter: 10,
  isBoldTitle: true,
  isBoldAxis: false,
  isBoldDataValues: true,
  paletteTheme: 'pastel',
  customSeriesColors: [
    '#3b82f6', // Blue
    '#6366f1', // Indigo
    '#8b5cf6', // Purple
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
  ],
  borderWidth: 1.5,
  fillOpacity: 0.85,
  dimensionPreset: 'a4-half',
  width: 400,
  height: 300,
  lockAspectRatio: true,
  aspectRatio: 400 / 300,
  barThicknessRatio: 0.65,
  lineStrokeWidth: 2.5,
  pointRadius: 4,
  donutCutoutPercent: 55,
  paddingMargin: 20,
  titlePosition: 'top-center',
  legendPosition: 'top',
  showDataLabels: true,
  dataLabelType: 'value',
};

export const BUILT_IN_LESSON_PRESETS: LessonPreset[] = [
  {
    id: 'preset-hwp-a4-half',
    name: '한글(HWP) A4 2단 시험지 (반단용 400×300)',
    description: '전국연합학력평가 및 내신 시험지 2단 편집에 최적화된 본명조 흑백 인쇄 규격',
    isBuiltIn: true,
    style: {
      ...DEFAULT_STYLE_CONFIG,
      fontFamily: 'Noto Serif KR',
      paletteTheme: 'monochrome',
      dimensionPreset: 'a4-half',
      width: 400,
      height: 300,
      titlePosition: 'top-left',
      legendPosition: 'top',
      showDataLabels: true,
      dataLabelType: 'value',
      fontSizeTitle: 14,
      fontSizeAxis: 10,
      fontSizeDataValues: 9,
      fontSizeLegend: 9,
      fontSizeFooter: 9,
      borderWidth: 1.5,
    }
  },
  {
    id: 'preset-hwp-a4-full',
    name: '한글(HWP) A4 1단 시험지 (전단용 800×450)',
    description: '시험지 전면 또는 중간 기말 종합 문항 삽입용 본명조 와이드 규격',
    isBuiltIn: true,
    style: {
      ...DEFAULT_STYLE_CONFIG,
      fontFamily: 'Noto Serif KR',
      paletteTheme: 'monochrome',
      dimensionPreset: 'a4-full',
      width: 800,
      height: 450,
      titlePosition: 'top-center',
      legendPosition: 'top',
      showDataLabels: true,
      fontSizeTitle: 18,
      fontSizeAxis: 12,
      fontSizeDataValues: 11,
      fontSizeLegend: 11,
      fontSizeFooter: 10,
    }
  },
  {
    id: 'preset-b5-worksheet',
    name: 'B5 모둠활동/학습지 규격 (350×280)',
    description: '수업 활동지 및 모둠 과제물에 쏙 들어가는 깔끔한 본고딕 규격',
    isBuiltIn: true,
    style: {
      ...DEFAULT_STYLE_CONFIG,
      fontFamily: 'Noto Sans KR',
      paletteTheme: 'pastel',
      dimensionPreset: 'b5-half',
      width: 350,
      height: 280,
      titlePosition: 'top-left',
      legendPosition: 'bottom',
      showDataLabels: true,
      fontSizeTitle: 13,
      fontSizeAxis: 9.5,
      fontSizeDataValues: 9,
    }
  },
  {
    id: 'preset-ppt-classroom',
    name: 'PPT 수업 슬라이드 (16:9, 1280×720)',
    description: '전자칠판 및 빔프로젝터 투사용 고선명 프리텐다드 파스텔 레이아웃',
    isBuiltIn: true,
    style: {
      ...DEFAULT_STYLE_CONFIG,
      fontFamily: 'Pretendard',
      paletteTheme: 'pastel',
      dimensionPreset: 'ppt-16-9',
      width: 1280,
      height: 720,
      titlePosition: 'top-center',
      legendPosition: 'right',
      showDataLabels: true,
      fontSizeTitle: 24,
      fontSizeAxis: 15,
      fontSizeDataValues: 13,
      fontSizeLegend: 14,
      fontSizeFooter: 12,
    }
  },
  {
    id: 'preset-cardnews-sq',
    name: '사회과 탐구 카드뉴스 (1:1, 800×800)',
    description: '학생 수행평가 보고서 및 카드뉴스용 비비드 정방형 레이아웃',
    isBuiltIn: true,
    style: {
      ...DEFAULT_STYLE_CONFIG,
      fontFamily: 'GmarketSansMedium',
      paletteTheme: 'vivid',
      dimensionPreset: 'card-1-1',
      width: 800,
      height: 800,
      titlePosition: 'top-center',
      legendPosition: 'top',
      showDataLabels: true,
      fontSizeTitle: 22,
      fontSizeAxis: 13,
      fontSizeDataValues: 12,
      fontSizeLegend: 13,
      fontSizeFooter: 11,
    }
  }
];

export const COLOR_PALETTES = {
  pastel: [
    '#60a5fa', // Blue
    '#818cf8', // Indigo
    '#a78bfa', // Purple
    '#34d399', // Emerald
    '#fbbf24', // Amber
    '#f87171', // Rose
    '#38bdf8', // Sky
    '#fb923c', // Orange
  ],
  monochrome: [
    '#1e293b', // Dark Slate
    '#475569', // Slate
    '#94a3b8', // Gray
    '#cbd5e1', // Light Gray
    '#0f172a', // Deep Black
    '#64748b', // Neutral
  ],
  vivid: [
    '#2563eb', // Royal Blue
    '#7c3aed', // Deep Violet
    '#059669', // Strong Emerald
    '#d97706', // Strong Amber
    '#dc2626', // Bright Red
    '#0891b2', // Cyan
  ],
  colorblind: [
    '#0072B2', // Blue
    '#E69F00', // Orange
    '#56B4E9', // Sky Blue
    '#009E73', // Bluish Green
    '#F0E442', // Yellow
    '#D55E00', // Vermilion
    '#CC79A7', // Reddish Purple
  ],
  sequentialBlue: [
    '#dbeafe',
    '#bfdbfe',
    '#93c5fd',
    '#60a5fa',
    '#3b82f6',
    '#2563eb',
    '#1d4ed8',
    '#1e40af',
  ],
  sequentialGreen: [
    '#dcfce7',
    '#bbf7d0',
    '#86efac',
    '#4ade80',
    '#22c55e',
    '#16a34a',
    '#15803d',
    '#166534',
  ]
};
