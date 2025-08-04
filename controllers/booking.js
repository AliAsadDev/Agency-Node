const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");

const User = require("../models/User");
const Trip = require("../models/Trip");
const Booking = require("../models/Booking");
const mongoose = require("mongoose");
const stripe = require("stripe")(process.env.STRIPE_URI);
// const emailTemplates = require('../email-templates');

// EMail configration utils
const sendEmail = require("../utils/sendEmail");

/*
 * @Desc       -> Register New Restaurant
 * @Route      -> POST /api/v1/restaurants/
 * @Access     -> Public
 */
exports.addBooking = asyncHandler(async (req, res, next) => {
  try {
    let trip = await Trip.aggregate([
      {
        $match: {
          _id: mongoose.Types.ObjectId(req.params.tripid),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "agency",
          foreignField: "_id",
          as: "agency",
        },
      },
      {
        $unwind: {
          path: "$agency",
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "agency.subscription",
          foreignField: "_id",
          as: "agency.subscription",
        },
      },
      {
        $unwind: {
          path: "$agency.subscription",
        },
      },
    ]);

    if (!trip[0])
      return next(new ErrorResponse(`Invalid TripID, Trip not found`, 404));

    const booking = await Booking.findOne({ email: req.body.email });
    if (booking)
      return next(
        new ErrorResponse(`Booking already exist with this email`, 500)
      );

    req.body.trip = trip[0]._id;
    req.body.agency = trip[0].agency;

    let newBooking = await Booking.create(req.body);
    res.status(200).json({
      success: true,
      data: newBooking,
      agency: trip[0].agency,
    });
  } catch (error) {
    console.log("error----->", error.message);
    res.status(500).json(error);
  }
});

exports.getAllAgencyBooking = asyncHandler(async (req, res, next) => {
  let bookings = await Booking.find().populate("trip");
  res.status(200).json({ success: true, data: bookings });
});

// get booking by id
exports.getById = asyncHandler(async (req, res, next) => {
  let bookings = await Booking.findById(req.params.id).populate("trip");
  res.status(200).json({ success: true, data: bookings });
});
exports.getBookingByAgencyId = asyncHandler(async (req, res, next) => {
  let bookings = await Booking.find({ agency: req.params.id }).populate("trip");
  res.status(200).json({ success: true, data: bookings });
});

exports.updateStatus = asyncHandler(async (req, res, next) => {
  let bookings = await Booking.findById(req.params.bookingId);
  if (!bookings)
    return next(new ErrorResponse(`Booking not found with this ID`, 404));

  // if (bookings.agency.toString() !== req.user.id.toString())
  //   return next(
  //     new ErrorResponse(`You are not authorize to update booking`, 400)
  //   );

  bookings.status = req.body.status;
  bookings.reason = req.body.reason;
  bookings = await bookings.save();

  res.status(200).json({ success: true, data: bookings });
});

// delete signle booking by its id
exports.DeleteBooking = async (req, res, next) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: "Booking deleted successfully!" });
  } catch (err) {
    res.status(500).json(err);
  }
};

// delete multiple trips
exports.deleteMultipleBooking = async (req, res) => {
  try {
    await Booking.deleteMany({ _id: { $in: req.body.ids } });
    res.json({ message: "Deleted successfully!" });
  } catch (error) {
    console.log("error----->", error.message);
    res.status(500).json(error);
  }
};

// update paid status
exports.updatePaidStatus = asyncHandler(async (req, res, next) => {
  let bookings = await Booking.findById(req.params.bookingId);
  if (!bookings)
    return next(new ErrorResponse(`Booking not found with this ID`, 404));

  bookings.paid = req.body.status === "true" ? true : false;
  bookings = await bookings.save();

  res.status(200).json({ success: true, data: bookings });
});

// chcekout on agency signup

exports.checkout = async (req, res) => {
  try {
    let lineItems = req.body.line_items;
    let metaData = req.body.metaData;
    let stripeId = req.body.stripeId;
    let amount = req.body.amount;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: process.env.STRIPE_RETURN_URL_CUSTOMER,
      cancel_url: process.env.STRIPE_REJECT_URL_CUSTOMER,
      metadata: metaData,
      payment_intent_data: {
        ////transfer to conected account
        transfer_data: {
          destination: stripeId,
          amount: amount,
        },
      },
    });

    res.status(200).json({
      url: session.url,
    });
  } catch (error) {
    console.log("error----->", error.message);
    res.status(500).json(error);
  }
};
