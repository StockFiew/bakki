const express = require("express");
const { generateHash, dispatchNewToken } = require("../utils");
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
      Error: true,
      Message: "Request body incomplete - email and password needed"
    })
    return
  }

  // 2. Determine if user is already exists in table
  const queryUsers = req.db.from("users").select("*").where("email", "=", email)
  queryUsers.then((users) => {
    if (users.length > 0) {
      return res.status(200).json({ Error: true, Message: "Email already exists" })
    }

    // 2.1. If user does not exist, insert into table
    generateHash(password)
      .then(({ salt, hash }) => {
        return req.db.from("users")
          .insert({ email, hash, salt })
          .returning(["id", "name", "email"]);
      })
      .then((users) => {
        const user = users[0];
        dispatchNewToken(req, res, { id: user.id, name: user.name, email: user.email });
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json({ Error: true, Message: "Internal server error" });
      });  });
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
      Error: true,
      Message: "Request body incomplete - email and password needed"
    })
    return
  }
  try {
    // 2. Determine if user already exists in table
    const queryUsers = req.db.from("users")
      .where("email", "=", email)
      .select("id", "name", "email", "hash")
      .first();
        
    queryUsers
      .then((user) => {
        // 2.2 If user does not exist, return error response
        if (!user) {
          console.log("User does not exist");
          return res.status(401).json({ Error: true, Message: "Invalid email or password" });
        }
        const bcrypt = require('bcrypt');
        bcrypt.compare(password, user.hash, (err, result) => {
          // 2.1 If user does exist, verify if passwords match
          if(err) {
            return res.status(500).json({ Error: true, Message: err.message });
          } else if (result) {
            return dispatchNewToken(req, res, { id: user.id, name: user.name, email: user.email });
          } else {
            return res.status(401).json({ Error: true, Message: "Invalid email or password" });
          }
        })
      })
  } catch(err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
})

router.get('/fmp_token', (req, res) => {
  req.db.from('configs').select('value').where('key', 'FMP_TOKEN').first()
    .then(config => {
      if (!config) {
        throw new Error('Config key not found!');
      }
      res.json({ token: config.value });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ Error: true, Message: 'Internal server error' });
    });
});


module.exports = router;
