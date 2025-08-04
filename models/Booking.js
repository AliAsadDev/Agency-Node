const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Adults Schema
const adultSchema = new Schema({
  firstname: String,
  lastName: String,
  passportDNI: String,
  nationality: String,
  dob: Date,
  gender: String,
});

// Children Schema
const childSchema = new Schema({
  firstname: String,
  lastName: String,
  passportDNI: String,
  nationality: String,
  dob: Date,
  gender: String,
});

// Booking Schema
const BookingSchema = new Schema(
  {
    fullName: {
      type: String,
      required: [true, "Please add your full name"],
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
    address: { type: String },
    comment: { type: String },
    bookingDate: { type: Date },
    bookingTime: { type: String },
    status: {
      type: String,
      enum: ["Pending", "Cancelled", "Confirmed", "Rejected"],
      default: "Pending",
    },
    reason: String,
    adult: [adultSchema],
    children: [childSchema],
    totalCost: Number,
    newsletter: Boolean,
    trip: { type: Schema.ObjectId, ref: "Trip", required: true },
    agency: { type: Schema.ObjectId, ref: "User" },
    paid: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// // Getter
// ItemSchema.path('price').get(function (num) {
// 	return (num / 100).toFixed(2);
// });

// // Setter
// ItemSchema.path('price').set(function (num) {
// 	return num * 100;
// });

module.exports = mongoose.model("Booking", BookingSchema);
