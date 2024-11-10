// WaitingScreen.js

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";

const WaitingScreen = ({ userEmail, onLogout }) => {
  const navigate = useNavigate();
  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    if (!userEmail) return;

    const signalDocRef = doc(db, "users", userEmail);

    const unsubscribe = onSnapshot(
      signalDocRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const signal = docSnapshot.data().signal;
          console.log("Signal value:", signal);
          if (signal && signal !== "0" && !hasNavigated) {
            setHasNavigated(true);
            navigate("/kiosk");
          }
        }
      },
      (error) => {
        console.error("onSnapshot error:", error);
      }
    );

    return () => unsubscribe();
  }, [navigate, userEmail, hasNavigated]);

  return (
    <div className="waiting-screen">
      <h2>UWB 인식 중입니다...</h2>
      <div className="spinner"></div>
      {/* 로그아웃 버튼 추가 */}
      <button className="logout-btn" onClick={onLogout}>
        로그아웃
      </button>
    </div>
  );
};

export default WaitingScreen;
