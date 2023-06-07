var express = require('express');
var router = express.Router();

/* GET stock listing. */
router.get('/', function(req, res, next) {
    req.db.from("users").select().then(rows => {
        res.json({ Error: false, Message: "Success", Users: rows});
    }).catch(err => {
        console.error(err);
        res.json({ Error: true, Message: "Error in MySQL query" });
    });
});


module.exports = router;
