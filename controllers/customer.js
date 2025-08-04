const FS = require("fs");
const path = require("path");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");

const User = require("../models/User");
const Customer = require("../models/Customer");
const Trip = require("../models/Trip");
const Booking = require("../models/Booking");
const Stripe = require("stripe");
const moment = require("moment");
// const emailTemplates = require('../email-templates');

// EMail configration utils
const sendEmail = require("../utils/sendEmail");

exports.addNewCustomer = asyncHandler(async (req, res, next) => {
  let customer = await Customer.findOne({ email: req.body.email });
  if (customer)
    return next(
      new ErrorResponse(`Customer already registered with this Email`, 400)
    );

  req.body.agency = req.user.id;

  customer = await Customer.create(req.body);
  res.status(200).json({ success: true, customer });
});

exports.updateCustomer = asyncHandler(async (req, res, next) => {
  let customer = await Customer.findById(req.params.id);
  if (!customer)
    return next(
      new ErrorResponse(`Customer not found with this id ${req.params.id}`, 404)
    );

  if (customer.agency.toString() !== req.user.id)
    return next(
      new ErrorResponse(`You are not authorize to update this customer`, 401)
    );

  req.body.agency = req.user.id;

  customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
    runValidators: true,
    new: true,
  });

  res.status(200).json({ success: true, customer });
});

exports.getCustomers = asyncHandler(async (req, res, next) => {
  let customer = await Customer.find({ agency: req.user.id });
  res.status(200).json({ success: true, count: customer.length, customer });
});

exports.getCustomerById = asyncHandler(async (req, res, next) => {
  let customer = await Customer.findById(req.params.id);

  if (customer.agency.toString() !== req.user.id)
    return next(new ErrorResponse(`You are not authorize this customer`, 401));

  if (!customer)
    return next(new ErrorResponse(`Customer not found with this id`, 404));
  res.status(200).json({ success: true, customer });
});

exports.getCustomerByAgencyId = asyncHandler(async (req, res, next) => {
  let customer = await Customer.find({ agency: req.params.id });
  res.status(200).json({ success: true, data: customer });
});

exports.getAgencyTrip = asyncHandler(async (req, res, next) => {
  let trip = await Trip.find({ agency: req.user.id });
  res.status(200).json({ success: true, data: trip });
});

exports.deleteGalleryImage = asyncHandler(async (req, res, next) => {
  let trip = await Trip.findById(req.params.tripid);
  if (!trip) return next(new ErrorResponse(`Trip not found`, 404));
  const index = trip.gallery.indexOf(req.params.imageId);
  if (index !== -1) {
    trip.gallery.splice(index, 1);
    const oldPath = path.join("./public/", "uploads", req.params.imageId);
    var exist = FS.existsSync(oldPath);
    if (exist) {
      FS.unlink(oldPath, async (err) => {
        if (err) return console.error(err);
      });
    } else {
      return next(new ErrorResponse(`Image file not exist in directory`, 404));
    }
  }
  if (trip.bannerImage === req.params.imageId) {
    trip.bannerImage = undefined;
    const oldPath = path.join("./public/", "uploads", req.params.imageId);
    var exist = FS.existsSync(oldPath);

    if (exist) {
      FS.unlink(oldPath, async (err) => {
        if (err) return console.error(err);
      });
    } else {
      return next(new ErrorResponse(`Image file not exist in directory`, 404));
    }
  }
  await trip.save();
  res.status(200).json({ success: true, data: trip });
});

////delete single customer
exports.deleteCustomer = async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);
    res.status(200).json({ msg: "Customer deleted successfully!" });
  } catch (error) {
    console.log("error-----> ", error);
    res.status(500).json(error);
  }
};

// delete many customer
exports.deleteMultiple = async (req, res) => {
  try {
    await Customer.deleteMany({ _id: { $in: req.body.ids } });
    res.json({ message: "Deleted successfully!" });
  } catch (error) {
    console.log("error----->", error.message);
    res.status(500).json(error);
  }
};

// toggle customer active status
exports.toggleActive = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    customer.active = !customer.active;
    await customer.save();
    res.json({ message: "Customer active status updated!" });
  } catch (error) {
    console.log("error----->", error.message);
    res.status(500).json(error);
  }
};

