import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { format, startOfWeek, addDays, addWeeks, subWeeks } from 'date-fns';
import { ko } from 'date-fns/locale';

function ReservationPage() {
  const navigate = useNavigate();
  const [selectedBand, setSelectedBand] = useState(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [reservations, setReservations] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  // 시간 슬롯 생성 (09:00 ~ 25:00, 30분 단위)
  const timeSlots = [];
  for (let hour = 9; hour <= 25; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      if (hour === 25 && minute > 0) break;
      const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      timeSlots.push(timeStr);
    }
  }

  // 요일 배열 생성 (일~토)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  // 초기 로드: localStorage에서 선택한 곡 & 예약 가져오기
  useEffect(() => {
    const band = JSON.parse(localStorage.getItem('selectedBand'));
    if (!band) {
      alert('곡을 먼저 선택해주세요.');
      navigate('/');
      return;
    }
    setSelectedBand(band);
  }, []); // 한 번만 실행: app 진입 시 selectedBand 설정

  // 주 변경 또는 selectedBand가 셋팅되었을 때 예약 불러오기
  useEffect(() => {
    if (!selectedBand) return;
    fetchReservations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWeekStart, selectedBand]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const startDate = format(currentWeekStart, 'yyyy-MM-dd');
      const endDate = format(addDays(currentWeekStart, 6), 'yyyy-MM-dd');

      const response = await api.get('/reservations', {
        params: { startDate, endDate }
      });

      // response.data.data 가 배열이 아닌 경우도 대비
      const data = Array.isArray(response.data?.data) ? response.data.data : [];
      setReservations(data);
    } catch (error) {
      console.error('예약 조회 실패:', error);
      alert('예약을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 슬롯 클릭 처리
  const handleSlotClick = (date, time) => {
    // selectedBand가 없는 상태에서 빈 슬롯을 선택하지 못하게 함
    if (!selectedBand) {
      alert('먼저 예약할 곡을 선택해주세요.');
      navigate('/');
      return;
    }

    const dateStr = format(date, 'yyyy-MM-dd');
    const slotKey = `${dateStr}_${time}`;

    // 해당 시간의 예약이 있는지 확인
    const existingReservation = reservations.find(
      r => String(r.date) === dateStr && String(r.start_time) === time
    );

    if (existingReservation) {
      // 예약이 있으면: 내 곡이면 삭제, 아니면 경고
      const isMyReservation = String(existingReservation.band_id) === String(selectedBand?.id);
      if (isMyReservation) {
        if (window.confirm('이 예약을 삭제하시겠습니까?')) {
          handleDeleteReservation(existingReservation.id);
        }
      } else {
        alert('다른 팀이 예약한 시간입니다. 삭제할 수 없습니다.');
      }
      return; // 예약이 있으면 선택/해제 동작 안함
    }

    // 예약이 없으면 선택/해제 (예약 생성 후보)
    setSelectedSlots(prev => (
      prev.includes(slotKey) ? prev.filter(s => s !== slotKey) : [...prev, slotKey]
    ));
  };

  const handleReservation = async () => {
    if (!selectedBand) {
      alert('예약할 곡을 선택해주세요.');
      return;
    }
    if (selectedSlots.length === 0) {
      alert('예약할 시간을 선택해주세요.');
      return;
    }

    try {
      setLoading(true);
      // 여러 슬롯 동시 예약 시 순차적으로 요청
      for (const slotKey of selectedSlots) {
        const [dateStr, startTime] = slotKey.split('_');

        // 종료 시간 계산 (30분 후)
        const [hour, minute] = startTime.split(':').map(Number);
        let endHour = hour;
        let endMinute = minute + 30;
        if (endMinute >= 60) {
          endHour += 1;
          endMinute = 0;
        }
        const endTime = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;

        await api.post('/reservations', {
          band_id: selectedBand.id,
          date: dateStr,
          start_time: startTime,
          end_time: endTime
        });
      }

      alert('예약이 완료되었습니다!');
      setSelectedSlots([]);
      await fetchReservations();
    } catch (error) {
      console.error('예약 실패:', error);
      const errorMsg = error.response?.data?.message || '예약에 실패했습니다.';
      alert(errorMsg);
      await fetchReservations(); // 최신 상태로 갱신
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReservation = async (reservationId) => {
    try {
      setLoading(true);
      // 삭제 요청 (서버가 band_id 체크를 요구하면 추가 전송)
      await api.delete(`/reservations/${reservationId}`, {
        data: { band_id: selectedBand?.id }
      });

      // 로컬에서 제거하여 즉시 UI 반영 (선택적)
      setReservations(prev => prev.filter(r => String(r.id) !== String(reservationId)));

      alert('예약이 삭제되었습니다.');
      // 전체 다시 불러오기 (안정성)
      await fetchReservations();
    } catch (error) {
      console.error('삭제 실패:', error);
      const errorMsg = error.response?.data?.message || '삭제에 실패했습니다.';
      alert(errorMsg);
      await fetchReservations();
    } finally {
      setLoading(false);
    }
  };

  // 슬롯에 보여줄 상태 결정
  const getSlotStatus = (date, time) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const slotKey = `${dateStr}_${time}`;

    // 해당 슬롯의 예약 검색
    const reservation = reservations.find(
      r => String(r.date) === dateStr && String(r.start_time) === time
    );

    if (reservation) {
      // 요구사항: "모든 팀의 예약" 그대로 보여줌
      // reservation.color 가 서버에서 내려오지 않으면 fallback 색상 사용
      return {
        type: 'reserved',
        color: reservation.color || '#888888',
        bandName: reservation.band_name || reservation.band || '예약',
        isMyBand: String(reservation.band_id) === String(selectedBand?.id)
      };
    }

    // 사용자가 선택한(예약하려는) 슬롯
    if (selectedSlots.includes(slotKey)) {
      return {
        type: 'selected',
        color: selectedBand?.color || '#2ECC71',
        bandName: selectedBand?.name || '내 곡',
        isMyBand: true
      };
    }

    return { type: 'empty' };
  };

  const goToPreviousWeek = () => setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  const goToNextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  const goToThisWeek = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }));

  const getWeekInfo = () => {
    const month = format(currentWeekStart, 'M월', { locale: ko });
    const weekOfMonth = Math.ceil(parseInt(format(currentWeekStart, 'd')) / 7);
    return `${month} ${weekOfMonth}주차`;
  };

  return (
    <div style={{ padding: '20px', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => navigate('/')} style={{
          padding: '10px 20px', backgroundColor: '#95A5A6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer',
        }}>← 돌아가기</button>

        <div style={{
          padding: '10px 20px',
          backgroundColor: selectedBand?.color || '#95A5A6',
          color: '#fff',
          borderRadius: '8px',
          fontWeight: 'bold',
        }}>
          선택한 곡: {selectedBand?.name || '없음'}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
        <button onClick={goToPreviousWeek} style={buttonStyle}>← 이전 주</button>
        <button onClick={goToThisWeek} style={{ ...buttonStyle, backgroundColor: '#2ECC71', fontWeight: 'bold' }}>{getWeekInfo()}</button>
        <button onClick={goToNextWeek} style={buttonStyle}>다음 주 →</button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <thead>
            <tr>
              <th style={{
                padding: '15px', backgroundColor: '#34495E', color: '#fff', border: '1px solid #ddd', position: 'sticky', left: 0, zIndex: 10,
              }}>시간</th>
              {weekDays.map((day, index) => (
                <th key={index} style={{
                  padding: '15px',
                  backgroundColor: index === 0 ? '#E74C3C' : index === 6 ? '#3498DB' : '#34495E',
                  color: '#fff',
                  border: '1px solid #ddd',
                  minWidth: '100px',
                }}>
                  <div>{format(day, 'EEE', { locale: ko })}</div>
                  <div style={{ fontSize: '14px', marginTop: '5px' }}>{format(day, 'M/d')}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((time) => (
              <tr key={time}>
                <td style={{
                  padding: '10px', border: '1px solid #ddd', backgroundColor: '#f8f9fa', fontWeight: 'bold', textAlign: 'center', position: 'sticky', left: 0, zIndex: 5,
                }}>{time}</td>

                {weekDays.map((day, dayIndex) => {
                  const status = getSlotStatus(day, time);
                  // 고유 키: 요일 인덱스 + 시간
                  const cellKey = `${format(day, 'yyyy-MM-dd')}_${time}`;

                  const titleText = status.type === 'reserved'
                    ? (status.isMyBand ? '내 예약 - 클릭하면 삭제' : `${status.bandName} 예약됨`)
                    : '클릭하여 예약';

                  return (
                    <td
                      key={cellKey}
                      onClick={() => handleSlotClick(day, time)}
                      title={titleText}
                      style={{
                        padding: '5px',
                        border: status.isMyBand ? '2px solid rgba(0,0,0,0.15)' : '1px solid #ddd',
                        height: '40px',
                        cursor: 'pointer',
                        backgroundColor: status.type === 'empty' ? '#fff' : status.color,
                        position: 'relative',
                        textAlign: 'center',
                        opacity: status.type === 'selected' ? 0.7 : 1,
                        color: status.type === 'empty' ? '#000' : '#fff',
                      }}
                    >
                      {status.type !== 'empty' && (
                        <div style={{
                          fontSize: '12px',
                          fontWeight: 'bold',
                          textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                        }}>
                          {status.isMyBand ? '내 예약' : status.bandName}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div style={{ marginTop: 8 }}>로딩 중...</div>}
      </div>

      {selectedSlots.length > 0 && (
        <div style={{
          position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', zIndex: 100,
        }}>
          <button onClick={handleReservation} style={{
            padding: '15px 40px', backgroundColor: '#2ECC71', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
          }}>
            선택한 {selectedSlots.length}개 시간 예약하기
          </button>
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h3>사용 방법</h3>
        <ul style={{ lineHeight: '2' }}>
          <li>빈 칸을 클릭하여 예약할 시간을 선택하세요 (30분 단위)</li>
          <li>여러 시간을 선택한 후 "예약하기" 버튼을 누르세요</li>
          <li>이미 예약된 칸을 클릭하면, 선택한 곡의 예약이면 삭제 여부를 묻고 삭제합니다</li>
          <li>다른 팀의 예약은 삭제할 수 없습니다</li>
        </ul>
      </div>
    </div>
  );
}

const buttonStyle = {
  padding: '10px 20px',
  backgroundColor: '#3498DB',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '16px',
};

export default ReservationPage;
