const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

// Middleware to authenticate the user based on the JWT in the Authorization header
const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ Error: 'True', Message: 'Authorization header missing' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.db.from('users').select('*')
      .where("email", "=", decoded.email).first()
      .then(user => {
        if (!user) {
          return res.status(401).json({ Error: 'True', Message: 'Invalid token' });
        }
        req.user = user;
        next();
      });
  } catch (error) {
    console.error(error);
    return res.status(401).json({ Error: 'True', Message: 'Invalid token' });
  }
};

module.exports = { authenticateUser };