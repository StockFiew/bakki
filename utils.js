const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");

const generateHash = (password) => {
  return new Promise((resolve, reject) => {
    // Generate a salt and hash the password using bcrypt
    bcrypt.genSalt(10, (err, salt) => {
      if (err) {
        reject(err);
      } else {
        bcrypt.hash(password, salt, (err, hash) => {
          if (err) {
            reject(err);
          } else {
            // Resolve the Promise with an object containing the salt and hashed password
            resolve({ salt, hash });
          }
        });
      }
    });
  });};

const dispatchNewToken = (req, res, payload) => {
  req.db.from("configs").select("*")
    .where("name", "=", "jwtKey").first()
    .then(row => {
      const expires_in = 60 * 60 * 24 // 1 Day
      const exp = Date.now() + expires_in * 1000
      const token = jwt.sign({ ...payload, exp }, row.value)
      return res.json({error: false, message: "Success", token_type: "Bearer",
        token: `Bearer ${token}`, expires_in,
        payload: payload})
    })
}

module.exports = {generateHash, dispatchNewToken};