// Stats for dashboard
exports.statistics = async (req, res) => {
  try {
    // dashboard overview
    console.log("userrr:", req.user.id);
    const NoOfCustomers = await Customer.find({
      agency: req.user.id,
    }).countDocuments();
    const NoOfTrips = await Trip.find({ agency: req.user.id }).countDocuments();
    const booking = await Booking.find({ agency: req.user.id }).populate(
      "trip"
    );
    let totalIncome = 0;
    booking.map((item) => (totalIncome += item.totalCost));
    const NoOfBookings = booking.length;
    const overviewData = {
      NoOfCustomers,
      NoOfTrips,
      NoOfBookings,
      totalIncome,
    };
    console.log("overviewData: ", overviewData);
    // financial stats
    let financialData = {
      Jan: 0,
      Feb: 0,
      Mar: 0,
      Apr: 0,
      May: 0,
      Jun: 0,
      Jul: 0,
      Aug: 0,
      Sep: 0,
      Oct: 0,
      Nov: 0,
      Dec: 0,
    };
    booking.map((item) => {
      let bookingMonth = 1 + moment(item.bookingDate).month();
      if (bookingMonth === 1) {
        financialData.jan += item.totalCost / 1000;
      } else if (bookingMonth === 2) {
        financialData.Feb += item.totalCost / 1000;
      } else if (bookingMonth === 3) {
        financialData.Mar += item.totalCost / 1000;
      } else if (bookingMonth === 4) {
        financialData.Apr += item.totalCost / 1000;
      } else if (bookingMonth === 5) {
        financialData.May += item.totalCost / 1000;
      } else if (bookingMonth === 6) {
        financialData.Jun += item.totalCost / 1000;
      } else if (bookingMonth === 7) {
        financialData.Jul += item.totalCost / 1000;
      } else if (bookingMonth === 8) {
        financialData.Aug += item.totalCost / 1000;
      } else if (bookingMonth === 9) {
        financialData.Sep += item.totalCost / 1000;
      } else if (bookingMonth === 10) {
        financialData.Oct += item.totalCost / 1000;
      } else if (bookingMonth === 11) {
        financialData.Nov += item.totalCost / 1000;
      } else if (bookingMonth === 12) {
        financialData.Dec += item.totalCost / 1000;
      }
    });
    // earning Segmentation
    let singleDayTripEarning = 0;
    let multiDayTripEarning = 0;
    let cruiseTripEarning = 0;
    let totalEarning = 0;
    booking.map((item) => {
      if (item.trip.category === "Single Day") {
        singleDayTripEarning += item.totalCost;
      } else if (item.trip.category === "Multiple Day") {
        multiDayTripEarning += item.totalCost;
      } else if (item.trip.category === "Cruises") {
        cruiseTripEarning += item.totalCost;
      }
      totalEarning += item.totalCost;
    });
    const earningSegmentationData = {
      singleDayTripEarning: Math.floor(
        (singleDayTripEarning / totalEarning) * 100
      ),
      multiDayTripEarning: Math.floor(
        (multiDayTripEarning / totalEarning) * 100
      ),
      cruiseTripEarning: Math.floor((cruiseTripEarning / totalEarning) * 100),
    };
    // latestBookings
    const latestBookingsData = await Booking.find({ agency: req.user.id })
      .populate("trip")
      .sort({ bookingDate: "desc" })
      .limit(5);
    // activeCustomers
    const activeCustomers = await Customer.find({
      agency: req.user.id,
      active: true,
    }).countDocuments();
    const inactiveCustomers = await Customer.find({
      agency: req.user.id,
      active: false,
    }).countDocuments();
    const activeCustomersData = {
      activeCustomers,
      inactiveCustomers,
    };
    // data for response
    const data = {
      overviewData,
      financialData,
      earningSegmentationData,
      latestBookingsData,
      activeCustomersData,
    };
    res.json({ success: true, data });
  } catch (error) {
    console.log("error----->", error.message);
    res.status(500).json(error);
  }
};

// add bank Brazil
exports.addBank = async (req, res, next) => {
  try {
    const accountToken = req.body.token;
    const personToken = req.body.personToken;
    const user = req.body.user;
    const name = req.body.name;
    const accountNumber = req.body.accountNumber;
    const routingNumber = req.body.routingNumber;
    const bankName = req.body.bankName;

    const stripe = Stripe(process.env.STRIPE_URI);
    const account = await stripe.account.create({
      type: "custom",
      country: "BR",
      account_token: accountToken.token.id,
      email: user.email,
      business_profile: {
        name: name,
        mcc: "7011",
        url: "http://google.com",
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      external_account: {
        object: "bank_account",
        account_number: accountNumber,
        routing_number: routingNumber,
        bank_name: bankName,
        country: "BR",
        currency: "BRL",
      },
    });

    //Creating person
    var person = await stripe.accounts.createPerson(
      account.id, // id of the account created earlier
      {
        person_token: personToken.token.id,
      }
    );
    let userObj = await User.findById(user._id);
    userObj.bankAdded = true;
    userObj.bank.stripId = account.id;
    await userObj.save();
    res.status(200).json({ message: "bank added" });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: err });
  }
};

// add bank portugal
exports.addBankPT = async (req, res, next) => {
  try {
    const accountToken = req.body.token;
    const personToken = req.body.personToken;
    const user = req.body.user;
    const name = req.body.name;
    const accountNumber = req.body.accountNumber;
    const bankName = req.body.bankName;

    const stripe = Stripe(process.env.STRIPE_URI);
    const account = await stripe.account.create({
      type: "custom",
      country: "PT",
      account_token: accountToken.token.id,
      email: "test@gmail.com",
      business_profile: {
        name: name,
        mcc: "7011",
        url: "http://google.com",
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      external_account: {
        object: "bank_account",
        account_number: accountNumber,
        bank_name: bankName,
        country: "PT",
        currency: "EUR",
      },
    });

    //Creating person
    var person = await stripe.accounts.createPerson(
      account.id, // id of the account created earlier
      {
        person_token: personToken.token.id,
      }
    );
    let userObj = await User.findById(user._id);
    userObj.bankAdded = true;
    userObj.bank.stripId = account.id;
    await userObj.save();
    res.status(200).json({ message: "bank added" });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: err });
  }
};

// controller for promotional emails
exports.promotionalEmail = async (req, res, next) => {
  try {
    const emails = req.body.emails;
    const subject = req.body.subject;
    const message = req.body.message;
    // code for promtional mails
    emails.map(async (email) => {
      await sendEmail({
        email: email,
        subject: subject,
        message,
      });
    });
    res.status(200).json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (err) {
    console.log("error----->", err.message);
    res.status(500).json(err);
  }
};

// controller for promotional emails
exports.getAllAgencies = async (req, res, next) => {
  try {
    const agency = await User.find({ type: "AGENCY" });
    res.status(200).json({
      success: true,
      data: agency,
    });
  } catch (err) {
    console.log("error----->", err.message);
    res.status(500).json(err);
  }
};
