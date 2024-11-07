// PaymentResult.js

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./PaymentResult.css"; // 스타일링을 위한 CSS 파일 임포트
import { v4 as uuidv4 } from "uuid"; // 주문 번호 생성을 위한 UUID 라이브러리

const PaymentResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const pg_token = query.get("pg_token");

    if (pg_token) {
      // 로컬 스토리지에서 tid를 가져옵니다.
      const tid = localStorage.getItem("tid");

      // 백엔드 url 설정
      fetch("https://79ca-168-131-224-57.ngrok-free.app/api/payments/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tid, pg_token }),
      })
        .then((res) => res.json())
        .then((data) => {
          // 결제 성공 처리
          console.log("결제 성공:", data);
          alert("결제가 성공적으로 완료되었습니다.");

          // 주문 번호 생성
          const newOrderNumber = generateOrderNumber();
          setOrderNumber(newOrderNumber);

          // 로컬 스토리지에서 주문 내역을 가져옵니다.
          const orderDetails = JSON.parse(localStorage.getItem("orderDetails"));
          if (orderDetails) {
            setCartItems(orderDetails.cartItems);
            setCartTotal(orderDetails.cartTotal);
          }

          // 팝업 표시
          setShowPopup(true);

          // 필요한 경우 상태 초기화 등 추가 작업 수행
          localStorage.removeItem("tid");
          localStorage.removeItem("orderDetails");
        })
        .catch((error) => {
          console.error("결제 승인 중 오류가 발생했습니다.", error);
          alert("결제 승인 중 오류가 발생했습니다.");
          navigate("/kiosk");
        });
    } else {
      // 결제 실패 또는 취소
      console.log("결제가 취소되었거나 실패했습니다.");
      alert("결제가 취소되었거나 실패했습니다.");
      navigate("/kiosk");
    }
  }, [location, navigate]);

  // 주문 번호 생성 함수
  const generateOrderNumber = () => {
    // UUID를 사용하여 주문 번호 생성
    return uuidv4().split("-")[0].toUpperCase();
  };

  // 팝업 닫기 핸들러
  const handleClosePopup = () => {
    setShowPopup(false);
    // 메인 페이지 또는 원하는 페이지로 이동
    navigate("/kiosk");
  };

  return (
    <div className="payment-result-container">
      {/* 결제 결과 처리 중 메시지 */}
      {!showPopup && <h2>결제 결과를 처리 중입니다...</h2>}

      {/* 결제 완료 팝업 */}
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h2>결제가 완료되었습니다!</h2>
            <p>
              주문 번호: <strong>{orderNumber}</strong>
            </p>
            {/* 주문 내역 표시 */}
            <ul className="order-item-list">
              {cartItems.map((item, index) => (
                <li key={index} className="order-item">
                  <div className="order-item-info">
                    <span className="order-item-name">{item.name}</span>
                    {item.selectedOptions && (
                      <ul className="selected-options">
                        {Object.entries(item.selectedOptions).map(
                          ([optionName, choice], idx) => (
                            <li key={idx}>
                              {optionName}: {choice}
                            </li>
                          )
                        )}
                      </ul>
                    )}
                  </div>
                  <span className="order-item-quantity">수량: {item.quantity}</span>
                  <span className="order-item-price">
                    ₩{(item.price * item.quantity).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
            <p className="order-total">총 합계: ₩{cartTotal.toLocaleString()}</p>
            <button className="confirm-button" onClick={handleClosePopup}>
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentResult;
