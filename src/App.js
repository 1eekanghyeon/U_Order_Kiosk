// App.js
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Signup from "./components/Signup";
import HamburgerKiosk from "./components/HamburgerKiosk";
import CafeKiosk from "./components/CafeKiosk";
import WaitingScreen from "./components/WaitingScreen";
import './App.css';
import logo from './assets/logo.png';

function App() {
  const [isAdminMode, setIsAdminMode] = useState(false); // 관리자 모드 상태
  const [isAdmin, setIsAdmin] = useState(false); // 로그인한 사용자가 관리자인지 여부
  const [userId, setUserId] = useState(null); // 로그인한 사용자 ID
  const [storeType, setStoreType] = useState("hamburger");
  const [isWaiting, setIsWaiting] = useState(false);

  // 관리자 모드 토글
  const toggleMode = () => {
    setIsAdminMode((prevMode) => !prevMode);
  };

  // 로그인 성공 시 관리자 여부와 사용자 ID 설정
  const handleLoginSuccess = (adminStatus, uid) => {
    setIsAdmin(adminStatus); // 관리자 여부 저장
    setIsAdminMode(adminStatus); // 관리자 여부에 따라 isAdminMode 초기값 설정
    setUserId(uid); // 로그인한 사용자 ID 저장
    setIsWaiting(true); // 로그인 후 대기 화면으로 이동
  };

  // 대기 화면에서 가게 선택 시 호출
  const changeStore = (type) => {
    setStoreType(type);
    setIsWaiting(false); // 선택 후 대기 화면 해제
  };

  return (
    <Router>
      <div className="App">
        <img src={logo} alt="U-Order Logo" className="app-logo" />

        {isWaiting ? (
          <Routes>
            <Route path="/" element={<WaitingScreen changeStore={changeStore} />} />
          </Routes>
        ) : (
          <Routes>
            <Route path="/" element={<Login onLoginSuccess={handleLoginSuccess} />} />
            <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/kiosk"
              element={
                <div>
                  {isAdmin && ( // 관리자인 경우에만 토글 버튼 표시
                    <button className="toggle-mode-btn" onClick={toggleMode}>
                      {isAdminMode ? "사용자 모드로 전환" : "관리자 모드로 전환"}
                    </button>
                  )}
                  {storeType === "hamburger" ? (
                    <HamburgerKiosk isAdminMode={isAdminMode} userId={userId} />
                  ) : (
                    <CafeKiosk isAdminMode={isAdminMode} userId={userId} />
                  )}
                </div>
              }
            />
          </Routes>
        )}
      </div>
    </Router>
  );
}

export default App;
