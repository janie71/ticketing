// ============================================
// src/pages/user/SchedulePage.jsx - 합주 일정 조회 페이지
// ============================================
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { format, startOfWeek, addDays, addWeeks, subWeeks } from 'date-fns';
import { ko } from 'date-fns/locale';

function SchedulePage() {
  const navigate = useNavigate();

  const [selectedBand, setSelectedBand] = useState(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [reservations, setReservations] = useState([]);

  // 시간 슬롯 생성 (09:00~25:00, 30분 단위)
  const timeSlots = [];
  for (let hour = 9; hour <= 25; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      if (hour === 25 && minute > 0) break;
      const displayHour = hour > 24 ? hour - 24 : hour;
      const h = String(displayHour).padStart(2, '0');
      const m = String(minute).padStart(2, '0');
      timeSlots.push(`${h}:${m}`);
    }
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  useEffect(() => {
    const band = JSON.parse(localStorage.getItem('selectedBand'));

    if (!band) {
      alert('곡을 먼저 선택해주세요.');
      navigate('/');
      return;
    }

    setSelectedBand(band);
  }, []);
  useEffect(() => {
    if (!selectedBand) return;  // selectedBand 준비된 후에만 실행

    fetchReservations();
  }, [selectedBand, currentWeekStart]);


  const fetchReservations = async () => {
    if (!selectedBand) return;
    try {
      const startDate = format(currentWeekStart, 'yyyy-MM-dd');
      const endDate = format(addDays(currentWeekStart, 6), 'yyyy-MM-dd');

      const response = await api.get('/reservations', {
        params: { startDate, endDate }
      });

      // 해당 밴드의 예약만 필터링
      const filtered = response.data.data.filter(r => 
        String(r.band_id) === String(selectedBand.id)
      );

      setReservations(filtered);
    } catch (err) {
      console.error(err);
    }
  };

  // 슬롯 상태 확인 (읽기 전용)
  const getSlotStatus = (date, time) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    const reservation = reservations.find(r => {
      const reservationDate = r.date.split('T')[0];
      const normalizedTime = r.start_time.slice(0, 5);
      return reservationDate === dateStr && normalizedTime === time;
    });

    if (reservation) {
      return { type: 'reserved', color: selectedBand.color, label: selectedBand.name };
    }
    return { type: 'empty' };
  };

  const goPrev = () => setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  const goNext = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  const goToday = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }));

  const getWeekInfo = () => {
    const month = format(currentWeekStart, 'M월', { locale: ko });
    const week = Math.ceil(format(currentWeekStart, 'd') / 7);
    return `${month} ${week}주차`;
  };

  return (
    <div style={{ display: 'flex', gap: '20px', padding: '20px' }}>
      
      {/* 왼쪽: 시간표 */}
      <div style={{ flex: 3 }}>
        <button onClick={() => navigate('/')}>← 돌아가기</button>

        <div style={{ margin: '20px 0', fontSize: '20px', fontWeight: 'bold' }}>
          선택한 곡: <span style={{ color: selectedBand?.color }}>{selectedBand?.name}</span>
        </div>

        {/* 주 이동 버튼 */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
          <button onClick={goPrev}>← 이전 주</button>
          <button onClick={goToday}>{getWeekInfo()}</button>
          <button onClick={goNext}>다음 주 →</button>
        </div>

        {/* 시간표 */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
            <thead>
              <tr>
                <th style={{ padding: '10px', backgroundColor: '#333', color: '#fff' }}>시간</th>
                {weekDays.map((day, idx) => (
                  <th key={idx} style={{ padding: '10px', backgroundColor: '#444', color: '#fff' }}>
                    <div>{format(day, 'EEE', { locale: ko })}</div>
                    <div style={{ fontSize: '13px' }}>{format(day, 'M/d')}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map(time => (
                <tr key={time}>
                  <td style={{ padding: '8px', backgroundColor: '#f1f1f1', textAlign: 'center' }}>{time}</td>

                  {weekDays.map((day, idx) => {
                    const status = getSlotStatus(day, time);
                    return (
                      <td
                        key={idx}
                        style={{
                          height: '35px',
                          border: '1px solid #ddd',
                          backgroundColor: status.type === 'reserved' ? selectedBand.color : '#fff',
                          textAlign: 'center',
                          color: status.type === 'reserved' ? '#fff' : '#000',
                          fontSize: '12px'
                        }}
                      >
                        {status.type === 'reserved' ? status.label : ''}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 오른쪽: 예약 리스트 */}
      <div style={{
        flex: 1,
        padding: '20px',
        backgroundColor: '#fafafa',
        borderRadius: '8px',
        boxShadow: '0 0 8px rgba(0,0,0,0.1)',
        height: 'fit-content'
      }}>
        <h2 style={{ marginBottom: '20px' }}>예약 목록</h2>

        {reservations.length === 0 && (
          <p style={{ color: '#555' }}>이번 주는 예약이 없습니다.</p>
        )}

        {reservations.map(r => {
          const date = r.date.split('T')[0];
          const start = r.start_time.slice(0,5);
          const end = r.end_time.slice(0,5);
          return (
            <div 
              key={r.id}
              style={{
                padding: '12px',
                borderRadius: '6px',
                backgroundColor: selectedBand.color,
                color: '#fff',
                marginBottom: '10px',
                fontWeight: 'bold'
              }}
            >
              {date} — {start} ~ {end}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SchedulePage;
