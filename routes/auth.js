const express = require("express");
const jwt = require("jsonwebtoken");
const {generateSalt} = require("../utils");
let router = express.Router();

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user.
 *     description: Use this endpoint to register a new user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: The user's username.
 *               password:
 *                 type: string
 *                 description: The user's password.
 *     responses:
 *       200:
 *         description: The registered user.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
router.post("/register", function(req, res, next) {
  // 1. Retrieve email and password from req.body
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      error: true,
      message: "Request body incomplete - email and password needed"
    })
    return
  }

  // 2. Determine if user is already exists in table
  const queryUsers = req.db.from("users").select("*").where("email", "=", email)
  queryUsers.then((users) => {
    if (users.length > 0) {
      console.log("User already exists");
      return;
    }

    // 2.1. If user does not exist, insert into table
    const bcrypt = require('bcrypt');
    const saltRounds = 10;
    generateSalt()
    const salt = bcrypt.genSaltSync(saltRounds);
    const hash = bcrypt.hashSync(password, salt)
    try {
      return req.db.from("users").insert({email, hash, salt})
    } catch(err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }).then(() => {
    res.status(201).json({ success: true, message: "User created" })
  });
})
/**
 * @swagger
 * /login:
 *   post:
 *     summary: Log in an existing user.
 *     description: Use this endpoint to log in an existing user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: The user's username.
 *               password:
 *                 type: string
 *                 description: The user's password.
 *     responses:
 *       200:
 *         description: The logged-in user.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
router.post("/login", function(req, res, next) {
  // 1. Retrieve email and password from req. body
  const {email, password} = req.body;

  // Verify body
  if (!email || !password) {
    res.status(400).json({
      error: true,
      message: "Request body incomplete - email and password needed"
    })
    return
  }
  try {
    // 2. Determine if user already exists in table
    const queryUsers = req.db.from("users").select("*").where("email", "=", email)
    queryUsers
      .then((users) => {
        // 2.2 If user does not exist, return error response
        if (users.length === 0) {
          console.log("Users does not exist");
          res.status(401).json({ message: "Invalid email or password" });
        }
        const user = users[0];
        const bcrypt = require('bcrypt');
        const hashedPassword = bcrypt.hashSync(password, user.salt);
        return bcrypt.compare(hashedPassword, user.password)
        // 2.1 If user does exist, verify if passwords match
      }).then((match) => {
      // 2.1.1 If passwords match, return JWT token
        if (!match) {
        // 2.1.2 If passwords do not match, return error response
          console.log("Passwords do not match");
          res.status(401).json({ message: "Invalid email or password" });
        }
        const secretKey = req.db.from("env".select("*").where("key", "=", "jwtKey"))
        const expires_in = 60 * 60 * 24 // 1 Day
        const exp = Date.now() + expires_in * 1000
        const token = jwt.sign({ email, exp }, secretKey)
        res.json({token_type: "Bearer", token, expires_in})
      })
  } catch(err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
})



module.exports = router;
