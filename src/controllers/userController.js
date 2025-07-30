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
      // New personal information fields
      dateOfBirth,
      age,
      gender,
      marriedStatus,
      // New employment fields
      salary,
      reportingManager,
      companyLocation,
      employmentStatus,
      // New banking fields
      accountHolder,
      accountNumber,
      ifscCode,
      branchName,
      bankName,
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
      // Personal information
      dateOfBirth,
      age,
      gender,
      marriedStatus,
      // Employment details
      salary,
      reportingManager,
      companyLocation,
      employmentStatus: "Active",
      // Banking information
      accountHolder,
      accountNumber,
      ifscCode,
      branchName,
      bankName,
    });

    // TODO: Send welcome email if needed

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        isActive: user.isActive,
        department: user.department,
        designation: user.designation,
        location: user.location,
        employmentStatus: user.employmentStatus,
      },
    });
  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({
      success: false,
      message: "Server error creating user",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
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
    console.error("Toggle user active status error:", err);
    res.status(500).json({
      success: false,
      message: "Server error toggling user status",
    });
  }
};

// @desc    Get all roles from existing users
// @route   GET /api/v1/users/role
// @access  Private/Admin

export const allRoles = async (req, res) => {
  try {
    // Connect to tenant database (assuming multi-tenant setup)
    const tenantConn = req.tenantConn || mongoose;
    const TenantUser = tenantConn.model("User");
    const roles = await TenantUser.aggregate([
      { $match: { role: { $exists: true } } }, // Only include users with role field
      { $group: { _id: "$role" } }, // Group by role
      { $project: { _id: 0, role: "$_id" } }, // Format output
      { $sort: { role: 1 } }, // Sort alphabetically
    ]);

    // Extract just the role strings from the aggregation result
    const roleList = roles.map((item) => item.role);
    res.status(200).json({
      success: true,
      count: roleList.length,
      data: roleList,
    });
  } catch (err) {
    console.error("Get all roles error:", err);
    res.status(500).json({
      success: false,
      message: "Server error fetching roles",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// @desc    Get all departments from existing users
// @route   GET /api/v1/users/departments
// @access  Private/Admin
export const getAllDepartments = async (req, res) => {
  try {
    // Connect to tenant database (assuming multi-tenant setup)
    const tenantConn = req.tenantConn || mongoose;
    const TenantUser = tenantConn.model("User");

    // Get enum values from the schema
    const departmentEnum = TenantUser.schema.path('department').enumValues;
    // Aggregate to get all distinct departments from users
    const departments = await TenantUser.aggregate([
      { $match: { department: { $exists: true, $ne: null } } }, // Only include users with department field
      { $group: { _id: "$department" } }, // Group by department
      { $project: { _id: 0, department: "$_id" } }, // Format output
      { $sort: { department: 1 } }, // Sort alphabetically
    ]);
    // Extract just the department strings from the aggregation result
    const departmentList = departments.map((item) => item.department);
    // Combine enum values with actual departments (remove duplicates)
    const allDepartments = [...new Set([...departmentEnum, ...departmentList])].sort();

    res.status(200).json({
      success: true,
      count: allDepartments.length,
      data: allDepartments,
    });
  } catch (err) {
    console.error("Get all departments error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching departments",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// @desc    Get all designations for a specific department
// @route   GET /api/v1/users/departments/:department/designations
// @access  Private/Admin

export const getDesignationsByDepartment = async (req, res) => {
  try {
    const { department } = req.params;

    // Connect to tenant database
    const tenantConn = req.tenantConn || mongoose;
    const TenantUser = tenantConn.model("User");

    // Validate department parameter
    if (!department) {
      return res.status(400).json({
        success: false,
        message: "Department parameter is required",
      });
    }

    // First check if the department exists
    const departmentExists = await TenantUser.findOne({ department });
    if (!departmentExists) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    // Get all distinct designations for the specified department
    const designations = await TenantUser.aggregate([
      {
        $match: {
          department: department,
          designation: { $exists: true, $ne: null },
        },
      },
      { $group: { _id: "$designation" } },
      { $project: { _id: 0, designation: "$_id" } },
      { $sort: { designation: 1 } },
    ]);

    // Extract just the designation strings
    const designationList = designations.map((item) => item.designation);

    res.status(200).json({
      success: true,
      department: department,
      count: designationList.length,
      data: designationList,
    });
  } catch (err) {
    console.error("Error getting designations by department:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching designations",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// @desc    Delete user permanently
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    //prevent user from deleting themselves
    if (req.user._id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: "YOu can delete your own user account",
      });
    }
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid user ID format: ${id}`,
      });
    }

    // Access the User model safely from tenant connection
    let TenantUser;
    try {
      TenantUser = req.tenantConn.model("User");
    } catch (modelErr) {
      console.error("Model access error:", modelErr);
      return res.status(500).json({
        success: false,
        message: "Error accessing user model",
      });
    }

    // Attempt to find and delete the user
    const user = await TenantUser.findOneAndDelete({
      _id: id,
      organization: req.user.organization,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found in this organization",
      });
    }

    // Successful deletion
    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Delete user error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting user",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};
