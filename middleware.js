const jwt = require('jsonwebtoken');

// Middleware to authenticate the user based on the JWT in the Authorization header
const authenticateUser = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ Error: 'True', Message: 'Authorization header missing' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await req.db.from('users').select('*').where({ id: decoded.userId }).first();
        if (!user) {
            return res.status(401).json({ Error: 'True', Message: 'Invalid token' });
        }
        req.user = user;
        next();
    } catch (error) {
        console.error(error);
        return res.status(401).json({ Error: 'True', Message: 'Invalid token' });
    }
};

module.exports = { authenticateUser };