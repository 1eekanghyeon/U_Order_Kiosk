// PaymentResult.js

import React, { useEffect, useState  } from 'react';
import { useLocation, useNavigate  } from 'react-router-dom';
import './PaymentResult.css'; // 스타일링을 위한 CSS 파일 임포트
import { v4 as uuidv4 } from 'uuid'; // 주문 번호 생성을 위한 UUID 라이브러리

const PaymentResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const pg_token = query.get('pg_token');

    if (pg_token) {
      // 로컬 스토리지에서 tid를 가져옵니다.
      const tid = localStorage.getItem('tid');

      // 결제 승인 요청을 백엔드로 보냅니다.
      fetch('https://75d7-168-131-224-57.ngrok-free.app/api/payments/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tid, pg_token }),
      })
        .then((res) => res.json())
        .then((data) => {
          // 결제 성공 처리
          console.log('결제 성공:', data);
          alert('결제가 성공적으로 완료되었습니다.');
            // 주문 번호 생성
          const newOrderNumber = generateOrderNumber();
          setOrderNumber(newOrderNumber);
          // 팝업 표시
          setShowPopup(true);
          // 필요한 경우 상태 초기화 등 추가 작업 수행
          localStorage.removeItem('tid');
        // 장바구니 비우기 등 추가 작업 필요 시 여기에 추가
        })
        .catch((error) => {
          console.error('결제 승인 중 오류가 발생했습니다.', error);
          alert('결제 승인 중 오류가 발생했습니다.');
          navigate('/');
        });
    } else {
      // 결제 실패 또는 취소
      console.log('결제가 취소되었거나 실패했습니다.');
      alert('결제가 취소되었거나 실패했습니다.');
      navigate('/');
      // 필요한 경우 상태 초기화 등 추가 작업 수행
      // window.location.href = '/';
    }
  }, [location,navigate]);

  // 주문 번호 생성 함수
  const generateOrderNumber = () => {
    // UUID를 사용하여 주문 번호 생성
    return uuidv4().split('-')[0].toUpperCase();
  };

  // 팝업 닫기 핸들러
  const handleClosePopup = () => {
    setShowPopup(false);
    // 메인 페이지 또는 원하는 페이지로 이동
    navigate('/');
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
            <p>주문 번호: <strong>{orderNumber}</strong></p>
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