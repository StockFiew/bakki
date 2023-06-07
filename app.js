var createError = require("http-errors");
var express = require("express");
var morgan = require('morgan');
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

const options = require("./knexfile");
const knex = require("knex")(options);

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const authRouter = require("./routes/auth");
const stockRouter = require("./routes/stock");

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

app.use((req, res, next) => {
  req.db = knex;
  next();
});

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/stock", stockRouter);

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
