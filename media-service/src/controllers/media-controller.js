const Media = require('../models/Media');
const { uploadMediaToCloudinary } = require('../utils/cloudinary');
const logger = require('../utils/logger');

const uploadMedia = async(req, res) => {
    logger.info('Starting media upload');
    try {
       if(!req.file){
        logger.error('No file found, Please upload a file')
        return res.status(400).json({
            success : false,
            message : "No file found, Please upload a file"
        })
       }

       const {originalname, mimetype, buffer} = req.file;
       const userId = req.user.userId;

       logger.info(`File details: name=${originalname}, type=${mimetype}`);
       logger.info('Upload to cloudinary starting...');
        
       const cloudinaryUploadResult = await uploadMediaToCloudinary(req.file);
       logger.info(`Cloudinary upload successful. Public Id: - ${cloudinaryUploadResult.public_id}`);

       const newlyCreatedMedia = new Media({
        publicId : cloudinaryUploadResult.public_id,
        originalName: originalname,
        mimeType : mimetype,
        url : cloudinaryUploadResult.secure_url,
        userId
       })

       await newlyCreatedMedia.save();
       
       res.status(201).json({
        success : true,
        mediaId : newlyCreatedMedia._id,
        url: newlyCreatedMedia.url,
        message : "Media upload is successful"
       })

    } catch (err) {
        logger.error("Error while uploading media");
        res.status(500).json({
            success: false,
            message : "Error while uploading media"
        })
    }
}

module.exports = { uploadMedia };