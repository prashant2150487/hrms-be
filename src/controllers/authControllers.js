// const { sendEmail } = require('../utils/sendEmail');

import Organization from "../models/Organization.js";
import User from "../models/User.js";
import { createTenantDatabase } from "../utils/tenantService.js";

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public

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
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        isActive: user.isActive,
        organization: user.organization,
        token,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Update user password
// @route   PUT /api/v1/auth/updatepassword
// @access  Private
export const updatePassword = async (req, res, next) => {
  try {
    const TenantUser = req.tenantConn.model("User");
    const user = await TenantUser.findById(req.user.id).select("+password");

    // Check current password
    const isMatch = await user.matchPassword(req.body.currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.password = req.body.newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.log(err.message)
    res.status(500).json({
      success:false,
      message:"Server Error"
    })
  }
};

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const TenantUser = req.tenantConn.model("User");
    const user = await TenantUser.findById(req.user.id)
      .select("-password")
      .lean();

    // Get organization details from master DB
    const organization = await Organization.findById(user.organization)
      .select("name subdomain subscription")
      .lean();

    res.status(200).json({
      success: true,
      data: {
        ...user,
        organization,
      },
    });
  } catch (err) {
    console.error("GetMe error:", err);
    res.status(500).json({
      success: false,
      message: "Server error fetching user data",
    });
  }
};

// @desc    Forgot password
// @route   POST /api/v1/auth/forgotpassword
// @access  Public

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please provide email",
      });
    }
    const subdomain = email.match(/@([^.@]+)\.com$/)?.[1];
    if (!subdomain) {
      return next(new ErrorResponse("Invalid email domain", 400));
    }
    // Check organization
    const organization = await Organization.findOne({ subdomain });
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }
    // Connect to tenant DB
    const tenantConn = await createTenantDatabase(subdomain);
    const TenantUser = tenantConn.model("User");

    // Check for user
    const user = await TenantUser.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    //get rest token
    const resetToken = user.getResetPasswordToken();
    await user.save({});
    // const resetToken

    // Create reset URL
    const resetUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/auth/resetpassword/${resetToken}`;
    // TODO: Implement email sending functionality
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Password Reset Token',
    //   message: `You are receiving this email because you requested a password reset. Please make a PUT request to: \n\n ${resetUrl}`
    // });
    // Extract subdomain from email
    res.status(200).json({
      success: true,
      data: "Email sent",
    });
  } catch (err) {
    // Clear reset token if error
    if (user) {
      user.clearResetToken();
      await user.save();
    }

    console.log(err.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Reset password
// @route   PUT /api/v1/auth/resetpassword/:resettoken
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.resettoken)
      .digest("hex");

    // Extract subdomain from token (you might need to modify this based on your token structure)
    // Alternatively, you might need to pass subdomain in the request body
    const { subdomain } = req.body;
    if (!subdomain) {
      return next(new ErrorResponse("Subdomain is required", 400));
    }

    // Check organization
    const organization = await Organization.findOne({ subdomain });
    if (!organization || !organization.isActive) {
      return next(new ErrorResponse("Organization not found or inactive", 404));
    }

    // Connect to tenant DB
    const tenantConn = await createTenantDatabase(subdomain);
    const TenantUser = tenantConn.model("User");

    const user = await TenantUser.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return next(new ErrorResponse("Invalid token or token expired", 400));
    }

    // Set new password
    user.password = req.body.password;
    user.clearResetToken();
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Log user out / clear cookie
// @route   GET /api/v1/auth/logout
// @access  Private
export const logout = async (req, res, next) => {
  try {
    res.cookie("token", "none", {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

// Helper function for sending token response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({
      success: true,
      token,
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
};
