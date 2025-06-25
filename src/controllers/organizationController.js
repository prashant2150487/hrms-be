
import Organization from "../models/Organization.js";


// @desc    Get current organization details
// @route   GET /api/v1/organization
// @access  Private/Admin
export const getOrganization = async (req, res) => {
  try {
    console.log(req.user.organization,"anv")
    const organization = await Organization.findById(req.user.organization);

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: `Organization not found with id of ${req.user.organization}`
      });
    }

    res.status(200).json({
      success: true,
      data: organization
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update organization details
// @route   PUT /api/v1/organization
// @access  Private/Admin
// exports.updateOrganization = async (req, res) => {
//   try {
//     let organization = await Organization.findById(req.user.organization);

//     if (!organization) {
//       return res.status(404).json({
//         success: false,
//         message: `Organization not found with id of ${req.user.organization}`
//       });
//     }

//     if (req.body.subdomain && req.body.subdomain !== organization.subdomain) {
//       return res.status(400).json({
//         success: false,
//         message: 'Cannot change organization subdomain'
//       });
//     }

//     organization = await Organization.findByIdAndUpdate(
//       req.user.organization,
//       req.body,
//       {
//         new: true,
//         runValidators: true
//       }
//     );

//     res.status(200).json({
//       success: true,
//       data: organization
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// };

// @desc    Upload organization logo
// @route   PUT /api/v1/organization/logo
// @access  Private/Admin
// exports.uploadLogo = async (req, res) => {
//   try {
//     const organization = await Organization.findById(req.user.organization);

//     if (!organization) {
//       return res.status(404).json({
//         success: false,
//         message: `Organization not found with id of ${req.user.organization}`
//       });
//     }

//     if (!req.files) {
//       return res.status(400).json({
//         success: false,
//         message: 'Please upload a file'
//       });
//     }

//     const file = req.files.file;

//     if (!file.mimetype.startsWith('image')) {
//       return res.status(400).json({
//         success: false,
//         message: 'Please upload an image file'
//       });
//     }

//     if (file.size > process.env.MAX_FILE_UPLOAD) {
//       return res.status(400).json({
//         success: false,
//         message: `Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`
//       });
//     }

//     file.name = `logo_${organization._id}${path.parse(file.name).ext}`;

//     file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err => {
//       if (err) {
//         console.error(err);
//         return res.status(500).json({
//           success: false,
//           message: 'Problem with file upload'
//         });
//       }

//       await Organization.findByIdAndUpdate(req.user.organization, {
//         logo: file.name
//       });

//       res.status(200).json({
//         success: true,
//         data: file.name
//       });
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// };

// @desc    Onboard new employee
// @route   POST /api/v1/organization/employees
// @access  Private/Admin
// exports.onboardEmployee = async (req, res) => {
//   try {
//     const organization = await Organization.findById(req.user.organization);
    
//     if (!organization) {
//       return res.status(404).json({
//         success: false,
//         message: 'Organization not found'
//       });
//     }

//     // Connect to tenant database
//     const tenantConn = await createTenantDatabase(organization.subdomain);
//     const TenantUser = tenantConn.model('User');

//     // Check if employee already exists
//     const existingEmployee = await TenantUser.findOne({ email: req.body.email });
//     if (existingEmployee) {
//       return res.status(400).json({
//         success: false,
//         message: 'Employee with this email already exists'
//       });
//     }

//     // Create employee in tenant database
//     const employee = await TenantUser.create({
//       ...req.body,
//       organization: organization._id,
//       role: 'employee',
//       isActive: true
//     });

//     // TODO: Send welcome email with temporary password
//     // await sendWelcomeEmail(employee.email, req.body.temporaryPassword);

//     res.status(201).json({
//       success: true,
//       data: {
//         id: employee._id,
//         firstName: employee.firstName,
//         lastName: employee.lastName,
//         email: employee.email,
//         role: employee.role
//       }
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// };

// @desc    Get organization users
// @route   GET /api/v1/organization/users
// @access  Private/Admin
// exports.getOrganizationUsers = async (req, res) => {
//   try {
//     const organization = await Organization.findById(req.user.organization);
    
//     if (!organization) {
//       return res.status(404).json({
//         success: false,
//         message: 'Organization not found'
//       });
//     }

//     // Connect to tenant database
//     const tenantConn = await createTenantDatabase(organization.subdomain);
//     const TenantUser = tenantConn.model('User');

//     const users = await TenantUser.find({ organization: req.user.organization })
//       .select('-password')
//       .populate({
//         path: 'department',
//         select: 'name'
//       });

//     res.status(200).json({
//       success: true,
//       count: users.length,
//       data: users
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// };

// @desc    Get organization statistics
// @route   GET /api/v1/organization/stats
// @access  Private/Admin
// exports.getOrganizationStats = async (req, res) => {
//   try {
//     const organization = await Organization.findById(req.user.organization);
    
//     if (!organization) {
//       return res.status(404).json({
//         success: false,
//         message: 'Organization not found'
//       });
//     }

//     // Connect to tenant database
//     const tenantConn = await createTenantDatabase(organization.subdomain);
//     const TenantUser = tenantConn.model('User');

//     const stats = await TenantUser.aggregate([
//       {
//         $match: { organization: req.user.organization._id }
//       },
//       {
//         $group: {
//           _id: '$department',
//           count: { $sum: 1 }
//         }
//       },
//       {
//         $project: {
//           department: '$_id',
//           count: 1,
//           _id: 0
//         }
//       }
//     ]);

//     const totalEmployees = await TenantUser.countDocuments({
//       organization: req.user.organization
//     });
//     const activeEmployees = await TenantUser.countDocuments({
//       organization: req.user.organization,
//       isActive: true
//     });

//     res.status(200).json({
//       success: true,
//       data: {
//         stats,
//         totalEmployees,
//         activeEmployees
//       }
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// };

// @desc    Update organization subscription
// @route   PUT /api/v1/organization/subscription
// @access  Private/Admin
// exports.updateSubscription = async (req, res) => {
//   try {
//     const { plan, paymentMethod } = req.body;

//     const organization = await Organization.findById(req.user.organization);

//     if (!organization) {
//       return res.status(404).json({
//         success: false,
//         message: `Organization not found with id of ${req.user.organization}`
//       });
//     }

//     const startDate = new Date();
//     const endDate = new Date();
//     endDate.setMonth(endDate.getMonth() + 1);

//     organization.subscription = {
//       plan,
//       status: 'active',
//       startDate,
//       endDate,
//       paymentMethod
//     };

//     await organization.save();

//     res.status(200).json({
//       success: true,
//       data: organization.subscription
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// };

// @desc    Get organization subscription details
// @route   GET /api/v1/organization/subscription
// @access  Private/Admin
// exports.getSubscription = async (req, res) => {
//   try {
//     const organization = await Organization.findById(req.user.organization);

//     if (!organization) {
//       return res.status(404).json({
//         success: false,
//         message: `Organization not found with id of ${req.user.organization}`
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: organization.subscription
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({
//       success: false,
//       message: 'Server error'
//     });
//   }
// };