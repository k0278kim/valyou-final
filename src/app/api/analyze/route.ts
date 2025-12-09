import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

// ==========================================
// 1. 소셜용 검색어 생성기 (전략 수정)
// ==========================================
function getYoutubeKeyword(brand: string, title: string) {
  // 전략 변경: 카테고리 대신 "상품명" 위주로 검색 (블로그와 동일하게)
  // 예: "낫온리포투데이 22 플리스 버튼 풀오버" -> "낫온리포투데이 플리스 버튼 풀오버"

  const cleanTitle = title.replace(/\[.*?\]/g, '').replace(brand, '').trim();
  // 앞 3단어 정도면 적당함
  return `${brand} ${cleanTitle.split(' ').slice(0, 3).join(' ')}`.trim();
}

// 네이버용 (조금 더 구체적이어도 됨)
function getBlogKeyword(brand: string, title: string) {
  const cleanTitle = title.replace(/\[.*?\]/g, '').replace(brand, '').trim();
  // 앞 3단어 정도면 적당함
  return `${brand} ${cleanTitle.split(' ').slice(0, 3).join(' ')}`.trim();
}

// 정확도 판별기
function checkIsExactMatch(itemTitle: string, brand: string, styleNo: string, goodsName: string) {
  if (!itemTitle) return false;
  const t = itemTitle.toLowerCase().replace(/\s/g, '');
  const b = (brand || '').toLowerCase().replace(/\s/g, '');
  const s = (styleNo || '').toLowerCase().replace(/\s/g, '');

  // 상품명 핵심 단어 (앞 3어절로 확장하여 정확도 높임)
  const cleanName = (goodsName || '').replace(/\[.*?\]/g, '').trim();
  const nameParts = cleanName.split(' ');
  const coreName = nameParts.slice(0, Math.min(3, nameParts.length)).join('').toLowerCase();

  if (s.length > 3 && !/[가-힣]/.test(s) && t.includes(s)) return true;
  if (b && coreName && t.includes(b) && t.includes(coreName)) return true;

  return false;
}

