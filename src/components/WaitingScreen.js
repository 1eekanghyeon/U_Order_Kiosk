import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase"; // firebase.js 파일 경로 확인 후 정확히 지정
import { doc, onSnapshot } from "firebase/firestore";

const WaitingScreen = ({ changeStore }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const signalDocRef = doc(db, "settings", "kioskSignal");

    const unsubscribe = onSnapshot(signalDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const signal = docSnapshot.data().signal;
        if (signal === "1") {
          changeStore("hamburger");
          navigate("/kiosk?storeType=hamburger");
        } else if (signal === "2") {
          changeStore("cafe");
          navigate("/kiosk?storeType=cafe");
        }
      }
    });

    return () => unsubscribe();
  }, [changeStore, navigate]);


  return (
    <div className="waiting-screen">
      <h2>UWB 인식 중입니다...</h2>
      <div className="spinner"></div>
    </div>
  );
};

export default WaitingScreen;
