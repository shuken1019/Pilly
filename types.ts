export interface PillData {
  name: string;
  category: string;
  ingredients: string;
  efficacy: string[];
  usage: string;
  precautions: string[];
}

// FastAPI DB 결과(pill_mfds 테이블)에 맞춘 인터페이스
export interface SearchResult {
  item_seq: string;
  item_name: string;
  entp_name: string;
  drug_shape: string;
  color_class1: string;
  color_class2: string;
  print_front: string;
  print_back: string;
  item_image: string;
  chart?: string;
}

export enum ViewState {
  HOME = "HOME",
  LOGIN = "LOGIN",
  SIGNUP = "SIGNUP",
  SEARCH = "SEARCH",
  AI_SEARCH = "AI_SEARCH", // ✅ [추가] AI 사진 인식 전용 화면
  COMMUNITY = "COMMUNITY",
  COMMUNITY_WRITE = "COMMUNITY_WRITE",
  COMMUNITY_DETAIL = "COMMUNITY_DETAIL",
  MYPAGE="MYPAGE",
  SCRAPS="SCRAPS",
  ADMIN="ADMIN",
  KAKAO_REDIRECT = "KAKAO_REDIRECT",
}
export interface Pill {
  id?: number;
  item_seq: string;
  item_name: string;
  entp_name: string;
  drug_shape: string;
  color_class1: string | null;
  color_class2: string | null;
  item_image: string | null;
  name?: string;
  // ...

  efcy_qesitm?: string | null;
  use_method_qesitm?: string | null;
  atpn_warn_qesitm?: string | null;
  atpn_qesitm?: string | null;
  intrc_qesitm?: string | null;
  se_qesitm?: string | null;
  deposit_method_qesitm?: string | null;
}
// ✅ 마이페이지 찜 목록 응답 형태
export interface MyScrapsResponse {
  items: Pill[];
}
