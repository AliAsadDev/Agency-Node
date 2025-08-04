const crypto = require("crypto");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const sendEmail = require("../utils/sendEmail");
const User = require("../models/User");
const Subscription = require("../models/Subscription");
const stripe = require("stripe")(process.env.STRIPE_URI);
const Booking = require("../models/Booking");

var path = require("path");
var multer = require("multer");

var emailTemplates = require("../email-templates");
var replace = require("../utils/replace");

var { cloudinary } = require("../utils/cloudinary");

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/uploads");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

var uploads = multer({ storage: storage, limits: { fileSize: 1000000 } });
var fileUpload = uploads.fields([
  { name: "bannerImage", maxCount: 1 },
  { name: "gallery", maxCount: 8 },
]);

// @desc      Register user
// @route     POST /api/v1/auth/register/agency
// @access    Public
exports.registerAgency = asyncHandler(async (req, res, next) => {
  let agency = await User.findOne({ email: req.body.email, type: "AGENCY" });
  if (agency && agency.active) {
    return next(
      new ErrorResponse(`Agency already registered with this Email`, 400)
    );
  } else if (agency && !agency.active) {
    // getting subscription
    let subscription = await Subscription.findById(req.body.subscription);

    // hex tokene to send to email
    const token = crypto.randomBytes(20).toString("hex");

    // setting verify token and account type
    req.body.verifyToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
    req.body.expireToken = Date.now() + 604800000;

    // setting user type
    req.body.type = "AGENCY";

    // setting active status
    req.body.active = subscription.type === "Beginner" ? true : false;

    // updating user with the same email
    agency = await User.findOneAndUpdate(
      { email: req.body.email, type: "AGENCY" },
      req.body
    );

    // setting the email template
    const message = replace(emailTemplates.CUSTOMER.REGISTRATION_CONFIRMATION, {
      name: agency.fullName,
      url: `${process.env.ServerURL}/auth/email/verification/${token}`, //// ServerURL from .env
    });

    // sendiong email with node mailer
    try {
      await sendEmail({
        email: agency.email,
        subject: "New Agency Email Confirmation",
        message,
      });
      res.status(200).json({
        success: true,
        data: "Email sent successfully",
        subscription,
        agency,
      });
    } catch (err) {
      await agency.remove();
      // await agency.save({ validateBeforeSave: false });
      return next(new ErrorResponse("Email could not be sent", 500));
    }
  } else {
    let subscription = await Subscription.findById(req.body.subscription); // getting subscription

    const token = crypto.randomBytes(20).toString("hex");

    req.body.verifyToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
    req.body.expireToken = Date.now() + 60 * 60 * 1000;
    req.body.type = "AGENCY";
    req.body.active = subscription.type === "Beginner" ? true : false; // setting active status

    // if (!req.body.plan) {
    // 	return next(new ErrorResponse(`Invalid Membership Plan. Please select plan`, 400));
    // }
    // Create user
    agency = await User.create(req.body);

    const message = replace(emailTemplates.CUSTOMER.REGISTRATION_CONFIRMATION, {
      name: agency.fullName,
      url: `${process.env.ServerURL}/auth/email/verification/${token}`, //// ServerURL from .env
    });

    // const message = `your agency account has been created . Token: <a href="http://api.crmviagens.com/api/v1/auth/email/verification/${token}" target="_blank">Verify Email Address</a>`;

    try {
      await sendEmail({
        email: agency.email,
        subject: "New Agency Email Confirmation",
        message,
      });
      res.status(200).json({
        success: true,
        data: "Email sent successfully",
        subscription,
        agency,
      });
    } catch (err) {
      await agency.remove();
      // await agency.save({ validateBeforeSave: false });
      return next(new ErrorResponse("Email could not be sent", 500));
    }
  }
  // sendTokenResponse(agency, 200, res);
});

exports.updateAgencyProfile = async (req, res, next) => {
  try {
    let agency = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json({
      success: true,
      message: "Profile Updated Successfully!",
      data: agency,
    });
  } catch (error) {
    console.log("error---->", error.message);
    res.status(500).json(error);
  }
};

