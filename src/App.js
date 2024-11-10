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
import { db, auth } from "./firebase";
import { doc, onSnapshot } from "firebase/firestore";

function App() {
  const [storeId, setStoreId] = useState(
    localStorage.getItem("storeId") || null
  );
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(
    localStorage.getItem("isAdmin") === "true"
  );
  const [email, setEmail] = useState(localStorage.getItem("email") || "");
  const [signal, setSignal] = useState(null);

  const toggleMode = () => {
    setIsAdminMode((prevMode) => !prevMode);
  };

  const handleLoginSuccess = (isAdminStatus, emailValue, storeIdValue) => {
    setIsAdmin(isAdminStatus);
    setEmail(emailValue);
    setStoreId(storeIdValue);

    // localStorage에 저장
    localStorage.setItem("isAdmin", isAdminStatus);
    localStorage.setItem("email", emailValue);
    localStorage.setItem("storeId", storeIdValue);
  };

  const handleLogout = () => {
    setEmail("");
    setIsAdmin(false);
    setStoreId(null);
    setIsAdminMode(false);
    setSignal(null);

    // localStorage에서도 삭제
    localStorage.removeItem("email");
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("storeId");

    // Firebase에서 로그아웃
    auth.signOut();

    // 로그인 페이지로 리다이렉트
    window.location.href = "/login";
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
              email ? (
                signal && signal !== "0" ? (
                  <Navigate to="/kiosk" replace />
                ) : (
                  <Navigate to="/waiting" replace />
                )
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
              signal && signal !== "0" ? (
                <Navigate to="/kiosk" replace />
              ) : (
                <WaitingScreen userEmail={email} onLogout={handleLogout} />
              )
            }
          />
          <Route
            path="/kiosk"
            element={
              signal && signal !== "0" ? (
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
                    onLogout={handleLogout}
                  />
                </div>
              ) : (
                <Navigate to="/waiting" replace />
              )
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
