import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터
api.interceptors.request.use(
  (config) => {
    // 관리자 비밀번호가 localStorage에 있으면 헤더에 추가
    const adminPassword = localStorage.getItem('adminPassword');
    if (adminPassword) {
      config.headers['x-admin-password'] = adminPassword;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // 서버 응답이 있는 경우
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      // 요청은 보냈지만 응답이 없는 경우
      console.error('No response from server');
    } else {
      // 요청 설정 중 에러
      console.error('Request setup error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;