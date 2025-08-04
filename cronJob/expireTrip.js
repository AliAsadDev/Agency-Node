/**
 * Cron job, Runs everyday at 12 AM with Asia/Karachi timezone
 */
const cron = require("node-cron");
const Trip = require("../models/Trip");

// Cronjob Schedule
cron.schedule(
  "1 0 * * *",
  async () => {
    const trip = await Trip.updateMany(
      { status: { $ne: "expired" }, arrival: { $lt: new Date() } },
      { status: "expired" }
    );
    console.log("Status updated for: ", trip);
  },
  {
    scheduled: true,
    timezone: "Asia/Karachi",
  }
);
