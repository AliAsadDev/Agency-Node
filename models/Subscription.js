const mongoose = require("mongoose");

const SubscriptionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["Beginner", "Professional", "Tourism"] },
    price: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subscription", SubscriptionSchema);
