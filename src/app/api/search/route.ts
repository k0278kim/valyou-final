import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query'); // 예: 낫온리포투데이 플리스
    const brand = searchParams.get('brand'); // 예: 낫온리포투데이

    if (!query || !brand) return NextResponse.json({ error: '정보 부족' }, { status: 400 });

    const API_KEY = process.env.GOOGLE_API_KEY;
    const CX = process.env.GOOGLE_CX;

    // ============================================================
    // 1. 공식 홈페이지 찾기 (정확도 UP)
    // ============================================================
    // -namu -wiki: 나무위키, 위키백과 제외
    // -store -smartstore: 네이버 스마트스토어 등 잡다한 판매처 제외하고 '진짜 공홈' 찾기 노력
    const officialQuery = `"${brand}" (공식 홈페이지 OR official store) -namu -wiki -coupang -musinsa`;
    
    // ============================================================
    // 2. 유튜브 검색 (리뷰/하울 위주)
    // ============================================================
    // "브랜드"는 반드시 포함되게 따옴표("")로 감쌈
    // 관련 없는 키워드 제외: 주식(stock), 뉴스(news), 중고(used)
    const youtubeQuery = `site:youtube.com "${brand}" ${query.replace(brand, '').trim()} (후기 OR 하울 OR 룩북 OR review) -stock -news -주식`;

    // ============================================================
    // 3. 인스타그램 검색 (착샷 위주)
    // ============================================================
    const instaQuery = `site:instagram.com "${brand}" ${query.replace(brand, '').trim()} (착샷 OR 코디 OR ootd)`;

    // 병렬 요청
    const [officialRes, youtubeRes, instaRes] = await Promise.all([
      fetch(`https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${CX}&q=${encodeURIComponent(officialQuery)}&num=1`), // 1개만
      fetch(`https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${CX}&q=${encodeURIComponent(youtubeQuery)}`),
      fetch(`https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${CX}&q=${encodeURIComponent(instaQuery)}`)
    ]);

    const officialJson = await officialRes.json();
    const youtubeJson = await youtubeRes.json();
    const instaJson = await instaRes.json();

    // 공식 홈페이지 결과 정제
    let officialSite = null;
    if (officialJson.items?.length > 0) {
        const item = officialJson.items[0];
        // 무신사, 쿠팡 등이 1순위로 뜨는 걸 방지하는 2차 필터
        if (!item.link.includes('musinsa.com') && !item.link.includes('coupang.com')) {
            officialSite = {
                title: item.title,
                link: item.link,
                snippet: item.snippet
            };
        }
    }

    const items = [
      ...(youtubeJson.items || []).map((item: any) => ({
        type: 'youtube',
        title: item.title,
        link: item.link,
        snippet: item.snippet,
        thumbnail: item.pagemap?.cse_image?.[0]?.src || item.pagemap?.image_object?.[0]?.url || '',
      })),
      ...(instaJson.items || []).map((item: any) => ({
        type: 'instagram',
        title: item.title,
        link: item.link,
        snippet: item.snippet,
        thumbnail: item.pagemap?.cse_image?.[0]?.src || '',
      })),
    ];

    return NextResponse.json({ success: true, officialSite, items });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}