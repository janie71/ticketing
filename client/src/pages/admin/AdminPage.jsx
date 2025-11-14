import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

function AdminPage() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

  // ⭐ 티켓팅 시간 관련 상태
  const [openDate, setOpenDate] = useState('');
  const [openTime, setOpenTime] = useState('');
  const [currentOpenText, setCurrentOpenText] = useState('설정된 오픈 시간이 없습니다.');
  const [loading, setLoading] = useState(false);
  const [openStatus, setOpenStatus] = useState('');


  // 🔥 1) 페이지 로드시 localStorage 검사 → 자동 로그인
  useEffect(() => {
    const savedPassword = localStorage.getItem('adminPassword');
    if (savedPassword === 'popmusic123') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    if (password === 'popmusic123') {
      localStorage.setItem('adminPassword', password);
      setIsAuthenticated(true);
    } else {
      alert('비밀번호가 틀렸습니다.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminPassword');
    setIsAuthenticated(false);
  };

  /** 🔥 2) 현재 설정된 티켓팅 오픈 시간 조회 */
  const fetchOpenTime = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings/open-time');

      const openAt = res.data?.openAt; // ISO 문자열

      if (!openAt) {
        setCurrentOpenText('설정된 오픈 시간이 없습니다.');
        setOpenDate('');
        setOpenTime('');
        setOpenStatus('오픈됨');
        return;
      }

      const dt = new Date(openAt);
      const dateStr = dt.toISOString().slice(0, 10);
      const timeStr = dt.toTimeString().slice(0, 5);

      setOpenDate(dateStr);
      setOpenTime(timeStr);
      
      const now = new Date();
      const isOpen = now >= dt;

      setOpenStatus(isOpen ? '오픈됨' : '대기 중');


      setCurrentOpenText(`현재 설정된 오픈 시간: ${dateStr} ${timeStr}`);
    } catch (err) {
      console.error('조회 실패:', err);
      setCurrentOpenText('설정된 오픈 시간을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 🔥 첫 로그인 후에만 fetchOpenTime 실행
  useEffect(() => {
    if (isAuthenticated) fetchOpenTime();
  }, [isAuthenticated]);

  /** 🔥 3) 티켓팅 오픈 시간 저장 */
  const handleSaveOpenTime = async () => {
    if (!openDate || !openTime) {
      alert('날짜와 시간을 모두 선택하세요.');
      return;
    }

    try {
      setLoading(true);

      const isoString = new Date(`${openDate}T${openTime}:00`).toISOString();

      await api.put('/admin/settings/open-time', {
        open_at: isoString,
      });

      alert('티켓팅 오픈 시간이 설정되었습니다.');
      fetchOpenTime();
    } catch (err) {
      console.error('저장 실패:', err);
      alert('저장 실패. 서버 로그를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  /** 🔥 4) 티켓팅 오픈 시간 삭제 */
  const handleClearOpenTime = async () => {
    if (!window.confirm('설정된 오픈 시간을 삭제하시겠습니까?')) return;

    try {
      setLoading(true);
      await api.delete('/admin/settings/open-time');

      alert('오픈 시간이 삭제되었습니다.');
      setOpenDate('');
      setOpenTime('');
      setCurrentOpenText('설정된 오픈 시간이 없습니다.');
    } catch (err) {
      console.error('삭제 실패:', err);
      alert('삭제 실패');
    } finally {
      setLoading(false);
    }
  };

  /** 🔐 로그인 페이지 */
  if (!isAuthenticated) {
    return (
      <div style={{ padding: '40px', maxWidth: '400px', margin: '100px auto' }}>
        <h1 style={{ textAlign: 'center' }}>관리자 로그인</h1>

        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
          style={{
            width: '100%',
            padding: '12px',
            marginBottom: '15px',
            fontSize: '16px',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        />

        <button
          onClick={handleLogin}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#E74C3C',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          로그인
        </button>

        <button
          onClick={() => navigate('/')}
          style={{
            width: '100%',
            padding: '12px',
            marginTop: '10px',
            backgroundColor: '#95A5A6',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          돌아가기
        </button>
      </div>
    );
  }

  /** 🔓 관리자 메인 페이지 */
  return (
    <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={() => navigate('/')}>← 사용자 페이지로</button>

        <button
          onClick={handleLogout}
          style={{
            padding: '8px 20px',
            backgroundColor: '#E74C3C',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          로그아웃
        </button>
      </div>

      <h1 style={{ marginTop: '20px', marginBottom: '30px' }}>관리자 페이지</h1>

      {/* ================================
          ⭐ 1단계: 티켓팅 오픈 시간 설정
          ================================ */}
      <section
        style={{
          backgroundColor: '#f8f9fa',
          padding: '20px',
          marginBottom: '40px',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <h2 style={{ marginBottom: '15px' }}>티켓팅 오픈 시간 설정</h2>

        <div style={{ marginBottom: '15px', fontWeight: 'bold' }}>{currentOpenText}</div>
        <div style={{ 
          marginBottom: '10px', 
          padding: '8px 12px', 
          backgroundColor: openStatus === '오픈됨' ? '#2ECC71' : '#E67E22',
          color: '#fff',
          borderRadius: '6px',
          display: 'inline-block',
          fontWeight: 'bold'
        }}>
          현재 상태: {openStatus}
        </div>

        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
          <div>
            <label>날짜</label>
            <input
              type="date"
              value={openDate}
              onChange={(e) => setOpenDate(e.target.value)}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
            />
          </div>

          <div>
            <label>시간</label>
            <input
              type="time"
              value={openTime}
              onChange={(e) => setOpenTime(e.target.value)}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleSaveOpenTime}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#2ECC71',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            저장
          </button>

          <button
            onClick={handleClearOpenTime}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#E74C3C',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            삭제
          </button>
        </div>
      </section>

      {/* ⚠️ 앞으로 기능 2~6 여기에 아래로 연결하면 됨 */}
      <p>다음: 시간표 조회 + 팀별 필터링 넣기 가능!</p>
    </div>
  );
}

export default AdminPage;
