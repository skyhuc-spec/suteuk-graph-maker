import React, { useState } from 'react';
import { 
  FileText, Sparkles, Copy, Check, Printer, Download, 
  HelpCircle, CheckCircle, RefreshCw, Layers, Edit3, Trash2
} from 'lucide-react';
import { StatDataset, ExamQuestion, AppSettings, StyleConfig } from '../types';

interface ExamQuestionStudioProps {
  dataset: StatDataset | null;
  settings: AppSettings;
  styleConfig: StyleConfig;
}

export const ExamQuestionStudio: React.FC<ExamQuestionStudioProps> = ({ dataset, settings, styleConfig }) => {
  if (!dataset) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">통계 데이터가 없습니다</h3>
        <p className="text-sm text-slate-500 mb-6">먼저 1번 '다중 입력' 탭에서 데이터를 불러와주세요.</p>
      </div>
    );
  }

  // Pre-loaded CSAT questions for current dataset
  const [questions, setQuestions] = useState<ExamQuestion[]>([
    {
      id: 'q-1',
      number: 1,
      title: '수능·학평 한국지리 3점 단골 문항',
      score: 3,
      questionText: `다음 자료는 (가)와 (나)에 해당하는 통계 자료이다. 이에 대한 설명으로 옳은 것만을 <보기>에서 있는 대로 고른 것은? [3점]`,
      boxContent: `ㄱ. ${dataset.categories[0] || '지역A'}은(는) ${dataset.categories[1] || '지역B'}보다 ${dataset.series[0]?.name || '통계값'}이 크다.
ㄴ. ${dataset.series[1]?.name ? `${dataset.series[1].name}의 전국 비중은 수도권이 비수도권보다 높다.` : '최대값과 최솟값의 차이는 지방권이 더 크다.'}
ㄷ. 최근 연도에서 ${dataset.categories[2] || '지역C'}의 변화율은 양(+)의 값을 나타낸다.
ㄹ. (가)와 (나) 모두에서 ${dataset.categories[0] || '지역A'}이 차지하는 비중은 20% 이상이다.`,
      choices: [
        '① ㄱ, ㄴ',
        '② ㄱ, ㄷ',
        '③ ㄴ, ㄷ',
        '④ ㄴ, ㄹ',
        '⑤ ㄷ, ㄹ'
      ],
      correctAnswer: 2,
      explanation: `${dataset.notes || '교과서 통계 분석'}\n\n- ㄱ (옳음): ${dataset.categories[0]}의 수치가 ${dataset.categories[1]}보다 통계적으로 높게 형성되어 있습니다.\n- ㄴ (틀림): 수도권 집중 추이와 지방 광역시 간의 격차를 정밀 확인해야 합니다.\n- ㄷ (옳음): 제시된 시계열 통계표에서 확인 가능합니다.`,
      conceptPoints: [
        '지역 간 불균형 및 인구·산업 분포 패턴 이해',
        '통계 도표 및 백분율 구성비 교차 분석',
        '수능 출제 가이드라인 지리적 개념 적용'
      ],
      includeChart: true,
      includeMap: false,
    }
  ]);

  const [activeQIndex, setActiveQIndex] = useState(0);
  const [copiedHwp, setCopiedHwp] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const currentQ = questions[activeQIndex] || questions[0];

  // AI Generate CSAT Question
  const handleGenerateAiQuestion = async () => {
    setGenerating(true);
    setGenError(null);
    try {
      const prompt = `
당신은 대한민국 대학수학능력시험(수능) 및 전국연합학력평가 사회탐구영역(한국지리, 세계지리, 사회·문화) 출제위원입니다.
아래 제공된 통계 데이터를 바탕으로 정통 수능 5지선다형 시험 문항 1개를 생성해주세요.

[통계 데이터]
- 제목: ${dataset.title}
- 단위: ${dataset.unit}
- 항목/지역: ${dataset.categories.slice(0, 10).join(', ')}
- 지표들: ${dataset.series.map(s => `${s.name}: [${s.data.slice(0, 5).join(', ')}...]`).join(' / ')}

[출력 JSON 스키마 (마크다운 없이 순수 JSON)]
{
  "questionText": "다음 자료는 ... 이에 대한 옳은 설명만을 <보기>에서 고른 것은? [3점]",
  "boxContent": "ㄱ. ...\\nㄴ. ...\\nㄷ. ...\\nㄹ. ...",
  "choices": ["① ㄱ, ㄴ", "② ㄱ, ㄷ", "③ ㄴ, ㄷ", "④ ㄴ, ㄹ", "⑤ ㄷ, ㄹ"],
  "correctAnswer": 2,
  "explanation": "정답 해설...",
  "conceptPoints": ["출제 핵심 개념 1", "출제 핵심 개념 2"]
}
      `;

      const res = await fetch('/api/analyze-stat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customPrompt: prompt,
          apiKey: settings.apiKey,
          modelName: settings.modelName
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || '문항 생성에 실패했습니다.');
      }

      if (json.data) {
        const d = json.data;
        const newQ: ExamQuestion = {
          id: 'q-' + Date.now(),
          number: questions.length + 1,
          title: `수능 연계 출제 문항 ${questions.length + 1}`,
          score: 3,
          questionText: d.questionText || '다음 자료에 대한 설명으로 옳은 것은? [3점]',
          boxContent: d.boxContent || 'ㄱ. ...\nㄴ. ...\nㄷ. ...\nㄹ. ...',
          choices: d.choices || ['① ㄱ, ㄴ', '② ㄱ, ㄷ', '③ ㄴ, ㄷ', '④ ㄴ, ㄹ', '⑤ ㄷ, ㄹ'],
          correctAnswer: d.correctAnswer || 1,
          explanation: d.explanation || '해설',
          conceptPoints: d.conceptPoints || ['지리 통계 해석'],
          includeChart: true,
          includeMap: false,
        };

        setQuestions([...questions, newQ]);
        setActiveQIndex(questions.length);
      }
    } catch (err: any) {
      console.error(err);
      setGenError(err.message || '문항 자동 생성 중 오류가 발생했습니다.');
    } finally {
      setGenerating(false);
    }
  };

  // Copy HWP Formatted Text
  const copyForHwp = () => {
    const text = `
[${currentQ.number}번] ${currentQ.questionText}

<보 기>
${currentQ.boxContent}

${currentQ.choices.join('   ')}

[정답 및 해설]
정답: ${currentQ.choices[currentQ.correctAnswer - 1] || currentQ.correctAnswer}
해설:
${currentQ.explanation}

[출제 통계 출처]
${dataset.title} (출처: ${dataset.originalSource}, 단위: ${dataset.unit})
    `.trim();

    navigator.clipboard.writeText(text).then(() => {
      setCopiedHwp(true);
      setTimeout(() => setCopiedHwp(false), 2000);
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-2 border border-blue-400/30">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            수능·내신 기출 스타일 출제 엔진
          </div>
          <h2 className="text-2xl font-black tracking-tight">사회·지리 시험 문항 및 한글(HWP) 시험지 생성</h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            추출된 통계 자료와 연동하여 정통 수능형 5지선다 문항, &lt;보기&gt; 선지, 정답 및 해설을 제작하고 한글(HWP) 시험지로 원클릭 복사합니다.
          </p>
        </div>

        <button
          onClick={handleGenerateAiQuestion}
          disabled={generating}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl text-xs font-bold shadow-lg transition flex items-center gap-2 shrink-0"
        >
          {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {generating ? '수능형 문항 출제 중...' : 'AI 신규 수능형 문항 자동 생성'}
        </button>
      </div>

      {/* Error Message */}
      {genError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl text-xs flex items-center justify-between gap-3">
          <span>{genError}</span>
          <button
            onClick={() => setGenError(null)}
            className="text-amber-700 hover:text-amber-900 font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Question Card & Worksheet Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Questions Navigator */}
        <div className="space-y-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
            <h4 className="font-bold text-xs text-slate-700 mb-3 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              출제 문항 목록 ({questions.length}개)
            </h4>
            <div className="space-y-1.5">
              {questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => setActiveQIndex(idx)}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition flex items-center justify-between ${
                    activeQIndex === idx
                      ? 'border-blue-600 bg-blue-50/70 font-bold text-blue-900 shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
                      {q.number}
                    </span>
                    <span className="truncate max-w-[170px]">{q.title}</span>
                  </div>
                  <span className="text-[10px] text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded font-mono">
                    [{q.score}점]
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 space-y-1">
            <div className="font-bold flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              한글(HWP) 최적화 복사
            </div>
            <p className="text-blue-800/80 leading-relaxed">
              우측 '한글(HWP) 시험지 양식 복사'를 누르면 문항 발문, &lt;보기&gt;, 5지선다, 정답 및 해설이 한글 워드프로세서에 바로 붙여넣을 수 있는 규격 텍스트로 복사됩니다.
            </p>
          </div>
        </div>

        {/* Right: Question Paper Preview (한글 시험지 뷰어) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
            
            {/* Exam Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-slate-900">{currentQ.number}.</span>
                <span className="text-base font-bold text-slate-800 leading-snug">
                  {currentQ.questionText}
                </span>
              </div>
              <button
                onClick={copyForHwp}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 shrink-0"
              >
                {copiedHwp ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedHwp ? '복사 완료!' : '한글(HWP) 양식 복사'}
              </button>
            </div>

            {/* Embedded Chart Reference Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center text-center space-y-2">
              <div className="text-xs font-bold text-slate-700">
                [자료] {dataset.title} (단위: {dataset.unit})
              </div>
              <p className="text-[11px] text-slate-500">
                (앞선 3번 '도표 스튜디오' 또는 4번 '통계지도'에서 내보낸 고해상도 이미지를 시험지 상단에 삽입하세요)
              </p>
            </div>

            {/* <보기> Box */}
            {currentQ.boxContent && (
              <div className="border border-slate-400 rounded-xl p-4 bg-slate-50/50 space-y-2 text-xs font-medium text-slate-900">
                <div className="font-bold text-center text-slate-800 pb-1 border-b border-slate-200">
                  &lt; 보 기 &gt;
                </div>
                <div className="whitespace-pre-line leading-relaxed pl-2">
                  {currentQ.boxContent}
                </div>
              </div>
            )}

            {/* Choices 1 to 5 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-xs">
              {currentQ.choices.map((choice, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded-xl border font-semibold ${
                    currentQ.correctAnswer === i + 1
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold'
                      : 'border-slate-200 text-slate-800'
                  }`}
                >
                  {choice}
                  {currentQ.correctAnswer === i + 1 && (
                    <span className="ml-2 text-[10px] text-emerald-600 bg-emerald-100 px-1 py-0.5 rounded">정답</span>
                  )}
                </div>
              ))}
            </div>

            {/* Teacher's Explanation & Pedagogical Points */}
            <div className="pt-4 border-t border-slate-200 space-y-2">
              <h5 className="font-bold text-xs text-indigo-900 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                출제 해설 및 지도 교사용 출제 포인트
              </h5>
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 text-xs text-indigo-950 whitespace-pre-line leading-relaxed">
                {currentQ.explanation}
              </div>

              {currentQ.conceptPoints && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {currentQ.conceptPoints.map((pt, i) => (
                    <span key={i} className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                      #{pt}
                    </span>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
