var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");
var session = require("express-session");
require("dotenv").config();

// Initialize passport configuration
require("./config/passport");
var passport = require("passport");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
const authRouter = require("./routes/auth");
const models = require("./models");

const tradesRouter = require("./routes/trades");
const strategiesRouter = require("./routes/strategies");
const imagesRouter = require("./routes/images");
const tagsRouter = require("./routes/tags");
const uploadRouter = require("./routes/upload");
const symbolsRouter = require("./routes/symbols");
const portfoliosRouter = require("./routes/portfolios");
const { router: holdingsRouter } = require("./routes/holdings");
const stocksRouter = require("./routes/stocks");
const screenersRouter = require("./routes/screeners");
const jobsRouter = require("./routes/jobs");
const scheduledJobsRouter = require("./routes/scheduled-jobs");
const databaseRouter = require("./routes/database");

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

// Session configuration for Google OAuth
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

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
app.use("/auth", authRouter);

app.use("/api/trades", tradesRouter);
app.use("/api/strategies", strategiesRouter);
app.use("/api/images", imagesRouter);
app.use("/api/tags", tagsRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/symbols", symbolsRouter);
app.use("/api/portfolios", portfoliosRouter);
app.use("/api/holdings", holdingsRouter);
app.use("/api/stocks", stocksRouter);
app.use("/api/screeners", screenersRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/scheduled-jobs", scheduledJobsRouter);
app.use("/api/database", databaseRouter);

module.exports = app;
