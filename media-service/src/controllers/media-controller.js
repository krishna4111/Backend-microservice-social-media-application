const { uploadMediaToCloudinary } = require("../utils/cloudinary");
const { logger } = require("../utils/logger");
const Media = require("../models/media");

const uploadMedia = async (req, res) => {
  logger.info("starting media upload");
  try {
    if (!req.file) {
      logger.warn(`No file is present please add a file and try again`);
      return res.status(400).json({
        success: false,
        message: "No file is present please add a file and try again",
      });
    }

    const { originalname, mimetype, buffer } = req.file;
    const userId = req.user;

    logger.info(`file details : name =${originalname} , type=${mimetype}`);
    logger.info("upload to cloudinary starts...");

    const cloudinaryUploadResult = await uploadMediaToCloudinary(req.file);

    logger.info(
      `cloudinary upload successful. Public Id is: - ${cloudinaryUploadResult.public_id}`
    );

    const newlyCreatedMedia = new Media({
      publicId: cloudinaryUploadResult.public_id,
      originalName: originalname,
      mimeType: mimetype,
      url: cloudinaryUploadResult.secure_url,
      userId,
    });

    await newlyCreatedMedia.save();
    return res.status(201).json({
      success: true,
      message: "Media uploaded successfully",
      mediaId: newlyCreatedMedia._id,
      url: newlyCreatedMedia.url,
    });
  } catch (error) {
    logger.error(`Error while uploading the media : ${error}`);

    return res.status(500).json({
      success: false,
      message: "Error while uploading the media",
      error,
    });
  }
};

const getAllMedias = async (req, res) => {
  try {
    const result = await Media.find({});
    return res.json({ result });
  } catch (error) {
    logger.error(`Error while fetching the media : ${error}`);

    return res.status(500).json({
      success: false,
      message: "Error while fetching the media",
      error,
    });
  }
};

module.exports = { uploadMedia, getAllMedias };
