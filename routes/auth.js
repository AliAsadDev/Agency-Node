const express = require("express");

const {
  registerAgency,
  registerCustomer,
  customerLogin,
  agencyLogin,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  updateDetails,
  updatePassword,
  verifyEmail,
  upload,
  updateAvatar,
  getSubscription,
  checkout,
  Webhook,
  updateAgencyProfile,
} = require("../controllers/auth");

const router = express.Router();

const { protect } = require("../middleware/auth");

router.post("/register/agency", registerAgency);
router.post("/register/customer", registerCustomer);

router.put("/updateAgencyProfile/:id", updateAgencyProfile); //// route to update yopur agency account

router.get("/email/verification/:token", verifyEmail);

router.post("/upload", upload);

router.post("/login/customer", customerLogin);
router.post("/login/agency", agencyLogin);

router.get("/logout", logout);
router.get("/profile", protect, getMe);
router.put("/updatedetails", protect, updateDetails);
router.put("/updateimage", protect, updateAvatar);
router.put("/updatepassword", protect, updatePassword);
router.post("/forgotpassword", forgotPassword);
router.put("/resetpassword/:resettoken", protect, resetPassword);
router.get("/subscription/get", getSubscription); //// route to get all subscriptions
router.post("/checkout", checkout);
router.post(
  "/stripe/webhook",
  express.raw({ type: "application/json" }),
  Webhook
);

module.exports = router;
