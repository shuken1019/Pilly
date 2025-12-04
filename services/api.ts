// src/services/api.ts

export interface Pill {
  id: number;
  item_seq: string;
  item_name: string;
  entp_name: string;
  drug_shape: string | null;
  color_class1: string | null;
  color_class2: string | null;
  item_image: string | null;

  // 🔽 e약은요 상세 필드 (옵셔널이면 ? 붙이기)
  efcy_qesitm?: string | null; // 어디에 좋은 약인가요?
  use_method_qesitm?: string | null; // 어떻게 먹어야 하나요?
  atpn_warn_qesitm?: string | null; // 꼭 주의해주세요!
  atpn_qesitm?: string | null; // 일반 주의사항
  intrc_qesitm?: string | null; // 상호작용
  se_qesitm?: string | null; // 부작용
  deposit_method_qesitm?: string | null; // 보관방법
  open_de?: string | null;
  update_de?: string | null;
}

export interface PillSearchResponse {
  keyword: string;
  page: number;
  page_size: number;
  total: number;
  items: Pill[];
}

const BASE_URL = "http://127.0.0.1:8000"; // FastAPI 주소

// 🔹 SearchSection의 filters 구조랑 똑같이 맞춰줌
export interface SearchFilters {
  keyword?: string;
  shape?: string;
  color?: string;
  printFront?: string;
  printBack?: string;
  entpName?: string;
  classNo?: string;
}

export async function searchPills(filters: SearchFilters, page = 1, size = 20) {
  const query = new URLSearchParams();

  if (filters.keyword) query.append("keyword", filters.keyword);
  if (filters.shape) query.append("drug_shape", filters.shape);
  if (filters.color) query.append("color_class", filters.color); // ✅ 백엔드 color_class
  if (filters.printFront) query.append("print_front", filters.printFront);
  if (filters.printBack) query.append("print_back", filters.printBack);
  if (filters.entpName) query.append("entp_name", filters.entpName);
  if (filters.classNo) query.append("class_no", filters.classNo);

  query.append("page", page.toString());
  query.append("page_size", size.toString());

  const res = await fetch(`${BASE_URL}/api/pills?${query.toString()}`);
  if (!res.ok) {
    throw new Error("검색 요청 실패");
  }
  return (await res.json()) as PillSearchResponse;
}
// src/services/api.ts

// 기존 Pill 인터페이스 아래에 추가
export interface PillDetailFull {
  easy_efficacy: string | null; // 쉬운 효능
  easy_usage: string | null; // 쉬운 용법
  easy_warning: string | null; // 쉬운 경고

  detail_valid_term: string | null; // 유통기한
  detail_ingredients: string | null; // 성분
  detail_chart: string | null; // 약물 특징(성상)
  detail_side_effects: string | null; // 부작용 상세
  detail_dosage: string | null; // 용법 상세
}

// 상세 정보 가져오는 함수 추가
// 약 상세 타입은 Pill 그대로 사용
export async function getPillDetail(itemSeq: string): Promise<Pill> {
  const res = await fetch(`${BASE_URL}/pills/${itemSeq}`);

  if (!res.ok) {
    throw new Error("약 상세 정보를 불러오지 못했습니다.");
  }

  const data = await res.json();
  return data.pill; // ← 방금 브라우저에서 본 JSON 구조 그대로
}
