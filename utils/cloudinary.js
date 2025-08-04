const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: "armada2021",
  api_key: "241867856589861",
  api_secret: "P2cHCiKqpDsRyhzyn94A85nQuXM",
});

module.exports = { cloudinary };
