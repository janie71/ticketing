// ============================================
// src/pages/user/ReservationPage.jsx - 예매 페이지
// ============================================
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

  // 시간 슬롯 생성 (09:00 ~ 25:00, 30분 단위)
  const timeSlots = [];
  for (let hour = 9; hour <= 25; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      if (hour === 25 && minute > 0) break;
      const displayHour = hour > 24 ? hour - 24 : hour;
      const timeStr = `${String(displayHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      timeSlots.push(timeStr);
    }
  }

  // 요일 배열 생성 (일~토)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  useEffect(() => {
    // localStorage에서 선택한 곡 가져오기
    const band = JSON.parse(localStorage.getItem('selectedBand'));
    if (!band) {
      alert('곡을 먼저 선택해주세요.');
      navigate('/');
      return;
    }
    setSelectedBand(band);
    fetchReservations();
  }, [currentWeekStart]);

  const fetchReservations = async () => {
    try {
      const startDate = format(currentWeekStart, 'yyyy-MM-dd');
      const endDate = format(addDays(currentWeekStart, 6), 'yyyy-MM-dd');
      
      const response = await api.get('/reservations', {
        params: { startDate, endDate }
      });
      
      console.log('받아온 예약 데이터:', response.data.data);
      console.log('현재 주 시작:', startDate, '~ 끝:', endDate);
      
      setReservations(response.data.data);
    } catch (error) {
      console.error('예약 조회 실패:', error);
    }
  };

  const handleSlotClick = (date, time) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const slotKey = `${dateStr}_${time}`;
    
    // 해당 시간에 예약이 있는지 확인
    const existingReservation = reservations.find(r => {
      const reservationDate = r.date.split('T')[0]; // ISO 날짜에서 날짜 부분만 추출
      const normalizedStartTime = r.start_time.slice(0, 5); 
      return reservationDate === dateStr && normalizedStartTime === time;
      });
    
    if (existingReservation) {
      // 선택한 곡(내 곡)의 예약이면 삭제 확인
      if (existingReservation.band_id === selectedBand.id) {
        if (window.confirm(`"${selectedBand.name}" 팀의 예약을 삭제하시겠습니까?`)) {
          handleDeleteReservation(existingReservation.id);
        }
      } else {
        // 다른 팀의 예약
        alert(`이미 "${existingReservation.band_name}" 팀이 예약한 시간입니다.`);
      }
      return;
    }
    
    // 빈 시간이면 선택/해제 토글
    if (selectedSlots.includes(slotKey)) {
      setSelectedSlots(selectedSlots.filter(s => s !== slotKey));
    } else {
      setSelectedSlots([...selectedSlots, slotKey]);
    }
  };

  const handleReservation = async () => {
    if (selectedSlots.length === 0) {
      alert('예약할 시간을 선택해주세요.');
      return;
    }

    try {
      // 각 슬롯에 대해 예약 요청
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
      fetchReservations();
    } catch (error) {
      const errorMsg = error.response?.data?.message || '예약에 실패했습니다.';
      alert(errorMsg);
      fetchReservations(); // 최신 상태로 갱신
    }
  };

  const handleDeleteReservation = async (reservationId) => {
    try {
      await api.delete(`/reservations/${reservationId}`, {
        data: { band_id: selectedBand.id }
      });
      
      alert('예약이 삭제되었습니다.');
      fetchReservations();
    } catch (error) {
      const errorMsg = error.response?.data?.message || '삭제에 실패했습니다.';
      alert(errorMsg);
    }
  };

  const getSlotStatus = (date, time) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const slotKey = `${dateStr}_${time}`;
    
    // 예약 확인 (날짜 비교 시 ISO 형식 비교)
    const reservation = reservations.find(r => {
      const reservationDate = r.date.split('T')[0]; // ISO 날짜에서 날짜 부분만 추출
      const normalizedStartTime = r.start_time.slice(0, 5);
      return reservationDate === dateStr && normalizedStartTime === time;
      });
    
    if (reservation) {
      return {
        type: 'reserved',
        color: reservation.color,
        bandName: reservation.band_name,
        isMyBand: reservation.band_id === selectedBand?.id
      };
    }
    
    // 선택된 슬롯 확인
    if (selectedSlots.includes(slotKey)) {
      return {
        type: 'selected',
        color: selectedBand?.color,
        bandName: selectedBand?.name,
        isMyBand: true
      };
    }
    
    return { type: 'empty' };
  };

  const goToPreviousWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  };

  const goToThisWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }));
  };

  // 몇 월 몇 주차 계산
  const getWeekInfo = () => {
    const month = format(currentWeekStart, 'M월', { locale: ko });
    const weekOfMonth = Math.ceil(parseInt(format(currentWeekStart, 'd')) / 7);
    return `${month} ${weekOfMonth}주차`;
  };

  return (
    <div style={{ padding: '20px', minHeight: '100vh' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#95A5A6',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          ← 돌아가기
        </button>
        
        <div style={{
          padding: '10px 20px',
          backgroundColor: selectedBand?.color,
          color: '#fff',
          borderRadius: '8px',
          fontWeight: 'bold',
        }}>
          선택한 곡: {selectedBand?.name}
        </div>
      </div>

      {/* 주차 선택 */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '15px',
        marginBottom: '20px',
      }}>
        <button
          onClick={goToPreviousWeek}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3498DB',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          ← 이전 주
        </button>
        
        <button
          onClick={goToThisWeek}
          style={{
            padding: '10px 20px',
            backgroundColor: '#2ECC71',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
          }}
        >
          {getWeekInfo()}
        </button>
        
        <button
          onClick={goToNextWeek}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3498DB',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          다음 주 →
        </button>
      </div>

      {/* 캘린더 */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          minWidth: '900px',
          backgroundColor: '#fff',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}>
          <thead>
            <tr>
              <th style={{
                padding: '15px',
                backgroundColor: '#34495E',
                color: '#fff',
                border: '1px solid #ddd',
                position: 'sticky',
                left: 0,
                zIndex: 10,
              }}>
                시간
              </th>
              {weekDays.map((day, index) => (
                <th key={index} style={{
                  padding: '15px',
                  backgroundColor: index === 0 ? '#E74C3C' : index === 6 ? '#3498DB' : '#34495E',
                  color: '#fff',
                  border: '1px solid #ddd',
                  minWidth: '100px',
                }}>
                  <div>{format(day, 'EEE', { locale: ko })}</div>
                  <div style={{ fontSize: '14px', marginTop: '5px' }}>
                    {format(day, 'M/d')}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((time) => (
              <tr key={time}>
                <td style={{
                  padding: '10px',
                  border: '1px solid #ddd',
                  backgroundColor: '#f8f9fa',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  position: 'sticky',
                  left: 0,
                  zIndex: 5,
                }}>
                  {time}
                </td>
                {weekDays.map((day, dayIndex) => {
                  const status = getSlotStatus(day, time);
                  return (
                    <td
                      key={dayIndex}
                      onClick={() => handleSlotClick(day, time)}
                      style={{
                        padding: '5px',
                        border: '1px solid #ddd',
                        height: '40px',
                        cursor: 'pointer',
                        backgroundColor: status.type === 'empty' ? '#fff' : status.color,
                        position: 'relative',
                        textAlign: 'center',
                        opacity: status.type === 'selected' ? 0.7 : 1,
                      }}
                      title={status.bandName || '클릭하여 예약'}
                    >
                      {status.type !== 'empty' && (
                        <div style={{
                          color: '#fff',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {status.type === 'selected' ? '선택중' : status.bandName}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 예약하기 버튼 */}
      {selectedSlots.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
        }}>
          <button
            onClick={handleReservation}
            style={{
              padding: '15px 40px',
              backgroundColor: '#2ECC71',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: 'bold',
              boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
            }}
          >
            선택한 {selectedSlots.length}개 시간 예약하기
          </button>
        </div>
      )}

      {/* 범례 */}
      <div style={{
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
      }}>
        <h3>사용 방법</h3>
        <ul style={{ lineHeight: '2' }}>
          <li>빈 칸을 클릭하여 예약할 시간을 선택하세요 (30분 단위)</li>
          <li>여러 시간을 선택한 후 "예약하기" 버튼을 누르세요</li>
          <li>색깔로 표시된 시간은 이미 예약된 시간입니다</li>
          <li><strong>"{selectedBand?.name}" 팀의 예약</strong>만 클릭하여 삭제할 수 있습니다</li>
          <li>다른 팀의 예약은 삭제할 수 없습니다</li>
        </ul>
      </div>
    </div>
  );
}

export default ReservationPage;