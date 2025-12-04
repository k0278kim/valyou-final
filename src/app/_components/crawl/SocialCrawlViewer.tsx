'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, Search, Youtube, Instagram } from 'lucide-react';

interface Props {
  brand: string;
  initialKeyword: string; // 초기 검색어
}

export default function SocialCrawlViewer({ brand, initialKeyword }: Props) {
  // 사용자가 수정 가능한 검색어 상태
  const [keyword, setKeyword] = useState(initialKeyword);
  const [items, setItems] = useState<any[]>([]);
  const [officialSite, setOfficialSite] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // 처음 로드될 때 한 번 검색
  useEffect(() => {
    if (initialKeyword && !hasSearched) {
        setKeyword(initialKeyword);
        fetchData(initialKeyword);
    }
  }, [initialKeyword]);

  const fetchData = async (searchQuery: string) => {
    if (!searchQuery) return;
    setLoading(true);
    setItems([]); // 기존 결과 초기화

    try {
      // 브랜드명도 같이 보내서 공식 홈페이지를 찾게 함
      const res = await fetch(`/api/search?query=${encodeURIComponent(searchQuery)}&brand=${encodeURIComponent(brand)}`);
      const json = await res.json();
      
      if (json.success) {
        setItems(json.items);
        setOfficialSite(json.officialSite);
        setHasSearched(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(keyword);
  };

  return (
    <div className="space-y-6 mt-8">
      
      {/* 1. 검색어 수정 및 공식 홈페이지 섹션 */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            🔍 소셜 반응 & 공식 스토어
        </h3>

        {/* 공식 홈페이지 카드 (있으면 표시) */}
        {officialSite && (
            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                <div>
                    <div className="text-xs text-gray-500 font-bold mb-1">OFFICIAL STORE</div>
                    <div className="font-bold text-gray-900">{officialSite.title}</div>
                    <div className="text-sm text-blue-600 truncate max-w-xs">{officialSite.link}</div>
                </div>
                <a 
                    href={officialSite.link} 
                    target="_blank" 
                    rel="noreferrer"
                    className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 transition"
                >
                    방문하기
                </a>
            </div>
        )}

        {/* 검색어 수정 입력창 */}
        <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="flex-1 relative">
                <input 
                    type="text" 
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg pl-4 pr-10 py-3 focus:ring-2 focus:ring-black focus:outline-none transition"
                    placeholder="검색어가 너무 길면 줄여보세요 (예: 낫온리포투데이 후리스)"
                />
                <Search className="absolute right-3 top-3 text-gray-400" size={20} />
            </div>
            <button 
                type="submit" 
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50"
            >
                {loading ? '검색 중...' : '재검색'}
            </button>
        </form>
        <p className="text-xs text-gray-400 mt-2 ml-1">
            * 팁: 상품명이 너무 구체적이면 결과가 없을 수 있습니다. <b>"브랜드 + 카테고리"</b>(예: 낫온리포투데이 후리스)로 검색해보세요.
        </p>
      </div>

      {/* 2. 검색 결과 리스트 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item, idx) => (
            <a 
              key={idx} 
              href={item.link} 
              target="_blank" 
              rel="noreferrer"
              className="group bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              <div className="aspect-video bg-gray-100 relative overflow-hidden">
                {item.thumbnail ? (
                  <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-300 text-sm">No Image</div>
                )}
                <span className={`absolute top-3 left-3 px-2 py-1 text-[10px] font-bold text-white rounded-full flex items-center gap-1 ${
                  item.type === 'youtube' ? 'bg-red-600' : 'bg-pink-600'
                }`}>
                  {item.type === 'youtube' ? <Youtube size={12} /> : <Instagram size={12} />}
                  {item.type === 'youtube' ? 'YouTube' : 'Instagram'}
                </span>
              </div>
              <div className="p-4">
                <h4 className="font-bold text-gray-900 line-clamp-2 text-sm mb-2 group-hover:text-blue-600 transition">
                  {item.title}
                </h4>
                <p className="text-xs text-gray-500 line-clamp-2">
                  {item.snippet}
                </p>
              </div>
            </a>
        ))}
        
        {!loading && items.length === 0 && hasSearched && (
            <div className="col-span-full text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                검색 결과가 없습니다.<br/>위 검색창에서 키워드를 더 짧게 수정해보세요!
            </div>
        )}
      </div>
    </div>
  );
}