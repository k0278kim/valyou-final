'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
   Search, Youtube, Instagram, BookOpen,
   ArrowLeft, ExternalLink, ScanEye, CheckCircle2, Ruler, Shirt, AlertCircle, TrendingUp
} from 'lucide-react';

export default function SearchPage() {
   return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩중...</div>}>
         <SearchContent />
      </Suspense>
   );
}

function SearchContent() {
   const searchParams = useSearchParams();
   const [url, setUrl] = useState(searchParams.get('url') || '');
   const [data, setData] = useState<any>(null);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [activeTab, setActiveTab] = useState<'visual' | 'info'>('info');
   const [summary, setSummary] = useState<any>(null);
   const [isSummaryLoading, setIsSummaryLoading] = useState(false);
   const [reviewSort, setReviewSort] = useState<'latest' | 'high' | 'low'>('latest');
   const [summaryFilter, setSummaryFilter] = useState<string>('all');

   const [page, setPage] = useState(0);
   const [hasMore, setHasMore] = useState(true);
   const [isReviewLoading, setIsReviewLoading] = useState(false);

   const handleAnalyze = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!url) return;
      setLoading(true);
      setData(null);
      setSummary(null);
      setError(null);
      setPage(0);
      setHasMore(true);

      try {
         const res = await fetch(`/api/analyze?url=${encodeURIComponent(url)}`);
         if (!res.ok) throw new Error('서버 요청에 실패했습니다.');

         const json = await res.json();

         if (!json.success || !json.data) {
            throw new Error('데이터 형식이 올바르지 않습니다.');
         }

         const result = json.data;

         if (!result.basicInfo) {
            throw new Error('상품 정보를 가져올 수 없습니다. URL을 확인해주세요.');
         }

         setData(result);
         // 초기 로드 시 60개 미만이면 더보기 없음
         if (result.reviews && result.reviews.length < 60) {
            setHasMore(false);
         }
      } catch (err: any) {
         console.error(err);
         setError(err.message || '분석 중 오류가 발생했습니다.');
      } finally {
         setLoading(false);
      }
   };

   const handleLoadMore = async () => {
      if (!data || !data.basicInfo?.goodsNo || isReviewLoading || !hasMore) return;

      setIsReviewLoading(true);
      const nextPage = page + 1;

      try {
         const res = await fetch(`/api/reviews?goodsNo=${data.basicInfo.goodsNo}&page=${nextPage}&pageSize=60&sort=up_cnt_desc`);
         const json = await res.json();

         if (json.success) {
            setData((prev: any) => ({
               ...prev,
               reviews: [...prev.reviews, ...json.data]
            }));
            setPage(nextPage);
            setHasMore(json.hasMore);
         }
      } catch (error) {
         console.error('Failed to load more reviews:', error);
      } finally {
         setIsReviewLoading(false);
      }
   };

   // URL 파라미터로 자동 실행
   useEffect(() => {
      const queryUrl = searchParams.get('url');
      if (queryUrl && !data && !loading) {
         setUrl(queryUrl);
         handleAnalyze({ preventDefault: () => { } } as any);
      }
   }, [searchParams]);

   // Fetch summary when product reviews are available
   useEffect(() => {
      if (!data) return;

      // Filter reviews based on summaryFilter
      let targetReviews = data.reviews || [];

      if (summaryFilter !== 'all') {
         const rating = parseInt(summaryFilter);

         targetReviews = targetReviews.filter((r: any) => {
            return parseInt(r.rating) === rating;
         });
      }

      const productReviews = targetReviews
         .map((r: any) => `[구매자(${r.rating}점)] ${r.content}`);

      if (productReviews.length > 0) {
         setIsSummaryLoading(true);

         // 최대 20개까지 전송
         const limitedReviews = productReviews.slice(0, 20);

         fetch('/api/summary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reviews: limitedReviews })
         })
            .then(res => res.json())
            .then(resData => {
               setSummary(resData.summary || null);
            })
            .catch(err => console.error('Summary fetch error:', err))
            .finally(() => setIsSummaryLoading(false));
      } else {
         setSummary(null);
      }
   }, [data, summaryFilter]);

   const filterSocial = (items: any[]) => {
      if (!data) return { exact: [], brand: [] };
      const exact = items.filter((i: any) => i.isExactMatch);
      const brand = items.filter((i: any) => !i.isExactMatch);
      return { exact, brand };
   };

   // Sorted Reviews Logic
   const getSortedReviews = () => {
      if (!data?.reviews) return [];
      const reviews = [...data.reviews];
      if (reviewSort === 'high') return reviews.sort((a: any, b: any) => b.rating - a.rating);
      if (reviewSort === 'low') return reviews.sort((a: any, b: any) => a.rating - b.rating);
      return reviews; // Default (usually latest from API)
   };

   if (loading) return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center">
         <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black mb-4"></div>
         <p className="text-neutral-500 font-medium animate-pulse text-sm">상품 정보를 분석하고 있습니다...</p>
      </div>
   );

   // 데이터가 없거나 basicInfo가 없는 경우 (초기 상태 또는 에러)
   if (!data || !data.basicInfo) return (
      <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans pb-24">
         {/* ========== HEADER (Sticky) ========== */}
         <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-neutral-200/60 transition-all duration-300">
            <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
               <Link href="/" className="p-2 -ml-2 hover:bg-neutral-100 rounded-full transition-colors text-neutral-600">
                  <ArrowLeft size={22} />
               </Link>
               <h1 className="font-semibold text-sm truncate max-w-[200px] text-neutral-800 opacity-0 animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
                  상품 분석
               </h1>
               <div className="w-8"></div>
            </div>
         </header>
         <div className="max-w-md mx-auto px-4 pt-4 flex flex-col items-center justify-center h-[calc(100vh-100px)] text-neutral-500">
            <Search size={48} className="mb-4 text-neutral-300" />
            <p className="text-lg font-medium mb-2">무신사 상품 URL을 입력해주세요.</p>
            <p className="text-sm text-neutral-400 text-center">상품의 상세 정보와 스타일링을 분석해드립니다.</p>

            {error && (
               <div className="mt-6 w-full bg-red-50 text-red-600 p-4 rounded-xl text-sm flex items-center gap-2 animate-shake">
                  <AlertCircle size={18} />
                  {error}
               </div>
            )}

            <form onSubmit={handleAnalyze} className="relative flex items-center w-full mt-8">
               <Search className="absolute left-4 text-neutral-400" size={20} />
               <input value={url} onChange={e => setUrl(e.target.value)} placeholder="무신사 URL 입력" className="w-full bg-neutral-100 rounded-full py-3 pl-12 pr-20 outline-none text-sm border border-neutral-200 focus:border-black transition-colors" />
               <button disabled={loading} className="absolute right-1.5 bg-black text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-neutral-800 transition-colors">
                  {loading ? '...' : '분석'}
               </button>
            </form>
         </div>
      </div>
   );

   return (
      <div className="min-h-screen bg-[#F9FAFB] text-neutral-900 font-sans pb-24 lg:pb-0">
         {/* ========== HEADER (Sticky) ========== */}
         <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-neutral-200/60 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
               <Link href="/" className="p-2 -ml-2 hover:bg-neutral-100 rounded-full transition-colors text-neutral-600">
                  <ArrowLeft size={22} />
               </Link>
               <h1 className="font-semibold text-sm truncate max-w-[200px] lg:max-w-md text-neutral-800 opacity-0 animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
                  {data.basicInfo?.title}
               </h1>
               <div className="w-8"></div>
            </div>
         </header>

         <main className="max-w-7xl mx-auto px-4 pt-6 lg:pt-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

               {/* LEFT COLUMN (Fixed on Desktop) */}
               <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
                  {/* ========== HERO SECTION ========== */}
                  <div className="bg-white p-5 rounded-3xl shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] border border-neutral-100">
                     <div className="flex lg:flex-col gap-5">
                        <div className="w-28 h-36 lg:w-full lg:h-auto lg:aspect-[3/4] flex-shrink-0 bg-neutral-100 rounded-2xl overflow-hidden relative shadow-inner">
                           <Image src={data.basicInfo.imageUrl} alt="" fill className="object-cover" unoptimized />
                        </div>
                        <div className="flex-1 flex flex-col justify-between py-1 lg:gap-4">
                           <div>
                              <div className="flex items-center gap-2 mb-2">
                                 <span className="text-[11px] font-bold text-neutral-500 bg-neutral-100 px-2 py-1 rounded-full tracking-wide uppercase">
                                    {data.basicInfo.brand}
                                 </span>
                                 {data.basicInfo.isSoldOut && (
                                    <span className="text-[10px] font-bold text-white bg-neutral-800 px-2 py-1 rounded-full tracking-wide uppercase">
                                       SOLD OUT
                                    </span>
                                 )}
                              </div>
                              <h1 className="text-lg lg:text-2xl font-bold text-neutral-900 leading-snug lg:leading-tight">
                                 {data.basicInfo.title}
                              </h1>
                           </div>

                           <div>
                              <div className="flex items-baseline gap-2">
                                 {data.basicInfo.discountRate > 0 && (
                                    <span className="text-2xl lg:text-3xl font-extrabold text-red-600 mr-1">
                                       {data.basicInfo.discountRate}%
                                    </span>
                                 )}
                                 <span className="text-2xl lg:text-3xl font-extrabold text-neutral-900">
                                    {data.basicInfo.salePrice.toLocaleString()}
                                    <span className="text-sm lg:text-base font-normal ml-0.5">원</span>
                                 </span>
                                 {data.basicInfo.price > data.basicInfo.salePrice && (
                                    <span className="text-sm lg:text-base text-neutral-400 line-through">
                                       {data.basicInfo.price.toLocaleString()}
                                    </span>
                                 )}
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* Action Buttons */}
                     <div className="mt-5 grid grid-cols-[1fr_auto] gap-3">
                        {data.basicInfo.link && (
                           <a href={data.basicInfo.link} target="_blank"
                              className={`h-11 lg:h-12 rounded-xl text-sm lg:text-base font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg ${data.basicInfo.isSoldOut ? 'bg-neutral-300 text-white cursor-not-allowed shadow-none' : 'bg-black text-white hover:bg-neutral-800 shadow-black/10'}`}
                              onClick={(e) => { if (data.basicInfo.isSoldOut) e.preventDefault(); }}
                           >
                              {data.basicInfo.isSoldOut ? '품절된 상품입니다' : '무신사에서 구매하기'}
                              {!data.basicInfo.isSoldOut && <ExternalLink size={14} className="opacity-70" />}
                           </a>
                        )}
                        <a href={`https://lens.google.com/uploadbyurl?url=${encodeURIComponent(data.basicInfo.imageUrl)}`} target="_blank"
                           className="h-11 lg:h-12 px-4 bg-neutral-100 text-neutral-600 rounded-xl font-bold text-sm flex items-center justify-center hover:bg-neutral-200 transition-colors">
                           <ScanEye size={18} />
                        </a>
                     </div>
                  </div>
               </div>

               {/* RIGHT COLUMN (Scrollable) */}
               <div className="lg:col-span-7 space-y-6 pb-10">
                  {/* ========== TABS ========== */}
                  <div className="bg-neutral-100/80 p-1 rounded-xl flex relative sticky top-16 z-40 backdrop-blur-md">
                     <button
                        onClick={() => setActiveTab('info')}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 relative z-10 ${activeTab === 'info' ? 'bg-white text-black shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                     >
                        상세정보
                     </button>
                     <button
                        onClick={() => setActiveTab('visual')}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 relative z-10 ${activeTab === 'visual' ? 'bg-white text-black shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                     >
                        SNS
                     </button>
                  </div>

                  {/* ========== VISUAL TAB ========== */}
                  {activeTab === 'visual' && (
                     <div className="space-y-6 animate-fade-in-up">

                        {/* 인스타그램 섹션 */}
                        <div className="space-y-3">
                           <h3 className="font-bold text-base flex items-center gap-2 text-neutral-800 px-1">
                              <Instagram size={18} className="text-pink-500" /> 인스타 착용샷
                           </h3>

                           {data.social.instagram.length > 0 ? (
                              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                                 {data.social.instagram.map((ins: any, i: number) => (
                                    <a key={i} href={ins.link} target="_blank" className="group block relative aspect-square bg-neutral-100 rounded-xl overflow-hidden shadow-sm">
                                       {ins.thumb ? (
                                          <img src={ins.thumb} className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                                             onError={(e: any) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                                       ) : null}
                                       <div className="hidden absolute inset-0 bg-neutral-50 flex-col items-center justify-center p-2 text-center">
                                          <span className="text-[10px] font-medium text-neutral-400">이미지 없음</span>
                                       </div>
                                       {/* Overlay */}
                                       <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                    </a>
                                 ))}
                              </div>
                           ) : (
                              <div className="bg-white p-8 rounded-2xl text-center border border-neutral-100">
                                 <p className="text-neutral-400 text-sm">관련 게시물이 없습니다.</p>
                              </div>
                           )}
                        </div>

                        {/* 유튜브 섹션 */}
                        <div className="space-y-3">
                           <h3 className="font-bold text-base flex items-center gap-2 text-neutral-800 px-1">
                              <Youtube size={18} className="text-red-500" /> 유튜브 리뷰
                           </h3>

                           {(() => {
                              const { exact, brand } = filterSocial(data.social.youtube);
                              const hasExact = exact.length > 0;

                              return (
                                 <div className="space-y-6">
                                    {/* 1. 정확한 리뷰 */}
                                    {hasExact ? (
                                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                          {exact.map((y: any, i: number) => (
                                             <a key={i} href={y.link} target="_blank" className="flex gap-4 bg-white p-3 rounded-2xl border border-neutral-100 shadow-sm hover:shadow-md transition-all group">
                                                <div className="w-28 aspect-video bg-neutral-100 rounded-xl overflow-hidden flex-shrink-0 relative shadow-inner">
                                                   {y.thumb ? (
                                                      <img src={y.thumb} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                                                   ) : (
                                                      <div className="w-full h-full flex items-center justify-center text-neutral-300">
                                                         <Youtube size={24} />
                                                      </div>
                                                   )}
                                                   <span className="absolute top-1 left-1 bg-green-500 text-white text-[10px] px-1.5 rounded-md font-bold shadow-sm">일치</span>
                                                </div>
                                                <div className="flex-1 min-w-0 py-1 flex flex-col justify-center">
                                                   <h4 className="font-semibold text-sm text-neutral-800 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                                                      {y.title}
                                                   </h4>
                                                   <div className="mt-2 flex items-center gap-1 text-xs text-neutral-400">
                                                      <span>YouTube</span>
                                                      <span>•</span>
                                                      <span>영상 보기</span>
                                                   </div>
                                                </div>
                                             </a>
                                          ))}
                                       </div>
                                    ) : (
                                       <div className="bg-neutral-50 p-4 rounded-2xl flex items-center gap-3 text-sm text-neutral-600 border border-neutral-100">
                                          <AlertCircle className="text-neutral-400" size={20} />
                                          <div>
                                             <div className="font-bold">이 상품의 직접적인 영상 리뷰를 못 찾았어요.</div>
                                             <div className="text-xs text-neutral-400">대신 <b>{data.basicInfo.brand}</b> 브랜드의 다른 영상을 보여드릴게요.</div>
                                          </div>
                                       </div>
                                    )}

                                    {/* 2. 브랜드 관련 리뷰 (Fallback) */}
                                    {brand.length > 0 && (
                                       <div>
                                          <div className="text-xs font-bold text-neutral-400 mb-3 uppercase tracking-wider px-1">Related Brand Videos</div>
                                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                             {brand.slice(0, 6).map((y: any, i: number) => (
                                                <a key={i} href={y.link} target="_blank" className="group block bg-white rounded-xl overflow-hidden border border-neutral-100 shadow-sm hover:shadow-md transition-all">
                                                   <div className="aspect-video bg-neutral-100 relative overflow-hidden">
                                                      {y.thumb && <img src={y.thumb} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition duration-500" />}
                                                   </div>
                                                   <div className="p-3">
                                                      <div className="text-xs font-medium text-neutral-600 line-clamp-2 group-hover:text-neutral-900 transition-colors">{y.title}</div>
                                                   </div>
                                                </a>
                                             ))}
                                          </div>
                                       </div>
                                    )}
                                 </div>
                              );
                           })()}
                        </div>

                     </div>
                  )}

                  {/* ========== INFO TAB ========== */}
                  {activeTab === 'info' && (
                     <div className="flex flex-col gap-6 animate-fade-in-up">

                        {/* 0. 리뷰 요약 (NEW DESIGN) */}
                        <div className="bg-white p-6 rounded-3xl border border-neutral-200">
                           <div className="flex justify-between items-center mb-6">
                              <h3 className="font-bold text-lg text-black flex items-center gap-2">
                                 AI 리뷰 요약
                              </h3>

                              {/* Summary Filter (Minimal) */}
                              <div className="relative">
                                 <select
                                    value={summaryFilter}
                                    onChange={(e) => setSummaryFilter(e.target.value)}
                                    className="appearance-none bg-transparent text-xs font-bold text-neutral-500 border-b border-neutral-200 py-1 pr-6 outline-none focus:border-black transition-colors cursor-pointer"
                                 >
                                    <option value="all">전체 리뷰 요약</option>
                                    <option value="5">5점 리뷰만</option>
                                    <option value="4">4점 리뷰만</option>
                                    <option value="3">3점 리뷰만</option>
                                    <option value="2">2점 리뷰만</option>
                                    <option value="1">1점 리뷰만</option>
                                 </select>
                                 <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
                                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                       <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                 </div>
                              </div>
                           </div>

                           {isSummaryLoading ? (
                              <div className="space-y-4 py-2">
                                 <div className="h-4 bg-neutral-100 rounded w-3/4 animate-pulse"></div>
                                 <div className="h-4 bg-neutral-100 rounded w-full animate-pulse"></div>
                                 <div className="h-4 bg-neutral-100 rounded w-5/6 animate-pulse"></div>
                                 <div className="flex items-center gap-2 text-xs text-neutral-400 mt-4">
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-black"></div>
                                    AI가 리뷰를 분석하고 있습니다...
                                 </div>
                              </div>
                           ) : (
                              <div>
                                 {summary ? (
                                    <div className="space-y-8">
                                       {/* 장점 */}
                                       {summary.pros && summary.pros.length > 0 && (
                                          <div>
                                             <h4 className="text-sm font-bold text-black mb-3 flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 bg-black rounded-full"></span>
                                                장점
                                             </h4>
                                             <ul className="space-y-2 pl-4 border-l border-neutral-100">
                                                {summary.pros.map((item: string, i: number) => (
                                                   <li key={i} className="text-sm text-neutral-600 leading-relaxed">
                                                      {item}
                                                   </li>
                                                ))}
                                             </ul>
                                          </div>
                                       )}

                                       {/* 단점 */}
                                       {summary.cons && summary.cons.length > 0 && (
                                          <div>
                                             <h4 className="text-sm font-bold text-neutral-400 mb-3 flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 bg-neutral-300 rounded-full"></span>
                                                단점
                                             </h4>
                                             <ul className="space-y-2 pl-4 border-l border-neutral-100">
                                                {summary.cons.map((item: string, i: number) => (
                                                   <li key={i} className="text-sm text-neutral-500 leading-relaxed">
                                                      {item}
                                                   </li>
                                                ))}
                                             </ul>
                                          </div>
                                       )}

                                       {/* 핏/스타일 */}
                                       {summary.fitStyle && summary.fitStyle.length > 0 && (
                                          <div className="bg-neutral-50 p-4 rounded-xl">
                                             <h4 className="text-sm font-bold text-black mb-3 flex items-center gap-2">
                                                <Shirt size={14} className="text-neutral-500" />
                                                핏 & 스타일
                                             </h4>
                                             <ul className="space-y-2">
                                                {summary.fitStyle.map((item: string, i: number) => (
                                                   <li key={i} className="text-sm text-neutral-600 leading-relaxed flex gap-2">
                                                      <span className="text-neutral-300">•</span>
                                                      {item}
                                                   </li>
                                                ))}
                                             </ul>
                                          </div>
                                       )}
                                    </div>
                                 ) : (
                                    <div className="text-neutral-400 text-sm py-8 text-center bg-neutral-50 rounded-xl">
                                       요약할 리뷰 데이터가 부족합니다.
                                    </div>
                                 )}

                                 <div className="mt-6 pt-4 border-t border-neutral-100 flex justify-between items-center">
                                    <div className="flex items-center gap-1.5">
                                       <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div>
                                       <span className="text-[10px] font-bold text-black">AI SUMMARY</span>
                                    </div>
                                    <span className="text-[10px] text-neutral-400">Powered by Gemini</span>
                                 </div>
                              </div>
                           )}
                        </div>

                        {/* 0.5 상품 정보 (핏/계절감 등) */}
                        {(data.basicInfo.fit || data.basicInfo.season || data.basicInfo.touch || data.basicInfo.flexibility || data.basicInfo.sheerness || data.basicInfo.thickness) && (
                           <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 overflow-hidden">
                              <div className="px-6 py-5 border-b border-neutral-50">
                                 <h3 className="font-bold flex items-center gap-2 text-neutral-800">
                                    <CheckCircle2 size={18} className="text-neutral-400" /> 상품 정보
                                 </h3>
                              </div>
                              <div className="p-5 grid grid-cols-2 gap-3">
                                 {[
                                    { label: '핏', value: data.basicInfo.fit },
                                    { label: '촉감', value: data.basicInfo.touch },
                                    { label: '신축성', value: data.basicInfo.flexibility },
                                    { label: '비침', value: data.basicInfo.sheerness },
                                    { label: '두께', value: data.basicInfo.thickness },
                                    { label: '계절', value: data.basicInfo.season },
                                 ].map((item, i) => (
                                    <div key={i} className="bg-neutral-50 rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-1.5">
                                       <span className="text-xs text-neutral-400 font-medium">{item.label}</span>
                                       <span className="text-sm font-bold text-neutral-800">{item.value || '-'}</span>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        )}

                        {/* 1. 사이즈 정보 */}
                        {data.sizeTable?.rows?.length > 0 && (
                           <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 overflow-hidden">
                              <div className="px-6 py-5 border-b border-neutral-50">
                                 <h3 className="font-bold flex items-center gap-2 text-neutral-800">
                                    <Ruler size={18} className="text-neutral-400" /> 사이즈 실측
                                 </h3>
                              </div>
                              <div className="overflow-x-auto">
                                 <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-neutral-400 uppercase bg-neutral-50/50">
                                       <tr>
                                          <th className="px-6 py-3 font-medium whitespace-nowrap">CM</th>
                                          {data.sizeTable.headers.map((header: string, i: number) => (
                                             <th key={i} className="px-6 py-3 font-medium whitespace-nowrap">
                                                {header}
                                             </th>
                                          ))}
                                       </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-50">
                                       {data.sizeTable.rows.map((row: any, i: number) => (
                                          <tr key={i} className="bg-white hover:bg-neutral-50 transition-colors">
                                             <td className="px-6 py-4 font-bold text-neutral-900 whitespace-nowrap">
                                                {row.name}
                                             </td>
                                             {row.values.map((val: any, j: number) => (
                                                <td key={j} className="px-6 py-4 text-neutral-600 whitespace-nowrap">
                                                   {val}
                                                </td>
                                             ))}
                                          </tr>
                                       ))}
                                    </tbody>
                                 </table>
                              </div>
                           </div>
                        )}

                        {/* 2. 구매자 리뷰 */}
                        {data.reviews?.length > 0 && (
                           <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 overflow-hidden">
                              <div className="px-6 py-5 border-b border-neutral-50 flex justify-between items-center">
                                 <h3 className="font-bold flex items-center gap-2 text-neutral-800">
                                    <Shirt size={18} className="text-neutral-400" /> 구매자 찐후기
                                 </h3>

                                 {/* Review Sort */}
                                 <div className="flex bg-neutral-100 rounded-lg p-1 gap-1">
                                    {[
                                       { id: 'latest', label: '최신순' },
                                       { id: 'high', label: '높은순' },
                                       { id: 'low', label: '낮은순' }
                                    ].map((opt) => (
                                       <button
                                          key={opt.id}
                                          onClick={() => setReviewSort(opt.id as any)}
                                          className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${reviewSort === opt.id ? 'bg-white text-black shadow-sm' : 'text-neutral-400 hover:text-neutral-600'}`}
                                       >
                                          {opt.label}
                                       </button>
                                    ))}
                                 </div>
                              </div>
                              <div className="divide-y divide-neutral-50">
                                 {getSortedReviews().map((r: any, i: number) => (
                                    <div key={i} className="p-6 hover:bg-neutral-50/50 transition-colors">
                                       <div className="flex justify-between items-center mb-2">
                                          <div className="flex items-center gap-2">
                                             <span className="font-bold text-sm text-neutral-900">{r.userName}</span>
                                             <span className="text-xs text-neutral-400">{r.date}</span>
                                          </div>
                                          <span className="text-yellow-400 text-xs tracking-widest">{'★'.repeat(r.rating)}</span>
                                       </div>
                                       <div className="flex gap-2 mb-3">
                                          <span className="text-xs bg-neutral-100 text-neutral-500 px-2 py-1 rounded-md">{r.profile}</span>
                                          <span className="text-xs bg-neutral-100 text-neutral-500 px-2 py-1 rounded-md">{r.size}</span>
                                       </div>
                                       <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">{r.content}</p>
                                    </div>
                                 ))}
                              </div>

                              {/* Load More Button */}
                              {hasMore && (
                                 <div className="p-4 border-t border-neutral-50">
                                    <button
                                       onClick={handleLoadMore}
                                       disabled={isReviewLoading}
                                       className="w-full py-3 bg-neutral-50 text-neutral-600 text-sm font-bold rounded-xl hover:bg-neutral-100 transition-colors flex items-center justify-center gap-2"
                                    >
                                       {isReviewLoading ? (
                                          <>
                                             <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-neutral-400"></div>
                                             리뷰 더 불러오는 중...
                                          </>
                                       ) : (
                                          <>
                                             더 보기 (+60개)
                                          </>
                                       )}
                                    </button>
                                 </div>
                              )}
                           </div>
                        )}

                     </div>
                  )}
               </div>
            </div>
         </main>
      </div>
   );
}
