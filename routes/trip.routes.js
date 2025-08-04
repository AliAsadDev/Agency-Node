const express = require("express");
var path = require("path");
var multer = require("multer");

var storage = multer.diskStorage({
  // destination: function (req, file, cb) {
  // 	cb(null, './public/uploads');
  // },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

var uploads = multer({ storage: storage, limits: { fileSize: 1000000 } });
var fileUpload = uploads.fields([
  { name: "banner", maxCount: 1 },
  { name: "gallery", maxCount: 5 },
]);

const {
  addNewTrip,
  updateTrip,
  getAgencyTrip,
  getAllTrip,
  getArchived, //// get archive trips controller
  getTripById,
  deleteBannerImage,
  deleteGalleryImage,
  deleteTrip,
  statusTrip, ///update trip status controller
  tripEvents, ////trip events for calendar
  getTripByAgencyId,
} = require("../controllers/trip");

const router = express.Router();

const { protect, authorize } = require("../middleware/auth");

router.post("/addnew", protect, fileUpload, addNewTrip);
router.put("/update/:tripid", protect, fileUpload, updateTrip);
router.delete("/delete", deleteTrip);
router.put("/status/:tripid", protect, statusTrip); ////route to update trip status
router.put("/banner/delete/:tripid", protect, deleteBannerImage);
router.put("/gallery/delete/:tripid", protect, deleteGalleryImage);
router.get("/getAll", getAllTrip);
router.get("/getArchived/:id", getArchived); //// get archive trips routes
router.get("/get/:tripid", getTripById);
router.get("/agency/getAll", protect, getAgencyTrip);
router.get("/tripEvents/:id", tripEvents);
router.get("/getTripByAgencyId/:id", getTripByAgencyId);

// router.get('/email/verification/:token', verifyEmail);

module.exports = router;
