import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { reviews } = await request.json();
        const GEMINI_KEY = process.env.GEMINI_API_KEY;
        let summary: any = null;

        if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
            return NextResponse.json({ summary: [] });
        }

        // 1. Gemini API를 이용한 요약 시도
        if (GEMINI_KEY) {
            try {
                const { GoogleGenerativeAI } = require("@google/generative-ai");
                const genAI = new GoogleGenerativeAI(GEMINI_KEY);
                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

                const reviewsText = reviews.join('\n');

                if (reviewsText.length > 0) {
                    const prompt = `
                        다음은 제품을 실제로 구매한 고객들의 리뷰입니다.
                        이 리뷰들을 종합하여 다음 3가지 항목으로 나누어 요약해주세요.
                        
                        1. 장점 (3문장 내외)
                        2. 단점 (3문장 내외, 없으면 "특별한 단점 없음"이라고 적어주세요)
                        3. 핏/스타일/사이즈 팁 (3문장 내외)

                        작성 가이드:
                        - 실구매자들의 생생한 경험(사이즈감, 착용감, 실제 색감 등)을 중심으로 요약해주세요.
                        - 반드시 아래와 같은 JSON 형식으로만 출력해주세요. 마크다운 코드 블럭 없이 순수 JSON만 출력하세요.
                        
                        {
                            "pros": ["장점1", "장점2", "장점3"],
                            "cons": ["단점1", "단점2", "단점3"],
                            "fitStyle": ["핏/스타일1", "핏/스타일2", "핏/스타일3"]
                        }
                        
                        리뷰 내용:
                        ${reviewsText}
                    `;

                    const result = await model.generateContent(prompt);
                    const response = await result.response;
                    const text = response.text();

                    // JSON 파싱 시도
                    try {
                        let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
                        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);

                        if (jsonMatch) {
                            summary = JSON.parse(jsonMatch[0]);
                        } else {
                            // 혹시라도 배열로 왔을 경우를 대비 (이전 프롬프트 잔재)
                            const arrayMatch = cleanText.match(/\[[\s\S]*\]/);
                            if (arrayMatch) {
                                const arr = JSON.parse(arrayMatch[0]);
                                summary = { pros: arr, cons: [], fitStyle: [] };
                            }
                        }
                    } catch (e) {
                        console.error('JSON Parse Error:', e);
                    }
                }
            } catch (geminiError) {
                console.error('⚠️ Gemini 요약 실패 (Fallback 사용):', geminiError);
            }
        }

        // 2. Gemini 실패 또는 키 없음 -> 기존 휴리스틱 로직 (Fallback)
        if (!summary || (Array.isArray(summary) && summary.length === 0) || (!Array.isArray(summary) && !summary.pros)) {
            // 요약 생성 (소재/질감/핏 위주)
            const keywords = ['소재', '질감', '촉감', '핏', '색감', '두께', '신축성', '마감', '퀄리티', '원단', '재질', '사이즈'];

            const relevantSentences: string[] = [];

            reviews.forEach(desc => {
                // 1. HTML 엔티티 및 태그 제거
                const cleanDesc = desc
                    .replace(/&quot;/g, '"')
                    .replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/<[^>]+>/g, '') // 태그 제거
                    .replace(/\.\.\./g, '') // 말줄임표 제거
                    .replace(/\s+/g, ' ') // 공백 정리
                    .trim();

                // 2. 문장 단위로 분리
                const sentences = cleanDesc.split(/(?<=[.?!])\s+/);

                sentences.forEach((sentence: string) => {
                    const cleanSentence = sentence.trim();
                    // 3. 유의미한 문장만 필터링 (길이 10자 이상, 키워드 포함)
                    if (cleanSentence.length > 10 && keywords.some(k => cleanSentence.includes(k))) {
                        // 중복 제거
                        if (!relevantSentences.includes(cleanSentence)) {
                            relevantSentences.push(cleanSentence);
                        }
                    }
                });
            });

            // 상위 5개만 선택하여 '장점' 섹션에 넣음 (Fallback 구조 맞춤)
            const fallbackItems = relevantSentences.length > 0 ? relevantSentences.slice(0, 5) : [];

            summary = {
                pros: fallbackItems,
                cons: [],
                fitStyle: []
            };
        }

        return NextResponse.json({ summary });

    } catch (e) {
        console.error('Summary generation failed:', e);
        return NextResponse.json({ summary: [] }, { status: 500 });
    }
}
