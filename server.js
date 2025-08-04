const path = require("path");

const express = require("express");
const morgan = require("morgan");
const colors = require("colors");
const fileupload = require("express-fileupload");
const cookieParser = require("cookie-parser");

// For API Security
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const xss = require("xss-clean");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const cors = require("cors");

const errorHandler = require("./middleware/error");

// Load environment vars
const dotenv = require("dotenv");
dotenv.config({ path: "./config/config.env" });

// Connect to database
const connectDB = require("./config/db");
connectDB();

// Route files
const auth = require("./routes/auth");
const users = require("./routes/users");
const trip = require("./routes/trip.routes");
const booking = require("./routes/booking.routes");
const agency = require("./routes/agency.routes");

const app = express();

/* Express Body Parser */
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(
  express.json({
    limit: "50mb",
    verify: function (req, res, buf) {
      var url = req.originalUrl;
      if (url.startsWith("/api/v1/auth/stripe/webhook")) {
        req.rawBody = buf.toString();
      }
    },
  })
);

// Cookie parser
app.use(cookieParser());

// Dev logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// File uploading
// app.use(fileupload());

// Sanitize data
app.use(mongoSanitize());

// Set security headers
app.use(helmet());

// Prevent XSS attacks
app.use(xss());

// Rate limiting
// const limiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 100 });
// app.use(limiter);

// Prevent http param pollution
app.use(hpp());

// Enable CORS
app.use(cors({ origin: true, credentials: true }));

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

// Set static folder
require("./cronJob/expireTrip");

// Mount routers
app.use("/api/v1/auth", auth);
app.use("/api/v1/users", users);
app.use("/api/v1/trips", trip);
app.use("/api/v1/bookings", booking);
app.use("/api/v1/agency", agency);

app.use(errorHandler);

/* Express Server */
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () =>
  console.log(
    `Server is running in ${process.env.NODE_ENV} mode at PORT:${PORT}`.yellow
      .bold
  )
);

/* Handle unhandled promise rejections */
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  // Close server and Exit process
  server.close(() => process.exit(1));
});
