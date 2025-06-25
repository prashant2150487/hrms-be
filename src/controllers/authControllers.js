// const { sendEmail } = require('../utils/sendEmail');

import Organization from "../models/Organization.js";
import User from "../models/User.js";
import { createTenantDatabase } from "../utils/tenantService.js";

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
// exports.login = async (req, res, next) => {
//   const { email, password } = req.body;

//   // Validate email & password
//   if (!email || !password) {
//     return next(new ErrorResponse('Please provide an email and password', 400));
//   }

//   // Check for user
//   const user = await User.findOne({ email }).select('+password');

//   if (!user) {
//     return next(new ErrorResponse('Invalid credentials', 401));
//   }

//   // Check if password matches
//   const isMatch = await user.matchPassword(password);

//   if (!isMatch) {
//     return next(new ErrorResponse('Invalid credentials', 401));
//   }

//   // Check if user is active
//   if (!user.isActive) {
//     return next(new ErrorResponse('Account is inactive', 401));
//   }

//   sendTokenResponse(user, 200, res);
// };
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email, password and subdomain",
      });
    }
    const extractSubDomainFromEmail = (email) => {
      const match = email.match(/@([^.@]+)\.com$/);
      return match ? match[1] : null;
    };
    const subdomain = extractSubDomainFromEmail(email);
    console.log(email, password, subdomain);
    // Check if organization exists and is active
    const organization = await Organization.findOne({ subdomain });
    if (!organization || !organization.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid organization or tenant inactive",
      });
    }
    // Connect to tenant database
    const tenantConn = await createTenantDatabase(subdomain);
    const TenantUser = tenantConn.model("User");

    // Check for user
    const user = await TenantUser.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    //check if password match
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is inactive",
      });
    }
    // create Token
    const token = user.getSignedJwtToken();
    //
    console.log(user);
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        isActive: user.isActive,
        organization: user.organization,
        token
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
// exports.getMe = async (req, res, next) => {
//   const user = await User.findById(req.user.id).populate("organization");

//   res.status(200).json({
//     success: true,
//     data: user,
//   });
// };

// @desc    Forgot password
// @route   POST /api/v1/auth/forgotpassword
// @access  Public
// exports.forgotPassword = async (req, res, next) => {
//   const { email } = req.body;

//   try {
//     const user = await User.findOne({ email });

//     if (!user) {
//       return next(new ErrorResponse("There is no user with that email", 404));
//     }

//     // Get reset token
//     const resetToken = user.getResetPasswordToken();

//     await user.save({ validateBeforeSave: false });

//     // Create reset URL
//     const resetUrl = `${req.protocol}://${req.get(
//       "host"
//     )}/api/v1/auth/resetpassword/${resetToken}`;

//     const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

//     try {
//       await sendEmail({
//         email: user.email,
//         subject: "Password reset token",
//         message,
//       });

//       res.status(200).json({ success: true, data: "Email sent" });
//     } catch (err) {
//       console.log(err);
//       user.resetPasswordToken = undefined;
//       user.resetPasswordExpire = undefined;

//       await user.save({ validateBeforeSave: false });

//       return next(new ErrorResponse("Email could not be sent", 500));
//     }
//   } catch (err) {
//     next(err);
//   }
// };

// Get token from model, create cookie and send response
// const sendTokenResponse = (user, statusCode, res) => {
//   // Create token
//   const token = user.getSignedJwtToken();

//   const options = {
//     expires: new Date(
//       Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
//     ),
//     httpOnly: true,
//     secure: process.env.NODE_ENV === "production",
//   };

//   res.status(statusCode).cookie("token", token, options).json({
//     success: true,
//     token,
//     role: user.role,
//     organization: user.organization,
//   });
// };
