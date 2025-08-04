const express = require("express");

const {
  addBooking,
  getAllAgencyBooking,
  updateStatus,
  getById,
  DeleteBooking,
  deleteMultipleBooking,
  checkout,
  updatePaidStatus,
  getBookingByAgencyId,
} = require("../controllers/booking");

const router = express.Router();

const { protect, authorize } = require("../middleware/auth");

router.post("/addnew/:tripid", addBooking);
router.get("/getAll", protect, getAllAgencyBooking);
router.get("/getById/:id", protect, getById);
router.get("/getBookingByAgencyId/:id", protect, getBookingByAgencyId);
router.put("/updateStatus/:bookingId", protect, updateStatus);
router.put("/updatePaidStatus/:bookingId", protect, updatePaidStatus);
router.delete("/deletebooking/:id", protect, DeleteBooking);
router.delete("/deleteMultiple", deleteMultipleBooking);
router.post("/checkout", checkout);
// router.get('/email/verification/:token', verifyEmail);

module.exports = router;
