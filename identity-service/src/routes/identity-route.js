const express = require('express');
const {registerUser, savedUserLog, loginUser, refreshTokenUser, logoutUser } = require('../controllers/identity-controller');

const router = express.Router();

router.post('/register', registerUser);
router.get('/alluser', savedUserLog);
router.post('/login', loginUser);
router.post('/refresh-token', refreshTokenUser);
router.post('/logout', logoutUser);

module.exports = router;