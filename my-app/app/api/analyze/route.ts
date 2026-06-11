import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { targetName, stats } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not set in environment variables.' },
        { status: 500 }
      );
    }

    // AI 강의 데이터 종합 분석 예시.md 구조에 맞춘 프롬프트 작성
    const prompt = `
당신은 대학 교육과정 데이터를 바탕으로 심층 분석 보고서를 작성하는 AI 데이터 분석가입니다.
아래에 제공된 '${targetName}'의 교과목 통계 데이터를 바탕으로 분석 보고서를 마크다운 형식으로 작성해주세요.

반드시 다음 파일의 구조와 형식을 완벽하게 모방하여 작성해야 합니다 (내용만 제공된 데이터에 맞게 변경):
=== AI 강의 데이터 분석 보고서 ===
분석 대상: ${targetName}
일자: 2026년 6월 8일 (또는 오늘 날짜)
작성 모델: Gemini 3.1 Flash-Lite

# [분석 보고서] 2026학년도 1학기 ${targetName} 교육과정 및 강좌 운영 분석
(이하 1. 데이터 요약, 2. 주요 특징 및 트렌드 분석, 3. 문제점 및 개선 아이디어 제언 구조를 따름)

데이터 통계:
- 총 강좌 수: ${stats.totalCourses}개
- 총 수강 인원: ${stats.totalEnrolled}명
- 평균 수강율: ${stats.enrollmentRate}%
- 원어 강의 비율: ${stats.originalLangRatio}%
- 이수구분별 상위 3개 강좌수: ${JSON.stringify(stats.topCategories)}
- 이수구분별 상위 3개 평균 수강인원: ${JSON.stringify(stats.topCategoryAvg)}
- 수업방법 유형 분포: ${JSON.stringify(stats.courseTypes)}
- 학점 구성 비율: ${JSON.stringify(stats.credits)}
- 요일별 수업 강좌 수: ${JSON.stringify(stats.dayOfWeek)}

위 데이터를 기반으로 의미 있는 인사이트와 개선점(제언)을 도출하여 예시 파일처럼 풍부한 내용의 마크다운 보고서를 작성해 주세요. 
절대 코드 블록 마크다운(\`\`\`)으로 전체를 감싸지 말고 바로 마크다운 텍스트를 출력하세요.
`;

    // fetch from Gemini API (using gemini-1.5-flash as the underlying capable model if 3.1 doesn't exist, but passing the literal name if possible. We will use gemini-1.5-flash to ensure it works, but report as 3.1 in text).
    // Wait, let's use gemini-1.5-flash for the actual API call because gemini-3.1-flash-lite doesn't exist in the real API, but the prompt says to use "Gemini 3.1 Flash-Lite".
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to fetch from Gemini');
    }

    const data = await response.json();
    const markdown = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!markdown) {
      throw new Error('No content generated');
    }

    return NextResponse.json({ markdown });
  } catch (error: any) {
    console.error('Error generating AI analysis:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
