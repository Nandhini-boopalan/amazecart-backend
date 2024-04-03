const catchAsyncError=require('../middlewares/catchAsyncerror')
const User=require('../models/usermodel');
const sendEmail = require('../utils/email');
const ErrorHandler = require('../utils/errorHandler');
const crypto=require('crypto')
const sendToken=require('../utils/jwt')

//Register User - /api/v1/register
exports.registerUser = catchAsyncError(async (req, res, next) => {
    const { name, email, password} = req.body;
    let avatar;
    if(req.file){
     avatar=`${process.env.BACKEND_URL}/uploads/user/${req.file.originalname}`
    }
    try {
        const user = await User.create({
            name,
            email,
            password,
            avatar
        });
        sendToken(user, 201, res);
    } catch (error) {
        if (error.code === 11000 && error.keyPattern.email === 1) {
            next(new ErrorHandler('Email already exists', 400));
        } else {
            next(new ErrorHandler('User registration failed', 500));
        }
    }
});

//login user-/api/v1/login
exports.loginUser = catchAsyncError(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new ErrorHandler('Please enter email and password', 400));
    }

    try {
        // Find the user in the database
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return next(new ErrorHandler('Invalid user or password', 401));
        }

        // Check if the provided password matches the hashed password
        const isPasswordValid = await user.isValidPassword(password);
        if (!isPasswordValid) {
            return next(new ErrorHandler('Invalid user or password', 401));

        }

        // If the password is valid, send the authentication token
        sendToken(user, 200, res);
    } catch (error) {
        return next(new ErrorHandler('Login failed', 500));
    }
});

//logout-/api/v1/logout
exports.logoutUser=(req,res,next)=>{
     res.cookie('token',null,{
        expires:new Date(Date.now()),
        httpOnly:true
    }).status(200)
    .json({
        sucess:true,
        message:"loggedout"
    })
}

//forgot-/api/v1/password/forgot
exports.forgotPassword=catchAsyncError(async (req,res,next)=>{
const user=await User.findOne({email:req.body.email})
if(!user){
    return next( new ErrorHandler('user not found with this email',404))
}
const resetToken = user.getResetToken();
user.resetPasswordToken = resetToken;
user.resetPasswordTokenExpire = Date.now() + 30 * 60 * 1000; // Setting token expiration time (e.g., 30 minutes)
await user.save({ validateBeforeSave: false }); // Save the token to the user document


//create reset url
const reseturl=`${process.env.FRONTEND_URL}/password/reset/${resetToken}`
const message = `Your password reset URL is as follows:\n\n${reseturl}. If you did not request this email, please ignore it.`;


try{
sendEmail({
    email:user.email,
    subject:'amazecart password recovery',
    message
})
res.status(200).json({
    success:true,
    email:`email sent to ${user.email}`
})
}
catch(error){
user.resetPasswordToken=undefined
user.resetPasswordTokenExpire=undefined
await user.save({validateBeforeSave:false})
return next(new ErrorHandler(error.message),500)
}
})


//Reset Password - /api/v1/password/reset/:token
exports.resetPassword = catchAsyncError(async (req, res, next) => {
    const resetPasswordToken = req.params.token; // No need to hash the token here

    // Find the user with the provided reset password token and a valid expiration time
    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordTokenExpire: { $gt: Date.now() }
    });

    //console.log("Query parameters:", { resetPasswordToken, resetPasswordTokenExpire: { $gt: Date.now() } });

    if (!user) {
        return next(new ErrorHandler('Password reset token is invalid or expired'));
    }

    //console.log("Request Body:", req.body);

    try {
        // Check if password and confirmPassword fields exist in the request body
        if (!req.body.password || !req.body.confirmPassword) {
            return res.status(400).json({ success: false, message: 'Password or confirmPassword field is missing' });
        }

        // Check if password matches confirm password
        const password = req.body.password.trim().toLowerCase(); // Trim and convert to lowercase
        const confirmPassword = req.body.confirmPassword.trim().toLowerCase(); // Trim and convert to lowercase

        if (password !== confirmPassword) {
            console.log("Password:", password);
            console.log("Confirm Password:", confirmPassword);
            return next(new ErrorHandler('Password does not match'));
        }

        // Set the new password and clear the reset password token and expiration time
        user.password = password; // Use the trimmed and lowercase password
        user.resetPasswordToken = undefined;
        user.resetPasswordTokenExpire = undefined;
        await user.save({ validateBeforeSave: false });

        // Send a response with a success status
        return res.status(200).json({ success: true, message: 'Password reset successfully' });
    } catch (error) {
        console.error("Error resetting password:", error);
        return next(new ErrorHandler('Failed to reset password'));
    }
});

//get user profile-/api/v1/myprofile
exports.getUserProfile=catchAsyncError(async(req,res,next)=>{
    const user=await User.findById(req.user.id)
    res.status(200).json({
        sucess:true,
        user
    })
})

//change password-/api/v1/password/change
exports.changePassword=catchAsyncError(async(req,res,next)=>{
    const user=await User.findById(req.user.id).select('+password')
    //check old password
    if(!await user.isValidPassword(req.body.oldPassword)){
       return next(new ErrorHandler('old password is incorrect',401))
    }

    //assigning new password
    user.password=req.body.password
    await user.save()
    res.status(200).json({
        sucess:true,
     
    })
})

//update profile-/api/v1/update
exports.updateProfile=catchAsyncError(async(req,res,next)=>{
    let newUserData={
        name:req.body.name,
        email:req.body.email
    }

    let avatar;
    if(req.file){
     avatar=`${process.env.BACKEND_URL}/uploads/user/${req.file.originalname}`
     newUserData={...newUserData,avatar}
    }

    const user=await User.findByIdAndUpdate(req.user.id,newUserData,{
        new:true,
        runValidators:true,
    })
    res.status(200).json({
        sucess:true,
        user
    })
}
)

//admin:Get All Users-/api/v1/admin/users
exports.getAllUsers=catchAsyncError(async(req,res,next)=>{
    const users=await User.find()
    res.status(200).json({
        success:true,
        users
    })
})

//admin:get specific user-/api/v1/admin/user/:id
exports.getUser = catchAsyncError(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return next(new ErrorHandler(`User not found with this id ${req.params.id}`, 404));
    }
    res.status(200).json({
        success: true,
        user
    });
});


//admin:update user-/api/v1/admin/user/:id
exports.updateUser=catchAsyncError(async(req,res,next)=>{
    const newUserData={
        name:req.body.name,
        email:req.body.email,
        role:req.body.role
    }
    const user=await User.findByIdAndUpdate(req.params.id,newUserData,{
        new:true,
        runValidators:true,
    })
    res.status(200).json({
        sucess:true,
        user
    })
})

//admin:delete user-/api/v1/admin/user/:id
exports.deleteUser = catchAsyncError(async (req, res, next) => {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
        return next(new ErrorHandler(`User not found with this id ${userId}`, 404));
    }

    try {
        await User.deleteOne({ _id: userId });
        res.status(200).json({
            success: true
        });
    } catch (err) {
        return next(new ErrorHandler(`Error occurred while deleting user: ${err.message}`, 500));
    }
});



