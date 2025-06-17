const admin = require('../config/firebase');

const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(403).send('No token provided');

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).send('Unauthorized');
  }
};

module.exports = verifyToken;
