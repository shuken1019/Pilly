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
  HOME = 'HOME',
  LOGIN = 'LOGIN',
  SIGNUP = 'SIGNUP',
  SEARCH = 'SEARCH',
}
export interface Pill {
  id: number;
  item_seq: string;
  item_name: string;
  entp_name: string;
  drug_shape: string;
  color_class1: string | null;
  color_class2: string | null;
  item_image: string | null;
  // ...

  efcy_qesitm?: string | null;
  use_method_qesitm?: string | null;
  atpn_warn_qesitm?: string | null;
  atpn_qesitm?: string | null;
  intrc_qesitm?: string | null;
  se_qesitm?: string | null;
  deposit_method_qesitm?: string | null;
}
