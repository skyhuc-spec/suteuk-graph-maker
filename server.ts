import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 3000;

// API endpoint for Gemini Vision + Google Search Grounding stat analysis
app.post('/api/analyze-stat', async (req, res) => {
  try {
    const { imageBase64, mimeType, customPrompt, apiKey, modelName } = req.body;
    
    const activeApiKey = apiKey || process.env.GEMINI_API_KEY;
    if (!activeApiKey) {
      return res.status(400).json({ 
        success: false,
        error: 'Gemini API Key가 설정되지 않았습니다. 우측 상단 [설정]에서 API Key를 입력해주세요.' 
      });
    }

    const ai = new GoogleGenAI({ 
      apiKey: activeApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    // Valid modern models per @google/genai guidelines
    const requestedModel = modelName && !modelName.includes('2.5') ? modelName : 'gemini-4-hydrogen';
    const candidateModels = Array.from(new Set([
      requestedModel,
      'gemini-4-hydrogen',
      'gemini-3.1-flash-lite',
      'gemini-3.8-flash',
    ]));

    const promptText = customPrompt || `
당신은 대한민국 중고등학교 사회 및 지리 교과서(수능특강, 한국지리, 세계지리 등)의 최고 권위 통계 분석 전문가입니다.
제공된 이미지(교과서 도표, 그래프, 통계표)를 정밀 분석하여 아래 규칙에 따라 정확하고 구조화된 JSON 데이터로 변환해주세요.

[엄격한 제약 규칙]
1. 제로-할루시네이션(Zero-Hallucination) 원칙: 이미지에 명시된 수치와 텍스트를 철저히 추출하되, 최신 공식 통계 기관(통계청 KOSIS, 한국은행, World Bank, FAO, IEA, UN 등)의 데이터와 대조하여 검증하세요.
2. 원출처(Original Source) 확인: 이미지 하단에 표기된 출처(예: 통계청, 관세청 등)를 파악하고, 최신 공식 수치를 확인하세요. 데이터가 불확실하거나 없는 셀은 반드시 "미확인(공식 데이터 없음)" 또는 null로 표기하십시오.
3. 출력 형식: 반드시 마크다운 코드 블록(\`\`\`json ... \`\`\`) 없이 순수 JSON 객체 또는 \`\`\`json으로 감싼 아래 스키마 형태로만 응답하세요.

{
  "title": "통계표 제목 (예: 시도별 1차 에너지 공급량)",
  "unit": "단위 (예: 천 TOE, %, 백만 달러)",
  "originalSource": "원출처 (예: 통계청 KOSIS 2024)",
  "sourceSubstitution": "출처 검증 및 대체 사유 (해당되는 경우 기재, 없으면 '원출처 일치')",
  "categories": ["서울", "부산", "대구", "인천", "광주", "대전", "울산", "경기"],
  "series": [
    {
      "name": "2020년",
      "data": [120.5, 45.2, 38.1, 89.4, 25.6, 27.2, 55.8, 142.3]
    },
    {
      "name": "2024년",
      "data": [115.0, 43.0, 37.0, 95.0, 26.0, 28.0, 58.0, 150.0]
    }
  ],
  "notes": "교과서 출제 포인트 및 지리적 분석 해설 (선생님 참고용)"
}
    `;

    const contents = imageBase64 ? {
      parts: [
        {
          inlineData: {
            data: imageBase64.replace(/^data:image\/[a-z0-9+.-]+;base64,/, ''),
            mimeType: mimeType || 'image/jpeg'
          }
        },
        { text: promptText }
      ]
    } : promptText;

    let response: any = null;
    let lastError: any = null;

    // Multi-tier attempt: first with Search Grounding, if failed retry without Grounding tool
    for (const model of candidateModels) {
      // 1. Try with search grounding
      try {
        response = await ai.models.generateContent({
          model,
          contents: contents as any,
          config: {
            tools: [{ googleSearch: {} }]
          }
        });
        if (response?.text) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${model} with search failed, attempting without search grounding...`);
      }

      // 2. Try without search grounding (saves quota and avoids tool 429)
      try {
        response = await ai.models.generateContent({
          model,
          contents: contents as any,
        });
        if (response?.text) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${model} without search failed:`, err.message || err);
      }
    }

    if (!response || !response.text) {
      const errStr = lastError?.message || JSON.stringify(lastError) || '';
      if (errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED') || errStr.includes('quota')) {
        return res.status(429).json({
          success: false,
          isQuotaExceeded: true,
          error: 'Google Gemini API 무료 호출 한도(Quota 429)가 초과되었습니다. 우측 상단 [설정]에서 본인의 Gemini API Key를 입력하시거나, [추천 프리셋 샘플]을 불러와 모든 기능을 바로 사용하실 수 있습니다.'
        });
      }
      if (errStr.includes('403') || errStr.includes('PERMISSION_DENIED') || errStr.includes('API_KEY_INVALID')) {
        return res.status(403).json({
          success: false,
          error: 'Gemini API Key 권한이 없거나 유효하지 않습니다. 우측 상단 [설정]에서 올바른 API Key를 입력해주세요.'
        });
      }
      throw lastError || new Error('모든 Gemini 모델 호출에 실패했습니다.');
    }

    const rawText = response.text || '';
    
    let jsonStr = rawText.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```/, '').replace(/```$/, '').trim();
    }

    let parsedData;
    try {
      parsedData = JSON.parse(jsonStr);
    } catch (e) {
      const firstBrace = jsonStr.indexOf('{');
      const lastBrace = jsonStr.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        parsedData = JSON.parse(jsonStr.substring(firstBrace, lastBrace + 1));
      } else {
        throw new Error('AI 응답을 JSON으로 파싱할 수 없습니다: ' + rawText);
      }
    }

    res.json({ success: true, data: parsedData, rawResponse: rawText });

  } catch (error: any) {
    console.error('Analyze Stat Error:', error);
    const msg = error.message || '통계 분석 중 오류가 발생했습니다.';
    res.status(500).json({ success: false, error: msg });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
