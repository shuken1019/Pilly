import axios from "axios";

// 백엔드 주소 (/api 포함)
const BASE_URL = "http://127.0.0.1:8000/api";

// 1. Axios 인스턴스 생성
export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 2. [핵심] 요청 인터셉터: 모든 API 요청 시 토큰이 있다면 자동으로 헤더에 추가
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ 타입 정의 (유지)
export interface Pill {
  id: number;
  item_seq: string;
  item_name: string;
  entp_name: string;
  drug_shape: string | null;
  color_class1: string | null;
  color_class2: string | null;
  item_image: string | null;
  print_front?: string | null;
  print_back?: string | null;
  efcy_qesitm?: string | null;
  use_method_qesitm?: string | null;
  atpn_warn_qesitm?: string | null;
  atpn_qesitm?: string | null;
  intrc_qesitm?: string | null;
  se_qesitm?: string | null;
  deposit_method_qesitm?: string | null;
  open_de?: string | null;
  update_de?: string | null;
  efficacy?: string;
  usage?: string;
  precautions?: string;
  is_liked?: boolean; // 찜 여부
}

export interface PillSearchResponse {
  keyword: string;
  page: number;
  page_size: number;
  total: number;
  items: Pill[];
}

export interface SearchFilters {
  keyword?: string;
  shape?: string;
  color?: string;
  printFront?: string;
  printBack?: string;
  entpName?: string;
  classNo?: string;
  sort?: string;
}

// ✅ 약 검색 함수 (토큰 자동 포함)
export async function searchPills(filters: SearchFilters, page = 1, size = 20) {
  // 백엔드 파라미터 매핑
  const params = {
    keyword: filters.keyword,
    drug_shape: filters.shape,
    color_class: filters.color,
    print_front: filters.printFront,
    print_back: filters.printBack,
    entp_name: filters.entpName,
    class_no: filters.classNo,
    sort: filters.sort,
    page: page,
    page_size: size,
  };

  // 빈 값 제거
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v != null && v !== "")
  );

  const response = await api.get("/pills", {
    params: cleanParams,
  });

  return response.data as PillSearchResponse;
}

// ✅ 약 상세 정보 조회 (주소 수정됨: /pills/... -> /api/pills/...)
export async function getPillDetail(itemSeq: string): Promise<Pill> {
  // api 인스턴스를 쓰면 baseURL(/api)이 자동 적용됨
  const res = await api.get(`/pills/${itemSeq}`);
  return res.data.pill; // 백엔드 응답 구조에 따라 .pill 또는 .data 등 확인 필요
}

// ✅ 찜하기 토글 함수
export async function togglePillLike(itemSeq: string) {
  // 로그인 체크는 호출하는 컴포넌트나 인터셉터에서 처리되지만 안전장치로 둠
  const token = localStorage.getItem("token");
  if (!token) throw new Error("로그인이 필요합니다.");

  const res = await api.post(`/pills/${itemSeq}/like`);
  return res.data.is_liked;
}