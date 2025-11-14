const auth = (req, res, next) => {
  const adminPassword = req.headers['x-admin-password'];
  
  if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({
      success: false,
      message: '관리자 권한이 필요합니다.',
    });
  }
  
  next();
};

module.exports = auth;
