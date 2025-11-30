// src/components/SearchSection.tsx
import React, { useState } from "react";
import { searchPills, Pill } from "../services/api";

const SearchSection: React.FC = () => {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<Pill[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await searchPills(keyword.trim(), 1);
      setResults(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error(err);
      setError("검색 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="search-section">
      {/* 검색 폼 */}
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          placeholder="약 이름 또는 식별 문자(앞/뒷면)를 입력하세요"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="search-input"
        />
        <button type="submit" className="search-button">
          검색
        </button>
      </form>

      {/* 로딩 / 에러 */}
      {loading && <p>검색 중...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* 총 개수 표시 */}
      {!loading && total > 0 && (
        <p className="search-summary">
          총 <strong>{total}</strong>개의 결과
        </p>
      )}

      {/* 결과 리스트 */}
      <div className="pill-results">
        {results.map((pill) => (
          <div key={pill.item_seq} className="pill-card">
            <div className="pill-image-wrapper">
              {pill.item_image ? (
                <img
                  src={pill.item_image}
                  alt={pill.item_name}
                  className="pill-image"
                />
              ) : (
                <div className="pill-image-placeholder">No Image</div>
              )}
            </div>

            <div className="pill-info">
              <h3 className="pill-name">{pill.item_name}</h3>
              <p className="pill-entp">{pill.entp_name}</p>
              <p className="pill-meta">
                {pill.drug_shape && <span>{pill.drug_shape}</span>}
                {pill.color_class1 && (
                  <span>
                    {" "}
                    · {pill.color_class1}
                    {pill.color_class2 ? ` / ${pill.color_class2}` : ""}
                  </span>
                )}
              </p>
              {(pill.print_front || pill.print_back) && (
                <p className="pill-print">
                  앞: {pill.print_front || "-"} / 뒤: {pill.print_back || "-"}
                </p>
              )}
            </div>
          </div>
        ))}

        {!loading && !error && results.length === 0 && keyword && (
          <p>검색 결과가 없습니다.</p>
        )}
      </div>
    </section>
  );
};

export default SearchSection;
