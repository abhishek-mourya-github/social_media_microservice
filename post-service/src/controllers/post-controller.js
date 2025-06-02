const logger =  require('../utils/logger');
const Post = require('../models/Post');
const {validateCreatePost} = require('../utils/validation')

// find all the keys that starts with post like post:1:10 or post:2:10
async function invalidatePostCache(req, input){
  const keys = await req.redisClient.keys("posts:*");
  // if keys length bigger than 0 delete the older data and store the newer data
  if(keys.length > 0){
    await req.redisClient.del(keys)
  }
}

// Create post
const createPost = async (req, res) => {
    logger.info("Create post endpoint hit...")
    try {
        const {error} = validateCreatePost(req.body);
        if(error){
            logger.warn("validation error", error.details[0].message);
            return res.status(400).json({
                success : false,
                message : error.details[0].message
            })
        }

        const { content, mediaIds } = req.body;
        const newlyCreatedPost = new Post({
            user : req.user.userId,
            content,
            mediaIds : mediaIds || []
        })

        await newlyCreatedPost.save();
        await invalidatePostCache(req, newlyCreatedPost._id.toString());

        logger.info("Post created successfully", newlyCreatedPost);
        res.status(201).json({
            success : true,
            message : "Post created successfully"
        })

    } catch (err) {
        logger.error("Error while creating post", err);
        res.status(500).json({
            success : false,
            message : "Error while creating post"
        })
    }
}

// Get all posts with pagination
const getAllPost = async (req, res) => {
  logger.info("get all post endpoint hit...");
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const cacheKey = `posts:${page}:${limit}`;
    const cachedPosts = await req.redisClient.get(cacheKey);

    if (cachedPosts) {
      logger.info("Serving posts from cache");
      return res.status(200).json(JSON.parse(cachedPosts));
    }

    const allPost = await Post.find({})
      .sort({ createdAt: -1 }) // assuming your schema has createdAt field
      .skip(skip)
      .limit(limit);

    const totalPosts = await Post.countDocuments();

    if (!allPost.length) {
      logger.warn("No Post found in the database");
      return res.status(404).json({
        success: false,
        message: "No Post found",
      });
    }

    const responseData = {
      success: true,
      message: "List of posts fetched successfully",
      data: allPost,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalPosts / limit),
        totalItems: totalPosts,
      },
    };

    // Cache the response for 5 minutes (300 seconds)
    await req.redisClient.setex(cacheKey, 300, JSON.stringify(responseData));

    logger.info("Posts fetched successfully", { count: allPost.length });

    res.status(200).json(responseData);

  } catch (err) {
    logger.error("Error while fetching all posts", err);
    res.status(500).json({
      success: false,
      message: "Error while fetching all posts",
    });
  }
};

// Get single post
const getSinglePost = async (req, res) => {
    logger.info("get single post endpoint hit...");
    try {
      
      const postId = req.params.id;
      const cacheKey = `post:${postId}`;
      const cachedPost = await req.redisClient.get(cacheKey);
    
      if(cachedPost){
        return res.json(JSON.parse(cachedPost))
      }

      const postDetailsById = await Post.findById(postId)

      if(!postDetailsById){
        return res.status(404).json({
          success : false,
          message : "Post not found"
        })
      }

      await req.redisClient.setex(cacheKey, 3600, JSON.stringify(postDetailsById));

      res.json(postDetailsById);

    } catch (err) {
      logger.error("Error while fetching post", err);
        res.status(500).json({
            success : false,
            message : "Error while fetching post by ID"
    });
}
}

const deletePost = async (req, res) => {
      logger.info("get single post endpoint hit...");  
      try {
        

    } catch (err) {
        logger.error("Error while deleting post", err);
        res.status(500).json({
            success : false,
            message : "Error while deleting post"
        })
    }
}

module.exports = { createPost, getAllPost, getSinglePost };