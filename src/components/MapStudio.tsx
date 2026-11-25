import React, { useState, useEffect, useRef } from 'react';
import { 
  Map as MapIcon, Layers, Globe, Compass, Download, Copy, Check, 
  Sparkles, Sliders, RefreshCw, ZoomIn, Info
} from 'lucide-react';
import { StatDataset, MapType, MapRegionType, StyleConfig, AppSettings } from '../types';
import * as d3 from 'd3';
import html2canvas from 'html2canvas';
import { StyleInspector } from './StyleInspector';
import { ALL_STANDARD_REGIONS } from '../data/regionDictionary';

interface MapStudioProps {
  dataset: StatDataset | null;
  settings: AppSettings;
  styleConfig: StyleConfig;
  onUpdateStyleConfig: (newStyle: StyleConfig) => void;
}

export const MapStudio: React.FC<MapStudioProps> = ({ 
  dataset, 
  settings, 
  styleConfig, 
  onUpdateStyleConfig 
}) => {
  if (!dataset) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <MapIcon className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">통계 데이터가 없습니다</h3>
        <p className="text-sm text-slate-500 mb-6">먼저 1번 '다중 입력' 탭에서 지역별 통계 데이터를 불러와주세요.</p>
      </div>
    );
  }

  const [mapType, setMapType] = useState<MapType>('choropleth');
  const [mapRegion, setMapRegion] = useState<MapRegionType>('korea_sido');
  const [classificationMethod, setClassificationMethod] = useState<'equal' | 'quantile' | 'custom'>('equal');
  const [classCount, setClassCount] = useState<number>(5);
  const [dotUnit, setDotUnit] = useState<number>(100);
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const [exportTransparent, setExportTransparent] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter excluded regions
  const excluded = dataset.excludedRegions || [];
  const primarySeries = dataset.series[0] || { name: '값', data: [] };

  // Data Map
  const dataMap = new Map<string, number>();
  dataset.categories.forEach((cat, idx) => {
    const val = primarySeries.data[idx];
    if (val !== null && val !== undefined) {
      dataMap.set(cat, val);
    }
  });

  // Render D3 Map
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = styleConfig.width;
    const height = styleConfig.height;
    svg.attr('viewBox', `0 0 ${width} ${height}`)
       .attr('width', width)
       .attr('height', height);

    const isBw = styleConfig.paletteTheme === 'monochrome';

    // Background
    if (!exportTransparent) {
      svg.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', '#ffffff')
        .attr('rx', 12);
    }

    // Values array
    const validValues = dataset.categories
      .filter(cat => !excluded.includes(cat))
      .map(cat => dataMap.get(cat))
      .filter((v): v is number => v !== undefined && v !== null);

    const minVal = validValues.length ? d3.min(validValues) || 0 : 0;
    const maxVal = validValues.length ? d3.max(validValues) || 100 : 100;

    // Color interpolators
    const colorInterpolator = isBw
      ? d3.interpolateGreys
      : {
          pastel: d3.interpolateBlues,
          monochrome: d3.interpolateGreys,
          vivid: d3.interpolateYlOrRd,
          colorblind: d3.interpolateViridis,
          sequentialBlue: d3.interpolateBlues,
          sequentialGreen: d3.interpolateGreens,
        }[styleConfig.paletteTheme] || d3.interpolateBlues;

    // Classification breaks
    let thresholds: number[] = [];
    if (classificationMethod === 'equal') {
      const step = (maxVal - minVal) / classCount;
      thresholds = Array.from({ length: classCount - 1 }, (_, i) => minVal + step * (i + 1));
    } else {
      // Quantile
      thresholds = d3.scaleQuantile<number>()
        .domain(validValues)
        .range(Array.from({ length: classCount }, (_, i) => i))
        .quantiles();
    }

    const colorScale = (val: number) => {
      if (val === undefined || val === null) return '#e2e8f0';
      const norm = maxVal === minVal ? 0.5 : (val - minVal) / (maxVal - minVal);
      return colorInterpolator(Math.max(0.15, Math.min(0.95, norm)));
    };

    const g = svg.append('g').attr('transform', `translate(${styleConfig.paddingMargin}, ${styleConfig.paddingMargin})`);

    // Title & Header inside SVG
    if (styleConfig.titlePosition !== 'hidden') {
      const titleG = svg.append('g').attr('transform', `translate(${width / 2}, 30)`);
      titleG.append('text')
        .attr('text-anchor', styleConfig.titlePosition === 'top-center' ? 'middle' : 'start')
        .attr('x', styleConfig.titlePosition === 'top-center' ? 0 : -width / 2 + 25)
        .attr('fill', '#0f172a')
        .attr('font-size', `${styleConfig.fontSizeTitle}px`)
        .attr('font-weight', styleConfig.isBoldTitle ? 'bold' : 'normal')
        .attr('font-family', styleConfig.fontFamily)
        .text(dataset.title);
    }

    // Coordinates for South Korea 17 Sido (Centered on canvas)
    const scaleFactorX = (width - styleConfig.paddingMargin * 2) / 600;
    const scaleFactorY = (height - styleConfig.paddingMargin * 2 - 60) / 550;

    if (mapRegion === 'korea_sido') {
      const sidoCoords: { [key: string]: { x: number; y: number; r: number } } = {
        '서울': { x: 220, y: 150, r: 35 },
        '서울특별시': { x: 220, y: 150, r: 35 },
        '인천': { x: 150, y: 140, r: 30 },
        '인천광역시': { x: 150, y: 140, r: 30 },
        '경기': { x: 250, y: 190, r: 48 },
        '경기도': { x: 250, y: 190, r: 48 },
        '강원': { x: 380, y: 130, r: 60 },
        '강원특별자치도': { x: 380, y: 130, r: 60 },
        '충북': { x: 310, y: 240, r: 40 },
        '충청북도': { x: 310, y: 240, r: 40 },
        '충남': { x: 190, y: 260, r: 44 },
        '충청남도': { x: 190, y: 260, r: 44 },
        '대전': { x: 260, y: 280, r: 24 },
        '대전광역시': { x: 260, y: 280, r: 24 },
        '세종': { x: 230, y: 250, r: 20 },
        '세종특별자치시': { x: 230, y: 250, r: 20 },
        '전북': { x: 230, y: 360, r: 44 },
        '전북특별자치도': { x: 230, y: 360, r: 44 },
        '전남': { x: 210, y: 460, r: 50 },
        '전라남도': { x: 210, y: 460, r: 50 },
        '광주': { x: 180, y: 410, r: 24 },
        '광주광역시': { x: 180, y: 410, r: 24 },
        '경북': { x: 440, y: 280, r: 68 },
        '경상북도': { x: 440, y: 280, r: 68 },
        '대구': { x: 410, y: 340, r: 30 },
        '대구광역시': { x: 410, y: 340, r: 30 },
        '울산': { x: 510, y: 380, r: 28 },
        '울산광역시': { x: 510, y: 380, r: 28 },
        '부산': { x: 460, y: 430, r: 34 },
        '부산광역시': { x: 460, y: 430, r: 34 },
        '경남': { x: 360, y: 420, r: 52 },
        '경상남도': { x: 360, y: 420, r: 52 },
        '제주': { x: 260, y: 520, r: 30 },
        '제주특별자치도': { x: 260, y: 520, r: 30 },
      };

      // Distinct entries
      const drawnSidos = new Set<string>();

      dataset.categories.forEach((cat) => {
        // Resolve alias
        let coord = sidoCoords[cat];
        if (!coord) {
          const match = ALL_STANDARD_REGIONS.find(r => r.standardName === cat || r.aliases.includes(cat));
          if (match) {
            coord = sidoCoords[match.standardName] || sidoCoords[match.aliases[0]];
          }
        }
        if (!coord) return;

        const val = dataMap.get(cat) ?? 0;
        const isExcluded = excluded.includes(cat);
        const cx = coord.x * scaleFactorX + 40;
        const cy = coord.y * scaleFactorY + 50;

        // Radius based on MapType
        let r = coord.r * Math.min(scaleFactorX, scaleFactorY);
        if (mapType === 'proportionalSymbol') {
          r = Math.max(14, (val / (maxVal || 1)) * 48 * Math.min(scaleFactorX, scaleFactorY));
        } else if (mapType === 'cartogram') {
          r = Math.max(18, Math.sqrt(val / (maxVal || 1)) * 55 * Math.min(scaleFactorX, scaleFactorY));
        }

        const fillColor = isExcluded ? '#f1f5f9' : colorScale(val);

        // 1. Draw Region Circle / Polygon
        const shape = g.append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', r)
          .attr('fill', fillColor)
          .attr('fill-opacity', styleConfig.fillOpacity)
          .attr('stroke', isBw ? '#000000' : '#334155')
          .attr('stroke-width', styleConfig.borderWidth)
          .attr('opacity', isExcluded ? 0.35 : 1);

        // 2. Dot Density Map Dots
        if (mapType === 'dotDensity' && !isExcluded) {
          const dotCount = Math.min(40, Math.max(1, Math.round(val / dotUnit)));
          for (let d = 0; d < dotCount; d++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.sqrt(Math.random()) * (r - 6);
            g.append('circle')
              .attr('cx', cx + Math.cos(angle) * dist)
              .attr('cy', cy + Math.sin(angle) * dist)
              .attr('r', 1.8)
              .attr('fill', '#000000');
          }
        }

        // 3. Label Text
        g.append('text')
          .attr('x', cx)
          .attr('y', cy - 3)
          .attr('text-anchor', 'middle')
          .attr('fill', '#0f172a')
          .attr('font-size', `${styleConfig.fontSizeAxis}px`)
          .attr('font-weight', styleConfig.isBoldAxis ? 'bold' : 'normal')
          .attr('font-family', styleConfig.fontFamily)
          .text(cat.length > 4 ? cat.substring(0, 2) : cat);

        // Value text
        if (styleConfig.showDataLabels && !isExcluded) {
          g.append('text')
            .attr('x', cx)
            .attr('y', cy + 12)
            .attr('text-anchor', 'middle')
            .attr('fill', '#475569')
            .attr('font-size', `${styleConfig.fontSizeDataValues}px`)
            .attr('font-weight', styleConfig.isBoldDataValues ? 'bold' : 'normal')
            .attr('font-family', styleConfig.fontFamily)
            .text(val);
        }
      });

      // 4. Flow Map (Curved Arrows from regions to Seoul / Center)
      if (mapType === 'flow') {
        const targetX = 220 * scaleFactorX + 40;
        const targetY = 150 * scaleFactorY + 50;

        dataset.categories.forEach(cat => {
          if (cat.includes('서울') || excluded.includes(cat)) return;
          const coord = sidoCoords[cat];
          if (!coord) return;
          const srcX = coord.x * scaleFactorX + 40;
          const srcY = coord.y * scaleFactorY + 50;
          const val = dataMap.get(cat) ?? 0;
          const strokeW = Math.max(1, (val / (maxVal || 1)) * 6);

          const dx = targetX - srcX;
          const dy = targetY - srcY;
          const cx = (srcX + targetX) / 2 - dy * 0.2;
          const cy = (srcY + targetY) / 2 + dx * 0.2;

          g.append('path')
            .attr('d', `M ${srcX} ${srcY} Q ${cx} ${cy} ${targetX} ${targetY}`)
            .attr('fill', 'none')
            .attr('stroke', isBw ? '#000000' : '#2563eb')
            .attr('stroke-width', strokeW)
            .attr('stroke-linecap', 'round')
            .attr('opacity', 0.7);
        });
      }

    } else {
      // World Countries Layout
      const worldCoords: { [key: string]: { x: number; y: number; r: number } } = {
        '중국': { x: 500, y: 220, r: 60 },
        '미국': { x: 180, y: 200, r: 65 },
        '인도': { x: 440, y: 300, r: 50 },
        '러시아': { x: 480, y: 110, r: 70 },
        '일본': { x: 580, y: 230, r: 35 },
        '독일': { x: 350, y: 170, r: 30 },
        '브라질': { x: 260, y: 380, r: 55 },
        '프랑스': { x: 320, y: 190, r: 28 },
        '대한민국': { x: 560, y: 220, r: 25 },
        '호주': { x: 550, y: 440, r: 50 },
      };

      dataset.categories.forEach((cat) => {
        let coord = worldCoords[cat];
        if (!coord) {
          const match = ALL_STANDARD_REGIONS.find(r => r.standardName === cat || r.aliases.includes(cat));
          if (match) coord = worldCoords[match.standardName];
        }
        if (!coord) return;

        const val = dataMap.get(cat) ?? 0;
        const isExcluded = excluded.includes(cat);
        const cx = coord.x * scaleFactorX + 30;
        const cy = coord.y * scaleFactorY + 50;

        let r = coord.r * Math.min(scaleFactorX, scaleFactorY);
        if (mapType === 'proportionalSymbol') {
          r = Math.max(16, (val / (maxVal || 1)) * 52 * Math.min(scaleFactorX, scaleFactorY));
        }

        const fillColor = isExcluded ? '#f1f5f9' : colorScale(val);

        g.append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', r)
          .attr('fill', fillColor)
          .attr('fill-opacity', styleConfig.fillOpacity)
          .attr('stroke', isBw ? '#000000' : '#334155')
          .attr('stroke-width', styleConfig.borderWidth)
          .attr('opacity', isExcluded ? 0.35 : 1);

        g.append('text')
          .attr('x', cx)
          .attr('y', cy - 2)
          .attr('text-anchor', 'middle')
          .attr('fill', '#0f172a')
          .attr('font-size', `${styleConfig.fontSizeAxis}px`)
          .attr('font-weight', styleConfig.isBoldAxis ? 'bold' : 'normal')
          .attr('font-family', styleConfig.fontFamily)
          .text(cat);

        if (styleConfig.showDataLabels && !isExcluded) {
          g.append('text')
            .attr('x', cx)
            .attr('y', cy + 13)
            .attr('text-anchor', 'middle')
            .attr('fill', '#475569')
            .attr('font-size', `${styleConfig.fontSizeDataValues}px`)
            .attr('font-weight', styleConfig.isBoldDataValues ? 'bold' : 'normal')
            .attr('font-family', styleConfig.fontFamily)
            .text(val);
        }
      });
    }

    // Legend Generator inside SVG (Bottom Left or Right)
    if (styleConfig.legendPosition !== 'hidden') {
      const legendG = svg.append('g').attr('transform', `translate(30, ${height - 65})`);
      legendG.append('text')
        .attr('x', 0)
        .attr('y', -6)
        .attr('font-size', `${styleConfig.fontSizeLegend}px`)
        .attr('font-weight', 'bold')
        .attr('fill', '#1e293b')
        .attr('font-family', styleConfig.fontFamily)
        .text(`[범례] ${primarySeries.name} (${dataset.unit})`);

      const boxW = 32;
      const boxH = 14;
      for (let i = 0; i < classCount; i++) {
        const valFraction = i / (classCount - 1 || 1);
        const swatchVal = minVal + (maxVal - minVal) * valFraction;

        legendG.append('rect')
          .attr('x', i * (boxW + 2))
          .attr('y', 0)
          .attr('width', boxW)
          .attr('height', boxH)
          .attr('fill', colorScale(swatchVal))
          .attr('stroke', '#475569')
          .attr('stroke-width', 0.8);
      }

      legendG.append('text')
        .attr('x', 0)
        .attr('y', boxH + 13)
        .attr('font-size', `${styleConfig.fontSizeFooter}px`)
        .attr('fill', '#64748b')
        .attr('font-family', styleConfig.fontFamily)
        .text(`${Math.round(minVal)} (최저)`);

      legendG.append('text')
        .attr('x', (classCount - 1) * (boxW + 2) + boxW)
        .attr('y', boxH + 13)
        .attr('text-anchor', 'end')
        .attr('font-size', `${styleConfig.fontSizeFooter}px`)
        .attr('fill', '#64748b')
        .attr('font-family', styleConfig.fontFamily)
        .text(`${Math.round(maxVal)} (최고)`);
    }

    // Source Footer
    const footerG = svg.append('g').attr('transform', `translate(${width - 25}, ${height - 20})`);
    footerG.append('text')
      .attr('text-anchor', 'end')
      .attr('font-size', `${styleConfig.fontSizeFooter}px`)
      .attr('fill', '#64748b')
      .attr('font-family', styleConfig.fontFamily)
      .text(`출처: ${dataset.originalSource}`);

  }, [dataset, mapType, mapRegion, classificationMethod, classCount, dotUnit, styleConfig, exportTransparent]);

  // Export Map as High-Res PNG
  const exportAsPng = async () => {
    if (!containerRef.current) return;
    const canvas = await html2canvas(containerRef.current, {
      scale: 3,
      backgroundColor: exportTransparent ? null : '#ffffff',
      useCORS: true
    });
    const link = document.createElement('a');
    link.download = `${dataset.title.replace(/[\s\[\]]/g, '_')}_통계지도_${mapType}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Export Map as Vector SVG
  const exportAsSvg = () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgRef.current);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const link = document.createElement('a');
    link.download = `${dataset.title.replace(/[\s\[\]]/g, '_')}_통계지도_${mapType}.svg`;
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  // Copy Image to Clipboard
  const copyToClipboard = async () => {
    if (!containerRef.current) return;
    const canvas = await html2canvas(containerRef.current, {
      scale: 2,
      backgroundColor: exportTransparent ? null : '#ffffff',
      useCORS: true
    });
    canvas.toBlob(async (blob) => {
      if (blob) {
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (err) {
          alert('클립보드 복사 권한이 거부되었거나 지원되지 않습니다.');
        }
      }
    });
  };

  return (
    <div className="flex h-full min-h-[calc(100vh-80px)] overflow-hidden">
      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        
        {/* Top Map Control Bar */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <MapIcon className="w-4 h-4 text-blue-600" />
              유니버설 통계지도(Map) 스튜디오 (5대 통계지도 전면 지원)
            </h3>
            <div className="flex items-center gap-2 text-xs">
              <select
                value={mapRegion}
                onChange={(e) => setMapRegion(e.target.value as MapRegionType)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 font-semibold text-slate-700 bg-white"
              >
                <option value="korea_sido">대한민국 17개 시도</option>
                <option value="world_countries">세계 주요 국가</option>
              </select>

              <select
                value={classificationMethod}
                onChange={(e) => setClassificationMethod(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 font-semibold text-slate-700 bg-white"
              >
                <option value="equal">등간격 분류 (Equal Interval)</option>
                <option value="quantile">분위수 분류 (Quantile)</option>
              </select>

              <select
                value={classCount}
                onChange={(e) => setClassCount(Number(e.target.value))}
                className="px-3 py-1.5 rounded-xl border border-slate-300 font-semibold text-slate-700 bg-white"
              >
                <option value="3">3단계 계급</option>
                <option value="4">4단계 계급</option>
                <option value="5">5단계 계급 (표준)</option>
                <option value="6">6단계 계급</option>
              </select>
            </div>
          </div>

          {/* Map Type 5 Buttons */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              { id: 'choropleth', label: '1. 단계구분도 (Choropleth)' },
              { id: 'proportionalSymbol', label: '2. 도형표현도 (Proportional Symbol)' },
              { id: 'dotDensity', label: '3. 점묘도 (Dot Density)' },
              { id: 'flow', label: '4. 유선도 (Flow Map)' },
              { id: 'cartogram', label: '5. 카토그램 (Cartogram)' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setMapType(m.id as MapType)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition border ${
                  mapType === m.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Dot Unit Slider (when dot density is selected) */}
          {mapType === 'dotDensity' && (
            <div className="pt-2 border-t border-slate-100 flex items-center gap-4 text-xs animate-in fade-in duration-150">
              <span className="font-semibold text-slate-700">1개 점(Dot) 당 단위 수치: {dotUnit}</span>
              <input
                type="range"
                min="10"
                max="500"
                step="10"
                value={dotUnit}
                onChange={(e) => setDotUnit(Number(e.target.value))}
                className="w-48 accent-blue-600"
              />
            </div>
          )}
        </div>

        {/* Map Preview Canvas */}
        <div className="bg-slate-100/70 p-4 sm:p-8 rounded-3xl border border-slate-200 flex items-center justify-center overflow-auto min-h-[520px]">
          <div
            ref={containerRef}
            style={{
              width: `${styleConfig.width}px`,
              height: `${styleConfig.height}px`,
            }}
            className="bg-white rounded-2xl shadow-lg border border-slate-200 flex items-center justify-center shrink-0 transition-all overflow-hidden relative"
          >
            <svg ref={svgRef} className="w-full h-full block"></svg>
          </div>
        </div>

        {/* Bottom Export Bar */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
              <input
                type="checkbox"
                checked={exportTransparent}
                onChange={(e) => setExportTransparent(e.target.checked)}
                className="rounded text-blue-600"
              />
              <span>투명 배경 (Transparent)</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? '복사 완료!' : '클립보드 복사'}
            </button>

            <button
              onClick={exportAsSvg}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
            >
              <Download className="w-3.5 h-3.5" />
              SVG 벡터 저장
            </button>

            <button
              onClick={exportAsPng}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition"
            >
              <Download className="w-3.5 h-3.5" />
              PNG 다운로드 (시험지 삽입용)
            </button>
          </div>
        </div>

      </div>

      {/* Right Styling Inspector Panel */}
      <StyleInspector
        styleConfig={styleConfig}
        onChangeStyle={onUpdateStyleConfig}
        seriesNames={[primarySeries.name]}
        isOpen={isInspectorOpen}
        onToggleOpen={() => setIsInspectorOpen(!isInspectorOpen)}
      />
    </div>
  );
};
