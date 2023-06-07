const bcrypt = require('bcrypt');

const hashPassword = async (password, salt) => {
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
};

const generateSalt = async () => {
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    return salt;
};

module.exports = { hashPassword, generateSalt };