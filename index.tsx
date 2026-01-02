import React from "react";
import ReactDOM from "react-dom/client";
// ✅ 1. Routes와 Route를 추가로 불러옵니다.
import { BrowserRouter, Routes, Route } from "react-router-dom";

import App from "./App";
// ✅ 2. KakaoCallback 컴포넌트를 불러옵니다.
import KakaoCallback from "./components/KakaoCallback";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      {/* ✅ 3. Routes로 감싸고 경로를 분리합니다. */}
      <Routes>
        {/* 카카오 로그인 전용 주소 */}
        <Route path="/oauth/kakao" element={<KakaoCallback />} />

        {/* 그 외 모든 주소는 App 컴포넌트가 담당 */}
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