// @desc      Register user
// @route     POST /api/v1/auth/register/agency
// @access    Public
exports.registerCustomer = asyncHandler(async (req, res, next) => {
  let customer = await User.findOne({
    email: req.body.email,
    type: "CUSTOMER",
  });
  if (customer)
    return next(
      new ErrorResponse(`Customer already registered with this Email`, 400)
    );

  const token = crypto.randomBytes(20).toString("hex");

  req.body.verifyToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  req.body.expireToken = Date.now() + 60 * 60 * 1000;
  req.body.type = "CUSTOMER";

  // Create user
  customer = await User.create(req.body);

  const message = replace(emailTemplates.CUSTOMER.REGISTRATION_CONFIRMATION, {
    name: customer.fullName,
    url: `${process.env.ServerURL}/auth/email/verification/${token}`, //// ServerURL from .env
  });

  // const message = `Your customer account has been created . Verfiy your email from this link: <a href="http://api.crmviagens.com/api/v1/auth/email/verification/${token}">Verify Email</a>`;
  try {
    await sendEmail({
      email: customer.email,
      subject: "New customer Email Confirmation",
      message,
    });
    res.status(200).json({ success: true, data: "Email sent successfully" });
  } catch (err) {
    // console.log(customer);
    // await customer.remove();
    // await customer.save({ validateBeforeSave: false });
    return next(new ErrorResponse("Email could not be sent", 500));
  }

  // sendTokenResponse(agency, 200, res);
});

// @desc      Login user
// @route     POST /api/v1/auth/login
// @access    Public
exports.customerLogin = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate emil & password
  if (!email || !password) {
    return next(new ErrorResponse("Please provide an email and password", 400));
  }

  // Check for user
  const user = await User.findOne({ email, type: "CUSTOMER" }).select(
    "+password"
  );

  if (!user) {
    return next(new ErrorResponse("Invalid credentials", 401));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse("Invalid credentials", 401));
  }
  if (!user.isVerified)
    return next(
      new ErrorResponse("Please verify your email before login", 400)
    );
  sendTokenResponse(user, 200, res);
});

exports.agencyLogin = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate emil & password
  if (!email || !password) {
    return next(new ErrorResponse("Please provide an email and password", 400));
  }

  // Check for user
  const user = await User.findOne({ email, type: "AGENCY" })
    .populate("subscription")
    .select("+password");

  if (!user) {
    return next(new ErrorResponse("Invalid credentials", 401));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse("Invalid credentials", 401));
  }
  if (!user.isVerified)
    return next(
      new ErrorResponse("Please verify your email before login", 400)
    );
  sendTokenResponse(user, 200, res);
});

exports.upload = asyncHandler(async (req, res, next) => {
  fileUpload(req, res, function (err) {
    if (err instanceof multer.MulterError) return res.send(err.message);
    else if (err) return res.send(err);

    res.send("File uploaded!");
  });
});

// @desc      Log user out / clear cookie
// @route     GET /api/v1/auth/logout
// @access    Private
exports.logout = asyncHandler(async (req, res, next) => {
  res.clearCookie("token");
  res.status(200).json({ success: true, data: {} });
});

// @desc      Get current logged in user
// @route     POST /api/v1/auth/me
// @access    Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id)
    .populate("subscription")
    .select("-password");

  res.status(200).json({ success: true, user });
});

