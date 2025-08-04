const crypto = require("crypto");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const UserSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Please add your full name"],
      trim: true,
    },
    agencyName: {
      type: String,
      required: [true, "Please add agency name"],
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email",
      ],
      required: [true, "Please add an email"],
    },
    phone: { type: String }, /// not required in agency signup
    birthday: { type: Date },
    gender: { type: String, enum: ["Male", "Female", "Others"] },
    avatar: { public_id: String, url: String },
    type: { type: String, enum: ["SUPERADMIN", "AGENCY", "CUSTOMER"] },
    role: { type: String, default: "Admin" },
    subscription: { type: mongoose.Schema.ObjectId, ref: "Subscription" },
    subscriptionDate: { type: Date },
    subscriptionExpire: { type: Date },
    address: {
      region: { type: String, default: "" },
      city: { type: String, default: "" },
      address: { type: String, default: "" },
      zipcode: { type: String, default: "" },
      country: { type: String, default: "" },
    },
    password: { type: String, minlength: 6 },
    isVerified: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    isLocked: { type: Boolean, default: false },
    policy: { type: Boolean, default: false },
    verifyToken: String,
    expireToken: Date,
    active: Boolean,
    bankAdded: { type: Boolean, default: false },
    bank: {
      stripId: String,
    },
  },
  { timestamps: true }
);

// Encrypt password using bcrypt
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    { id: this._id, fullName: this.fullName, email: this.email },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE,
    }
  );
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
UserSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");

  this.verifyToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.expireToken = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model("User", UserSchema);
