// PaymentResult.js

import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const PaymentResult = () => {
  const location = useLocation();

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const pg_token = query.get('pg_token');

    if (pg_token) {
      // 로컬 스토리지에서 tid를 가져옵니다.
      const tid = localStorage.getItem('tid');

      // 결제 승인 요청을 백엔드로 보냅니다.
      fetch('https://dd81-168-131-224-57.ngrok-free.app', {
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

          // 필요한 경우 상태 초기화 등 추가 작업 수행
          localStorage.removeItem('tid');
          // 결제 완료 후 원하는 페이지로 이동
          // 예: 메인 페이지로 이동
          // window.location.href = '/';
        })
        .catch((error) => {
          console.error('결제 승인 중 오류가 발생했습니다.', error);
          alert('결제 승인 중 오류가 발생했습니다.');
        });
    } else {
      // 결제 실패 또는 취소
      console.log('결제가 취소되었거나 실패했습니다.');
      alert('결제가 취소되었거나 실패했습니다.');
      // 필요한 경우 상태 초기화 등 추가 작업 수행
      // window.location.href = '/';
    }
  }, [location]);

  return (
    <div>
      <h2>결제 결과 처리 중입니다...</h2>
    </div>
  );
};

export default PaymentResult;
