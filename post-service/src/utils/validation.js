const { z } = require("zod");
const { logger } = require("../utils/logger");

const createPostValidation = (data) => {
  console.log("inside validators", typeof data);
  // Sub-schema: media
  const mediaSchema = z.object({
    id: z.string(), // Cloudinary/AWS ID
    url: z.string(), // must be a valid URL
    type: z.enum(["image", "video"]),
  });

  // Sub-schema: comment
  const commentSchema = z.object({
    userId: z.string().min(24).max(24), // Mongo ObjectId
    text: z.string().min(1).max(500),
    createdAt: z.date().default(() => new Date(), "time of creation"),
  });

  // Main Post schema
  const postSchema = z.object({
    content: z.string().min(1).max(5000),
    media: z.array(mediaSchema).optional(), // optional array of objects
    likes: z.array(z.string()).optional(),
    comments: z.array(commentSchema).optional(),
    shares: z.array(z.string()).optional(),
    visibility: z.enum(["public", "friends", "private"]).default("public"),
  });

  return postSchema.safeParse(data);
};
module.exports = { createPostValidation };
