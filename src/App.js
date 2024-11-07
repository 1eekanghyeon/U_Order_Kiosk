// App.js

import React, { useState, useEffect } from "react";
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
import "./App.css";
import logo from "./assets/logo.png";
import PaymentResult from "./components/PaymentResult";

// Firestore 관련 import 추가
import { db } from "./firebase";
import { doc, onSnapshot } from "firebase/firestore";

function App() {
  const [storeId, setStoreId] = useState(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [email, setEmail] = useState("");
  const [signal, setSignal] = useState(null); // signal 상태 추가

  // 관리자 모드 토글
  const toggleMode = () => {
    setIsAdminMode((prevMode) => !prevMode);
  };

  // 로그인 성공 시 호출
  const handleLoginSuccess = (isAdminStatus, emailValue, storeIdValue) => {
    setIsAdmin(isAdminStatus); // isAdmin 설정
    setEmail(emailValue);
    setStoreId(storeIdValue); // storeId 설정
    setIsWaiting(true); // 모든 사용자에 대해 isWaiting을 true로 설정
  };

  // 대기 화면에서 가게 선택 시 호출
  const changeStore = (storeIdValue) => {
    // setIsWaiting(false); // 이 부분을 제거합니다.
  };

  // Firestore의 signal 값 변화를 감지
  useEffect(() => {
    if (email) {
      const userDocRef = doc(db, "users", email);
      const unsubscribe = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setSignal(data.signal);

          // signal 값이 변경되면 isAdminMode를 false로 설정
          setIsAdminMode(false);

          // signal 값에 따라 isWaiting 상태를 업데이트
          if (data.signal === "0") {
            setIsWaiting(true);
          } else {
            setIsWaiting(false);
          }
        }
      });
      return () => unsubscribe();
    }
  }, [email]);

  return (
    <Router>
      <div className="App">
        <img src={logo} alt="U-Order Logo" className="app-logo" />

        <Routes>
          <Route path="/payments/success" element={<PaymentResult />} />
          <Route path="/payments/cancel" element={<PaymentResult />} />
          <Route path="/payments/fail" element={<PaymentResult />} />

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
                signal === "0" ? (
                  <Navigate to="/waiting" replace />
                ) : (
                  <div>
                    {isAdmin && String(storeId) === signal && (
                      <button className="toggle-mode-btn" onClick={toggleMode}>
                        {isAdminMode ? "사용자 모드로 전환" : "관리자 모드로 전환"}
                      </button>
                    )}
                    <CafeKiosk
                      isAdminMode={isAdminMode}
                      userEmail={email}
                      signal={signal}
                    />
                  </div>
                )
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