// @desc      Update user details
// @route     PUT /api/v1/auth/updatedetails
// @access    Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.user.id, req.body, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({ success: true, user });
});
exports.updateAvatar = asyncHandler(async (req, res, next) => {
  if (req.user.avatar) {
    const public_id = req.user.avatar.public_id;
    await cloudinary.uploader.destroy(public_id);
    const result = await cloudinary.uploader.upload(req.body.avatar, {
      folder: "Avatar",
      width: 250,
      height: 250,
      crop: "scale",
    });
    req.body.avatar = { public_id: result.public_id, url: result.secure_url };
    const user = await User.findByIdAndUpdate(req.user.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({ success: true, user });
  } else {
    const result = await cloudinary.uploader.upload(req.body.avatar, {
      folder: "Avatar",
      width: 250,
      height: 250,
      crop: "scale",
    });
    req.body.avatar = { public_id: result.public_id, url: result.secure_url };
    const user = await User.findByIdAndUpdate(req.user.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({ success: true, user });
  }
});

// @desc      Update password
// @route     PUT /api/v1/auth/updatepassword
// @access    Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  // Check current password
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse("Password is incorrect", 401));
  }

  user.password = req.body.newPassword;
  await user.save();

  res.status(200).json({ success: true, message: "Password updated" });
  // sendTokenResponse(user, 200, res);
});

// @desc      Forgot password
// @route     POST /api/v1/auth/forgotpassword
// @access    Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse("There is no user with that email", 404));
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  // Create reset url
  const resetUrl = `http://crmviagens.com/auth/resetpassword/${resetToken}`;

  const message = replace(emailTemplates.CUSTOMER.RESET_PASSWORD, {
    name: user.fullName,
    url: `http://crmviagens.com/auth/resetpassword/${resetToken}`,
  });

  // const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Reset password from this link: \n\n ${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Reset Account Password",
      message,
    });

    res.status(200).json({ success: true, data: "Email sent" });
  } catch (err) {
    console.log(err);
    user.verifyToken = undefined;
    user.expireToken = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse("Email could not be sent", 500));
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc      Reset password
// @route     PUT /api/v1/auth/resetpassword/:resettoken
// @access    Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const verifyToken = crypto
    .createHash("sha256")
    .update(req.params.resettoken)
    .digest("hex");
  console.log(verifyToken);
  const user = await User.findOne({
    verifyToken,
    expireToken: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorResponse("Invalid token", 400));
  }

  // Set new password
  user.password = req.body.password;
  user.verifyToken = undefined;
  user.expireToken = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({ success: true, token, user });
};

exports.verifyEmail = asyncHandler(async (req, res, next) => {
  //Get hash token
  const token = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    verifyToken: token,
    expireToken: { $gt: Date.now() },
  });
  if (!user) return next(new ErrorResponse("Invalid verification token", 400));

  // Set the password
  user.isVerified = true;
  user.verifyToken = undefined;
  user.expireToken = undefined;

  await user.save({ validateBeforeSave: false });
  res
    .status(200)
    .send(
      '<h1 style="text-align: center;padding: 100px 0">Sua conta de e-mail foi verificada com sucesso!!</h1>'
    );
  // res.status(200).json({ success: true, data: 'Your email address has been verified!' });
});

// controller to get all subcriptions
exports.getSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.find();
    res.status(200).json(subscription);
  } catch (error) {
    console.log("error----->", error);
    res.status(500).json({ error, message: "Somthing went wrong!" });
  }
};

// chcekout on agency signup

exports.checkout = async (req, res) => {
  try {
    let lineItems = req.body.line_items;
    let metaData = req.body.metaData;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      locale: "fr",
      mode: "payment",
      success_url: process.env.STRIPE_RETURN_URL,
      cancel_url: process.env.STRIPE_REJECT_URL,
      metadata: metaData,
    });
    res.status(200).json({
      url: session.url,
    });
  } catch (error) {
    console.log("error----->", error.message);
    res.status(500).json(error);
  }
};

exports.Webhook = async (req, res) => {
  let sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      "whsec_aSdqclKwj3wgs17MhAwKXJwYd45LZ2jf"
    );
  } catch (error) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const metaData = session.metadata;
      // update agency status
      if (metaData.type !== "booking") {
        let agency = await User.findById(metaData.agency);
        agency.active = true;
        agency.save();
      } else {
        let booking = await Booking.findById(metaData.booking);
        booking.paid = true;
        booking.save();
      }
      break;
    }
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
};
