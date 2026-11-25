export interface SeriesData {
  name: string; // e.g., "2020년", "인구수(만명)"
  data: (number | null)[];
}

export type ConfidenceLevel = 'high' | 'medium' | 'manual';

export interface RegionMapping {
  originalName: string;
  standardName: string;
  code: string; // KOSIS code (e.g., "11" for Seoul) or ISO-3166 code (e.g., "KOR", "USA")
  regionType: 'korea_sido' | 'korea_sigungu' | 'world_country' | 'continent' | 'unknown';
  confidence: ConfidenceLevel;
  isVerified: boolean;
}

export interface StatDataset {
  id: string;
  title: string;
  unit: string;
  originalSource: string;
  sourceSubstitution: string;
  categories: string[]; // X-axis / regions / items (e.g., ["서울", "부산", ...])
  series: SeriesData[];
  notes?: string;
  excludedRegions?: string[]; // Regions unchecked by teacher
  isTransposed?: boolean; // Transposed rows <-> columns
  regionMappings?: Record<string, RegionMapping>;
}

export type ChartType = 
  | 'bar' 
  | 'horizontalBar' 
  | 'stackedBar' 
  | 'percentStackedBar' 
  | 'pie' 
  | 'doughnut' 
  | 'line' 
  | 'stackedArea' 
  | 'radar' 
  | 'scatter' 
  | 'bubble' 
  | 'treemap' 
  | 'pareto' 
  | 'combo';

export type MapType = 
  | 'choropleth' 
  | 'proportionalSymbol' 
  | 'dotDensity' 
  | 'flow' 
  | 'cartogram';

export type MapRegionType = 'korea_sido' | 'korea_sigungu' | 'world_countries' | 'continents';

export type KoreanFontFamily = 
  | 'Pretendard' 
  | 'Noto Sans KR' 
  | 'Noto Serif KR' 
  | 'Nanum Gothic' 
  | 'Nanum Myeongjo' 
  | 'IBM Plex Sans KR' 
  | 'GmarketSansMedium';

export type ColorThemePalette = 
  | 'pastel' 
  | 'monochrome' 
  | 'vivid' 
  | 'colorblind' 
  | 'sequentialBlue' 
  | 'sequentialGreen';

export type DimensionPreset = 
  | 'a4-half' 
  | 'a4-full' 
  | 'b5-half' 
  | 'b5-full' 
  | 'ppt-16-9' 
  | 'card-1-1' 
  | 'card-4-5' 
  | 'custom';

export interface StyleConfig {
  fontFamily: KoreanFontFamily;
  fontSizeTitle: number;
  fontSizeAxis: number;
  fontSizeDataValues: number;
  fontSizeLegend: number;
  fontSizeFooter: number;
  isBoldTitle: boolean;
  isBoldAxis: boolean;
  isBoldDataValues: boolean;
  paletteTheme: ColorThemePalette;
  customSeriesColors: string[];
  borderWidth: number;
  fillOpacity: number;
  // Dimensions
  dimensionPreset: DimensionPreset;
  width: number;
  height: number;
  lockAspectRatio: boolean;
  aspectRatio: number;
  // Geometry
  barThicknessRatio: number;
  lineStrokeWidth: number;
  pointRadius: number;
  donutCutoutPercent: number;
  paddingMargin: number;
  // Layout
  titlePosition: 'top-left' | 'top-center' | 'hidden';
  legendPosition: 'top' | 'bottom' | 'right' | 'hidden';
  showDataLabels: boolean;
  dataLabelType: 'value' | 'percent' | 'both';
  yAxisMin?: number;
  yAxisMax?: number;
  yAxisStep?: number;
}

export interface LessonPreset {
  id: string;
  name: string;
  description: string;
  isBuiltIn?: boolean;
  style: StyleConfig;
}

export interface ExamQuestion {
  id: string;
  number: number;
  title: string;
  score: number; // e.g. 2 or 3
  questionText: string;
  boxContent?: string; // [보기]
  choices: string[];
  correctAnswer: number; // 1 to 5
  explanation: string;
  conceptPoints: string[];
  includeChart: boolean;
  includeMap: boolean;
  chartType?: ChartType;
  mapType?: MapType;
}

export interface AppSettings {
  apiKey: string;
  modelName: string;
  theme: 'bright' | 'exam';
  bwPatternMode: boolean;
  showDataLabels: boolean;
  showPercentages: boolean;
}
