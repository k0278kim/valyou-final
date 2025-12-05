'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
   Search, Youtube, Instagram, BookOpen,
   ArrowLeft, ExternalLink, ScanEye, CheckCircle2, Ruler, Shirt, AlertCircle, TrendingUp, Sparkles
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

   // New State for Profile & Recommendation
   const [userProfile, setUserProfile] = useState<any>(null);
   const [recommendedSize, setRecommendedSize] = useState<string | null>(null);
   const [similarBodyFilter, setSimilarBodyFilter] = useState(false);
   const [fitPrediction, setFitPrediction] = useState<string | null>(null);
   const [isFitAnalyzing, setIsFitAnalyzing] = useState(false);

   useEffect(() => {
      fetchUserProfile();
   }, []);

   const fetchUserProfile = async () => {
      try {
         const res = await fetch('/api/profile');
         const json = await res.json();
         if (json.success) {
            setUserProfile(json.data);
         }
      } catch (err) {
         console.error('Failed to fetch user profile:', err);
      }
   };

   // Calculate recommended size when data or userProfile changes
   useEffect(() => {
      if (data?.sizeTable && userProfile?.idealSize) {
         const bestFit = calculateRecommendedSize(data.sizeTable, userProfile.idealSize);
         setRecommendedSize(bestFit);

         // Trigger AI Fit Prediction if a size is recommended
         if (bestFit && userProfile.userStats) {
            fetchFitPrediction(bestFit, userProfile.userStats, data.basicInfo.title, data.sizeTable);
         }
      }
   }, [data, userProfile]);

   const fetchFitPrediction = async (size: string, stats: any, title: string, table: any) => {
      setIsFitAnalyzing(true);
      try {
         const res = await fetch('/api/fit-recommend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               userStats: stats,
               productTitle: title,
               sizeTable: table,
               recommendedSize: size
            })
         });
         const json = await res.json();
         if (json.success) {
            setFitPrediction(json.fitPrediction);
         }
      } catch (err) {
         console.error('Fit prediction failed:', err);
      } finally {
         setIsFitAnalyzing(false);
      }
   };

   const calculateRecommendedSize = (sizeTable: any, idealSize: any) => {
      if (!sizeTable?.rows || !idealSize) return null;

      let bestSize = null;
      let minDiff = Infinity;

      sizeTable.rows.forEach((row: any) => {
         let totalDiff = 0;
         let matchCount = 0;

         sizeTable.headers.forEach((header: string, idx: number) => {
            // Match headers (Length, Shoulder, Chest, Sleeve)
            // This is a simple matching logic, might need refinement based on actual header names
            const key = Object.keys(idealSize).find(k => header.includes(k) || k.includes(header));
            if (key) {
               const val = parseFloat(row.values[idx]);
               const ideal = parseFloat(idealSize[key].avg);
               if (!isNaN(val) && !isNaN(ideal)) {
                  totalDiff += Math.abs(val - ideal);
                  matchCount++;
               }
            }
         });

         if (matchCount > 0 && totalDiff < minDiff) {
            minDiff = totalDiff;
            bestSize = row.name;
         }
      });

      return bestSize;
   };

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

   const summaryRequestId = useRef(0);

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
         const currentId = ++summaryRequestId.current;

         // 최대 20개까지 전송
         const limitedReviews = productReviews.slice(0, 20);

         fetch('/api/summary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reviews: limitedReviews })
         })
            .then(res => res.json())
            .then(resData => {
               if (currentId === summaryRequestId.current) {
                  setSummary(resData.summary || null);
               }
            })
            .catch(err => console.error('Summary fetch error:', err))
            .finally(() => {
               if (currentId === summaryRequestId.current) {
                  setIsSummaryLoading(false);
               }
            });
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
      let reviews = [...data.reviews];

      // Filter by Body Type
      if (similarBodyFilter && userProfile?.userStats?.height && userProfile?.userStats?.weight) {
         const userH = parseFloat(userProfile.userStats.height);
         const userW = parseFloat(userProfile.userStats.weight);

         reviews = reviews.filter((r: any) => {
            // Parse height/weight from review (handle "175cm", "60kg" strings)
            let h = r.userHeight;
            let w = r.userWeight;

            if (typeof h === 'string') h = parseFloat(h.replace(/[^0-9.]/g, ''));
            if (typeof w === 'string') w = parseFloat(w.replace(/[^0-9.]/g, ''));

            if (!h || !w || isNaN(h) || isNaN(w)) return false;

            return Math.abs(userH - h) <= 5 && Math.abs(userW - w) <= 5;
         });
      }

      if (reviewSort === 'high') return reviews.sort((a: any, b: any) => b.rating - a.rating);
      if (reviewSort === 'low') return reviews.sort((a: any, b: any) => a.rating - b.rating);
      return reviews; // Default (usually latest from API)
   };

   if (loading) return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
         <div className="w-6 h-6 border-2 border-neutral-200 border-t-black rounded-full animate-spin mb-4" />
         <p className="text-xs font-bold text-neutral-400 animate-pulse">ANALYZING PRODUCT...</p>
      </div>
   );

   // 데이터가 없거나 basicInfo가 없는 경우 (초기 상태 또는 에러)
   if (!data || !data.basicInfo) return (
      <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white">
         <header className="fixed top-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-xl z-50 flex items-center justify-between px-8 border-b border-neutral-100">
            <Link href="/search" className="text-2xl font-black tracking-tighter hover:opacity-50 transition-opacity">
               VALYOU
            </Link>
            <nav className="flex gap-8">
               <Link href="/search" className="text-sm font-bold text-black border-b-2 border-black pb-1">SEARCH</Link>
               <Link href="/profile" className="text-sm font-medium text-neutral-400 hover:text-black transition-colors">WARDROBE</Link>
            </nav>
         </header>

         <div className="min-h-screen flex flex-col items-center justify-center px-4">
            <div className="w-full max-w-xl">
               <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 text-center">
                  SEARCH
               </h1>
               <form onSubmit={handleAnalyze} className="relative">
                  <input
                     value={url}
                     onChange={e => setUrl(e.target.value)}
                     placeholder="Paste Musinsa URL here"
                     className="w-full pb-6 bg-transparent border-b-2 border-neutral-100 focus:border-black outline-none text-2xl md:text-3xl font-bold placeholder-neutral-200 transition-colors pr-12"
                  />
                  <button disabled={loading} className="absolute right-0 top-0 bottom-6 text-black hover:opacity-50 transition-opacity">
                     <ArrowLeft className="rotate-180" size={32} />
                  </button>
               </form>
               {error && (
                  <div className="mt-8 p-4 bg-neutral-50 border border-neutral-100 flex items-center gap-3 text-sm font-medium text-neutral-500">
                     <AlertCircle size={16} />
                     {error}
                  </div>
               )}
            </div>
         </div>
      </div>
   );

   return (
      <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white pb-24 lg:pb-0">
         {/* Minimal Header */}
         <header className="fixed top-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-xl z-50 flex items-center justify-between px-8 border-b border-neutral-100">
            <Link href="/search" className="text-2xl font-black tracking-tighter hover:opacity-50 transition-opacity">
               VALYOU
            </Link>
            <nav className="flex gap-8">
               <Link href="/search" className="text-sm font-bold text-black border-b-2 border-black pb-1">SEARCH</Link>
               <Link href="/profile" className="text-sm font-medium text-neutral-400 hover:text-black transition-colors">WARDROBE</Link>
            </nav>
         </header>

         <main className="pt-32 px-8 max-w-7xl mx-auto pb-32">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

               {/* LEFT COLUMN (Fixed on Desktop) */}
               <div className="lg:col-span-5 lg:sticky lg:top-32 space-y-8">
                  {/* Product Image */}
                  <div className="aspect-[3/4] bg-neutral-100 relative overflow-hidden">
                     <Image src={data.basicInfo.imageUrl} alt="" fill className="object-cover" unoptimized />
                  </div>

                  {/* Product Info */}
                  <div>
                     <div className="flex items-center gap-3 mb-4">
                        <span className="text-sm font-bold text-neutral-400 uppercase tracking-wider">
                           {data.basicInfo.brand}
                        </span>
                        {data.basicInfo.isSoldOut && (
                           <span className="text-xs font-bold text-white bg-black px-2 py-1">
                              SOLD OUT
                           </span>
                        )}
                     </div>
                     <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight mb-6">
                        {data.basicInfo.title}
                     </h1>

                     <div className="flex items-baseline gap-3 mb-8">
                        {data.basicInfo.discountRate > 0 && (
                           <span className="text-3xl font-black text-red-600">
                              {data.basicInfo.discountRate}%
                           </span>
                        )}
                        <span className="text-3xl font-black">
                           {data.basicInfo.salePrice.toLocaleString()}
                           <span className="text-base font-medium ml-1">KRW</span>
                        </span>
                        {data.basicInfo.price > data.basicInfo.salePrice && (
                           <span className="text-lg text-neutral-300 line-through decoration-2">
                              {data.basicInfo.price.toLocaleString()}
                           </span>
                        )}
                     </div>

                     {/* Action Buttons */}
                     <div className="grid grid-cols-[1fr_auto] gap-4">
                        {data.basicInfo.link && (
                           <a href={data.basicInfo.link} target="_blank"
                              className={`h-14 flex items-center justify-center text-sm font-bold tracking-wide transition-all ${data.basicInfo.isSoldOut
                                 ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                                 : 'bg-black text-white hover:bg-neutral-800'
                                 }`}
                              onClick={(e) => { if (data.basicInfo.isSoldOut) e.preventDefault(); }}
                           >
                              {data.basicInfo.isSoldOut ? '품절된 상품' : '무신사에서 구매하기'}
                              {!data.basicInfo.isSoldOut && <ExternalLink size={14} className="ml-2 opacity-70" />}
                           </a>
                        )}
                        <a href={`https://lens.google.com/uploadbyurl?url=${encodeURIComponent(data.basicInfo.imageUrl)}`} target="_blank"
                           className="h-14 w-14 flex items-center justify-center border-2 border-neutral-100 text-neutral-400 hover:text-black hover:border-black transition-colors">
                           <ScanEye size={20} />
                        </a>
                     </div>
                  </div>
               </div>

               {/* RIGHT COLUMN (Scrollable) */}
               <div className="lg:col-span-7 space-y-12">
                  {/* Tabs */}
                  <div className="flex border-b-2 border-neutral-100">
                     <button
                        onClick={() => setActiveTab('info')}
                        className={`flex-1 py-4 text-sm font-bold tracking-widest uppercase transition-colors ${activeTab === 'info' ? 'text-black border-b-2 border-black -mb-0.5' : 'text-neutral-300 hover:text-neutral-500'}`}
                     >
                        Info & Analysis
                     </button>
                     <button
                        onClick={() => setActiveTab('visual')}
                        className={`flex-1 py-4 text-sm font-bold tracking-widest uppercase transition-colors ${activeTab === 'visual' ? 'text-black border-b-2 border-black -mb-0.5' : 'text-neutral-300 hover:text-neutral-500'}`}
                     >
                        Social & Reviews
                     </button>
                  </div>

                  {/* ========== VISUAL TAB ========== */}
                  {activeTab === 'visual' && (
                     <div className="space-y-12 animate-fade-in-up">

                        {/* Instagram Section */}
                        <section>
                           <h3 className="text-xs font-black tracking-widest text-neutral-400 mb-6 uppercase flex items-center gap-2">
                              <Instagram size={14} /> Instagram Looks
                           </h3>

                           {data.social.instagram.length > 0 ? (
                              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1">
                                 {data.social.instagram.map((ins: any, i: number) => (
                                    <a key={i} href={ins.link} target="_blank" className="group block relative aspect-square bg-neutral-100 overflow-hidden">
                                       {ins.thumb ? (
                                          <img src={ins.thumb} className="w-full h-full object-cover group-hover:scale-110 transition duration-700 grayscale group-hover:grayscale-0"
                                             onError={(e: any) => { e.target.style.display = 'none'; }} />
                                       ) : null}
                                       <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                    </a>
                                 ))}
                              </div>
                           ) : (
                              <div className="py-12 text-center border border-neutral-100">
                                 <p className="text-sm text-neutral-400">관련 게시물이 없습니다.</p>
                              </div>
                           )}
                        </section>

                        {/* YouTube Section */}
                        <section>
                           <h3 className="text-xs font-black tracking-widest text-neutral-400 mb-6 uppercase flex items-center gap-2">
                              <Youtube size={14} /> Youtube Reviews
                           </h3>

                           {(() => {
                              const { exact, brand } = filterSocial(data.social.youtube);
                              const hasExact = exact.length > 0;

                              return (
                                 <div className="space-y-8">
                                    {/* Exact Matches */}
                                    {hasExact ? (
                                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                          {exact.map((y: any, i: number) => (
                                             <a key={i} href={y.link} target="_blank" className="group block">
                                                <div className="aspect-video bg-neutral-100 overflow-hidden mb-3 relative">
                                                   {y.thumb ? (
                                                      <img src={y.thumb} className="w-full h-full object-cover group-hover:scale-105 transition duration-700 grayscale group-hover:grayscale-0" />
                                                   ) : (
                                                      <div className="w-full h-full flex items-center justify-center text-neutral-300">
                                                         <Youtube size={24} />
                                                      </div>
                                                   )}
                                                   <span className="absolute top-2 left-2 bg-black text-white text-[10px] font-bold px-2 py-1">MATCH</span>
                                                </div>
                                                <h4 className="font-bold text-sm leading-snug group-hover:underline decoration-1 underline-offset-4">
                                                   {y.title}
                                                </h4>
                                             </a>
                                          ))}
                                       </div>
                                    ) : (
                                       <div className="p-6 border border-neutral-100 flex items-center gap-4">
                                          <AlertCircle className="text-neutral-300" size={20} />
                                          <div>
                                             <div className="font-bold text-sm">직접적인 영상 리뷰가 없습니다.</div>
                                             <div className="text-xs text-neutral-400 mt-1">대신 <b>{data.basicInfo.brand}</b> 브랜드의 다른 영상을 보여드릴게요.</div>
                                          </div>
                                       </div>
                                    )}

                                    {/* Brand Related */}
                                    {brand.length > 0 && (
                                       <div>
                                          <div className="text-xs font-bold text-neutral-300 mb-4 uppercase tracking-wider">Related Brand Videos</div>
                                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                             {brand.slice(0, 6).map((y: any, i: number) => (
                                                <a key={i} href={y.link} target="_blank" className="group block">
                                                   <div className="aspect-video bg-neutral-100 mb-2 overflow-hidden">
                                                      {y.thumb && <img src={y.thumb} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition duration-700 grayscale group-hover:grayscale-0" />}
                                                   </div>
                                                   <div className="text-xs font-medium text-neutral-500 line-clamp-2 group-hover:text-black transition-colors">{y.title}</div>
                                                </a>
                                             ))}
                                          </div>
                                       </div>
                                    )}
                                 </div>
                              );
                           })()}
                        </section>

                        {/* Reviews Section */}
                        {data.reviews?.length > 0 && (
                           <section>
                              <div className="flex items-center justify-between mb-8">
                                 <h3 className="text-xs font-black tracking-widest text-neutral-400 uppercase">Real Reviews</h3>

                                 <div className="flex gap-4">
                                    {/* Body Type Filter */}
                                    {userProfile?.userStats?.height && (
                                       <button
                                          onClick={() => setSimilarBodyFilter(!similarBodyFilter)}
                                          className={`text-xs font-bold transition-colors ${similarBodyFilter ? 'text-black underline decoration-2 underline-offset-4' : 'text-neutral-300 hover:text-neutral-500'}`}
                                       >
                                          내 체형과 비슷한 리뷰
                                       </button>
                                    )}

                                    {/* Sort */}
                                    <div className="flex gap-2">
                                       {[
                                          { id: 'latest', label: '최신순' },
                                          { id: 'high', label: '높은순' },
                                          { id: 'low', label: '낮은순' }
                                       ].map((opt) => (
                                          <button
                                             key={opt.id}
                                             onClick={() => setReviewSort(opt.id as any)}
                                             className={`text-xs font-bold transition-colors ${reviewSort === opt.id ? 'text-black' : 'text-neutral-300 hover:text-neutral-500'}`}
                                          >
                                             {opt.label}
                                          </button>
                                       ))}
                                    </div>
                                 </div>
                              </div>

                              <div className="space-y-8">
                                 {getSortedReviews().map((r: any, i: number) => (
                                    <div key={i} className="group">
                                       <div className="flex justify-between items-baseline mb-2">
                                          <div className="flex items-center gap-2">
                                             <span className="font-bold text-sm">{r.userName}</span>
                                             <span className="text-xs text-neutral-300">{r.date}</span>
                                          </div>
                                          <div className="flex gap-1">
                                             {[...Array(5)].map((_, idx) => (
                                                <div key={idx} className={`w-1.5 h-1.5 rounded-full ${idx < r.rating ? 'bg-black' : 'bg-neutral-200'}`} />
                                             ))}
                                          </div>
                                       </div>

                                       <div className="flex flex-wrap gap-2 mb-3">
                                          {(r.userHeight || r.userWeight) && (
                                             <span className="text-[10px] font-bold bg-neutral-100 px-2 py-1 uppercase tracking-wide">
                                                {r.userHeight ? `${r.userHeight}CM` : ''}
                                                {r.userHeight && r.userWeight ? ' / ' : ''}
                                                {r.userWeight ? `${r.userWeight}KG` : ''}
                                             </span>
                                          )}
                                          {r.option && (
                                             <span className="text-[10px] font-bold border border-neutral-100 text-neutral-400 px-2 py-1 uppercase tracking-wide">
                                                {r.option}
                                             </span>
                                          )}
                                       </div>

                                       <p className="text-sm leading-relaxed text-neutral-600 whitespace-pre-wrap group-hover:text-black transition-colors">
                                          {r.content}
                                       </p>
                                    </div>
                                 ))}
                              </div>

                              {hasMore && (
                                 <button
                                    onClick={handleLoadMore}
                                    disabled={isReviewLoading}
                                    className="w-full mt-12 py-4 border border-black text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors disabled:opacity-50"
                                 >
                                    {isReviewLoading ? 'LOADING...' : 'LOAD MORE REVIEWS'}
                                 </button>
                              )}
                           </section>
                        )}
                     </div>
                  )}

                  {/* ========== INFO TAB ========== */}
                  {activeTab === 'info' && (
                     <div className="space-y-12 animate-fade-in-up">

                        {/* AI Review Summary */}
                        <section className="bg-neutral-50 p-8">
                           <div className="flex justify-between items-center mb-8">
                              <h3 className="text-xl font-black flex items-center gap-2">
                                 AI REVIEW SUMMARY
                              </h3>

                              {/* Minimal Filter */}
                              <div className="relative">
                                 <select
                                    value={summaryFilter}
                                    onChange={(e) => setSummaryFilter(e.target.value)}
                                    className="appearance-none bg-transparent text-xs font-bold text-neutral-400 border-b border-neutral-200 py-1 pr-6 outline-none focus:border-black focus:text-black transition-colors cursor-pointer"
                                 >
                                    <option value="all">ALL REVIEWS</option>
                                    <option value="5">5 STARS ONLY</option>
                                    <option value="4">4 STARS ONLY</option>
                                    <option value="3">3 STARS ONLY</option>
                                    <option value="2">2 STARS ONLY</option>
                                    <option value="1">1 STAR ONLY</option>
                                 </select>
                                 <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
                                    <svg width="8" height="4" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 1L5 5L9 1" /></svg>
                                 </div>
                              </div>
                           </div>

                           {isSummaryLoading ? (
                              <div className="space-y-4 opacity-50">
                                 <div className="h-4 bg-neutral-200 w-3/4 animate-pulse"></div>
                                 <div className="h-4 bg-neutral-200 w-full animate-pulse"></div>
                                 <div className="h-4 bg-neutral-200 w-5/6 animate-pulse"></div>
                                 <div className="pt-4 text-xs font-bold text-neutral-400">ANALYZING REVIEWS...</div>
                              </div>
                           ) : (
                              <div>
                                 {summary ? (
                                    <div className="space-y-8">
                                       {/* Pros */}
                                       {summary.pros && summary.pros.length > 0 && (
                                          <div>
                                             <h4 className="text-xs font-black text-black mb-4 uppercase tracking-widest">Pros</h4>
                                             <ul className="space-y-3">
                                                {summary.pros.map((item: string, i: number) => (
                                                   <li key={i} className="text-sm font-medium text-neutral-600 flex gap-3">
                                                      <span className="text-black font-bold">+</span>
                                                      {item}
                                                   </li>
                                                ))}
                                             </ul>
                                          </div>
                                       )}

                                       {/* Cons */}
                                       {summary.cons && summary.cons.length > 0 && (
                                          <div>
                                             <h4 className="text-xs font-black text-neutral-400 mb-4 uppercase tracking-widest">Cons</h4>
                                             <ul className="space-y-3">
                                                {summary.cons.map((item: string, i: number) => (
                                                   <li key={i} className="text-sm font-medium text-neutral-500 flex gap-3">
                                                      <span className="text-neutral-300 font-bold">-</span>
                                                      {item}
                                                   </li>
                                                ))}
                                             </ul>
                                          </div>
                                       )}

                                       {/* Fit & Style */}
                                       {summary.fitStyle && summary.fitStyle.length > 0 && (
                                          <div className="pt-6 border-t border-neutral-200">
                                             <h4 className="text-xs font-black text-black mb-4 uppercase tracking-widest">Fit & Style</h4>
                                             <ul className="space-y-2">
                                                {summary.fitStyle.map((item: string, i: number) => (
                                                   <li key={i} className="text-sm text-neutral-600">
                                                      {item}
                                                   </li>
                                                ))}
                                             </ul>
                                          </div>
                                       )}
                                    </div>
                                 ) : (
                                    <div className="text-neutral-400 text-sm py-8 text-center">
                                       요약할 리뷰 데이터가 부족합니다.
                                    </div>
                                 )}

                                 <div className="mt-8 pt-4 border-t border-neutral-200 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                       <div className="w-1.5 h-1.5 bg-black animate-pulse"></div>
                                       <span className="text-[10px] font-black tracking-widest">AI SUMMARY</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-neutral-300">POWERED BY GEMINI</span>
                                 </div>
                              </div>
                           )}
                        </section>

                        {/* Product Specs */}
                        {(data.basicInfo.fit || data.basicInfo.season || data.basicInfo.touch || data.basicInfo.flexibility || data.basicInfo.sheerness || data.basicInfo.thickness) && (
                           <section>
                              <h3 className="text-xs font-black tracking-widest text-neutral-400 mb-6 uppercase">Product Specs</h3>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                 {[
                                    { label: 'FIT', value: data.basicInfo.fit },
                                    { label: 'TOUCH', value: data.basicInfo.touch },
                                    { label: 'FLEX', value: data.basicInfo.flexibility },
                                    { label: 'SHEER', value: data.basicInfo.sheerness },
                                    { label: 'THICK', value: data.basicInfo.thickness },
                                    { label: 'SEASON', value: data.basicInfo.season },
                                 ].map((item, i) => (
                                    <div key={i} className="border border-neutral-100 p-6 flex flex-col items-center justify-center text-center gap-2 hover:border-black transition-colors">
                                       <span className="text-[10px] font-bold text-neutral-300 tracking-widest">{item.label}</span>
                                       <span className="text-sm font-bold text-black">{item.value || '-'}</span>
                                    </div>
                                 ))}
                              </div>
                           </section>
                        )}

                        {/* Size Table */}
                        {data.sizeTable?.rows?.length > 0 && (
                           <section>
                              <h3 className="text-xs font-black tracking-widest text-neutral-400 mb-6 uppercase">Size Guide</h3>

                              {/* Recommendation Banner */}
                              {recommendedSize && userProfile?.userStats && (
                                 <div className="bg-black text-white p-6 mb-6 flex items-start gap-4">
                                    <div className="mt-1">
                                       <CheckCircle2 size={16} />
                                    </div>
                                    <div>
                                       <p className="font-bold text-lg mb-1">
                                          추천 사이즈: <span className="underline decoration-2 underline-offset-4">{recommendedSize}</span>
                                       </p>
                                       <p className="text-sm text-neutral-400">
                                          고객님의 체형({userProfile.userStats.height}cm/{userProfile.userStats.weight}kg)과 기존 구매 이력을 분석한 결과입니다.
                                       </p>
                                    </div>
                                 </div>
                              )}

                              {/* AI Fit Prediction Card */}
                              {(isFitAnalyzing || fitPrediction) && (
                                 <div className="border border-neutral-200 p-6 mb-8 bg-neutral-50">
                                    <div className="flex items-center gap-2 mb-4">
                                       <Sparkles size={16} className="text-black" />
                                       <h4 className="font-black text-sm uppercase tracking-wider">AI Fit Prediction</h4>
                                    </div>

                                    {isFitAnalyzing ? (
                                       <div className="flex items-center gap-3 text-sm font-medium text-neutral-500">
                                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                                          AI가 핏을 분석하고 있습니다...
                                       </div>
                                    ) : (
                                       <div className="space-y-4">
                                          <p className="text-sm font-medium leading-relaxed text-neutral-800">
                                             {fitPrediction}
                                          </p>

                                          {/* Ideal Size Display */}
                                          {userProfile?.idealSize && (
                                             <div className="pt-4 border-t border-neutral-200">
                                                <p className="text-[10px] font-bold text-neutral-400 mb-2 uppercase tracking-wider">Your Ideal Measurements</p>
                                                <div className="flex flex-wrap gap-2">
                                                   {Object.entries(userProfile.idealSize).map(([key, val]: any) => (
                                                      <span key={key} className="text-xs font-bold bg-white border border-neutral-200 px-2 py-1">
                                                         {key}: {val.avg}
                                                      </span>
                                                   ))}
                                                </div>
                                             </div>
                                          )}
                                       </div>
                                    )}
                                 </div>
                              )}

                              <div className="overflow-x-auto border border-neutral-100">
                                 <table className="w-full text-sm text-left">
                                    <thead className="text-[10px] font-bold text-neutral-400 uppercase bg-neutral-50 border-b border-neutral-100">
                                       <tr>
                                          <th className="px-6 py-4 whitespace-nowrap">SIZE</th>
                                          {data.sizeTable.headers.map((header: string, i: number) => (
                                             <th key={i} className="px-6 py-4 whitespace-nowrap">
                                                {header}
                                             </th>
                                          ))}
                                       </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100">
                                       {data.sizeTable.rows.map((row: any, i: number) => {
                                          const isRecommended = recommendedSize === row.name;
                                          return (
                                             <tr key={i} className={`transition-colors ${isRecommended ? 'bg-neutral-50' : 'bg-white hover:bg-neutral-50'}`}>
                                                <td className="px-6 py-4 font-black text-black whitespace-nowrap flex items-center gap-2">
                                                   {row.name}
                                                   {isRecommended && (
                                                      <span className="bg-black text-white text-[10px] px-1.5 py-0.5 font-bold">PICK</span>
                                                   )}
                                                </td>
                                                {row.values.map((val: any, j: number) => (
                                                   <td key={j} className={`px-6 py-4 whitespace-nowrap font-medium ${isRecommended ? 'text-black' : 'text-neutral-500'}`}>
                                                      {val}
                                                   </td>
                                                ))}
                                             </tr>
                                          );
                                       })}
                                    </tbody>
                                 </table>
                              </div>
                           </section>
                        )}
                     </div>
                  )}
               </div>
            </div>
         </main>
      </div>
   );
}
