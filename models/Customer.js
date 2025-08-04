const mongoose = require("mongoose");

const CustomerSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Customer", "Provider", "Affiliate"],
      default: "Customer",
    },
    firstName: {
      type: String,
      required: [true, "Please add your first name"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Please add your last name"],
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
    phone: { type: String, required: [true, "Please add phone"] },
    birthday: { type: Date },
    gender: { type: String, enum: ["Male", "Female", "Others"] },
    active: { type: Boolean, required: true, default: true }, /////active status to close or active customer account
    avatar: { public_id: String, url: String },
    info: {
      passportNo: String,
      dateIssued: Date,
      passportExpire: Date,
      nationality: String,
      nid: String,
      maritalStatus: { type: String, enum: ["Married", "UnMarried", "N/A"] },
    },

    address: { type: String, default: "" },
    city: { type: String, default: "" },
    zipcode: { type: String, default: "" },
    country: { type: String, default: "" },

    note: String,
    document: String,
    tags: [String],
    agency: { type: mongoose.Schema.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Customer", CustomerSchema);
