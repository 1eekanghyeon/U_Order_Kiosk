// WaitingScreen.js

import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";

const WaitingScreen = ({ changeStore, userEmail, isAdmin }) => {
  const navigate = useNavigate();

  useEffect(() => {
    console.log("userEmail:", userEmail); // userEmail 값 확인
    if (!userEmail) return; // 이메일이 없으면 리턴

    const signalDocRef = doc(db, "users", userEmail);

    const unsubscribe = onSnapshot(
      signalDocRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const signal = docSnapshot.data().signal;
          console.log("Signal value:", signal);
          if (signal) {
            // signal 값이 존재하면 storeType과 storeId를 설정하고 키오스크로 이동
            changeStore(signal);
            navigate("/kiosk");
          }
        }
      },
      (error) => {
        console.error("onSnapshot error:", error);
      }
    );

    return () => unsubscribe();
  }, [changeStore, navigate, userEmail]);

  return (
    <div className="waiting-screen">
      <h2>UWB 인식 중입니다...</h2>
      <div className="spinner"></div>
    </div>
  );
};

export default WaitingScreen;
