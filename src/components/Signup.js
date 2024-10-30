import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword, sendEmailVerification} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
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
  });

  const [emailVerified, setEmailVerified] = useState(false); // 이메일 인증 상태
  const [emailVerificationSent, setEmailVerificationSent] = useState(false); // 인증 이메일 전송 상태
  const [errorMessage, setErrorMessage] = useState(""); // 오류 메시지
  const [showPopup, setShowPopup] = useState(false); // 팝업 메시지 표시 상태
  const navigate = useNavigate();

  // 이메일 인증 상태 주기적으로 확인하는 타이머 설정
  useEffect(() => {
    const checkEmailVerification = setInterval(() => {
      if (auth.currentUser) {
        auth.currentUser.reload().then(() => {
          setEmailVerified(auth.currentUser.emailVerified);
        });
      }
    }, 5000); // 5초마다 상태 확인

    return () => clearInterval(checkEmailVerification); // 컴포넌트 언마운트 시 타이머 정리
  }, []);

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
    // 모든 필드가 입력되지 않으면 팝업 메시지 표시
    if (!formData.email || !formData.name || !formData.id || !formData.password || !formData.confirmPassword || !formData.uwbMac) {
      setErrorMessage("나머지 정보를 전부 입력하고 이메일 인증을 눌러주세요.");
      setShowPopup(true);
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage("비밀번호는 최소 6자 이상이어야 합니다.");
      setShowPopup(true);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("비밀번호가 일치하지 않습니다.");
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
      setEmailVerificationSent(true); // 인증 이메일 전송 상태 설정
      alert("이메일 인증 링크가 발송되었습니다. 이메일을 확인하세요.");
    } catch (error) {
        if (error.code === "auth/email-already-in-use") {
          // 이미 사용 중인 이메일일 때 처리
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

    if (!emailVerificationSent || !emailVerified) {
      setErrorMessage("이메일 인증을 완료해 주세요.");
      setShowPopup(true);
      return;
    }

    try {
      // Firestore에 이메일을 문서 ID로 저장 (이메일로 사용자 확인)
      const userDocRef = doc(db, "users", formData.email);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Firestore에 사용자 추가 정보 저장
        await setDoc(doc(db, "users", formData.email), {
          email: formData.email,
          name: formData.name,
          id: formData.id,
          uwbMac: formData.uwbMac,
          isAdmin: formData.isAdmin,
        });
      }

      alert("회원가입이 완료되었습니다!");
      navigate("/login"); // 회원가입 후 로그인 페이지로 이동
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
            required
          />
          <button
            type="button"
            onClick={handleSendVerificationEmail}
            disabled={emailVerificationSent}
          >
            {emailVerificationSent ? "인증 이메일 발송됨" : "인증 이메일 보내기"}
          </button>
          {/* 이메일 인증 완료 시 초록색 체크 표시 및 메시지 */}
          {emailVerificationSent && emailVerified && (
            <span style={{ color: "green", marginLeft: "10px" }}>✔ 이메일 인증에 성공했습니다</span>
          )}
        </div>
        <div>
          <label>이름:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
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
          <label>비밀번호:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>비밀번호 확인:</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>UWB MAC 주소:</label>
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
        <button type="submit" disabled={!emailVerified}>
          Sign Up
        </button>
      </form>

      {/* 팝업 메시지 */}
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
