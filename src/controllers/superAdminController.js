// src/controllers/superAdminController.js

import Organization from "../models/Organization.js";
import User, { userSchema } from "../models/User.js";
import generatePassword from "../utils/generatePassword.js";
import sendEmail from "../utils/sendEmail.js";
import { createTenantDatabase } from "../utils/tenantService.js";

// @desc    Create new organization
// @route   POST /api/v1/organizations
// @access  Private/SuperAdmin
export const createOrganization = async (req, res) => {
  try {
    const {
      name,
      subdomain,
      contactEmail,
      phone,
      address,
      plan,
      firstName,
      lastName,
    } = req.body;

    const existingOrg = await Organization.findOne({ subdomain });
    if (existingOrg) {
      return res
        .status(400)
        .json({ success: false, message: "Subdomain already in use" });
    }

    // Create organization in master DB
    const organization = await Organization.create({
      name,
      subdomain,
      contactEmail,
      phone,
      address,
      subscription: {
        plan: plan || "free",
        status: "active",
        startDate: new Date(),
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      },
      tenantConfig: {
        dbName: `tenant_${subdomain}`,
      },
    });

    // Create tenant DB and initialize User collection
    const tenantConn = await createTenantDatabase(subdomain);
    const TenantUser = tenantConn.model("User", userSchema);

    // const password = generatePassword();
    const password = "Psachan04@";
    const adminUser = await TenantUser.create({
      email: contactEmail,
      password,
      role: "admin",
      organization: organization._id,
      firstName,
      lastName,
      phone,
    });

    // Optionally send email
    // await sendEmail({
    //   email: contactEmail,
    //   subject: "Welcome to HRMS",
    //   message: `<p>Login with Email: ${contactEmail} and Password: ${password}</p>`,
    // });

    res.status(201).json({
      success: true,
      data: {
        organization,
        adminUser: {
          email: adminUser.email,
          role: adminUser.role,
        },
      },
    });
  } catch (err) {
    console.error("Error creating organization:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Get all organizations
// @route   GET /api/v1/organizations
// @access  Private/SuperAdmin

export const getAllOrganizations = async (req, res) => {
  try {
    const organizations = await Organization.find();
    if (!organizations) {
      return res
        .status(404)
        .json({ success: false, message: "No organizations found" });
    }

    res.status(200).json({
      success: true,
      count: organizations.length,
      data: organizations,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Get single organization
// @route   GET /api/v1/organizations/:id
// @access  Private/SuperAdmin
export const getOrganization = async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id);
    if (!organization) {
      return res
        .status(404)
        .json({ success: false, message: "Organization not found" });
    }

    res.status(200).json({
      success: true,
      data: organization,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
// export const getOrganization = async (req, res, next) => {
//   try {
//     const organization = await Organization.findById(req.params.id);

//     if (!organization) {
//       return next(
//         new ErrorResponse(
//           `Organization not found with id of ${req.params.id}`,
//           404
//         )
//       );
//     }

//     res.status(200).json({
//       success: true,
//       data: organization,
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// @desc    Update organization
// @route   PUT /api/v1/organizations/:id
// @access  Private/SuperAdmin
// export const updateOrganization = async (req, res, next) => {
//   try {
//     // Prevent changing subdomain
//     if (req.body.subdomain) {
//       return next(new ErrorResponse("Subdomain cannot be changed", 400));
//     }

//     const organization = await Organization.findByIdAndUpdate(
//       req.params.id,
//       req.body,
//       {
//         new: true,
//         runValidators: true,
//       }
//     );

//     if (!organization) {
//       return next(
//         new ErrorResponse(
//           `Organization not found with id of ${req.params.id}`,
//           404
//         )
//       );
//     }

//     res.status(200).json({
//       success: true,
//       data: organization,
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// @desc    Delete organization
// @route   DELETE /api/v1/organizations/:id
// @access  Private/SuperAdmin
// export const deleteOrganization = async (req, res, next) => {
//   try {
//     const organization = await Organization.findById(req.params.id);

//     if (!organization) {
//       return next(
//         new ErrorResponse(
//           `Organization not found with id of ${req.params.id}`,
//           404
//         )
//       );
//     }

//     // Soft delete (recommended for multi-tenant)
//     organization.isActive = false;
//     await organization.save();

//     // Optionally deactivate all users
//     await User.updateMany(
//       { organization: organization._id },
//       { isActive: false }
//     );

//     res.status(200).json({
//       success: true,
//       data: {},
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// @desc    Get organization by subdomain
// @route   GET /api/v1/organizations/subdomain/:subdomain
// @access  Public
// export const getOrganizationBySubdomain = async (req, res, next) => {
//   try {
//     const organization = await Organization.findOne({
//       subdomain: req.params.subdomain,
//     });

//     if (!organization) {
//       return next(
//         new ErrorResponse(
//           `Organization not found with subdomain ${req.params.subdomain}`,
//           404
//         )
//       );
//     }

//     res.status(200).json({
//       success: true,
//       data: organization,
//     });
//   } catch (err) {
//     next(err);
//   }
// };
