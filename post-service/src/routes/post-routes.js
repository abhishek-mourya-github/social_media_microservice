const express =  require('express');
const router = express.Router();
const { createPost, getAllPost, getSinglePost } = require('../controllers/post-controller');
const {authenticateRequest} = require('../middleware/authMiddleware');


// middleware -> this will tell if the user is an auth user or not
// the main purpose is to write down here to avoid wtiting it again and again in the router like
// router.post('/create-post',authenticateRequest, createPost); 
// now we not have to write it again in each, all the router below it will execute after its varification
router.use(authenticateRequest); 

router.post('/createpost', createPost);
router.get('/getallposts', getAllPost);
router.get('/:id', getSinglePost);

module.exports = router;