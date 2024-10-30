// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";  
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage"; // Storage 추가
// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC-MpdbOyIP2FMPFmn6yPYTx08eiLoe_vU",
  authDomain: "kiosk-27da2.firebaseapp.com",
  projectId: "kiosk-27da2",
  storageBucket: "kiosk-27da2.appspot.com",
  messagingSenderId: "1069119770169",
  appId: "1:1069119770169:web:a97e233d542906b98307e8",
  measurementId: "G-NYFMJ1RXLP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); // Storage 객체 추가
// Disable app verification during testing (if necessary)
if (process.env.NODE_ENV === "development") {
  auth.settings.appVerificationDisabledForTesting = true; // 이 부분이 테스트 환경에서만 적용됩니다.
}
