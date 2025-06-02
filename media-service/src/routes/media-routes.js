const express = require("express");
const multer = require("multer");

const { uploadMedia } = require("../controllers/media-controller");
const { authenticateRequest } = require("../middleware/authMiddleware");
const logger = require("../utils/logger");
const { error } = require("winston");

const router = express.Router();

// config multer for file upload
const upload = multer({
  // memoryStorage store the file in RAM not disk
  storage: multer.memoryStorage(),
  // limit of 5MB
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
}).single("file"); // it means file should be upload from file upload field from frontend

// route which includes authentication which make sure user should logged in first then able to upload the file
// it also including a middleware for error handling and also to check file is missing or not
router.post("/upload", authenticateRequest, (req, res, next) => {
  upload(req, res, function (err) {
    // when error happen in js it have .name property to check what kind of error it is
    if (err instanceof multer.MulterError) {
      logger.error("Multer error while uploading", err);
      return res.status(400).json({
        success: false,
        message: "Multer error while uploading",
        error: err.message,
        stack: err.stack,
      });
    } else if (err) {
      logger.error("Unknown error occured while uploading", err);
      return res.status(500).json({
        success: false,
        message: "Unknown error occured while uploading",
        error: err.message,
        stack: err.stack,
      });
    }

    // checking whether file is present or not
    if(!req.file){
        return res.status(400).json({
        success: false,
        message: "No file found",
      });
    }

    // calling next to move on next operation here is uploadMedia
    next();

  });
}, uploadMedia);

module.exports = router;