const db = require('../config/db');

// 모든 곡 조회
exports.getAllBands = async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT * FROM bands ORDER BY created_at DESC'
    );
    
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

// 새 곡 생성
exports.createBand = async (req, res, next) => {
  try {
    const { name, color } = req.body;
    
    if (!name || !color) {
      return res.status(400).json({
        success: false,
        message: '곡 이름과 색상을 입력해주세요.',
      });
    }
    
    const result = await db.query(
      'INSERT INTO bands (name, color) VALUES ($1, $2) RETURNING *',
      [name, color]
    );
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: '곡이 생성되었습니다.',
    });
  } catch (error) {
    next(error);
  }
};

// 곡 정보 수정
exports.updateBand = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;
    
    const result = await db.query(
      'UPDATE bands SET name = $1, color = $2 WHERE id = $3 RETURNING *',
      [name, color, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '곡을 찾을 수 없습니다.',
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: '곡 정보가 수정되었습니다.',
    });
  } catch (error) {
    next(error);
  }
};