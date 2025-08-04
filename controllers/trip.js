const FS = require("fs");
const path = require("path");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");

const User = require("../models/User");
const Trip = require("../models/Trip");
const mongoose = require("mongoose");

const { cloudinary } = require("../utils/cloudinary");
// const emailTemplates = require('../email-templates');

// EMail configration utils
const sendEmail = require("../utils/sendEmail");

/*
 * @Desc       -> Register New Restaurant
 * @Route      -> POST /api/v1/restaurants/
 * @Access     -> Public
 */

exports.addNewTrip = asyncHandler(async (req, res, next) => {
  const galleryCloud = [];

  req.body = JSON.parse(req.body.data);
  req.body.agency = req.user.id;

  if (req.files) {
    if (req.files.banner) {
      let { path } = req.files.banner[0];
      const bannerCloud = await cloudinaryImageUploadMethod(path);
      req.body.banner = bannerCloud;
    }
    if (req.files.gallery) {
      const files = req.files.gallery;
      for (const file of files) {
        const { path } = file;
        const newPath = await cloudinaryImageUploadMethod(path);
        galleryCloud.push(newPath);
      }
    }
  }

  req.body.gallery = galleryCloud;

  // if (req.files) {
  // 	if (req.files.bannerImage) {
  // 		req.body.bannerImage = req.files.bannerImage[0].filename;
  // 	}
  // 	if (req.files.gallery) {
  // 		req.body.gallery = req.files.gallery.map((img) => img.filename);
  // 	}
  // }

  let trip = await Trip.create(req.body);
  res.status(200).json({ success: true, trip });
});
exports.updateTrip = asyncHandler(async (req, res, next) => {
  const trip = await Trip.findById(req.params.tripid);
  if (!trip)
    return next(
      new ErrorResponse(`Trip not found with this id ${req.params.tripid}`, 404)
    );

  if (trip.agency.toString() !== req.user.id)
    return next(new ErrorResponse(`You are not authorize to update trip`, 401));

  req.body = JSON.parse(req.body.data);
  req.body.agency = req.user.id;

  delete req.body.bannerImage;
  let galleryCloud = [];
  if (req.files) {
    if (req.files.banner) {
      let { path } = req.files.banner[0];
      const bannerCloud = await cloudinaryImageUploadMethod(path);
      req.body.banner = bannerCloud;
    }
    if (req.files.gallery) {
      const files = req.files.gallery;
      for (const file of files) {
        const { path } = file;
        const newPath = await cloudinaryImageUploadMethod(path);
        req.body.gallery.push(newPath);
      }
    }
  }

  const updateTrip = await Trip.findByIdAndUpdate(req.params.tripid, req.body, {
    runValidators: true,
  });

  res.status(200).json({ success: true, trip: updateTrip });
});

// update trip status
exports.statusTrip = asyncHandler(async (req, res, next) => {
  // await Trip.update({ _id: { $in: req.body.ids } }, { $set: { archived: req.body.archived } }, { multi: true });

  let trip = await Trip.findById(req.params.tripid);
  if (!trip)
    return next(
      new ErrorResponse(`Trip not found with this id ${req.params.tripid}`, 404)
    );

  if (trip.agency.toString() !== req.user.id)
    return next(new ErrorResponse(`You are not authorize to update trip`, 401));

  trip.status = req.body.status;
  await trip.save();
  res.status(200).json({ success: true, message: trip });
});

// gettting all trip with status published
exports.getAllTrip = asyncHandler(async (req, res, next) => {
  let trip = await Trip.find({ status: "published" }); ////all trips other than archive
  res.status(200).json({ success: true, data: trip });
});

// getting all trip with agency registred users
exports.getTripByAgencyId = asyncHandler(async (req, res, next) => {
  let trip = await Trip.find({ agency: req.params.id, status: "published" });
  res.status(200).json({ success: true, data: trip });
});

// getting all trips with status archived
exports.getArchived = asyncHandler(async (req, res, next) => {
  let trip = await Trip.find({ agency: req.params.id, status: "archived" }); ////only archive trips
  res.status(200).json({ success: true, data: trip });
});

exports.getTripById = asyncHandler(async (req, res, next) => {
  let trip = await Trip.findById(req.params.tripid).populate("agency", "phone");

  if (!trip) return next(new ErrorResponse(`Trip not found`, 404));
  res.status(200).json({ success: true, trip });
});

exports.getAgencyTrip = asyncHandler(async (req, res, next) => {
  let trip = await Trip.find({ agency: req.user.id });
  res.status(200).json({ success: true, data: trip });
});

exports.deleteBannerImage = asyncHandler(async (req, res, next) => {
  let trip = await Trip.findById(req.params.tripid);
  if (!trip) return next(new ErrorResponse(`Trip not found`, 404));

  cloudinary.uploader.destroy(req.body.public_id, function (error, result) {
    if (error) return res.status(500).send("upload image error");
    console.log(result);
    trip.banner = {};
  });
  trip.banner = {};
  await trip.save();
  res.status(200).json({ success: true, trip });
});
exports.deleteGalleryImage = asyncHandler(async (req, res, next) => {
  let trip = await Trip.findById(req.params.tripid);
  if (!trip) return next(new ErrorResponse(`Trip not found`, 404));

  index = trip.gallery.findIndex((img) => img.public_id === req.body.public_id);
  if (index !== -1) {
    cloudinary.uploader.destroy(req.body.public_id, function (error, result) {
      if (error) return res.status(500).send("upload image error");
      console.log(result);
      trip.gallery.splice(index, 1);
    });
    trip.gallery.splice(index, 1);
  }
  await trip.save();
  res.status(200).json({ success: true, trip });
});

const cloudinaryImageUploadMethod = async (file) => {
  return new Promise((resolve) => {
    cloudinary.uploader.upload(file, { folder: "trip" }, (err, res) => {
      if (err) return res.status(500).send("upload image error");
      resolve({ public_id: res.public_id, url: res.secure_url });
    });
  });
};

// delete trip controller function
exports.deleteTrip = async (req, res) => {
  try {
    await Trip.deleteMany({ _id: { $in: req.body.ids } });
    res.json({ message: "Deleted successfully!" });
  } catch (error) {
    console.log("error----->", error.message);
    res.status(500).json(error);
  }
};

// trip events for calendar
exports.tripEvents = async (req, res) => {
  try {
    const events = await Trip.aggregate([
      {
        $match: {
          agency: mongoose.Types.ObjectId(req.params.id),
        },
      },
      {
        $unwind: {
          path: "$arrival",
          includeArrayIndex: "arrival_index",
        },
      },
      {
        $unwind: {
          path: "$departure",
          includeArrayIndex: "departure_index",
        },
      },
      {
        $project: {
          end: "$arrival",
          start: "$departure",
          title: "$name",
          desc: "$description",
          id: "$_id",
          compare: {
            $cmp: ["$arrival_index", "$departure_index"],
          },
        },
      },
      {
        $match: {
          compare: 0,
        },
      },
      {
        $unset: ["compare"],
      },
      {
        $addFields: {
          start: {
            $dateFromString: {
              dateString: "$start",
            },
          },
          end: {
            $dateFromString: {
              dateString: "$end",
            },
          },
        },
      },
    ]);
    res.json(events);
  } catch (error) {
    console.log("error----->", error.message);
    res.status(500).json(error);
  }
};
