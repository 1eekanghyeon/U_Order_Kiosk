// server.js

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const qs = require('qs'); // 쿼리스트링 변환을 위해 추가

const app = express();
app.use(cors()); // 모든 도메인에서의 요청을 허용합니다.
app.use(express.json());

// 카카오페이 API 키와 상점 정보
const ADMIN_KEY = '298058d014e67c5a75121167f448a127'; // 발급받은 어드민 키로 교체하세요
const CID = 'TC0ONETIME'; // 테스트용 CID입니다.
const NGROK_URL = 'https://3ae8-168-131-224-57.ngrok-free.app'; // ngrok 출력에서 받은 HTTPS URL

// 결제 준비 요청 처리 엔드포인트
app.post('/api/payments/ready', async (req, res) => {
  const { cartItems, totalAmount, partner_order_id } = req.body;

  try {
    // item_name과 quantity 설정
    const item_names = cartItems.map(item => item.name).join(', ');
    const total_quantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    const params = {
      cid: CID,
      partner_order_id,
      partner_user_id: 'partner_user_id',
      item_name: item_names.substring(0, 100), // 최대 100자까지 허용되므로 잘라냄
      quantity: total_quantity,
      total_amount: totalAmount,
      vat_amount: 0,
      tax_free_amount: 0,
      approval_url: `${NGROK_URL}/payments/success`,
      cancel_url: `${NGROK_URL}/payments/cancel`,
      fail_url: `${NGROK_URL}/payments/fail`,
    };

    const response = await axios.post(
      'https://kapi.kakao.com/v1/payment/ready',
      qs.stringify(params),
      {
        headers: {
          Authorization: `KakaoAK ${ADMIN_KEY}`,
          'Content-type': 'application/x-www-form-urlencoded;charset=utf-8',
        },
      }
    );

    // 결제 준비 응답에서 tid와 결제 페이지 URL을 프론트엔드로 전달합니다.
    console.log('카카오페이 결제 준비 응답:', response.data); // 로그 추가
    res.json({
      tid: response.data.tid,
      next_redirect_pc_url: response.data.next_redirect_pc_url,
    });
  } catch (error) {
    console.error('카카오페이 결제 준비 중 오류:', error.response ? error.response.data : error.message);
    res.status(500).json({ message: '결제 준비 중 오류가 발생했습니다.', error: error.response ? error.response.data : error.message });
  }
});

// 결제 승인 요청 처리 엔드포인트
app.post('/api/payments/approve', async (req, res) => {
  const { tid, pg_token, partner_order_id } = req.body; // partner_order_id 추가

  try {
    if (!tid) {
      throw new Error('tid가 전달되지 않았습니다.');
    }

    const params = {
      cid: CID,
      tid,
      partner_order_id,
      partner_user_id: 'partner_user_id',
      pg_token,
    };

    const response = await axios.post(
      'https://kapi.kakao.com/v1/payment/approve',
      qs.stringify(params),
      {
        headers: {
          Authorization: `KakaoAK ${ADMIN_KEY}`,
          'Content-type': 'application/x-www-form-urlencoded;charset=utf-8',
        },
      }
    );

    console.log('카카오페이 결제 승인 응답:', response.data); // 로그 추가
    res.json(response.data);
  } catch (error) {
    console.error('카카오페이 결제 승인 중 오류:', error.response ? error.response.data : error.message);
    res.status(500).json({ message: '결제 승인 중 오류가 발생했습니다.', error: error.response ? error.response.data : error.message });
  }
});

// 서버 실행
app.listen(5000, () => {
  console.log('Server is running on port 5000');
});
