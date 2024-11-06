// Signup.js

import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    id: "",
    password: "",
    confirmPassword: "",
    uwbMac: "",
    isAdmin: false,
    signal: "",
  });

  const [emailVerified, setEmailVerified] = useState(false);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();

  // 이메일 인증 상태 주기적으로 확인하는 타이머 설정
  useEffect(() => {
    const checkEmailVerification = setInterval(() => {
      if (auth.currentUser) {
        auth.currentUser.reload()
          .then(() => {
            setEmailVerified(auth.currentUser.emailVerified);
          })
          .catch((error) => {
            console.error('Error reloading user:', error);
            if (error.code === 'auth/user-token-expired') {
              // 토큰이 만료된 경우 로그아웃 및 로그인 페이지로 이동
              auth.signOut();
              navigate('/login');
            }
          });
      }
    }, 5000);

    return () => clearInterval(checkEmailVerification);
  }, [navigate]);
  // 입력 필드 핸들러
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // 팝업 닫기 핸들러
  const closePopup = () => {
    setShowPopup(false);
    setErrorMessage("");
  };

  // 이메일 인증 보내기 핸들러
  const handleSendVerificationEmail = async () => {
    // 이메일과 비밀번호가 입력되었는지 확인
    if (!formData.email || !formData.password) {
      setErrorMessage("이메일과 비밀번호를 입력하고 인증 이메일을 보내주세요.");
      setShowPopup(true);
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage("비밀번호는 최소 6자 이상이어야 합니다.");
      setShowPopup(true);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // 이메일 인증 보내기
      await sendEmailVerification(userCredential.user);
      setEmailVerificationSent(true);
      alert("이메일 인증 링크가 발송되었습니다. 이메일을 확인하세요.");
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        setErrorMessage("이미 사용된 이메일입니다.");
        setShowPopup(true);
      } else {
        console.error("인증 이메일 전송 오류:", error);
        setErrorMessage("인증 이메일 전송 중 오류가 발생했습니다.");
        setShowPopup(true);
      }
    }
  };

  // 회원가입 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();

    const { email, name, id, password, confirmPassword, uwbMac } = formData;

    // 입력 필드 검증
    if (!email || !name || !id || !password || !confirmPassword || !uwbMac) {
      setErrorMessage("모든 필드를 입력해 주세요.");
      setShowPopup(true);
      return;
    }

    // 비밀번호 일치 여부 확인
    if (password !== confirmPassword) {
      setErrorMessage("비밀번호가 일치하지 않습니다.");
      setShowPopup(true);
      return;
    }

    // 이메일 인증 여부 확인
    if (!emailVerificationSent || !emailVerified) {
      setErrorMessage("이메일 인증을 완료해 주세요.");
      setShowPopup(true);
      return;
    }

    try {
      // Firestore에 사용자 정보 저장 (기존 코드 유지)
      const userDocRef = doc(db, "users", formData.email);
      const userDoc = await getDoc(userDocRef);

      let storeId = null;

      if (!userDoc.exists()) {
        // 관리자인 경우 고유한 매장 ID 부여
        if (formData.isAdmin) {
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

        // Firestore에 사용자 추가 정보 저장
        await setDoc(userDocRef, {
          email: formData.email,
          name: formData.name,
          id: formData.id,
          uwbMac: formData.uwbMac,
          isAdmin: formData.isAdmin,
          signal: "",
          storeId: storeId,
        });
      }

      alert("회원가입이 완료되었습니다!");
      auth.signOut();
      navigate("/login");
    } catch (error) {
      console.error("회원가입 중 오류:", error);
      setErrorMessage("회원가입 중 오류가 발생했습니다. 다시 시도해 주세요.");
      setShowPopup(true);
    }
  };

  return (
    <div className="signup-container">
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
          />
          <button
            type="button"
            onClick={handleSendVerificationEmail}
            disabled={emailVerificationSent}
          >
            {emailVerificationSent ? "인증 이메일 발송됨" : "인증 이메일 보내기"}
          </button>
          {emailVerificationSent && emailVerified && (
            <span style={{ color: "green", marginLeft: "10px" }}>
              ✔ 이메일 인증에 성공했습니다
            </span>
          )}
        </div>
        <div>
          <label>이름:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>ID:</label>
          <input
            type="text"
            name="id"
            value={formData.id}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>비밀번호:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>비밀번호 확인:</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>UWB MAC 주소:</label>
          <input
            type="text"
            name="uwbMac"
            value={formData.uwbMac}
            onChange={handleChange}
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
        <button type="submit">
          Sign Up
        </button>
      </form>

      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-message">
            <h2>오류</h2>
            <p>{errorMessage}</p>
            <button onClick={closePopup}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Signup;
