// Login.js

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorPopup, setErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isGoogleLogin, setIsGoogleLogin] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    id: "",
    uwbMac: "",
    email: "",
    isAdmin: false,
    signal: "",
  });

  const navigate = useNavigate();

  // 팝업 닫기 핸들러
  const closePopup = () => {
    setErrorPopup(false);
  };

  // 회원가입 페이지로 이동
  const handleSignupClick = () => {
    navigate("/signup");
  };

  // 이메일/비밀번호 로그인 처리
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      // Firebase 인증을 사용한 이메일/비밀번호 로그인
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      console.log("로그인 성공");

      // Firestore에서 해당 사용자의 문서 확인
      const userDocRef = doc(db, "users", user.email);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const isAdmin = userData.isAdmin;
        const storeId = userData.storeId || null;

        // 관리자 여부와 상관없이 onLoginSuccess 호출
        onLoginSuccess(isAdmin, user.email, storeId);
      } else {
        // 사용자 문서가 없을 경우 처리
        setErrorMessage("사용자 정보를 찾을 수 없습니다.");
        setErrorPopup(true);
      }
    } catch (error) {
      console.error("로그인 오류:", error);
      setErrorMessage("이메일 또는 비밀번호가 잘못되었습니다.");
      setErrorPopup(true);
    }
  };

  // 구글 로그인 처리
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("구글 로그인 성공");

      const userDocRef = doc(db, "users", user.email);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const isAdmin = userData.isAdmin;
        const storeId = userData.storeId || null;

        // 관리자 여부와 상관없이 onLoginSuccess 호출
        onLoginSuccess(isAdmin, user.email, storeId);
      } else {
        // 추가 정보가 없으면 입력 창 표시
        setFormData({
          ...formData,
          email: user.email,
        });
        setIsGoogleLogin(true);
      }
    } catch (error) {
      console.error("구글 로그인 오류:", error);
      setErrorMessage("구글 로그인 중 오류가 발생했습니다.");
      setErrorPopup(true);
    }
  };

  // 추가 정보 입력 후 Firestore에 저장
  const handleAdditionalInfoSubmit = async (e) => {
    e.preventDefault();
    try {
      // Firestore에 추가 정보 저장 (이메일을 문서 ID로 사용)
      const userDocRef = doc(db, "users", formData.email);

      let storeId = null;

      if (formData.isAdmin) {
        // 관리자인 경우 고유한 매장 ID 부여
        // 현재 존재하는 매장 ID들을 가져와서 새로운 ID 생성
        const kioskCollectionRef = collection(db, "kiosk");
        const kioskDocs = await getDocs(kioskCollectionRef);
        const existingStoreIds = kioskDocs.docs
          .map((doc) => parseInt(doc.id))
          .filter(Number.isInteger);
        storeId =
          existingStoreIds.length > 0 ? Math.max(...existingStoreIds) + 1 : 1;

        // 해당 매장 ID로 kiosk 컬렉션에 문서 생성
        const kioskDocRef = doc(db, "kiosk", storeId.toString());
        await setDoc(kioskDocRef, {
          categories: ["카테고리1", "카테고리2", "카테고리3"],
          menuItems: [],
        });
      }

      // 사용자 정보 저장
      await setDoc(userDocRef, {
        email: formData.email,
        name: formData.name,
        phone: formData.phone,
        id: formData.id,
        uwbMac: formData.uwbMac,
        isAdmin: formData.isAdmin,
        signal: formData.isAdmin && storeId ? storeId.toString() : "", // 관리자일 경우 signal 설정
        storeId: storeId, // 관리자일 경우 storeId 저장
      });

      alert("추가 정보가 저장되었습니다.");

      // 추가 정보 저장 후 onLoginSuccess 호출
      onLoginSuccess(formData.isAdmin, formData.email, storeId);
    } catch (error) {
      console.error("정보 저장 중 오류:", error);
      alert("정보 저장 중 오류가 발생했습니다.");
    }
  };

  // 입력 필드 핸들러
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  return (
    <div className="login-container">
      {!isGoogleLogin ? (
        <>
          <form onSubmit={handleLoginSubmit}>
            <div>
              <label>Email:</label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label>비밀번호:</label>
              <input
                type="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit">로그인</button>
          </form>

          <button className="signup-btn" onClick={handleSignupClick}>
            회원가입
          </button>

          {/* 구글 로그인 버튼 */}
          <button className="google-btn" onClick={handleGoogleLogin}>
            구글 로그인
          </button>
        </>
      ) : (
        // 구글 로그인 후 추가 정보 입력 화면
        <form onSubmit={handleAdditionalInfoSubmit}>
          <div>
            <label>Email:</label>
            <input type="email" name="email" value={formData.email} disabled />
          </div>
          <div>
            <label>Name:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label>Phone:</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label>ID:</label>
            <input
              type="text"
              name="id"
              value={formData.id}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label>UWB MAC Address:</label>
            <input
              type="text"
              name="uwbMac"
              value={formData.uwbMac}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label>관리자 여부:</label>
            <input
              type="checkbox"
              name="isAdmin"
              checked={formData.isAdmin}
              onChange={handleChange}
            />
          </div>
          <button type="submit">정보 저장</button>
        </form>
      )}
      {/* 오류 팝업 메시지 */}
      {errorPopup && (
        <div className="popup-overlay">
          <div className="popup-message">
            <h2>로그인 오류</h2>
            <p>{errorMessage}</p>
            <button onClick={closePopup}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
