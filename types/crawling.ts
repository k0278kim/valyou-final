// types/crawling.ts (또는 파일 상단에 정의)

export interface MusinsaProductResponse {
  success: boolean;
  data?: {
    site: 'musinsa';
    title: string;
    brand: string;
    price: number;        // 연산을 위해 숫자로 변환
    formattedPrice: string; // 화면 표시용 문자열 ('15,000원')
    imageUrl: string;
    productUrl: string;
  };
  error?: string;
}

export interface CrawlRequestBody {
  url: string;
}