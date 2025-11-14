const db = require('../config/db');

// 예매 열기/닫기
exports.toggleReservation = async (req, res, next) => {
  try {
    const { isOpen } = req.body;
    
    await db.query(
      "UPDATE settings SET value = $1, updated_at = NOW() WHERE key = 'is_reservation_open'",
      [isOpen.toString()]
    );
    
    res.json({
      success: true,
      message: `예매가 ${isOpen ? '열렸' : '닫혔'}습니다.`,
    });
  } catch (error) {
    next(error);
  }
};

// 예매 오픈 시간 설정
exports.setOpenTime = async (req, res, next) => {
  try {
    const { open_at } = req.body;

    if (!open_at) {
      return res.status(400).json({
        success: false,
        message: 'open_at 값이 필요합니다.',
      });
    }

    // 1) reservation_open_time key 존재하는지 확인
    const result = await db.query(
      "SELECT * FROM settings WHERE key = 'reservation_open_time'"
    );

    if (result.rows.length === 0) {
      // 2) 없으면 Insert
      await db.query(
        "INSERT INTO settings (key, value, created_at, updated_at) VALUES ($1, $2, NOW(), NOW())",
        ['reservation_open_time', open_at]
      );
    } else {
      // 3) 있으면 Update
      await db.query(
        "UPDATE settings SET value = $1, updated_at = NOW() WHERE key = 'reservation_open_time'",
        [open_at]
      );
    }

    res.json({
      success: true,
      message: '예매 오픈 시간이 설정되었습니다.',
    });

  } catch (error) {
    next(error);
  }
};


// 차단 시간 조회
exports.getBlockedTimes = async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT * FROM blocked_times ORDER BY date, start_time'
    );
    
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

// 차단 시간 추가
exports.addBlockedTime = async (req, res, next) => {
  try {
    const { date, start_time, end_time, reason } = req.body;
    
    const result = await db.query(
      'INSERT INTO blocked_times (date, start_time, end_time, reason) VALUES ($1, $2, $3, $4) RETURNING *',
      [date, start_time, end_time, reason || null]
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: '차단 시간이 추가되었습니다.',
    });
  } catch (error) {
    next(error);
  }
};

// 차단 시간 삭제
exports.deleteBlockedTime = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await db.query('DELETE FROM blocked_times WHERE id = $1', [id]);
    
    res.json({
      success: true,
      message: '차단 시간이 삭제되었습니다.',
    });
  } catch (error) {
    next(error);
  }
};

// 공개 날짜 추가
exports.addVisibleDate = async (req, res, next) => {
  try {
    const { date, week_number } = req.body;
    
    const result = await db.query(
      'INSERT INTO visible_dates (date, week_number) VALUES ($1, $2) RETURNING *',
      [date, week_number]
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: '날짜가 공개되었습니다.',
    });
  } catch (error) {
    next(error);
  }
};

// 공개 날짜 삭제
exports.deleteVisibleDate = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await db.query('DELETE FROM visible_dates WHERE id = $1', [id]);
    
    res.json({
      success: true,
      message: '날짜 공개가 취소되었습니다.',
    });
  } catch (error) {
    next(error);
  }
};

// 팀 삭제
exports.deleteBand = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // CASCADE로 연결된 예약도 자동 삭제됨
    await db.query('DELETE FROM bands WHERE id = $1', [id]);
    
    res.json({
      success: true,
      message: '팀이 삭제되었습니다.',
    });
  } catch (error) {
    next(error);
  }
};

// 예약 삭제 (관리자는 모든 예약 삭제 가능)
exports.deleteReservation = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await db.query('DELETE FROM reservations WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '예약을 찾을 수 없습니다.',
      });
    }
    
    res.json({
      success: true,
      message: '예약이 삭제되었습니다.',
    });
  } catch (error) {
    next(error);
  }
};

// 예매 오픈 시간 삭제
exports.clearOpenTime = async (req, res, next) => {
  try {
    await db.query(
      "UPDATE settings SET value = '', updated_at = NOW() WHERE key = 'reservation_open_time'"
    );

    res.json({
      success: true,
      message: '오픈 시간이 초기화되었습니다.',
    });
  } catch (error) {
    next(error);
  }
};

