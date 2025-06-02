const logger = require("../utils/logger");
const { validateRegistration, validateLogin } = require("../utils/validation");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const bcrypt = require("bcrypt");
const RefreshToken = require("../models/RefreshToken");

// User registration
const registerUser = async (req, res) => {
  logger.info("Registration endpoint hit...");
  try {
    // Check if request data is valid (email, username format)
    const { error } = validateRegistration(req.body);
    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { email, username, password } = req.body;

    // Check if user already exists (by email or username)
    let existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      logger.warn("User already exists");
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // create and save the user
    const user = new User({
      username,
      email,
      password
    });

    await user.save();
    logger.warn("User saved successfully", { userId: user._id.toString() });

    // Generate tokens (JWT)
    const { accessToken, refreshToken } = await generateToken(user);

    // Send success response
    res.status(201).json({
      success: true,
      message: "User register successfully",
      accessToken,
      refreshToken,
    });

  } catch (err) {
    logger.error(`Registration error occurred: ${err.message}`, {
      stack: err.stack,
    });
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// to get all the user saved
const savedUserLog = async (req, res) => {
  logger.info("Fetch all users endpoint hit...");
  try {
    const allUsers = await User.find({}).select("-password"); // Exclude passwords for security purpose

    if (!allUsers.length) {
      logger.warn("No users found in the database");
      return res.status(404).json({
        success: false,
        message: "No users found",
      });
    }

    logger.info("Users fetched successfully", { count: allUsers.length });

    res.status(200).json({
      success: true,
      message: "List of all users fetched successfully",
      data: allUsers,
    });

  } catch (err) {
    logger.error(`Failed to fetch users: ${err.message}`, { stack: err.stack });
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// User login
const loginUser = async (req, res) => {
  logger.info("Login endpoint hit...");
  try {
  
    const { error } = validateLogin(req.body);
    if(error){
      logger.warn("Login error", error.details[0].message);
      return res.status(400).json({
         success : false,
         message : error.details[0].message,
      });
    }

    const { email, password } = req.body;
    
    const user = await User.findOne({email});
    if(!user){
        logger.warn("Invalid user");
        return res.status(404).json({
          success : false,
          message : "Invalid credentials"
        })
    }

    // check user password valid or not
    const isValidPassword = await user.comparePassword(password);
     if(!isValidPassword){
        logger.warn("Invalid password");
        return res.status(404).json({
          success : false,
          message : "Invalid password"
        })
    }

    const {accessToken, refreshToken} = await generateToken(user);
     
    res.json({
      accessToken,
      refreshToken, 
      userId : user._id,
    })

  } catch (err) {
    logger.error("Login error occured", err);
    res.status(500).json({
      success : false,
      message : "Internal server error"
    })
  }
};

// Refresh token
const refreshTokenUser = async(req, res) => {
  logger.info("Refresh Token endpoint hit...");
  try {
    const { refreshToken } = req.body;
    if(!refreshToken){
      logger.warn("Refresh token is missing");
      return res.status(400).json({
        success : false,
        message : "Refresh token is missing"
      })
    }

    const storedToken = await RefreshToken.findOne({token : refreshToken});
    if(!storedToken || storedToken.expiredAt < new Date()){
         logger.warn("Invalid or expired refresh token");
         return res.status(401).json({
          success : false,
          message : "Invalid or expired refresh token"
         })
    }

    const user =  await User.findById(storedToken.user);
      if(!user){
        logger.warn("User not found");
        return res.status(401).json({
          success : false,
          message : "User not found"
        })
    }

    const {accessToken : newAccessToken, refreshToken : newRefreshToken} = await generateToken(user);

    // Delete the old refresh token
    await RefreshToken.deleteOne({_id : storedToken._id});

    res.json({
      accessToken : newAccessToken,
      refreshToken : newRefreshToken
    })

  } catch (err) {
     logger.error("Refresh Token error occured", err);
    res.status(500).json({
      success : false,
      message : "Internal server error"
    })
  } 
}

// logout
const logoutUser = async (req, res) => {
  logger.info("Logout endpoint hit...");
  try {
    const {refreshToken} = req.body;
      if(!refreshToken){
      logger.warn("Refresh token is missing");
      return res.stack(400).json({
        success : false,
        message : "Refresh token is missing"
      })
    }

    await RefreshToken.deleteOne({token : refreshToken});
    logger.info("Refresh token deleted for logout")

    res.json({
      success : true,
      message : "Logged out successfully"
    })

  } catch (err) {
    logger.error("Logout error occured", err);
    res.status(500).json({
      success : false,
      message : "Internal server error"
    })
  }
}

module.exports = { registerUser, savedUserLog, loginUser, refreshTokenUser, logoutUser };