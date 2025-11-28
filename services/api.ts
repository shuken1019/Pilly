import { SearchResult } from "../types";

// FastAPI 서버 주소 (로컬 환경 기준)
const API_BASE_URL = "http://127.0.0.1:8000";

// DB 컬럼 순서 (튜플로 응답이 올 경우 매핑용)
const COLUMNS = [
  "item_seq",
  "item_name",
  "entp_name",
  "drug_shape",
  "color_class1",
  "color_class2",
  "print_front",
  "print_back",
  "chart",
  "item_image",
];

/**
 * API 응답 데이터를 SearchResult 객체 배열로 변환
 * (FastAPI가 리스트의 리스트(튜플)를 반환할 경우를 대비)
 */
const mapDataToResults = (data: any[]): SearchResult[] => {
  if (!Array.isArray(data)) return [];

  return data.map((item) => {
    // 이미 객체 형태라면 그대로 반환
    if (typeof item === "object" && !Array.isArray(item)) {
      return item as SearchResult;
    }

    // 배열(튜플) 형태라면 컬럼명과 매핑하여 객체 생성
    if (Array.isArray(item)) {
      const obj: any = {};
      COLUMNS.forEach((col, index) => {
        obj[col] = item[index] || "";
      });
      return obj as SearchResult;
    }

    return item;
  });
};

export const searchPills = async (keyword: string): Promise<SearchResult[]> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/pills?keyword=${encodeURIComponent(keyword)}`
    );

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();
    return mapDataToResults(data);
  } catch (error) {
    console.error("API Error:", error);
    return [];
  }
};

export const searchPillsByMark = async (
  front?: string,
  back?: string
): Promise<SearchResult[]> => {
  try {
    const params = new URLSearchParams();
    if (front) params.append("front_mark", front);
    if (back) params.append("back_mark", back);

    const response = await fetch(`${API_BASE_URL}/pills?${params.toString()}`);

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();
    return mapDataToResults(data);
  } catch (error) {
    console.error("API Error:", error);
    return [];
  }
};

export const searchPillsByVisual = async (
  shape?: string,
  color?: string
): Promise<SearchResult[]> => {
  try {
    const params = new URLSearchParams();
    if (shape) params.append("shape", shape);
    if (color) params.append("color", color);

    const response = await fetch(`${API_BASE_URL}/pills?${params.toString()}`);

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();
    return mapDataToResults(data);
  } catch (error) {
    console.error("API Error:", error);
    return [];
  }
};
