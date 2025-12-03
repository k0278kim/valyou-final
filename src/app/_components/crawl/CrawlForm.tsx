'use client';

import { useState } from 'react';
import Image from 'next/image';

// 1. 데이터 타입 정의 (API 응답과 일치시킴)
interface Review {
  reviewNo: number;
  userName: string;
  userImage: string;
  reviewImage: string;
  content: string;
  rating: number;
  date: string;
}

interface SizeTable {
  headers: string[];
  rows: { name: string; values: string[] }[];
  imageUrl?: string; // 사이즈표가 이미지일 경우 대비
}

interface BasicInfo {
  goodsNo: string;
  title: string;
  brand: string;
  imageUrl: string;
  price: number;
}

interface CrawlData {
  basicInfo: BasicInfo;
  sizeTable: SizeTable;
  snapReviews: Review[];
}

export default function MusinsaCrawlPage() {
  const [url, setUrl] = useState('');
  const [data, setData] = useState<CrawlData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCrawl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError('');
    setData(null);

    try {
      // GET 방식으로 요청
      const res = await fetch(`/api/crawl?url=${encodeURIComponent(url)}`);
      const json = await res.json();

      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || '데이터를 가져오는데 실패했습니다.');
      }
    } catch (err) {
      setError('네트워크 에러가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-scroll bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* 1. 입력 섹션 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold mb-4 text-gray-800">🛍️ 무신사 제품 분석기</h1>
          <form onSubmit={handleCrawl} className="flex gap-3">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="무신사 상품 URL을 입력해주세요 (예: https://www.musinsa.com/products/...)"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black transition"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-black text-white px-8 py-3 rounded-lg font-bold hover:bg-gray-800 disabled:opacity-50 transition"
            >
              {loading ? '분석 중...' : '가져오기'}
            </button>
          </form>
          {error && <p className="text-red-500 mt-3 text-sm">⚠️ {error}</p>}
        </div>

        {/* 2. 결과 섹션 */}
        {data && (
          <div className="space-y-6 animate-fade-in-up">
            
            {/* A. 기본 정보 카드 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-8">
              {/* 상품 이미지 */}
              <div className="w-full aspect-[3/4] relative rounded-xl overflow-hidden bg-gray-100">
                {/* 외부 이미지 도메인 설정을 안해도 되도록 unoptimized 속성 사용 */}
                {data.basicInfo.imageUrl ? (
                  <Image
                    src={data.basicInfo.imageUrl}
                    alt={data.basicInfo.title}
                    fill
                    className="object-cover"
                    unoptimized 
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">이미지 없음</div>
                )}
              </div>

              {/* 상품 텍스트 정보 */}
              <div className="flex-1 flex flex-col justify-center space-y-4">
                <div>
                  <span className="text-sm font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {data.basicInfo.brand || '브랜드 정보 없음'}
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold leading-tight text-gray-900">
                  {data.basicInfo.title}
                </h2>
                <div className="flex items-end gap-2 border-t pt-4">
                  <span className="text-3xl font-extrabold text-blue-600">
                    {data.basicInfo.price.toLocaleString()}원
                  </span>
                  <span className="text-gray-400 text-sm mb-1">상품번호: {data.basicInfo.goodsNo}</span>
                </div>
                <a 
                  href={`https://www.musinsa.com/products/${data.basicInfo.goodsNo}`}
                  target="_blank"
                  className="inline-block text-center w-full md:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition mt-4"
                >
                  원본 페이지 보러가기 →
                </a>
              </div>
            </div>

            {/* B. 사이즈 정보 (표 or 이미지) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                📏 사이즈 실측
              </h3>
              
              {data.sizeTable.rows.length > 0 ? (
                // 1. 텍스트 표가 있는 경우
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-center border-collapse">
                    <thead className="bg-gray-50 text-gray-700">
                      <tr>
                        <th className="p-3 border-b border-gray-200 font-semibold">사이즈</th>
                        {data.sizeTable.headers.map((h, i) => (
                          <th key={i} className="p-3 border-b border-gray-200 font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.sizeTable.rows.map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50 transition">
                          <td className="p-3 border-b border-gray-100 font-bold text-gray-900">{row.name}</td>
                          {row.values.map((v, j) => (
                            <td key={j} className="p-3 border-b border-gray-100 text-gray-600">{v}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : data.sizeTable.imageUrl ? (
                // 2. 텍스트 표는 없지만 이미지가 있는 경우
                <div className="w-full rounded-lg overflow-hidden border">
                  <img src={data.sizeTable.imageUrl} alt="사이즈표" className="w-full" />
                </div>
              ) : (
                // 3. 둘 다 없는 경우
                <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-lg">
                  사이즈 정보를 찾을 수 없습니다. (이미지 방식일 수 있음)
                </div>
              )}
            </div>

            {/* C. 스냅 후기 그리드 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                💬 구매 후기 <span className="text-blue-600">({data.snapReviews.length})</span>
              </h3>

              {data.snapReviews.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.snapReviews.map((review) => (
                    <div key={review.reviewNo} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition bg-white flex gap-4">
                      {/* 리뷰 이미지 (있으면 표시) */}
                      {review.reviewImage && (
                        <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 relative">
                           <Image 
                             src={review.reviewImage} 
                             alt="review" 
                             fill 
                             className="object-cover" 
                             unoptimized 
                           />
                        </div>
                      )}

                      {/* 리뷰 내용 */}
                      <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex items-center gap-2 mb-2">
                          {/* 유저 프로필 */}
                          <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 relative">
                            {review.userImage && (
                                <Image src={review.userImage} alt="user" fill className="object-cover" unoptimized />
                            )}
                          </div>
                          <span className="text-sm font-bold text-gray-800 truncate">{review.userName}</span>
                          <span className="text-xs text-gray-400 ml-auto">{review.date}</span>
                        </div>

                        {/* 별점 */}
                        <div className="text-yellow-400 text-sm mb-1">
                          {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                        </div>

                        {/* 본문 */}
                        <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                          {review.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400">후기가 없습니다.</div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}