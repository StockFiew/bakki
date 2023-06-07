const { hashPassword, generateSalt} = require('../utils');
const { authenticateUser } = require('../middleware');
const express = require('express');
const router = express.Router();

// Define your Express routes
/**
 * @swagger
 * /users:
 *   get:
 *     summary: Returns a list of users.
 *     description: Use this endpoint to retrieve a list of all users.
 *     responses:
 *       200:
 *         description: A list of users.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
router.get('/', function(req, res, next) {
  req.db.from("users").select().then(rows => {
    res.json({ Error: false, Message: "Success", Users: rows});
  }).catch(err => {
    console.error(err);
    res.json({ Error: true, Message: "Error in MySQL query" });
  });
});


router.get("/:id", async function (req, res, next) {
  try {
    req.db.from("users").select("*").where("id", "=", req.params.id)
        .then(row => {
          res.json({Error: False, Message: "Success", Users: row})
        })
        .catch(err => {
        throw Error("Internal Server Error")
    });
  } catch (err) {
    console.log(err);
    res.json({ Error: true, Message: "Error in MySQL query" });
  }
});


router.get('/me', authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    res.json({ Error: 'False', User: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ Error: 'True', Message: 'Internal server error' });
  }
});

router.get('/watchlist', authenticateUser, async(req, res) => {
  try {
    const user = req.user;
    req.db.from("watchlist").select("symbol").where('userId', '=', user.id)
        .then(rows => {
          res.json({Error: false, Message: "Success", watchlist: rows})
        })
        .catch(err => {
          throw Error("Internal Server Error");
        });
  } catch(err) {
    console.error(err);
    res.status(500).json({error: 'True', Message: err.message})
  }
})


// Route handler for updating a user's email and password
router.put('/update', authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    const {oldPassword, newPassword, name, email} = req.body;

    if (!oldPassword) {
      res.status(400).json({
        error: true,
        message: "Request body incomplete - oldPassword is needed "
      })
      return
    }
    const bcrypt = require('bcrypt');

    if (!newPassword) {
      const hashedPassword = bcrypt.hashSync(oldPassword, user.salt);
      if (!bcrypt.compare(hashedPassword, user.hash)) {
        console.log("Passwords do not match");
        res.status(401).json({message: "Invalid password"});
      }
      return;
    } else {
      const salt = generateSalt();
      user.hash = await hashPassword(newPassword, salt)
      user.salt = salt;
    }

    if (name) user.name = name;
    if (email) user.email = email;
    const updatedUser = await req.db.from('users').where({id: user.id}).update(user);
    if (!updatedUser) {
      return res.status(404).json({Error: 'True', Message: 'User not found'});
    }
    res.status(201).json({success: true, message: "Password updated"})
  } catch (err) {
    console.error(err);
    res.status(500).json({Error: 'True', Message: 'Internal Server Error'});
  }
});

module.exports = router;
