const mongoose = require('mongoose');
const argon2 = require('argon2');

const userSchema = new mongoose.Schema({
    username : {
        type : String,
        required : true,
        unique : true,
        trim : true
    },
    email : {
        type : String,
        required : true,
        unique : true,
        trim : true,
        lowercase : true
    },
    password : {
        type : String,
        required : true
    },
    createdAt : {
        type : Date,
        default : Date.now,
    }
}, {
    timestamps : true,
})

// before save the user data here we check if password field is new or changes then hash the password than save it.
userSchema.pre('save', async function(next){
    if(this.isModified('password')){
        try {
            this.password = await argon2.hash(this.password)
        } catch (error) {
            return next(error);
        }
    }
})

// here candidatePassword we get it from frontend login form
userSchema.methods.comparePassword = async function(candidatePassword){
    try {
        return await argon2.verify(this.password, candidatePassword)
    } catch (error) {
        throw error;
    }
}

userSchema.index({
    username : "text"
});

const User = mongoose.model('User', userSchema);
module.exports = User;