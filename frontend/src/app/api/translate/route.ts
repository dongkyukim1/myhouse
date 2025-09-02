import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Google Translate API 대안으로 무료 번역 서비스 사용
async function translateText(text: string, targetLang: string = 'ko'): Promise<string> {
  try {
    // MyMemory API (무료 번역 서비스)
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`
    );
    
    const data = await response.json();
    
    if (data.responseStatus === 200 && data.responseData) {
      return data.responseData.translatedText;
    }
    
    // 번역 실패 시 원문 반환
    return text;
  } catch (error) {
    console.error('번역 실패:', error);
    return text;
  }
}

// 여러 텍스트를 배치로 번역
async function translateBatch(texts: string[], targetLang: string = 'ko'): Promise<string[]> {
  const promises = texts.map(text => translateText(text, targetLang));
  return Promise.all(promises);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, texts, targetLang = 'ko' } = body;

    if (!text && !texts) {
      return NextResponse.json(
        { error: '번역할 텍스트가 필요합니다.' },
        { status: 400 }
      );
    }

    let result;

    if (texts && Array.isArray(texts)) {
      // 배치 번역
      result = await translateBatch(texts, targetLang);
    } else if (text) {
      // 단일 번역
      result = await translateText(text, targetLang);
    }

    return NextResponse.json({
      success: true,
      data: result,
      originalCount: texts ? texts.length : 1
    });

  } catch (error: any) {
    console.error('번역 API 오류:', error);
    return NextResponse.json(
      { 
        error: '번역 중 오류가 발생했습니다.',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
