const { authenticateUser } = require('../middleware');
const express = require('express');
const { generateHash, dispatchNewToken} = require("../utils");
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
router.use(authenticateUser);
router.get('/', function(req, res, next) {
  req.db.from("users").select().then(rows => {
    const mappedRows = rows.map(user => ({ id: user.id, name: user.name, email: user.email }))
    res.json({ Error: false, Message: "Success", Users: mappedRows });
  }).catch(err => {
    console.error(err);
    res.json({ Error: true, Message: "Error in MySQL query" });
  });
});

router.get('/me', async function (req, res, next) {
  console.log(`testing, ${req.user}`)
  try {
    const user = req.user;
    res.status(200).json({ Error: 'False', User: {
      id: user.id,
      email: user.email,
      name: user.name,
    }});
  } catch (error) {
    console.error(error);
    res.status(500).json({ Error: 'True', Message: 'Internal server error' });
  }
});


// Route handler for updating a user's email and password
router.put('/update', authenticateUser, async (req, res, next) => {
  const renewToken = require('../utils').dispatchNewToken;
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
    
    if (name) user.name = name;

    if (!newPassword) {
      const hashedPassword = bcrypt.hashSync(oldPassword, user.salt);
      if (!bcrypt.compare(hashedPassword, user.hash)) {
        console.log("Passwords do not match");
        return res.status(401).json({message: "Invalid password"});
      }
    } else if (newPassword) {
      generateHash(newPassword)
        .then(({salt, hash}) => {
          user.hash = hash;
          user.salt = salt;
          req.db.from('users').where({id: user.id}).update(user)
            .then(count => {
              if (!count) return res.status(404).json({Error: 'True', Message: 'User not found'});
            });
          return dispatchNewToken(req, res, user.email);
        });
    } else {
      req.db.from('users').where({id: user.id}).update(user)
        .then(count => {
          if (!count) return res.status(404).json({Error: 'True', Message: 'User not found'});
        });
      return res.status(200).json({Error: 'False', Message: 'Success', User: user});
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({Error: 'True', Message: 'Internal Server Error'});
  }
});

router.get("/:id", async function (req, res, next) {
  try {
    req.db.from("users").select("*").where("id", "=", req.params.id).first()
      .then(row => {
        res.status(200).json({Error: 'False', Message: "Success", Users:
            {
              id: row.id,
              name: row.name,
              email: row.email,
              created_at: row.created_at,
              updated_at: row.updated_at
            }
        })
      }).catch(() => {
        throw Error("Internal Server Error")
      });
  } catch (err) {
    console.log(err);
    res.status(500).json({ Error: true, Message: "Error in MySQL query" });
  }
});


module.exports = router;
