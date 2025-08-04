const express = require("express");
var path = require("path");
var multer = require("multer");

const {
  addNewCustomer,
  updateCustomer,
  getCustomers,
  getCustomerById,
  deleteCustomer,
  deleteMultiple,
  toggleActive,
  addBank,
  addBankPT,
  promotionalEmail,
  getCustomerByAgencyId,
  statistics,
  getAllAgencies,
} = require("../controllers/customer");

const router = express.Router();

const { protect } = require("../middleware/auth");

router.get("/getAll", getAllAgencies);
router.post("/customer/new", protect, addNewCustomer);
router.put("/customer/:id", protect, updateCustomer);
router.get("/getCustomerByAgencyId/:id", protect, getCustomerByAgencyId);
router.get("/customers", protect, getCustomers);
router.get("/customer/:id", protect, getCustomerById);
router.delete("/customer/:id", protect, deleteCustomer); ////delete single customer
router.delete("/deleteMultiple", deleteMultiple); ////delete multiple customer
router.put("/customer/toggleActive/:id", protect, toggleActive); ////toggle active customer
router.post("/addbank", protect, addBank); ////Add bank for brazil
router.post("/addbankpt", protect, addBankPT); ////Add bank for portagul
router.get("/stats", protect, statistics); ////Add bank for portagul
router.post("/promotionalEmail", protect, promotionalEmail); ////send promotional email
// router.put('/update/:tripid', protect, fileUpload, updateTrip);
// router.put('/archive/:tripid', protect, archivedTrip);

// router.delete('/gallery/delete/:tripid/:imageId', protect, deleteGalleryImage);
// router.get('/getAll', getAllTrip);
// router.get('/get/:tripid', getTripById);
// router.get('/agency/getAll', protect, getAgencyTrip);

// router.get('/email/verification/:token', verifyEmail);

module.exports = router;
