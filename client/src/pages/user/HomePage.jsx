import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const PRESET_COLORS = [
  '#ff0000ff', '#79c2f2ff', '#2ECC71', '#ffdd00ff', '#973cbcff',
  '#fb8ac7ff', '#00ffe1ff', '#0800ffff', '#f97604ff', '#a7a7a7ff',
  '#6c3e1eff', '#f5ae83ff', '#d499eeff', '#266793ff', '#056400ff',
  '#48af9aff', '#ffefafff', '#ef08ebff', '#0099ffff', '#5833cfff'
];

function HomePage() {
  const navigate = useNavigate();
  const [bands, setBands] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBandList, setShowBandList] = useState(false);
  const [newBand, setNewBand] = useState({ name: '', color: PRESET_COLORS[0] });
  const [selectedBand, setSelectedBand] = useState(null);
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  const [openAt, setOpenAt] = useState(null);
  const [remainingTime, setRemainingTime] = useState('');

  useEffect(() => {
    fetchBands();
    checkReservationStatus();
  }, []);

//  // 외부 클릭 시 드롭다운 닫기
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (showBandList && !event.target.closest('.band-dropdown')) {
//         setShowBandList(false);
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, [showBandList]);

// 카운트다운 계산
  useEffect(() => {
    if (!openAt) return;

    const interval = setInterval(() => {
      const now = new Date();
      const openTime = new Date(openAt);

      const diff = openTime - now;

      if (diff <= 0) {
        setRemainingTime('');
        setIsReservationOpen(true);
        clearInterval(interval);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setRemainingTime(`${hours}시간 ${minutes}분 ${seconds}초 남음`);
    }, 1000);

    return () => clearInterval(interval);
  }, [openAt]);

  const fetchBands = async () => {
    try {
      const response = await api.get('/bands');
      setBands(response.data.data);
    } catch (error) {
      alert('곡 목록을 불러오는데 실패했습니다.');
    }
  };

  const checkReservationStatus = async () => {
    try {
      const response = await api.get('/settings/is-open');
      
      setIsReservationOpen(response.data.isOpen);
      setOpenAt(response.data.openAt);
      setIsReservationOpen(response.data.isOpen);
    } catch (error) {
      console.error('예매 상태 확인 실패:', error);
    }
  };

  const handleCreateBand = async () => {
    if (!newBand.name.trim()) {
      alert('곡 이름을 입력해주세요.');
      return;
    }
    console.log('전송할 데이터:', newBand); // 이 줄 추가

    try {
      const response = await api.post('/bands', newBand);
      alert(response.data.message);
      setShowCreateModal(false);
      setNewBand({ name: '', color: PRESET_COLORS[0] });
      fetchBands();
    } catch (error) {
      console.error('에러:', error.response?.data); // 이 줄 추가
      alert('곡 생성에 실패했습니다.');
    }
  };

  const handleReservation = () => {
    if (!selectedBand) {
      alert('곡을 선택해주세요.');
      return;
    }

    if (!isReservationOpen) {
      alert('예매가 아직 열리지 않았습니다.');
      return;
    }

    // 선택한 곡 정보를 localStorage에 저장
    localStorage.setItem('selectedBand', JSON.stringify(selectedBand));
    navigate('/reservation');
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '40px' }}>팝뮤직 동방 예약 시스템</h1>

      {/* 곡 선택 */}
      <div style={{ marginBottom: '30px' }}>
        <h2>곡 선택</h2>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowBandList(!showBandList)}
            style={{
              width: '100%',
              padding: '15px',
              fontSize: '16px',
              backgroundColor: selectedBand ? selectedBand.color : '#fff',
              color: selectedBand ? '#000000ff' : '#333',
              border: '2px solid #ddd',
              borderRadius: '8px',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontWeight: 'bold',
            }}
          >
            <span>{selectedBand ? selectedBand.name : '곡을 선택하세요'}</span>
            <span>{showBandList ? '▲' : '▼'}</span>
          </button>

          {/* 드롭다운 리스트 */}
          {showBandList && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '5px',
              backgroundColor: '#fff',
              border: '2px solid #ddd',
              borderRadius: '8px',
              maxHeight: '300px',
              overflowY: 'auto',
              zIndex: 10,
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            }}>
              {bands.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                  등록된 곡이 없습니다
                </div>
              ) : (
                bands.map(band => (
                  <div
                    key={band.id}
                    onClick={() => {
                      setSelectedBand(band);
                      setShowBandList(false);
                    }}
                    style={{
                      padding: '15px',
                      borderBottom: '1px solid #ffffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      backgroundColor: selectedBand?.id === band.id ? '#cfcfcfff' : '#ffffffff',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedBand?.id === band.id ? '#f8f9fa' : '#fff'}
                  >
                    <div style={{
                      width: '30px',
                      height: '30px',
                      backgroundColor: band.color,
                      borderRadius: '4px',
                    }} />
                    <span style={{ fontWeight: 'bold', color: '#333' }}>{band.name}</span>
                    {selectedBand?.id === band.id && <span style={{ marginLeft: 'auto', color: '#2ECC71' }}>✓</span>}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* 버튼 그룹 */}
      <div style={{ display: 'flex', gap: '15px', flexDirection: 'column' }}>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '15px',
            fontSize: '16px',
            backgroundColor: '#848484ff',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          곡 새로 만들기
        </button>
        {!isReservationOpen && remainingTime && (
          <div style={{ marginBottom: '10px', color: '#E74C3C', fontWeight: 'bold' }}>
            예매 오픈까지 {remainingTime}
          </div>
        )}

        <button
          onClick={handleReservation}
          disabled={!isReservationOpen}
          style={{
            padding: '15px',
            fontSize: '16px',
            backgroundColor: isReservationOpen ? '#808080ff' : '#95A5A6',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: isReservationOpen ? 'pointer' : 'not-allowed',
          }}
        >
          {isReservationOpen ? '예약하기' : '예약 준비 중...'}
        </button>

        <button
          onClick={() => {
            if (!selectedBand) {
              alert('곡을 선택해주세요.');
              return;
            }

            // 선택한 곡 정보 저장
            localStorage.setItem('selectedBand', JSON.stringify(selectedBand));

            navigate('/schedule');
          }}
          style={{
            padding: '15px',
            fontSize: '16px',
            backgroundColor: '#808080ff',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          합주 일정 조회
        </button>


        <button
          onClick={() => navigate('/admin')}
          style={{
            padding: '15px',
            fontSize: '16px',
            backgroundColor: '#808080ff',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          관리자 페이지
        </button>
      </div>

      {/* 곡 생성 모달 */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            backgroundColor: '#ffffffff',
            padding: '30px',
            borderRadius: '12px',
            minWidth: '400px',
          }}>
            <h2>새 곡 만들기</h2>
            
            <input
              type="text"
              placeholder="곡 이름"
              value={newBand.name}
              onChange={(e) => setNewBand({ ...newBand, name: e.target.value })}
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '20px',
                fontSize: '16px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            />

            <div style={{ marginBottom: '20px' }}>
              <p>색상 선택:</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                {PRESET_COLORS.map(color => (
                  <div
                    key={color}
                    onClick={() => setNewBand({ ...newBand, color })}
                    style={{
                      width: '100%',
                      height: '40px',
                      backgroundColor: color,
                      border: newBand.color === color ? '3px solid #000' : '1px solid #ddd',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleCreateBand}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#2ECC71',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px',
                }}
              >
                만들기
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewBand({ name: '', color: PRESET_COLORS[0] });
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#95A5A6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px',
                }}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;