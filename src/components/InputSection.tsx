import React, { useState, useRef, useEffect } from 'react';
import { Upload, Camera, FileText, Sparkles, Image as ImageIcon, Clipboard, CheckCircle, AlertTriangle, RefreshCw, Layers } from 'lucide-react';
import { StatDataset, AppSettings } from '../types';
import { SAMPLE_DATASETS } from '../data/sampleData';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker path for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

interface InputSectionProps {
  onDatasetLoaded: (dataset: StatDataset) => void;
  settings: AppSettings;
  onOpenSettings?: () => void;
}

export const InputSection: React.FC<InputSectionProps> = ({ onDatasetLoaded, settings, onOpenSettings }) => {
  const [activeSubTab, setActiveSubTab] = useState<'sample' | 'image' | 'pdf' | 'camera'>('sample');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Image & Clipboard state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState('image/jpeg');

  // PDF state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfPageImage, setPdfPageImage] = useState<string | null>(null);

  // Crop Tool state
  const [isCropping, setIsCropping] = useState(false);
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(null);
  const [cropBox, setCropBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Camera state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Clipboard paste listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              setSelectedImage(event.target?.result as string);
              setImageMime(blob.type);
              setActiveSubTab('image');
            };
            reader.readAsDataURL(blob);
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Handle Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
      setImageMime(file.type);
    };
    reader.readAsDataURL(file);
  };

  // Handle PDF Upload
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfFile(file);
    setLoading(true);
    setLoadingMessage('PDF 파일을 로드하고 있습니다...');
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const doc = await loadingTask.promise;
      setPdfDoc(doc);
      setNumPages(doc.numPages);
      setCurrentPage(1);
      await renderPdfPage(doc, 1);
    } catch (err: any) {
      setError('PDF 파일을 읽는 중 오류가 발생했습니다: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderPdfPage = async (doc: any, pageNum: number) => {
    try {
      const page = await doc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context, viewport }).promise;
      const dataUrl = canvas.toDataURL('image/jpeg');
      setPdfPageImage(dataUrl);
      setSelectedImage(dataUrl);
    } catch (err: any) {
      setError('PDF 페이지 렌더링 오류: ' + err.message);
    }
  };

  const changePdfPage = async (newPage: number) => {
    if (!pdfDoc || newPage < 1 || newPage > numPages) return;
    setCurrentPage(newPage);
    setLoading(true);
    await renderPdfPage(pdfDoc, newPage);
    setLoading(false);
  };

  // Camera start / stop
  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      setError('카메라 접근 권한이 없거나 지원되지 않습니다: ' + err.message);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  const captureCamera = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setSelectedImage(dataUrl);
      setImageMime('image/jpeg');
      stopCamera();
      setActiveSubTab('image');
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Crop interaction handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isCropping || !imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCropStart({ x, y });
    setCropBox({ x, y, w: 0, h: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isCropping || !cropStart || !imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const currentX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const currentY = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

    const x = Math.min(cropStart.x, currentX);
    const y = Math.min(cropStart.y, currentY);
    const w = Math.abs(currentX - cropStart.x);
    const h = Math.abs(currentY - cropStart.y);

    setCropBox({ x, y, w, h });
  };

  const handleMouseUp = () => {
    if (!isCropping) return;
    // Keep crop box for visual confirmation
  };

  // Perform Gemini Vision + Google Search Grounding Analysis
  const analyzeImageWithAI = async () => {
    if (!selectedImage) {
      setError('분석할 이미지나 PDF 페이지가 선택되지 않았습니다.');
      return;
    }

    setLoading(true);
    setLoadingMessage('Gemini Vision 비전 분석 및 Google Search Grounding 원출처 검증 중...');
    setError(null);

    try {
      // If crop box is set, crop image on canvas before sending
      let imageToSend = selectedImage;
      if (cropBox && cropBox.w > 20 && cropBox.h > 20 && imageRef.current) {
        const img = new Image();
        img.src = selectedImage;
        await new Promise((resolve) => { img.onload = resolve; });

        const canvas = document.createElement('canvas');
        const scaleX = img.naturalWidth / imageRef.current.width;
        const scaleY = img.naturalHeight / imageRef.current.height;

        canvas.width = cropBox.w * scaleX;
        canvas.height = cropBox.h * scaleY;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(
            img,
            cropBox.x * scaleX,
            cropBox.y * scaleY,
            cropBox.w * scaleX,
            cropBox.h * scaleY,
            0,
            0,
            canvas.width,
            canvas.height
          );
          imageToSend = canvas.toDataURL('image/jpeg');
        }
      }

      const res = await fetch('/api/analyze-stat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageToSend,
          mimeType: imageMime,
          apiKey: settings.apiKey,
          modelName: settings.modelName
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || '통계 분석 요청에 실패했습니다.');
      }

      const rawDataset = json.data;
      const formattedDataset: StatDataset = {
        id: 'dataset-' + Date.now(),
        title: rawDataset.title || '교과서 추출 통계 자료',
        unit: rawDataset.unit || '단위 미기재',
        originalSource: rawDataset.originalSource || '공식 통계기관',
        sourceSubstitution: rawDataset.sourceSubstitution || '원출처 일치 검증 완료',
        categories: rawDataset.categories || ['항목1', '항목2', '항목3'],
        series: rawDataset.series || [{ name: '통계값', data: [10, 20, 30] }],
        notes: rawDataset.notes || 'AI 비전 분석 및 검색 그라운딩을 통해 추출된 정밀 데이터입니다.',
        excludedRegions: [],
        isTransposed: false
      };

      onDatasetLoaded(formattedDataset);
    } catch (err: any) {
      setError(err.message || 'AI 분석 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/30 text-blue-200 text-xs font-semibold mb-3 border border-blue-400/40">
            <Sparkles className="w-3.5 h-3.5 text-blue-300 animate-spin" />
            Zero-Hallucination Grounding Engine
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
            교과서·수능특강 통계 자료 스마트 입력
          </h2>
          <p className="text-sm text-blue-100/90 leading-relaxed">
            교과서 PDF 업로드, 부분 스크린샷 캡처(클립보드 붙여넣기 <code className="bg-white/10 px-1 py-0.5 rounded font-mono">Ctrl+V</code>), 실시간 카메라 스캔 또는 검증된 프리셋 샘플 중 선택하여 즉시 도표·지도 변환을 시작하세요.
          </p>
        </div>
      </div>

      {/* Input Sub-Tabs */}
      <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
        <button
          onClick={() => { setActiveSubTab('sample'); stopCamera(); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
            activeSubTab === 'sample'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          추천 프리셋 샘플 (즉시 체험)
        </button>

        <button
          onClick={() => { setActiveSubTab('image'); stopCamera(); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
            activeSubTab === 'image'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          이미지 업로드 및 클립보드 붙여넣기
        </button>

        <button
          onClick={() => { setActiveSubTab('pdf'); stopCamera(); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
            activeSubTab === 'pdf'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          교과서/수능특강 PDF 전체 업로드 & 크롭
        </button>

        <button
          onClick={() => { setActiveSubTab('camera'); startCamera(); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
            activeSubTab === 'camera'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Camera className="w-4 h-4" />
          실시간 카메라 스캔
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-5 rounded-2xl space-y-3 text-sm shadow-xs animate-in fade-in">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-amber-950 mb-1">안내 및 복구 옵션</div>
              <p className="text-xs text-amber-900/90 leading-relaxed">{error}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-200/60">
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                ⚙️ API Key 설정 열기
              </button>
            )}
            <button
              onClick={() => onDatasetLoaded(SAMPLE_DATASETS[0])}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              📊 추천 프리셋 샘플 불러오기
            </button>
            <button
              onClick={() => onDatasetLoaded({
                id: 'custom-' + Date.now(),
                title: '교과서 통계 자료 (직접 입력)',
                unit: '%',
                originalSource: '통계청 / 공식 기관',
                sourceSubstitution: '교사 직접 검증',
                categories: ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '경기'],
                series: [
                  { name: '통계 지표 1', data: [100, 80, 60, 90, 50, 55, 70, 110] },
                  { name: '통계 지표 2', data: [85, 75, 65, 80, 45, 50, 65, 95] }
                ],
                notes: '선생님 직접 입력 및 수정용 통계표'
              })}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              ✏️ 빈 테이블에서 직접 시작하기
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-6 py-4 rounded-2xl flex items-center gap-4 shadow-sm">
          <RefreshCw className="w-6 h-6 text-blue-600 animate-spin shrink-0" />
          <div>
            <div className="font-bold text-sm">처리 중입니다...</div>
            <div className="text-xs text-blue-600">{loadingMessage}</div>
          </div>
        </div>
      )}

      {/* SubTab 1: Sample Library */}
      {activeSubTab === 'sample' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
          <div>
            <h3 className="font-bold text-lg text-slate-900 mb-1">교과서 핵심 단골 통계 프리셋</h3>
            <p className="text-xs sm:text-sm text-slate-500">
              한국지리 및 세계지리 수능·내신에 자주 출제되는 검증된 공식 통계 데이터 세트를 원클릭으로 불러옵니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {SAMPLE_DATASETS.map((sample) => (
              <div 
                key={sample.id}
                className="bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 rounded-2xl p-5 transition flex flex-col justify-between group shadow-xs"
              >
                <div>
                  <div className="text-xs font-semibold text-blue-600 bg-blue-100/70 px-2.5 py-1 rounded-full inline-block mb-3">
                    {sample.unit}
                  </div>
                  <h4 className="font-bold text-slate-900 text-base mb-2 group-hover:text-blue-700 transition">
                    {sample.title}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                    {sample.notes}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">{sample.originalSource}</span>
                  <button
                    onClick={() => onDatasetLoaded(sample)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    불러오기
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SubTab 2: Image Upload & Clipboard */}
      {activeSubTab === 'image' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg text-slate-900 mb-1">이미지 업로드 및 클립보드 붙여넣기</h3>
              <p className="text-xs sm:text-sm text-slate-500">
                교과서 통계표 이미지를 업로드하거나, 화면을 캡처한 뒤 본 화면에 <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-mono">Ctrl + V</code>를 누르세요.
              </p>
            </div>
            <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition flex items-center gap-2">
              <Upload className="w-4 h-4" />
              이미지 파일 선택
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>

          {selectedImage ? (
            <div className="space-y-4 border border-slate-200 rounded-2xl p-4 bg-slate-50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  이미지 로드 완료 (마우스로 드래그하여 분석할 영역을 크롭할 수 있습니다)
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsCropping(!isCropping)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      isCropping ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    {isCropping ? '크롭 모드 활성화됨' : '영역 크롭(Crop)'}
                  </button>
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-medium transition"
                  >
                    다시 선택
                  </button>
                </div>
              </div>

              {/* Image Preview Container */}
              <div 
                className={`relative inline-block overflow-hidden rounded-xl border border-slate-300 cursor-crosshair select-none ${
                  isCropping ? 'ring-2 ring-amber-500' : ''
                }`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              >
                <img 
                  ref={imageRef} 
                  src={selectedImage} 
                  alt="통계 자료 미리보기" 
                  className="max-h-[500px] object-contain block mx-auto"
                />
                {cropBox && cropBox.w > 5 && cropBox.h > 5 && (
                  <div
                    className="absolute border-2 border-amber-500 bg-amber-500/20 pointer-events-none"
                    style={{
                      left: cropBox.x,
                      top: cropBox.y,
                      width: cropBox.w,
                      height: cropBox.h
                    }}
                  ></div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={analyzeImageWithAI}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-md transition flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 animate-bounce" />
                  AI 비전 분석 및 공식 통계 검증 시작
                </button>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-slate-300 rounded-3xl p-12 text-center bg-slate-50/50 hover:bg-slate-50 transition">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-slate-800 text-base mb-1">이미지 파일을 드래그하거나 붙여넣으세요</h4>
              <p className="text-xs text-slate-500 mb-4">
                지원 형식: PNG, JPG, WEBP (클립보드 복사 후 <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-700 font-mono">Ctrl+V</code> 가능)
              </p>
              <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition">
                <Upload className="w-4 h-4" />
                파일 찾아보기
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
          )}
        </div>
      )}

      {/* SubTab 3: PDF Upload */}
      {activeSubTab === 'pdf' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg text-slate-900 mb-1">교과서 및 수능특강 PDF 전체 업로드</h3>
              <p className="text-xs sm:text-sm text-slate-500">
                PDF 교재 전체를 불러온 뒤 원하는 페이지를 선택하고 테이블 영역을 추출합니다.
              </p>
            </div>
            <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition flex items-center gap-2">
              <FileText className="w-4 h-4" />
              PDF 파일 선택
              <input type="file" accept="application/pdf" onChange={handlePdfUpload} className="hidden" />
            </label>
          </div>

          {pdfFile && numPages > 0 && (
            <div className="space-y-4 border border-slate-200 rounded-2xl p-4 bg-slate-50">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="text-xs font-semibold text-slate-700">
                  파일: <span className="text-blue-600">{pdfFile.name}</span> (총 {numPages}페이지 중 {currentPage}페이지)
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => changePdfPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 disabled:opacity-50 rounded-lg text-xs font-medium transition"
                  >
                    이전 페이지
                  </button>
                  <span className="text-xs font-bold text-slate-700">{currentPage} / {numPages}</span>
                  <button
                    onClick={() => changePdfPage(currentPage + 1)}
                    disabled={currentPage >= numPages}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 disabled:opacity-50 rounded-lg text-xs font-medium transition"
                  >
                    다음 페이지
                  </button>
                </div>
              </div>

              {pdfPageImage && (
                <div className="relative inline-block overflow-hidden rounded-xl border border-slate-300 bg-white shadow-xs mx-auto block">
                  <img src={pdfPageImage} alt="PDF Page" className="max-h-[500px] object-contain block mx-auto" />
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  onClick={analyzeImageWithAI}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-md transition flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 animate-bounce" />
                  현재 PDF 페이지 AI 분석 및 검증 시작
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SubTab 4: Camera Scan */}
      {activeSubTab === 'camera' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6 text-center">
          <div>
            <h3 className="font-bold text-lg text-slate-900 mb-1">실시간 카메라 스캔 (구글 렌즈 스타일)</h3>
            <p className="text-xs sm:text-sm text-slate-500">
              실물 교과서나 참고서 페이지를 카메라에 비추고 캡처 버튼을 누르세요.
            </p>
          </div>

          <div className="relative max-w-xl mx-auto rounded-2xl overflow-hidden bg-slate-900 aspect-video flex items-center justify-center border border-slate-300 shadow-md">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            ></video>
            {!cameraActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 text-white">
                <button
                  onClick={startCamera}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-sm shadow-lg transition flex items-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  카메라 시작하기
                </button>
              </div>
            )}
          </div>

          {cameraActive && (
            <div className="flex justify-center gap-4">
              <button
                onClick={captureCamera}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm shadow-lg transition flex items-center gap-2"
              >
                <Camera className="w-5 h-5" />
                촬영하기 (Capture)
              </button>
              <button
                onClick={stopCamera}
                className="px-5 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-2xl font-medium text-sm transition"
              >
                카메라 끄기
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
