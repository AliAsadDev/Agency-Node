const fs = require("fs");
const path = require("path");

const customerRegister = path.join(__dirname, "./customerRegister.html");
const resetPassword = path.join(__dirname, "./resetPassword.html");
const bookingDetails = path.join(__dirname, "./booking-details.html");
const bookingCompleted = path.join(__dirname, "./booking-completed.html");

module.exports = {
  CUSTOMER: {
    REGISTRATION_CONFIRMATION: fs.readFileSync(customerRegister, "utf-8"),
    RESET_PASSWORD: fs.readFileSync(resetPassword, "utf-8"),
    BOOKING_DETAILS: fs.readFileSync(bookingDetails, "utf-8"),
    BOOKING_COMPLETED: fs.readFileSync(bookingCompleted, "utf-8"),
  },
  CUSTOMER2: {
    BOOKING_COMPLETED: fs.readFileSync(bookingCompleted, "utf-8"),
  },
};
