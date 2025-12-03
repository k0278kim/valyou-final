// types/musinsa.ts

// 1. 기본 상품 정보 (JSON-LD에서 추출)
export interface MusinsaBasicInfo {
  goodsNo: string;      // 상품 ID (가장 중요)
  title: string;        // 상품명
  brand: string;        // 브랜드
  imageUrl: string;     // 대표 이미지
  price: number;        // 가격 (숫자)
  currency: string;     // 통화 (KRW)
  isSoldOut: boolean;   // 품절 여부
}

// 2. 사이즈 표 (HTML Table에서 추출)
export interface SizeTable {
  headers: string[];    // 예: ['총장', '어깨너비', '가슴단면']
  rows: {
    name: string;       // 예: 'M', 'L'
    values: string[];   // 예: ['70', '50', '55']
  }[];
}

// 3. 스냅 후기 (내부 API로 추출)
export interface SnapReview {
  reviewNo: number;
  userName: string;
  userImage?: string;
  reviewImage: string;
  rating: number;
  content: string;
  date: string;
}

// 통합 응답 타입
export interface CrawlResult {
  basicInfo: MusinsaBasicInfo;
  sizeTable: SizeTable;
  snapReviews: SnapReview[];
}