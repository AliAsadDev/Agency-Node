const dotenv = require("dotenv");
const colors = require("colors");

const Subscription = require("../models/Subscription");
const subscription = require("../mock/subscription.json");

dotenv.config({ path: "config/config.env" });

// Connect to database
const connectDB = require("../config/db");
connectDB();

const seedProducts = async () => {
  try {
    await Subscription.deleteMany();
    console.log(`All subscription deleted`.red.bold);
    await Subscription.insertMany(subscription);
    console.log("Subscriptions are added".green.underline.bold);
    process.exit();
  } catch (error) {
    console.log(error.message);
    process.exit();
  }
};

seedProducts();
