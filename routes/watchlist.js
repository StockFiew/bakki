const { hashPassword, generateSalt} = require('../utils');
const { authenticateUser } = require('../middleware');
const express = require('express');
const router = express.Router();

router.get('/', authenticateUser, async(req, res) => {
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

router.post('/remove', authenticateUser, async(req, res) => {
  const user = req.user;
  const { symbol } = req.body
  try {
    const user = req.user;
    req.db.from("watchlist").select("symbol").where('userId', '=', user.id)
      .then(rows => {
        if (rows.symbol == symbol) {
          req.db.from("watchlist").delete({
            userId: user.id,
            symbol: symbol
          });
          return res.status(200).json({Error: false, Message: "Success", watchlist: rows})
        }
      })
      .catch(err => {
        throw Error(err);
      });
  } catch(err) {
    console.error(err);
    res.status(500).json({error: 'True', Message: err.message})
  }
})

router.post('/add', authenticateUser, async(req, res) => {
  const user = req.user;
  const { symbol } = req.body
  try {
    const user = req.user;
    req.db.from("watchlist").select("symbol").where('userId', '=', user.id)
      .then(rows => {
        if (rows.symbol === symbol) {
            return res.sendStatus(204);
        }
      })
      .then(item => {
        req.db.from("watchlist").insert({
          userId: user.id,
          symbol: symbol
        })
        res.status(200).json({Error: false, Message: "Success", watchlist: rows})
      })
      .catch(err => {
        throw Error(err);
      });
  } catch(err) {
    console.error(err);
    res.status(500).json({error: 'True', Message: err.message})
  }
})

module.exports = router;
