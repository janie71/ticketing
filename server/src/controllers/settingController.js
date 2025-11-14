const db = require('../config/db');

// 예매 오픈 여부 확인
exports.isReservationOpen = async (req, res, next) => {
  try {
    const result = await db.query(
      "SELECT value FROM settings WHERE key = 'reservation_open_time'"
    );

    const openAt = result.rows[0]?.value || null;

    if (!openAt) {
      return res.json({
        success: true,
        isOpen:true,
        openAt:null,
      });
    }

    const now = new Date();
    const openTime = new Date(openAt);

    const isOpen = now >= openTime;

    res.json({
      success: true,
      isOpen,
      openAt,
    });

  } catch (error) {
    next(error);
  }
};


// 공개된 날짜 목록 조회
exports.getVisibleDates = async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT * FROM visible_dates ORDER BY date'
    );
    
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

exports.getOpenTime = async (req, res, next) => {
  try {
    const result = await db.query(
      "SELECT value FROM settings WHERE key = 'reservation_open_time'"
    );

    const openAt = result.rows[0]?.value || null;

    res.json({
      success: true,
      openAt,
    });
  } catch (error) {
    next(error);
  }
};
