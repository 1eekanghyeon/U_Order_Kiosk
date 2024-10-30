import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {GoogleAuthProvider, signInWithPopup } from "firebase/auth"; // Firebase 로그인 함수
import { auth, db } from "../firebase"; // Firebase 인증 및 Firestore
import { doc, getDoc, setDoc } from "firebase/firestore"; // Firestore 데이터 조회 및 저장 함수

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorPopup, setErrorPopup] = useState(false); // 오류 팝업 상태 관리
  const [errorMessage, setErrorMessage] = useState(""); // 오류 메시지 관리
  const [isGoogleLogin, setIsGoogleLogin] = useState(false); // 구글 로그인 상태 관리
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    id: "",
    uwbMac: "",
    email: "",
    isAdmin: false, // 관리자 여부 추가
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
  // handleLoginSubmit에서 Firestore에서 isAdmin 여부를 확인하여 onLoginSuccess에 전달
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(""); // 오류 메시지 초기화

    try {
        // Firebase 인증을 사용한 이메일/비밀번호 로그인
        console.log("로그인 성공");

        // Firestore에서 해당 사용자의 isAdmin 여부를 확인
        const userDoc = await getDoc(doc(db, "users", email));
        const isAdmin = userDoc.exists() && userDoc.data().isAdmin; // 관리자인지 여부 확인

        // 로그인 성공 시 isAdmin 여부와 함께 onLoginSuccess 호출
        onLoginSuccess(email, isAdmin); // 로그인 성공 시 관리자 여부 전달
    } catch (error) {
        // 로그인 실패 시 오류 팝업 띄우기
        setErrorMessage("이메일 또는 비밀번호가 잘못되었습니다.");
        setErrorPopup(true); // 팝업을 활성화
    }
  };


  // 구글 로그인 처리
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider); // 구글 로그인 팝업
      const user = result.user;
      console.log("구글 로그인 성공");

      // Firestore에서 해당 사용자의 이메일로 추가 정보 확인
      const userDoc = await getDoc(doc(db, "users", user.email)); // Firestore에서 이메일로 사용자 데이터 확인
      if (userDoc.exists()) {
        console.log("추가 정보가 이미 존재합니다. 바로 대기 화면으로 이동합니다.");
        onLoginSuccess(); // 추가 정보가 이미 있으면 바로 대기 화면으로 이동
      } else {
        // 추가 정보가 없으면 입력 창 표시
        setFormData({
          ...formData,
          email: user.email, // 구글 계정의 이메일 자동 입력
        });
        setIsGoogleLogin(true); // 추가 정보 입력 단계로 전환
      }
    } catch (error) {
      setErrorMessage("구글 로그인 중 오류가 발생했습니다.");
      setErrorPopup(true); // 팝업을 활성화
    }
  };

  // 추가 정보 입력 후 Firestore에 저장
  const handleAdditionalInfoSubmit = async (e) => {
    e.preventDefault();
    try {
      // Firestore에 추가 정보 저장 (이메일을 문서 ID로 사용)
      await setDoc(doc(db, "users", formData.email), {
        email: formData.email,
        name: formData.name,
        phone: formData.phone,
        id: formData.id,
        uwbMac: formData.uwbMac,
        isAdmin: formData.isAdmin, // 관리자 여부 저장
      });
      alert("추가 정보가 저장되었습니다.");
      onLoginSuccess(); // 추가 정보 저장 후 콜백 호출
    } catch (error) {
      console.error("Error saving additional info:", error);
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
          <button type="submit">Save Information</button>
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
