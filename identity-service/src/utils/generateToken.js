const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const RefreshToken = require('../models/RefreshToken');

const generateToken = async (user) => {
    // generate access token
    const accessToken = jwt.sign({
        userId : user._id,
        username : user.username
    }, process.env.JWT_SECRET, {expiresIn : '60m'})


    // generate refresh token using crypto
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const expiredAt = new Date();
    expiredAt.setDate(expiredAt.getDate() + 7) // refresh token expire in 7 days


    await RefreshToken.create({
        token : refreshToken,
        user : user._id,
        expiredAt
    })

    return {accessToken, refreshToken};
}

module.exports = generateToken;