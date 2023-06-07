var express = require('express');
var router = express.Router();

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
    let row = req.db.from("users").select("*");
    row = row.where("Id", "=", req.params.id);
    res.json({ Error: false, Message: "Success", Users: await row });
  } catch (err) {
    console.log(err);
    res.json({ Error: true, Message: "Error in MySQL query" });
  }
});

module.exports = router;
