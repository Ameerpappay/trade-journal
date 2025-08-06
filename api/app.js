var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
const models = require("./models");

const tradesRouter = require("./routes/trades");
const strategiesRouter = require("./routes/strategies");
const imagesRouter = require("./routes/images");
const tagsRouter = require("./routes/tags");
const uploadRouter = require("./routes/upload");
const { router: holdingsRouter } = require("./routes/holdings");

var app = express();

// Enable CORS for all routes
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Database connection test (migrations handle schema)
models.sequelize
  .authenticate()
  .then(() => {
    console.log("Database connection established successfully.");
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });

app.use("/", indexRouter);
app.use("/users", usersRouter);

app.use("/api/trades", tradesRouter);
app.use("/api/strategies", strategiesRouter);
app.use("/api/images", imagesRouter);
app.use("/api/tags", tagsRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/holdings", holdingsRouter);

module.exports = app;
