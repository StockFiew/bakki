const { authenticateUser } = require('../middleware');
const express = require('express');
const router = express.Router();

router.get('/', authenticateUser, async(req, res) => {
  try {
    const user = req.user;
    req.db.from("watchlist").select("symbol").where('uid', '=', user.id)
      .then(rows => {
        res.json({Error: false, Message: "Success", watchlist: rows})
      })
      .catch(() => {
        throw Error("Internal Server Error");
      });
  } catch(err) {
    console.error(err);
    res.status(500).json({error: 'True', Message: err.message})
  }
})

router.post('/remove', authenticateUser, async(req, res) => {
  const { symbol } = req.body
  try {
    const user = req.user;
    req.db.from("watchlist").select("symbol").where('uid', '=', user.id)
      .then(rows => {
        if (rows.symbol === symbol) {
          req.db.from("watchlist").delete({
            uid: user.id,
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
  const { symbol } = req.body
  try {
    const user = req.user;
    req.db.from("watchlist").select("symbol").where('uid', '=', user.id)
      .then(rows => {
        if (rows.symbol === symbol) {
          return res.sendStatus(204);
        }
      })
      .then((rows) => {
        req.db.from("watchlist").insert({
          uid: user.id,
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
