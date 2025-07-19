import Organization from "../models/Organization.js";
import User from "../models/User.js";
import sendEmail from "../utils/sendEmail.js";
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

// @desc    Log user out / clear cookie
// @route   GET /api/v1/auth/logout
// @access  Private
export const logout = async (req, res, next) => {
  try {
    // Clear the token cookie
    res.cookie("token", "none", {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

// @desc    Update user password
// @route   PUT /api/v1/auth/updatepassword
// @access  Private
// export const updatePassword = async (req, res, next) => {
//   try {
//     const TenantUser = req.tenantConn.model("User");
//     const user = await TenantUser.findById(req.user.id).select("+password");

//     // Check current password
//     const isMatch = await user.matchPassword(req.body.currentPassword);
//     if (!isMatch) {
//       return res.status(401).json({
//         success: false,
//         message: "Current password is incorrect",
//       });
//     }

//     user.password = req.body.newPassword;
//     await user.save();

//     sendTokenResponse(user, 200, res);
//   } catch (err) {
//     console.log(err.message);
//     res.status(500).json({
//       success: false,
//       message: "Server Error",
//     });
//   }
// };

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const TenantUser = req.tenantConn.model("User");
    const user = await TenantUser.findById(req.user.id).select("-password");

    // Get organization details from master DB
    const organization = await Organization.findById(user.organization)
      .select("name subdomain subscription")
      .lean();
    const token = user.getSignedJwtToken();
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
    console.error("GetMe error:", err);
    res.status(500).json({
      success: false,
      message: "Server error fetching user data",
    });
  }
};

// @desc    Forgot password
// @route   POST /api/v1/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  let user; // Declare user variable at the top to ensure scope in catch block
  try {
    const { email } = req.body;
    // Validate email input
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please provide an email address",
      });
    }
    // Extract subdomain from email
    const subdomain = email.match(/@([^.@]+)\.com$/)?.[1];
    if (!subdomain) {
      return res.status(400).json({
        success: false,
        message: "Invalid email domain",
      });
    }
    // Check if organization exists and is active
    const organization = await Organization.findOne({ subdomain });
    if (!organization || !organization.isActive) {
      return res.status(404).json({
        success: false,
        message: "Organization not found or inactive",
      });
    }

    // Connect to tenant database
    const tenantConn = await createTenantDatabase(subdomain);
    const TenantUser = tenantConn.model("User");

    // Check if user exists
    user = await TenantUser.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No user found with this email address",
      });
    }

    // Generate and save reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetUrl = `${req.protocol}://${process.env.CLIENT_URL}/create-password/${resetToken}`;

    // Send email with reset URL
    try {
      await sendEmail({
        email: user.email,
        subject: "Password Reset Request",
        message: `You are receiving this email because you (or someone else) requested a password reset. 
                  Please visit the following link to reset your password: \n\n${resetUrl}\n\n
                  If you did not request this, please ignore this email. The reset link will expire in 1 hour.`,
      });

      res.status(200).json({
        success: true,
        data: { message: "Password reset email sent successfully" },
      });
    } catch (emailErr) {
      // Clear reset token if email sending fails
      if (user) {
        user.clearResetToken();
        await user.save({ validateBeforeSave: false });
      }
      console.error("Email sending error:", emailErr);
      return res.status(500).json({
        success: false,
        message: "Error sending password reset email",
      });
    }
  } catch (err) {
    // Clear reset token if user is defined
    if (user) {
      user.clearResetToken();
      await user.save({ validateBeforeSave: false });
    }
    console.error("Forgot password error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error processing password reset request",
    });
  }
};

// @desc    Reset password
// @route   PUT /api/v1/auth/resetpassword/:resettoken
// @access  Public

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
