const Media = require("../models/media");
const { deleteMediaFromCloudinary } = require("../utils/cloudinary");
const { logger } = require("../utils/logger");

const handlePostDeleted = async (event) => {
  try {
    logger.info(
      "post delete event is triggered in media service to delete the related medias"
    );
    const mediaIds = event.mediaDetails.map((media) => {
      return media.id;
    });

    const medias = await Media.find({ _id: { $in: mediaIds } });

    medias.forEach(async (media) => {
      await deleteMediaFromCloudinary(media.publicId);
      await Media.findByIdAndDelete(media._id);
    });

    logger.info(
      `post with id :${event.postId} , related medias are deleted successfully`
    );
  } catch (error) {
    logger.error(
      `Error when handling the delete Posts event in the media service , when we delete the media related to the post :${error}`
    );
  }
};

module.exports = { handlePostDeleted };