export async function GET(request: Request) {
  console.log('\n🔵 [API 요청 시작] --------------------------');

  try {
    const { searchParams } = new URL(request.url);
    let url = searchParams.get('url');
    console.log('🔍 Received URL:', url);

    if (!url) return NextResponse.json({ error: 'URL이 필요합니다.' }, { status: 400 });

    // 0. URL 확장 (단축 URL 대응)
    try {
      // 무신사 단축 URL 패턴이거나, 일반적인 단축 URL인 경우 리다이렉트 추적
      if (!url.includes('musinsa.com/app/goods') && !url.includes('musinsa.com/products')) {
        console.log('🔄 단축 URL 감지, 원본 URL 추적 중...');
        const response = await fetch(url, { method: 'HEAD', redirect: 'follow' });
        url = response.url;
        console.log('✅ 최종 URL:', url);
      }
    } catch (e) {
      console.error('⚠️ URL 확장 실패:', e);
      // 실패해도 원래 URL로 시도
    }

    // 1. 상품 ID 추출
    // 지원 형식: /products/123456, /app/goods/123456
    const urlMatch = url.match(/(?:products|goods)\/(\d+)/);
    const goodsNo = urlMatch ? urlMatch[1] : '';

    if (!goodsNo) return NextResponse.json({ error: '상품 ID를 찾을 수 없습니다.' }, { status: 400 });

    // 2. 무신사 API 호출 (리뷰 다양성을 위해 4가지 정렬 병렬 호출)
    // up_cnt_desc(추천순), goods_est_asc(별점낮은순), goods_est_desc(별점높은순), new(최신순)
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://www.musinsa.com/'
    };

    let dData: any = {};
    let reviewList: any[] = [];
    let sizeList: any[] = [];

    try {
      const reviewSorts = ['up_cnt_desc', 'goods_est_asc', 'goods_est_desc', 'new'];
      const reviewRequests = reviewSorts.map(sort =>
        fetch(`https://goods.musinsa.com/api2/review/v1/view/list?page=0&pageSize=20&goodsNo=${goodsNo}&sort=${sort}`, { headers })
          .then(res => res.ok ? res.json() : null)
          .catch(() => null)
      );

      const [detailRes, sizeRes, ...reviewResults] = await Promise.all([
        fetch(`https://goods-detail.musinsa.com/api2/goods/${goodsNo}`, { headers }),
        fetch(`https://goods-detail.musinsa.com/api2/goods/${goodsNo}/actual-size`, { headers }),
        ...reviewRequests
      ]);

      if (detailRes.ok) {
        const json = await detailRes.json();
        dData = json.data || {};
      }

      if (sizeRes.ok) { const json = await sizeRes.json(); sizeList = json.data?.sizes || json.data || []; }

      // 리뷰 병합 및 중복 제거
      const allReviews = reviewResults
        .filter(r => r && r.data && r.data.list)
        .flatMap(r => r.data.list);

      const seenReviews = new Set();
      reviewList = allReviews.filter((item: any) => {
        if (seenReviews.has(item.no)) return false;
        seenReviews.add(item.no);
        return true;
      });

    } catch (e) { console.error('무신사 API 에러', e); }

    // 3. 기본 정보 구성
    // 핏/계절감 등 상세 정보 추출
    let fit = '';
    let touch = '';
    let flexibility = '';
    let sheerness = '';
    let thickness = '';
    let season = '';

    if (dData.goodsMaterial && Array.isArray(dData.goodsMaterial.materials)) {
      const materials = dData.goodsMaterial.materials;

      const getVal = (name: string) => {
        const item = materials.find((m: any) => m.name === name);
        if (item && Array.isArray(item.items)) {
          return item.items.filter((i: any) => i.isSelected).map((i: any) => i.name).join(', ');
        }
        return '';
      };

      fit = getVal('핏');
      touch = getVal('촉감');
      flexibility = getVal('신축성');
      sheerness = getVal('비침');
      thickness = getVal('두께');
      season = getVal('계절');
    }

    // 가격 정보 추출 강화 (API 응답 기반)
    // goodsPrice 객체가 있으면 우선 사용
    const gp = dData.goodsPrice;
    let originalPrice = gp?.normalPrice || gp?.originPrice || dData.price || 0;
    let finalPrice = gp?.salePrice || gp?.minPrice || dData.salePrice || originalPrice;
    let discountRate = gp?.discountRate || 0;

    // 만약 할인율이 0인데 원가 > 판매가라면 직접 계산
    if (discountRate === 0 && originalPrice > finalPrice) {
      discountRate = Math.round(((originalPrice - finalPrice) / originalPrice) * 100);
    }

    // 품절 여부
    const isSoldOut = dData.isOutOfStock || dData.isSoldOut || false;

    // Category extraction
    const category1 = dData.category?.categoryDepth1Title || '기타';
    const category2 = dData.category?.categoryDepth2Title || '';

    const basicInfo = {
      goodsNo,
      title: dData.goodsNm || '',
      brand: dData.brandInfo?.brandName || dData.brand || '',
      brandId: dData.brandInfo?.brand || '',
      styleNo: dData.styleNo || '',
      category1, // Major Category
      category2, // Sub Category
      imageUrl: dData.thumbnailImageUrl ? (dData.thumbnailImageUrl.startsWith('http') ? dData.thumbnailImageUrl : `https://image.msscdn.net${dData.thumbnailImageUrl}`) : '',
      price: originalPrice,
      salePrice: finalPrice,
      discountRate: discountRate,
      isSoldOut: isSoldOut,
      link: `https://www.musinsa.com/app/goods/${goodsNo}`,
      fit,
      touch,
      flexibility,
      sheerness,
      thickness,
      season,
    };

    // 4. 리뷰 & 사이즈
    const reviews = reviewList.map((item: any) => {
      const profile = item.userProfileInfo || {};
      return {
        reviewNo: item.no,
        userName: profile.userNickName || '익명',
        userImage: item.userImageFile ? `https://image.msscdn.net${item.userImageFile}` : '',
        reviewImage: item.images && item.images.length > 0 ? `https://image.msscdn.net${item.images[0].imageUrl}` : '',
        content: item.content,
        rating: item.grade,
        date: item.createDate ? item.createDate.split('T')[0] : '',
        profile: profile.bodySize || '', // 예: 170cm / 60kg (Legacy fallback)
        size: item.goodsOptionName || item.goodsOption || '', // 예: L (Legacy fallback)
        // New Fields
        option: item.goodsOption || '',
        userHeight: profile.userHeight || null,
        userWeight: profile.userWeight || null,
        userSex: profile.reviewSex || ''
      };
    });

    const sizeTable = { headers: [] as string[], rows: [] as any[], imageUrl: '' };
    if (sizeList.length > 0) {
      const first = sizeList[0];
      const keys = first.items || first.actual_size;
      if (keys) sizeTable.headers = keys.map((k: any) => k.name);
      sizeTable.rows = sizeList.map((s: any) => ({
        name: s.name, values: (s.items || s.actual_size || []).map((v: any) => v.value)
      }));
    }

    // 5. 브랜드 베스트셀러
    let bestItems = [] as any[];
    if (basicInfo.brandId) {
      try {
        const brandUrl = `https://api.musinsa.com/api2/dp/v1/plp/goods?brandId=${basicInfo.brandId}&sortCode=POPULAR&page=1&size=10`;
        const bRes = await fetch(brandUrl, { headers });
        if (bRes.ok) {
          const bJson = await bRes.json();
          bestItems = (bJson.data?.list || []).slice(0, 6).map((item: any) => ({
            title: item.goodsName,
            price: item.salePrice || item.price,
            imageUrl: item.imageUrl ? (item.imageUrl.startsWith('http') ? item.imageUrl : `https://image.msscdn.net${item.imageUrl}`) : ''
          }));
        }
      } catch (e) { }
    }

    // ==========================================
    // 🚨 6. 소셜 검색 (유튜브 살리기 대작전)
    // ==========================================
    const ytKeyword = getYoutubeKeyword(basicInfo.brand, basicInfo.title); // 브랜드 + 상품명 (좁게)
    const blogKeyword = getBlogKeyword(basicInfo.brand, basicInfo.title); // 브랜드 + 상품명 (좁게)

    console.log(`🔑 유튜브용 키워드: [${ytKeyword}]`);
    console.log(`🔑 블로그용 키워드: [${blogKeyword}]`);

    const G_KEY = process.env.GOOGLE_API_KEY;
    const G_CX = process.env.GOOGLE_CX;
    const N_ID = process.env.NAVER_CLIENT_ID;
    const N_SECRET = process.env.NAVER_CLIENT_SECRET;
    const GEMINI_KEY = process.env.GEMINI_API_KEY;

    let socialData = { youtube: [], instagram: [], blog: [] };
    let summary: string[] = [];

    if (G_KEY && G_CX) {
      // 유튜브 쿼리: 따옴표 제거하고 최대한 느슨하게 검색
      // site:youtube.com [브랜드] [상품명] (후기 OR 리뷰 OR 하울)
      const ytQuery = `site:youtube.com ${ytKeyword} (후기 OR 리뷰 OR 하울 OR lookbook)`;

      // 인스타 쿼리: 브랜드 + 상품명
      const insQuery = `site:instagram.com ${ytKeyword} (착샷 OR 코디 OR ootd)`;

      const blogQuery = `${blogKeyword} 후기`;

      try {
        const requests = [
          fetch(`https://www.googleapis.com/customsearch/v1?key=${G_KEY}&cx=${G_CX}&q=${encodeURIComponent(ytQuery)}`),
          fetch(`https://www.googleapis.com/customsearch/v1?key=${G_KEY}&cx=${G_CX}&q=${encodeURIComponent(insQuery)}`)
        ];

        if (N_ID && N_SECRET) {
          // 블로그 검색
          requests.push(fetch(`https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(blogQuery)}&display=5&sort=sim`, {
            headers: { 'X-Naver-Client-Id': N_ID, 'X-Naver-Client-Secret': N_SECRET }
          }));
        }

        const results = await Promise.all(requests);
        const yJson = results[0] ? await results[0].json() : {};
        const iJson = results[1] ? await results[1].json() : {};
        const nJson = (N_ID && results[2]) ? await results[2].json() : { items: [] };

        console.log(`📊 검색 결과: 유튜브(${yJson.items?.length || 0}), 인스타(${iJson.items?.length || 0}), 블로그(${nJson.items?.length || 0})`);

        // 유튜브 매핑
        socialData.youtube = (yJson.items || []).map((i: any) => ({
          title: i.title, link: i.link,
          thumb: i.pagemap?.cse_image?.[0]?.src || i.pagemap?.image_object?.[0]?.url || '',
          isExactMatch: checkIsExactMatch(i.title, basicInfo.brand, basicInfo.styleNo, basicInfo.title)
        }));

        // 인스타 매핑
        socialData.instagram = (iJson.items || []).map((i: any) => ({
          title: i.title, link: i.link,
          thumb: i.pagemap?.cse_image?.[0]?.src || '',
          isExactMatch: (i.title || '').includes(basicInfo.brand)
        }));

        // 네이버 블로그 매핑
        socialData.blog = (nJson.items || []).map((i: any) => ({
          title: i.title.replace(/<[^>]+>/g, ''), link: i.link,
          desc: i.description.replace(/<[^>]+>/g, ''), date: i.postdate,
          isExactMatch: checkIsExactMatch(i.title, basicInfo.brand, basicInfo.styleNo, basicInfo.title)
        }));

      } catch (e) {
        console.error('❌ 소셜 검색 fetch 실패:', e);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        basicInfo,
        brandInfo: {
          name: basicInfo.brand,
          desc: dData.brandInfo?.memo || '',
          logo: dData.brandInfo?.brandLogoImage ? `https:${dData.brandInfo.brandLogoImage}` : '',
          vibe: ['#트렌디', '#데일리', '#캐주얼'],
          bestItems: bestItems
        },
        sizeTable,
        reviews,
        social: socialData,
        summary, // 추가
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
