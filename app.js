var createError = require("http-errors");
var express = require("express");
var morgan = require('morgan');
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

// DB
const options = require("./knexfile");
const {authenticateUser} = require("./middleware");
const knex = require("knex")(options);

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
// Use morgan middleware to log HTTP requests in the "combined" format
app.use(morgan('combined'));
// Use a custom logging function to log messages in a specific fomrat
app.use(morgan((tokens, req, res) => {
  return `${req.method} ${req.url} ${res.statusCode} ${tokens['response-time'](req, res)} ms`;
}));

// Swagger
const swaggerUi = require("swagger-ui-express");
const swaggerFile = require('./swagger-output.json');
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));

app.use((req, res, next) => {
  req.db = knex;
  next();
});

app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/users', authenticateUser, require('./routes/users'));
app.use('/watchlist', authenticateUser, require('./routes/watchlist'));

app.get("/knex", function (req, res, next) {
  req.db
    .raw("SELECT VERSION()")
    .then((version) => console.log(version[0][0]))
    .catch((err) => {
      console.log(err);
      throw err;
    });

  res.send("Version logged successfully");
});


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
