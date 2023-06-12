const { authenticateUser } = require('../middleware');
const express = require('express');
const router = express.Router();

router.get('/', authenticateUser, (req, res) => {
  const user = req.user;
  req.db.from("watchlists").select("*").where('uid', '=', user.id)
    .then((rows) => {
      const watchlist = rows || [];
      res.json({Error: false, Message: "Success", watchlist});
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({Error: true, Message: err.message});
    });
});


router.delete('/delete', authenticateUser, async(req, res) => {
  const { symbol } = req.body
  try {
    const user = req.user;
    req.db.transaction(async (trx) => {
      const watchlist = await trx.from("watchlists").select("*").where('uid', '=', user.id);
      const symbolExists = watchlist.some(row => row.symbol === symbol);
      if (!symbolExists) {
        return { watchlist };
      }
      await trx.from("watchlists").where({uid: user.id, symbol: symbol}).del();
      const updatedWatchlist = await trx.from("watchlists").select("*").where('uid', '=', user.id);
      return { watchlist: updatedWatchlist, deletedSymbol: symbol };
    })
      .then(result => {
        const { watchlist, deletedSymbol } = result;
        if (!deletedSymbol) {
          return res.status(200).json({Error: false, Message: "Item doest not exist", WatchList: watchlist});
        }
        return res.status(200).json({Error: false, Message: "Success", WatchList: watchlist});
      })
      .catch(err => {
        throw Error(err);
      });
  } catch(err) {
    console.error(err);
    res.status(500).json({Error: 'True', Message: err.message})
  }
})

router.post('/add', authenticateUser, async(req, res) => {
  const { symbol, name, stockExchange } = req.body
  if (!symbol || !name || !stockExchange) return res.status(400).json({Error: true, Message: 'Symbol, Name and StockExchange is required.'});
  try {
    const user = req.user;
    req.db.transaction(async (trx) => {
      const watchlist = await trx.from("watchlists").select("*").where('uid', '=', user.id);
      const symbolExists = watchlist.some(row => row.symbol === symbol);
      if (symbolExists) {
        return { watchlist };
      }
      await trx.from("watchlists").insert({
        uid: user.id,
        symbol: symbol,
        name: name,
        stockExchange: stockExchange
      });
      const updatedWatchlist = await trx.from("watchlists").select("*").where('uid', '=', user.id);
      return { watchlist: updatedWatchlist, addedSymbol: symbol };
    }).then(result => {
      const { watchlist, addedSymbol } = result;
      if (!addedSymbol) {
        return res.status(200).json({Error: false, Message: "Item already exists", WatchList: watchlist});
      }
      return res.status(200).json({Error: false, Message: "Success", WatchList: watchlist});
    })
      .catch(err => {
        throw Error(err);
      });
  } catch(err) {
    console.error(err);
    res.status(500).json({Error: true, Message: err.message})
  }
})

module.exports = router;
