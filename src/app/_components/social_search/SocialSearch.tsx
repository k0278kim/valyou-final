'use client';

import { ExternalLink, Instagram, Youtube, Search } from 'lucide-react';
// lucide-react가 없다면 npm install lucide-react, 혹은 텍스트로 대체 가능

interface Props {
  brand: string;
  title: string;
}

export default function SocialSearch({ brand, title }: Props) {
  // 1. 검색어 정제 로직 (핵심!)
  const getCleanQuery = () => {
    let query = title;

    // [대괄호] 안에 있는 색상/옵션 정보 제거 (예: [아이보리])
    query = query.replace(/\[.*?\]/g, '');

    // (괄호) 안에 있는 내용 제거 (보통 영어 브랜드명)
    // 예: 낫온리포투데이(NOT ONLY FOR TODAY) -> 낫온리포투데이
    // 단, 브랜드명이 아예 없을 수도 있으니 주의
    query = query.replace(/\(.*?\)/g, '');

    // - 사이즈 & 후기 | 무신사 같은 꼬리말 제거
    query = query.split('-')[0] || query;
    query = query.split('|')[0] || query;

    // 앞뒤 공백 제거 및 브랜드명과 합치기 (중복 방지)
    const cleanTitle = query.trim();

    // 브랜드명이 제목에 이미 포함되어 있으면 제목만, 아니면 브랜드+제목
    if (cleanTitle.includes(brand)) {
      return cleanTitle;
    }
    return `${brand} ${cleanTitle}`;
  };

  const query = getCleanQuery();

  // 각 플랫폼별 검색 URL 생성
  const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' 후기')}`;

  // 인스타그램은 구글을 통해 검색하는 게 가장 정확함 (site:instagram.com)
  const instagramUrl = `https://www.google.com/search?q=${encodeURIComponent('site:instagram.com ' + query)}`;

  // 네이버 블로그/카페 검색
  const naverUrl = `https://search.naver.com/search.naver?where=view&sm=tab_jum&query=${encodeURIComponent(query)}`;

  // 구글 전체 검색
  const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mt-6">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        🔍 다른 채널 반응 모아보기
      </h3>
      <p className="text-sm text-gray-500 mb-6">
        자동 생성된 검색어: <span className="font-bold text-black bg-gray-100 px-2 py-1 rounded">{query}</span>
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 유튜브 */}
        <a
          href={youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 p-4 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition border border-red-100 font-bold"
        >
          {/* 아이콘이 없다면 텍스트로 대체하세요 */}
          <Youtube size={20} />
          유튜브 영상 찾기
        </a>

        {/* 인스타그램 */}
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 p-4 rounded-xl bg-pink-50 text-pink-600 hover:bg-pink-100 transition border border-pink-100 font-bold"
        >
          <Instagram size={20} />
          인스타 착샷 찾기
        </a>

        {/* 네이버 */}
        <a
          href={naverUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 p-4 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 transition border border-green-100 font-bold"
        >
          <Search size={20} />
          네이버 후기 검색
        </a>

        {/* 구글 */}
        <a
          href={googleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 p-4 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition border border-blue-100 font-bold"
        >
          <ExternalLink size={20} />
          구글 최저가 검색
        </a>
      </div>
    </div>
  );
}