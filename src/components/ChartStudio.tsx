import React, { useState, useRef, useEffect } from 'react';
import { 
  BarChart3, PieChart, LineChart, Download, Copy, Printer, Check, 
  Sparkles, Layers, Sliders, RefreshCw, ZoomIn, Eye, FileText, Image as ImageIcon
} from 'lucide-react';
import { StatDataset, ChartType, StyleConfig, AppSettings } from '../types';
import { Chart as ChartJS, registerables } from 'chart.js';
import { Chart } from 'react-chartjs-2';
import html2canvas from 'html2canvas';
import { StyleInspector } from './StyleInspector';
import { getExamPatterns } from '../utils/patternGenerator';

ChartJS.register(...registerables);

interface ChartStudioProps {
  dataset: StatDataset | null;
  settings: AppSettings;
  styleConfig: StyleConfig;
  onUpdateStyleConfig: (newStyle: StyleConfig) => void;
  onUpdateDataset: (updated: StatDataset) => void;
}

export const ChartStudio: React.FC<ChartStudioProps> = ({ 
  dataset, 
  settings, 
  styleConfig, 
  onUpdateStyleConfig,
  onUpdateDataset,
}) => {
  if (!dataset) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">통계 데이터가 없습니다</h3>
        <p className="text-sm text-slate-500 mb-6">먼저 1번 '다중 입력' 탭에서 데이터를 불러와주세요.</p>
      </div>
    );
  }

  const [chartType, setChartType] = useState<ChartType>('bar');
  const [copied, setCopied] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(true);
  const [exportTransparent, setExportTransparent] = useState(false);
  const [exportScale, setExportScale] = useState<2 | 3>(3);

  // Editable titles
  const [editableTitle, setEditableTitle] = useState(dataset.title);
  const [editableSubtitle, setEditableSubtitle] = useState(dataset.notes || '');
  const [editableUnit, setEditableUnit] = useState(dataset.unit);
  const [editableSource, setEditableSource] = useState(dataset.originalSource);

  // Y-axis manual bounds
  const [manualYAxis, setManualYAxis] = useState(false);
  const [yMin, setYMin] = useState<number | ''>('');
  const [yMax, setYMax] = useState<number | ''>('');
  const [yStep, setYStep] = useState<number | ''>('');

  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Filter out excluded regions
  const excluded = dataset.excludedRegions || [];
  const activeIndices: number[] = [];
  const filteredCategories = dataset.categories.filter((cat, idx) => {
    if (!excluded.includes(cat)) {
      activeIndices.push(idx);
      return true;
    }
    return false;
  });

  const filteredSeries = dataset.series.map(s => ({
    ...s,
    data: activeIndices.map(idx => s.data[idx])
  }));

  const isBw = styleConfig.paletteTheme === 'monochrome';

  // Prepare Chart.js Dataset
  const getChartJsData = () => {
    // Canvas context for patterns
    const dummyCanvas = document.createElement('canvas');
    const ctx = dummyCanvas.getContext('2d');
    const patterns = ctx ? getExamPatterns(ctx) : [];

    const colors = styleConfig.customSeriesColors;

    // Circular charts (Pie / Doughnut)
    if (chartType === 'pie' || chartType === 'doughnut') {
      const s = filteredSeries[0] || { name: '값', data: [] };
      return {
        labels: filteredCategories,
        datasets: [{
          label: s.name,
          data: s.data.map(v => v ?? 0),
          backgroundColor: isBw && patterns.length 
            ? filteredCategories.map((_, i) => patterns[i % patterns.length])
            : filteredCategories.map((_, i) => colors[i % colors.length]),
          borderColor: isBw ? '#000000' : '#ffffff',
          borderWidth: styleConfig.borderWidth,
          cutout: chartType === 'doughnut' ? `${styleConfig.donutCutoutPercent}%` : undefined
        }]
      };
    }

    // Pareto Chart (Sorted Descending Bar + Cumulative % Line)
    if (chartType === 'pareto') {
      const s = filteredSeries[0] || { name: '값', data: [] };
      const items = filteredCategories.map((cat, i) => ({
        cat,
        val: s.data[i] ?? 0
      })).sort((a, b) => b.val - a.val);

      const total = items.reduce((acc, curr) => acc + curr.val, 0);
      let runningSum = 0;
      const cumulativePercents = items.map(item => {
        runningSum += item.val;
        return total > 0 ? Math.round((runningSum / total) * 100 * 10) / 10 : 0;
      });

      return {
        labels: items.map(i => i.cat),
        datasets: [
          {
            type: 'bar' as const,
            label: `${s.name} (수치)`,
            data: items.map(i => i.val),
            backgroundColor: isBw && patterns.length ? patterns[0] : colors[0],
            borderColor: isBw ? '#000000' : colors[0],
            borderWidth: styleConfig.borderWidth,
            yAxisID: 'y',
          },
          {
            type: 'line' as const,
            label: '누적 점유율 (%)',
            data: cumulativePercents,
            borderColor: isBw ? '#000000' : '#ef4444',
            backgroundColor: isBw ? '#000000' : '#ef4444',
            borderWidth: styleConfig.lineStrokeWidth,
            pointRadius: styleConfig.pointRadius,
            yAxisID: 'y1',
          }
        ]
      };
    }

    // Radar Chart
    if (chartType === 'radar') {
      return {
        labels: filteredCategories,
        datasets: filteredSeries.map((s, sIdx) => {
          const col = colors[sIdx % colors.length];
          return {
            label: s.name,
            data: s.data.map(v => v ?? 0),
            backgroundColor: isBw ? 'rgba(0,0,0,0.1)' : `${col}33`,
            borderColor: isBw ? '#000000' : col,
            borderWidth: styleConfig.lineStrokeWidth,
            pointBackgroundColor: isBw ? '#000000' : col,
            pointRadius: styleConfig.pointRadius,
          };
        })
      };
    }

    // Scatter / Bubble Chart
    if (chartType === 'scatter' || chartType === 'bubble') {
      const s1 = filteredSeries[0] || { name: 'X축', data: [] };
      const s2 = filteredSeries[1] || filteredSeries[0];
      const s3 = filteredSeries[2] || filteredSeries[0];

      return {
        datasets: [{
          label: `${s1.name} vs ${s2.name}`,
          data: filteredCategories.map((_, i) => ({
            x: s1.data[i] ?? 0,
            y: s2.data[i] ?? 0,
            r: chartType === 'bubble' ? Math.max(5, Math.min(30, (s3.data[i] ?? 10) / 5)) : undefined
          })),
          backgroundColor: isBw ? '#333333' : colors[0],
          borderColor: isBw ? '#000000' : colors[0],
          borderWidth: styleConfig.borderWidth,
        }]
      };
    }

    // Standard Bars, Lines, Stacked, Combo
    const is100Percent = chartType === 'percentStackedBar';
    return {
      labels: filteredCategories,
      datasets: filteredSeries.map((s, sIdx) => {
        const isLine = chartType === 'line' || chartType === 'stackedArea' || (chartType === 'combo' && sIdx > 0);
        const col = colors[sIdx % colors.length];
        const pat = patterns[sIdx % patterns.length];

        return {
          type: isLine ? ('line' as const) : ('bar' as const),
          label: s.name,
          data: s.data.map(v => v ?? 0),
          backgroundColor: isBw && pat && !isLine ? pat : `${col}`,
          borderColor: isBw ? '#000000' : col,
          borderWidth: isLine ? styleConfig.lineStrokeWidth : styleConfig.borderWidth,
          fill: chartType === 'stackedArea',
          tension: 0.25,
          pointRadius: isLine ? styleConfig.pointRadius : undefined,
          barPercentage: styleConfig.barThicknessRatio,
          stack: chartType === 'stackedBar' || is100Percent || chartType === 'stackedArea' ? 'stack0' : undefined,
          yAxisID: chartType === 'combo' && sIdx > 0 ? 'y1' : 'y'
        };
      })
    };
  };

  // Prepare Chart.js Options
  const getChartJsOptions = () => {
    const isHorizontal = chartType === 'horizontalBar';
    const isStacked = chartType === 'stackedBar' || chartType === 'percentStackedBar' || chartType === 'stackedArea';
    const hasDualY = chartType === 'combo' || chartType === 'pareto';

    return {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: isHorizontal ? ('y' as const) : ('x' as const),
      plugins: {
        legend: {
          display: styleConfig.legendPosition !== 'hidden',
          position: (styleConfig.legendPosition === 'hidden' ? 'top' : styleConfig.legendPosition) as any,
          labels: {
            font: {
              family: styleConfig.fontFamily,
              size: styleConfig.fontSizeLegend,
              weight: 'bold'
            },
            color: '#0f172a'
          }
        },
        tooltip: {
          enabled: true,
          bodyFont: { family: styleConfig.fontFamily }
        }
      },
      scales: chartType === 'pie' || chartType === 'doughnut' || chartType === 'radar' ? {} : {
        x: {
          stacked: isStacked,
          grid: { display: !isBw },
          ticks: {
            font: {
              family: styleConfig.fontFamily,
              size: styleConfig.fontSizeAxis,
              weight: styleConfig.isBoldAxis ? 'bold' : 'normal'
            },
            color: '#334155'
          }
        },
        y: {
          stacked: isStacked,
          grid: { display: !isBw },
          min: manualYAxis && yMin !== '' ? Number(yMin) : undefined,
          max: manualYAxis && yMax !== '' ? Number(yMax) : undefined,
          ticks: {
            stepSize: manualYAxis && yStep !== '' ? Number(yStep) : undefined,
            font: {
              family: styleConfig.fontFamily,
              size: styleConfig.fontSizeAxis,
              weight: styleConfig.isBoldAxis ? 'bold' : 'normal'
            },
            color: '#334155'
          },
          title: {
            display: !!editableUnit,
            text: editableUnit,
            font: { family: styleConfig.fontFamily, size: styleConfig.fontSizeAxis + 1, weight: 'bold' }
          }
        },
        ...(hasDualY ? {
          y1: {
            position: 'right' as const,
            grid: { drawOnChartArea: false },
            ticks: {
              font: { family: styleConfig.fontFamily, size: styleConfig.fontSizeAxis },
              color: '#64748b'
            },
            title: {
              display: true,
              text: chartType === 'pareto' ? '누적 %' : '보조지표',
              font: { family: styleConfig.fontFamily, size: styleConfig.fontSizeAxis, weight: 'bold' }
            }
          }
        } : {})
      }
    };
  };

  // High-Resolution PNG Export
  const exportAsPng = async () => {
    if (!chartContainerRef.current) return;
    const canvas = await html2canvas(chartContainerRef.current, {
      scale: exportScale,
      backgroundColor: exportTransparent ? null : '#ffffff',
      useCORS: true
    });
    const link = document.createElement('a');
    link.download = `${editableTitle.replace(/[\s\[\]]/g, '_')}_${chartType}_고해상도.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Clipboard Copy
  const copyToClipboard = async () => {
    if (!chartContainerRef.current) return;
    const canvas = await html2canvas(chartContainerRef.current, {
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

  // SVG Export
  const exportAsSvg = () => {
    if (!chartContainerRef.current) return;
    // Generate clean SVG envelope with foreignObject or canvas snapshot
    const svgData = `
<svg xmlns="http://www.w3.org/2000/svg" width="${styleConfig.width}" height="${styleConfig.height}" viewBox="0 0 ${styleConfig.width} ${styleConfig.height}">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700&amp;family=Noto+Sans+KR:wght@400;700&amp;display=swap');
    text { font-family: '${styleConfig.fontFamily}', sans-serif; }
  </style>
  ${exportTransparent ? '' : `<rect width="${styleConfig.width}" height="${styleConfig.height}" fill="#ffffff"/>`}
  <foreignObject width="100%" height="100%">
    <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%;">
      ${chartContainerRef.current.innerHTML}
    </div>
  </foreignObject>
</svg>
    `;
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const link = document.createElement('a');
    link.download = `${editableTitle.replace(/[\s\[\]]/g, '_')}_${chartType}.svg`;
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  return (
    <div className="flex h-full min-h-[calc(100vh-80px)] overflow-hidden">
      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        
        {/* Top Chart Type Switcher Bar */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              유니버설 차트 유형 선택 (14가지 도표 실시간 전환)
            </h3>
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => setManualYAxis(!manualYAxis)}
                className={`px-3 py-1.5 rounded-xl font-semibold border transition ${
                  manualYAxis ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 text-slate-700 border-slate-300'
                }`}
              >
                Y축 눈금 수동 조절 {manualYAxis ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* Chart Types Pill Grid */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              { id: 'bar', label: '세로 막대' },
              { id: 'horizontalBar', label: '가로 막대' },
              { id: 'stackedBar', label: '누적 막대' },
              { id: 'percentStackedBar', label: '100% 누적' },
              { id: 'pie', label: '파이(원형)' },
              { id: 'doughnut', label: '도넛' },
              { id: 'line', label: '꺾은선' },
              { id: 'stackedArea', label: '누적 영역' },
              { id: 'combo', label: '콤보(막대+선)' },
              { id: 'pareto', label: '파레토도 (80:20)' },
              { id: 'radar', label: '방사형(레이더)' },
              { id: 'scatter', label: '산점도' },
              { id: 'bubble', label: '버블' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setChartType(t.id as ChartType)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                  chartType === t.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Manual Y Axis Controls */}
          {manualYAxis && (
            <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-2 text-xs animate-in fade-in duration-150">
              <div>
                <label className="block text-slate-600 mb-0.5">Y축 최솟값 (Min)</label>
                <input
                  type="number"
                  value={yMin}
                  onChange={(e) => setYMin(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="자동"
                  className="w-full px-2 py-1 rounded border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-0.5">Y축 최댓값 (Max)</label>
                <input
                  type="number"
                  value={yMax}
                  onChange={(e) => setYMax(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="자동"
                  className="w-full px-2 py-1 rounded border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-0.5">눈금 간격 (Step)</label>
                <input
                  type="number"
                  value={yStep}
                  onChange={(e) => setYStep(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="자동"
                  className="w-full px-2 py-1 rounded border border-slate-300"
                />
              </div>
            </div>
          )}
        </div>

        {/* Chart Render Canvas Container */}
        <div className="bg-slate-100/70 p-4 sm:p-8 rounded-3xl border border-slate-200 flex items-center justify-center overflow-auto min-h-[500px]">
          <div
            ref={chartContainerRef}
            style={{
              width: `${styleConfig.width}px`,
              height: `${styleConfig.height}px`,
              fontFamily: styleConfig.fontFamily,
              padding: `${styleConfig.paddingMargin}px`,
            }}
            className="bg-white rounded-2xl shadow-lg border border-slate-200 flex flex-col justify-between shrink-0 transition-all select-none relative"
          >
            {/* Chart Title Header */}
            {styleConfig.titlePosition !== 'hidden' && (
              <div className={`mb-3 ${styleConfig.titlePosition === 'top-center' ? 'text-center' : 'text-left'}`}>
                <input
                  type="text"
                  value={editableTitle}
                  onChange={(e) => setEditableTitle(e.target.value)}
                  style={{
                    fontSize: `${styleConfig.fontSizeTitle}px`,
                    fontWeight: styleConfig.isBoldTitle ? 'bold' : 'normal',
                    fontFamily: styleConfig.fontFamily,
                  }}
                  className="w-full bg-transparent border-0 outline-none text-slate-900 focus:ring-1 focus:ring-blue-400 rounded px-1"
                />
                {editableSubtitle && (
                  <div className="text-slate-500 text-[11px] px-1 mt-0.5">{editableSubtitle}</div>
                )}
              </div>
            )}

            {/* Inner Chart */}
            <div className="flex-1 w-full relative min-h-0">
              <Chart
                type={
                  (chartType === 'horizontalBar' ? 'bar' :
                  chartType === 'percentStackedBar' ? 'bar' :
                  chartType === 'combo' ? 'bar' :
                  chartType === 'pareto' ? 'bar' :
                  chartType === 'stackedBar' ? 'bar' :
                  chartType === 'stackedArea' ? 'line' :
                  chartType === 'treemap' ? 'bar' :
                  chartType) as any
                }
                data={getChartJsData() as any}
                options={getChartJsOptions() as any}
              />
            </div>

            {/* Chart Footer with Source & Unit */}
            <div 
              className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-slate-500"
              style={{ fontSize: `${styleConfig.fontSizeFooter}px` }}
            >
              <div className="flex items-center gap-1">
                <span>출처:</span>
                <input
                  type="text"
                  value={editableSource}
                  onChange={(e) => setEditableSource(e.target.value)}
                  className="bg-transparent border-0 outline-none text-slate-600 focus:ring-1 focus:ring-blue-400 rounded px-1 max-w-[250px]"
                />
              </div>
              <div className="flex items-center gap-1 font-semibold text-slate-700">
                <span>단위:</span>
                <input
                  type="text"
                  value={editableUnit}
                  onChange={(e) => setEditableUnit(e.target.value)}
                  className="bg-transparent border-0 outline-none text-slate-700 font-bold focus:ring-1 focus:ring-blue-400 rounded px-1 w-20 text-right"
                />
              </div>
            </div>
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

            <select
              value={exportScale}
              onChange={(e) => setExportScale(Number(e.target.value) as 2 | 3)}
              className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs bg-white text-slate-700"
            >
              <option value="2">2x 해상도 (기본 HWP용)</option>
              <option value="3">3x 초고해상도 (인쇄/출판용)</option>
            </select>
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
        seriesNames={filteredSeries.map(s => s.name)}
        isOpen={isInspectorOpen}
        onToggleOpen={() => setIsInspectorOpen(!isInspectorOpen)}
      />
    </div>
  );
};
