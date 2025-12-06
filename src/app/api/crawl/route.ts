import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const url = searchParams.get('url');

        if (!url) return NextResponse.json({ error: 'URL이 필요합니다.' }, { status: 400 });

        // 1. HTML 가져오기 (기본 정보 파싱용)
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.musinsa.com/',
            },
        });

        const html = await res.text();
        const $ = cheerio.load(html);

        // 상품 ID 추출
        let goodsNo = '';
        const urlMatch = url.match(/products\/(\d+)/);
        if (urlMatch) goodsNo = urlMatch[1] || '';

        // ==========================================
        // STEP 1: 기본 정보 & 가격 (API 매핑 수정 완료)
        // ==========================================
        let basicInfo = {
            goodsNo,
            title: $('.product_title').text().trim() || $('meta[property="og:title"]').attr('content') || '',
            brand: $('.product_article_contents a').first().text().trim(),
            imageUrl: $('meta[property="og:image"]').attr('content') || '',
            price: 0,
        };

        // [수정됨] 상세 API로 정확한 가격 가져오기
        if (goodsNo) {
            const detailApiUrl = `https://goods-detail.musinsa.com/api2/goods/${goodsNo}`;

            try {
                const detailRes = await fetch(detailApiUrl, {
                    headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': url }
                });

                if (detailRes.ok) {
                    const detailJson = await detailRes.json();
                    const data = detailJson.data || {};

                    // 1. 가격 추출 (보내주신 JSON 구조 반영)
                    if (data.goodsPrice) {
                        // salePrice(판매가)를 우선으로 하고, 없으면 normalPrice(정가) 사용
                        basicInfo.price = data.goodsPrice.salePrice || data.goodsPrice.normalPrice || 0;
                    }

                    // 2. 제목/브랜드/이미지 백업 (HTML 파싱 실패 시 사용)
                    if (!basicInfo.title) basicInfo.title = data.goodsNm || '';
                    if (!basicInfo.brand) basicInfo.brand = data.brandInfo?.brandName || '';
                    if (!basicInfo.imageUrl && data.thumbnailImageUrl) {
                        basicInfo.imageUrl = data.thumbnailImageUrl.startsWith('http')
                            ? data.thumbnailImageUrl
                            : `https://image.msscdn.net${data.thumbnailImageUrl}`;
                    }
                }
            } catch (e) {
                console.error('상세 API 에러:', e);
            }
        }

        // [Backup] API 실패 시에만 HTML 태그 사용
        if (basicInfo.price === 0) {
            const ogDesc = $('meta[property="og:description"]').attr('content') || '';
            const match = ogDesc.match(/([0-9,]+)원/);
            if (match && match[1]) basicInfo.price = parseInt(match[1].replace(/,/g, ''));
        }


        // ==========================================
        // STEP 2: 스냅 후기 (pageSize=60)
        // ==========================================
        let snapReviews = [];
        const IMG_DOMAIN = 'https://image.msscdn.net';

        if (goodsNo) {
            const reviewApiUrl = `https://goods.musinsa.com/api2/review/v1/view/list?page=0&pageSize=60&goodsNo=${goodsNo}&sort=up_cnt_desc`;
            try {
                const reviewRes = await fetch(reviewApiUrl, {
                    headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': url }
                });

                if (reviewRes.ok) {
                    const reviewJson = await reviewRes.json();
                    const list = reviewJson.data?.list || reviewJson.list || [];

                    snapReviews = list.map((item: any) => ({
                        reviewNo: item.no,
                        userName: item.userProfileInfo?.userNickName || '익명',
                        userImage: item.userImageFile ? `${IMG_DOMAIN}${item.userImageFile}` : '',
                        reviewImage: item.images?.[0]?.imageUrl ? `${IMG_DOMAIN}${item.images[0].imageUrl}` : '',
                        content: item.content,
                        rating: parseInt(item.grade || '5'),
                        date: item.createDate ? item.createDate.split('T')[0] : '',
                    }));
                }
            } catch (e) { console.error('리뷰 에러', e); }
        }


        // ==========================================
        // STEP 3: 사이즈 데이터 (actual-size API)
        // ==========================================
        const sizeTable = { headers: [] as string[], rows: [] as any[], imageUrl: '' };

        if (goodsNo) {
            const sizeApiUrl = `https://goods-detail.musinsa.com/api2/goods/${goodsNo}/actual-size`;

            try {
                const sizeRes = await fetch(sizeApiUrl, {
                    headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': url }
                });

                if (sizeRes.ok) {
                    const sizeJson = await sizeRes.json();
                    const sizeList = sizeJson.data?.sizes || sizeJson.data || [];

                    if (sizeList.length > 0) {
                        const firstItem = sizeList[0];
                        // 구조 대응: items 또는 actual_size
                        if (firstItem.items) {
                            sizeTable.headers = firstItem.items.map((it: any) => it.name);
                        } else if (firstItem.actual_size) {
                            sizeTable.headers = firstItem.actual_size.map((it: any) => it.name);
                        }

                        sizeTable.rows = sizeList.map((item: any) => {
                            const measurements = item.items || item.actual_size || [];
                            return {
                                name: item.name,
                                values: measurements.map((m: any) => m.value)
                            };
                        });
                    }
                }
            } catch (e) { console.error('사이즈 API 에러:', e); }
        }

        // 이미지 백업
        if (sizeTable.rows.length === 0) {
            let sizeImg = $('img[alt*="사이즈"]').attr('src') || $('img[alt*="실측"]').attr('src');
            if (!sizeImg) sizeImg = $('.mysize_area img').attr('src') || $('#detail_view img').first().attr('src');
            if (sizeImg) sizeTable.imageUrl = sizeImg.startsWith('http') ? sizeImg : `${IMG_DOMAIN}${sizeImg}`;
        }

        return NextResponse.json({
            success: true,
            data: {
                basicInfo,
                sizeTable,
                snapReviews
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}