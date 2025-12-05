import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const goodsNo = searchParams.get('goodsNo');
        const page = searchParams.get('page') || '0';
        const pageSize = searchParams.get('pageSize') || '60';
        const sort = searchParams.get('sort') || 'up_cnt_desc'; // up_cnt_desc (추천순), new (최신순), goods_est_desc (별점높은순), goods_est_asc (별점낮은순)

        if (!goodsNo) {
            return NextResponse.json({ error: '상품 ID가 필요합니다.' }, { status: 400 });
        }

        const headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://www.musinsa.com/'
        };

        // 무신사 리뷰 API 호출
        // https://goods.musinsa.com/api2/review/v1/view/list?page=0&pageSize=60&goodsNo=123456&sort=up_cnt_desc
        const response = await fetch(`https://goods.musinsa.com/api2/review/v1/view/list?page=${page}&pageSize=${pageSize}&goodsNo=${goodsNo}&sort=${sort}`, { headers });

        if (!response.ok) {
            throw new Error(`Musinsa API Error: ${response.status}`);
        }

        const json = await response.json();
        const list = json.data?.list || [];

        // 데이터 포맷팅
        const reviews = list.map((item: any) => ({
            reviewNo: item.no,
            userName: item.userProfileInfo?.userNickName || '익명',
            userImage: item.userImageFile ? `https://image.msscdn.net${item.userImageFile}` : '',
            reviewImage: item.images?.[0]?.imageUrl ? `https://image.msscdn.net${item.images[0].imageUrl}` : '',
            content: item.content,
            rating: item.grade,
            date: item.createDate ? item.createDate.split('T')[0] : '',
            profile: item.userProfileInfo?.bodySize || '', // 예: 170cm / 60kg (Legacy fallback)
            size: item.goodsOptionName || '', // 예: L (Legacy fallback)
            // New Fields
            option: item.goodsOption || '',
            userHeight: item.userProfileInfo?.userHeight || null,
            userWeight: item.userProfileInfo?.userWeight || null,
            userSex: item.userProfileInfo?.reviewSex || ''
        }));

        return NextResponse.json({
            success: true,
            data: reviews,
            hasMore: reviews.length === parseInt(pageSize as string)
        });

    } catch (error: any) {
        console.error('Review fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
