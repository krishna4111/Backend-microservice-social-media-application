const Post = require("../models/post");
const { logger } = require("../utils/logger");
const { createPostValidation } = require("../utils/validation");
const { invalidateCache } = require("../utils/redis-cache");
const { publishEvent } = require("../utils/rabbitmq");

const createPost = async (req, res) => {
  try {
    logger.info(`post creation endpoint hit....`);
    console.log(typeof req.body);
    const { error } = createPostValidation(req.body);

    if (error) {
      logger.warn("validation error", error.details[0].message);

      return res.status(400).json({
        success: false,
        message: `validation failed error : ${error.details[0].message}`,
      });
    }

    //in here from the media i will get the media url , id and type(image / video)in an array of object format
    const { content, media } = req.body;
    const userId = req.user;

    const newPost = new Post({
      userId: userId,
      content: content,
      ...(media && { media: [...media] }),
    });
    await newPost.save();
    //NOTE: when ever we create a new post we wil delete the existing posts related cache
    await invalidateCache(req, newPost._id.toString());

    logger.info("post created successfully", newPost);

    return res.status(201).json({
      success: true,
      message: "post created successfully",
      data: newPost,
    });
  } catch (error) {
    logger.error(`Error when creating a post : ${error}`);
    res.status(500).json({
      success: false,
      message: `Error when creating a post : ${error}`,
    });
  }
};
const getAllPosts = async (req, res) => {
  try {
    let { page = 0, limit = 10, search } = req.query;
    let skip = (page - 1) * limit;
    const redis = req.redis;

    //create a cash key & data present in cash then get it from cache
    const cacheKey = `post:${page}:${limit}`;
    const cachedPosts = await redis.get(cacheKey);

    if (cachedPosts) {
      return res.status(200).json({
        success: true,
        message: "fetched all posts",
        data: JSON.parse(cachedPosts),
      });
    }
    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments();

    const results = {
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total,
    };
    //if we get the data from db then add it to redis cache
    await redis.setex(cacheKey, 5 * 60, JSON.stringify(results));
    return res.status(200).json({
      success: true,
      message: "fetched all posts",
      data: results,
    });
  } catch (error) {
    logger.error(`Error when fetching all post : ${error}`);
    res.status(500).json({
      success: false,
      message: `Error when fetching all post : ${error}`,
    });
  }
};
const getPost = async (req, res) => {
  try {
    const { id } = req.params;

    const cacheKey = `post:${id}`;

    const cachedPost = await req.redis.get(cacheKey);

    if (cachedPost) {
      return res.status(200).json({
        success: true,
        message: `get the post with id:${id} successfully`,
        data: JSON.parse(cachedPost),
      });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: `post with id :${id} not found`,
      });
    }
    await req.redis.setex(cacheKey, 3600, JSON.stringify(post));
    return res.status(200).json({
      success: true,
      message: `get the post with id:${id} successfully`,
      data: post,
    });
  } catch (error) {
    logger.error(`Error when fetching a post : ${error}`);
    res.status(500).json({
      success: false,
      message: `Error when fetching a post : ${error}`,
    });
  }
};
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findOneAndDelete({ _id: id, userId: req.user });
    if (!post) {
      return res.status(404).json({
        success: false,
        message: `post with id :${id} not found`,
      });
    }

    await invalidateCache(req, id);

    //publish post delete method
    //the routing key is the unique identifier
    await publishEvent("post.deleted", {
      postId: post._id.toString(),
      userId: req.user,
      mediaDetails: post.media,
    });

    return res.status(200).json({
      success: true,
      message: `delete the post with id:${id} successfully`,
    });
  } catch (error) {
    logger.error(`Error when deleting a post : ${error}`);
    res.status(500).json({
      success: false,
      message: `Error when deleting a post : ${error}`,
    });
  }
};

module.exports = {
  createPost,
  getAllPosts,
  getPost,
  deletePost,
};
