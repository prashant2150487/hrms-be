import Organization from "../models/Organization.js";
import mongoose from "mongoose";
import { createTenantDatabase } from "../utils/tenantService.js";

// @desc    Create user within an organization
// @route   POST /api/v1/admin/users
// @access  Private/Admin
export const createUser = async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      role,
      department,
      designation,
      location,
      startDate,
      panCard,
      aadharCard,
      uanNumber,
    } = req.body;

    // Check if user already exists in tenant DB
    const TenantUser = req.tenantConn.model("User");
    const existingUser = await TenantUser.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists in this organization",
      });
    }

    // Create user in tenant database
    const user = await TenantUser.create({
      email,
      password,
      firstName,
      lastName,
      phone,
      role: role || "employee",
      organization: req.user.organization,
      isActive: true,
      department,
      designation,
      location,
      startDate,
      panCard,
      aadharCard,
      uanNumber,
    });

    // TODO: Send welcome email if needed

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        isActive: user.isActive,
      },
    });
  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({
      success: false,
      message: "Server error creating user",
    });
  }
};

// @desc    Get all users in organization
// @route   GET /api/v1/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    // 1. Get organization details from master DB
    const organization = await Organization.findById(req.user.organization);
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    // 2. Connect to tenant database
    const tenantConn = await createTenantDatabase(organization.subdomain);
    const TenantUser = tenantConn.model("User");

    // 3. Build query (only users in current organization)
    const query = { organization: req.user.organization };

    // Optional filters
    if (req.query.role) {
      query.role = req.query.role;
    }
    if (req.query.department) {
      query.department = req.query.department;
    }
    if (req.query.isActive) {
      query.isActive = req.query.isActive === "true";
    }
    if (req.query.search) {
      query.$or = [
        { firstName: { $regex: req.query.search, $options: "i" } },
        { lastName: { $regex: req.query.search, $options: "i" } },
        { email: { $regex: req.query.search, $options: "i" } },
      ];
    }

    // 4. Set up pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // 5. Get total count for pagination
    const total = await TenantUser.countDocuments(query);

    // 6. Get users with pagination and filtering
    const users = await TenantUser.find(query)
      .select("-password -resetPasswordToken -resetPasswordExpire")
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit)
      .lean();

    // 7. Return response
    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: users,
    });
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({
      success: false,
      message: "Server error fetching users",
    });
  }
};
// @desc    Get single user
// @route   GET /api/v1/users/:id
// @access  Private/Admin
export const getUser = async (req, res) => {
  try {
    const TenantUser = req.tenantConn.model("User");
    const user = await TenantUser.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    }).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found in this organization",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({
      success: false,
      message: "Server error fetching user",
    });
  }
};

// @desc    Update user
// @route   PUT /api/v1/users/:id
// @access  Private/Admin
export const updateUser = async (req, res) => {
  try {
    const TenantUser = req.tenantConn.model("User");

    // Prevent changing certain fields
    const { password, email, organization, ...updateData } = req.body;

    const user = await TenantUser.findOneAndUpdate(
      {
        _id: req.params.id,
        organization: req.user.organization,
      },
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found in this organization",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({
      success: false,
      message: "Server error updating user",
    });
  }
};

// @desc    Deactivate user
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
export const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }
    const TenantUser = req.tenantConn.model("User");

    const user = await TenantUser.findOne({
      _id: id,
      organization: req.user.organization,
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found in this organization",
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User has been ${
        user.isActive ? "activated" : "deactivated"
      } successfully.`,
      data: {
        _id: user._id,
        isActive: user.isActive,
      },
    });
  } catch (err) {
    console.error("Deactivate user error:", err);
    res.status(500).json({
      success: false,
      message: "Server error deactivating user",
    });
  }
};

// @desc    Acctivate user
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
