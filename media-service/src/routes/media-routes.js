const express = require("express");
const router = express.Router();
const { upload } = require("../middlewares/multer-file-handler");
const {
  uploadMedia,
  getAllMedias,
} = require("../controllers/media-controller");
const { authenticateRequest } = require("../middlewares/auth-middleware");

router.post(
  "/upload-media",
  authenticateRequest,
  upload.single("file"),
  uploadMedia
);

router.get("/get-all-medias", authenticateRequest, getAllMedias);

module.exports = router;
