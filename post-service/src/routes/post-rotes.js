const express = require("express");
const {
  createPost,
  getAllPosts,
  getPost,
  deletePost,
} = require("../controllers/postController");
const { authenticateRequest } = require("../middlewares/auth-middleware");
const { rateLimiter } = require("../middlewares/rate-limiter");

const router = express.Router();

//we need to create a middleware ,this middleware tells the user is auth middleware or not
//every feature should be accessed only by the authenticated users.
router.use(authenticateRequest);
router.post(
  "/create-post",
  rateLimiter({
    windowSize: 1 * 60, //1 minutes in sec
    limit: 2,
    rateLimiterFeature: "CREATE-POST",
  }),
  createPost
);
router.get(
  "/get-posts",
  rateLimiter({
    windowSize: 1 * 60, //1 minutes in sec
    limit: 2,
    rateLimiterFeature: "GET-ALL-POSTS",
  }),
  getAllPosts
);
router.get(
  "/get-post/:id",
  rateLimiter({
    windowSize: 1 * 60, //1 minutes in sec
    limit: 5,
    rateLimiterFeature: "GET-POST",
  }),
  getPost
);
router.delete(
  "/delete-post/:id",
  rateLimiter({
    windowSize: 1 * 60, //1 minutes in sec
    limit: 2,
    rateLimiterFeature: "GET-POST",
  }),
  deletePost
);

module.exports = router;
