const shortid = require("shortid");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TripSchema = new Schema(
  {
    name: String,
    reference: { type: String, default: shortid.generate },
    organizer: Boolean,
    organizerName: String,
    organizerComission: Number,
    youtube: String,
    description: String,
    includes: [String],
    excludes: [String],
    status: { type: String, enum: ["published", "archived", "expired"] }, ////three possible status
    // spotlight: Boolean,
    // affiliates: Boolean,
    // soldOf: Boolean,
    // stamp: Boolean,
    // sealText: String,
    address: String,
    city: { type: String, lowercase: true, trim: true },
    zipcode: String,
    country: String,
    // category: { type: String, enum: ['HoneyMoon', 'Expedions', 'Beaches', 'Big-Trips'] },
    dayType: { type: String, enum: ["Weekend", "Weekday"] },
    tripSize: { type: String, enum: ["Individual", "Group", "Both"] },
    category: { type: String, enum: ["Single Day", "Multiple Day", "Cruises"] },

    interior: { adultPrice: Number, childPrice: Number },
    exterior: { adultPrice: Number, childPrice: Number },
    balcony: { adultPrice: Number, childPrice: Number },
    suite: { adultPrice: Number, childPrice: Number },

    bedroom: { double: Number, single: Number, twin: Number },

    departure: { type: Array },
    arrival: { type: Array },
    minReservation: Number,
    maxReservation: Number,
    adultPrice: Number,
    childPrice: Number,
    reservationSignal: Number,
    suplimentPrice: Number,

    banner: { public_id: String, url: String },
    gallery: [{ public_id: String, url: String }],
    agency: { type: Schema.ObjectId, ref: "User" },
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

module.exports = mongoose.model("Trip", TripSchema);
