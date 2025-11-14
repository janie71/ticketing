const db = require('../config/db');

// 예약 조회 (날짜별, 주별)
exports.getReservations = async (req, res, next) => {
  try {
    const { date, startDate, endDate } = req.query;
    
    let query = `
      SELECT 
        r.id,
        r.band_id,
        TO_CHAR(r.date, 'YYYY-MM-DD') as date,
        r.start_time,
        r.end_time,
        r.created_at,
        b.name as band_name, 
        b.color 
      FROM reservations r
      JOIN bands b ON r.band_id = b.id
    `;
    let params = [];
    
    if (date) {
      query += ' WHERE r.date = $1';
      params = [date];
    } else if (startDate && endDate) {
      query += ' WHERE r.date BETWEEN $1 AND $2';
      params = [startDate, endDate];
    }
    
    query += ' ORDER BY r.date, r.start_time';
    
    const result = await db.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

// 예약 생성
exports.createReservation = async (req, res, next) => {
  try {
    const { band_id, date, start_time, end_time } = req.body;
    
    if (!band_id || !date || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        message: '모든 필드를 입력해주세요.',
      });
    }
    
    // 예약 가능 여부 확인
    const checkQuery = `
      SELECT * FROM reservations 
      WHERE date = $1 AND start_time = $2
    `;
    const checkResult = await db.query(checkQuery, [date, start_time]);
    
    if (checkResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: '이미 예약된 시간입니다.',
      });
    }
    
    // 차단된 시간인지 확인
    const blockedQuery = `
      SELECT * FROM blocked_times 
      WHERE date = $1 AND start_time = $2
    `;
    const blockedResult = await db.query(blockedQuery, [date, start_time]);
    
    if (blockedResult.rows.length > 0) {
      return res.status(403).json({
        success: false,
        message: '예약이 불가능한 시간입니다.',
      });
    }
    
    // 예약 생성
    const result = await db.query(
      `INSERT INTO reservations (band_id, date, start_time, end_time) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [band_id, date, start_time, end_time]
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: '예약이 완료되었습니다.',
    });
  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({
        success: false,
        message: '이미 예약된 시간입니다.',
      });
    }
    next(error);
  }
};

// 예약 삭제
exports.deleteReservation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { band_id } = req.body; // 본인 곡인지 확인용
    
    // 예약 정보 조회
    const checkResult = await db.query(
      'SELECT * FROM reservations WHERE id = $1',
      [id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '예약을 찾을 수 없습니다.',
      });
    }
    
    // 본인 곡인지 확인
    if (checkResult.rows[0].band_id !== parseInt(band_id)) {
      return res.status(403).json({
        success: false,
        message: '본인 곡의 예약만 삭제할 수 있습니다.',
      });
    }
    
    // 예약 삭제
    await db.query('DELETE FROM reservations WHERE id = $1', [id]);
    
    res.json({
      success: true,
      message: '예약이 삭제되었습니다.',
    });
  } catch (error) {
    next(error);
  }
};