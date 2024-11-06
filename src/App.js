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
import './App.css';
import logo from './assets/logo.png';

// Firestore 관련 import 추가
import { db } from './firebase';
import { doc, onSnapshot } from 'firebase/firestore';

function App() {
  const [storeId, setStoreId] = useState(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [email, setEmail] = useState('');
  const [signal, setSignal] = useState(null); // signal 상태 추가

  // 관리자 모드 토글
  const toggleMode = () => {
    setIsAdminMode((prevMode) => !prevMode);
  };

  // 로그인 성공 시 호출
  const handleLoginSuccess = (isAdminStatus, emailValue, storeIdValue) => {
    setIsAdmin(isAdminStatus); // isAdmin 설정
    setEmail(emailValue);
    setIsWaiting(true); // 모든 사용자에 대해 isWaiting을 true로 설정
    setStoreId(storeIdValue);
  };

  // 대기 화면에서 가게 선택 시 호출
  const changeStore = (storeIdValue) => {
    // setStoreId(storeIdValue); // storeId 업데이트
    setIsWaiting(false); // 선택 후 대기 화면 해제
  };

  // Firestore의 signal 값 변화를 감지
  useEffect(() => {
    if (email) {
      const userDocRef = doc(db, 'users', email);
      const unsubscribe = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setSignal(data.signal);
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
                    <>
                      {console.log("isAdmin:", isAdmin)}
                      {console.log("signal:", signal)}
                      {console.log("storeId:", storeId)}
                      {console.log("signal === storeId:", String(signal) === String(storeId))}
                      {console.log("isAdmin && storeId === signal", isAdmin && String(storeId) === signal)}
                    </>
                  )}
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
