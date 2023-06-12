const { authenticateUser } = require('../middleware');
const express = require('express');
const { generateHash, dispatchNewToken} = require("../utils");
const router = express.Router();
const multer = require('multer');
const upload = multer();
router.use(authenticateUser);

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
    const mappedRows = rows.map(user => ({ id: user.id, name: user.name, email: user.email }))
    res.json({ Error: false, Message: "Success", Users: mappedRows });
  }).catch(err => {
    console.error(err);
    res.json({ Error: true, Message: "Error in MySQL query" });
  });
});

router.get('/me', async function (req, res, next) {
  const user = req.user;
  return req.db.from('profile_pic').where({ uid: user.id} ).first()
    .then(row => {
      return res.status(200).json({ Error: false,
        User: {
          id: user.id,
          email: user.email,
          name: user.name,
          profilePic: row ? row : null
        }
      })
    }).catch((err) => {
      console.log(err)
      res.status(500).json({ Error: true, Message: "Internal Server Error"})
    });
});


router.post('/profile/picture', upload.single('picture'), (req, res) => {
  console.log(req)
  const user = req.user;
  const { file } = req.file;
  const fileData = file.buffer.toString('base64');

  // check if the user already has a profile picture
  req.db.from('profile_pic')
    .where({ uid: user.id })
    .select()
    .then((rows) => {
      if (rows.length === 0) {
        // insert a new profile picture for the user
        return req.db.from('profile_pic').insert({ uid: user.id, type: file.originalname, name: file.mimetype, data: fileData });
      } else {
        // update the existing profile picture for the user
        return req.db.from('profile_pic').where({ uid: user.id })
          .update({ type: file.originalname, name: file.mimetype, data: fileData });
      }
    })
    .then(() => {
      res.status(200).json({
        Error: false,
        Message: 'Profile picture updated successfully',
        Picture: {
          name: file.originalname,
          type: file.mimetype,
          data: fileData,
        },
      });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ Error: true, Message: 'Internal server error' });
    });
});

module.exports = router;

// Route handler for updating a user's email and password
router.put('/update', authenticateUser, (req, res, next) => {
  const user = req.user;
  const { oldPassword, newPassword, name, email } = req.body;

  if (!oldPassword) {
    return res.status(400).json({
      Error: true,
      Message: "Request body incomplete - oldPassword is needed "
    });
  }

  if (newPassword) {
    generateHash(newPassword).then(({ salt, hash }) => {
      user.hash = hash;
      user.salt = salt;
    });
  }

  if (name) {
    user.name = name;
  }

  if (email) {
    user.email = email;
  }

  req.db.from('users').where({ id: user.id }).update(user).then(updatedUser => {
    if (!updatedUser) {
      return res.status(404).json({ Error: true, Message: 'User not found' });
    }

    const { id, name: updatedName } = updatedUser;

    return res.status(200).json({ Error: false, Message: 'Success', User: { id, name: updatedName } });
  }).catch(err => {
    console.error(err);
    res.status(500).json({ Error: true, Message: 'Internal Server Error' });
  });
});


module.exports = router;
