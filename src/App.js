// App.js

import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./components/Login";
import Signup from "./components/Signup";
import CafeKiosk from "./components/CafeKiosk";
import WaitingScreen from "./components/WaitingScreen";
import './App.css';
import logo from './assets/logo.png';

function App() {
  const [storeId, setStoreId] = useState(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [email, setEmail] = useState('');

  // 관리자 모드 토글
  const toggleMode = () => {
    setIsAdminMode((prevMode) => !prevMode);
  };

  // 로그인 성공 시 호출
  const handleLoginSuccess = (isAdminStatus, emailValue) => {
    setIsAdmin(isAdminStatus); // isAdmin 설정
    setIsAdminMode(isAdminStatus); // isAdminStatus로 초기 모드 설정
    setEmail(emailValue);

    // 모든 사용자에 대해 isWaiting을 true로 설정
    setIsWaiting(true);
  };

  // 대기 화면에서 가게 선택 시 호출
  const changeStore = (storeIdValue) => {
    setStoreId(storeIdValue); // storeId 업데이트
    setIsWaiting(false); // 선택 후 대기 화면 해제
  };

  return (
    <Router>
      <div className="App">
        <img src={logo} alt="U-Order Logo" className="app-logo" />

        <Routes>
          <Route
            path="/"
            element={
              isWaiting ? (
                <Navigate to="/waiting" replace />
              ) : (
                <Login onLoginSuccess={handleLoginSuccess} />
              )
            }
          />
          <Route
            path="/login"
            element={<Login onLoginSuccess={handleLoginSuccess} />}
          />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/waiting"
            element={
              isWaiting ? (
                <WaitingScreen
                  changeStore={changeStore}
                  userEmail={email}
                  isAdmin={isAdmin}
                />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/kiosk"
            element={
              !isWaiting ? (
                <div>
                  {isAdmin && (
                    <button className="toggle-mode-btn" onClick={toggleMode}>
                      {isAdminMode ? "사용자 모드로 전환" : "관리자 모드로 전환"}
                    </button>
                  )}
                  <CafeKiosk
                    isAdminMode={isAdminMode}
                    userEmail={email}
                    storeId={storeId}
                  />
                </div>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;