const Organization = require('../models/Organization');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middlewares/async');

// @desc    Get current organization details
// @route   GET /api/v1/organization
// @access  Private/Admin
exports.getOrganization = asyncHandler(async (req, res, next) => {
  // Only allow access to the organization the user belongs to
  const organization = await Organization.findById(req.user.organization);

  if (!organization) {
    return next(
      new ErrorResponse(`Organization not found with id of ${req.user.organization}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: organization
  });
});

// @desc    Update organization details
// @route   PUT /api/v1/organization
// @access  Private/Admin
exports.updateOrganization = asyncHandler(async (req, res, next) => {
  // Only allow updates to the organization the user belongs to
  let organization = await Organization.findById(req.user.organization);

  if (!organization) {
    return next(
      new ErrorResponse(`Organization not found with id of ${req.user.organization}`, 404)
    );
  }

  // Prevent changing subdomain as it's used for multi-tenancy
  if (req.body.subdomain && req.body.subdomain !== organization.subdomain) {
    return next(
      new ErrorResponse('Cannot change organization subdomain', 400)
    );
  }

  organization = await Organization.findByIdAndUpdate(
    req.user.organization,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    data: organization
  });
});

// @desc    Upload organization logo
// @route   PUT /api/v1/organization/logo
// @access  Private/Admin
exports.uploadLogo = asyncHandler(async (req, res, next) => {
  const organization = await Organization.findById(req.user.organization);

  if (!organization) {
    return next(
      new ErrorResponse(`Organization not found with id of ${req.user.organization}`, 404)
    );
  }

  if (!req.files) {
    return next(new ErrorResponse(`Please upload a file`, 400));
  }

  const file = req.files.file;

  // Make sure the image is a photo
  if (!file.mimetype.startsWith('image')) {
    return next(new ErrorResponse(`Please upload an image file`, 400));
  }

  // Check filesize
  if (file.size > process.env.MAX_FILE_UPLOAD) {
    return next(
      new ErrorResponse(
        `Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`,
        400
      )
    );
  }

  // Create custom filename
  file.name = `logo_${organization._id}${path.parse(file.name).ext}`;

  file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse(`Problem with file upload`, 500));
    }

    await Organization.findByIdAndUpdate(req.user.organization, {
      logo: file.name
    });

    res.status(200).json({
      success: true,
      data: file.name
    });
  });
});

// @desc    Get organization users
// @route   GET /api/v1/organization/users
// @access  Private/Admin
exports.getOrganizationUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find({ organization: req.user.organization })
    .select('-password')
    .populate({
      path: 'department',
      select: 'name'
    });

  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
});

// @desc    Get organization statistics
// @route   GET /api/v1/organization/stats
// @access  Private/Admin
exports.getOrganizationStats = asyncHandler(async (req, res, next) => {
  const stats = await User.aggregate([
    {
      $match: { organization: req.user.organization._id }
    },
    {
      $group: {
        _id: '$department',
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        department: '$_id',
        count: 1,
        _id: 0
      }
    }
  ]);

  const totalEmployees = await User.countDocuments({
    organization: req.user.organization
  });
  const activeEmployees = await User.countDocuments({
    organization: req.user.organization,
    isActive: true
  });

  res.status(200).json({
    success: true,
    data: {
      stats,
      totalEmployees,
      activeEmployees
    }
  });
});

// @desc    Update organization subscription
// @route   PUT /api/v1/organization/subscription
// @access  Private/Admin
exports.updateSubscription = asyncHandler(async (req, res, next) => {
  const { plan, paymentMethod } = req.body;

  // In a real application, you would integrate with a payment processor here
  // This is a simplified version for demonstration

  const organization = await Organization.findById(req.user.organization);

  if (!organization) {
    return next(
      new ErrorResponse(`Organization not found with id of ${req.user.organization}`, 404)
    );
  }

  // Calculate subscription end date (1 month from now)
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);

  organization.subscription = {
    plan,
    status: 'active',
    startDate,
    endDate,
    paymentMethod
  };

  await organization.save();

  res.status(200).json({
    success: true,
    data: organization.subscription
  });
});

// @desc    Get organization subscription details
// @route   GET /api/v1/organization/subscription
// @access  Private/Admin
exports.getSubscription = asyncHandler(async (req, res, next) => {
  const organization = await Organization.findById(req.user.organization);

  if (!organization) {
    return next(
      new ErrorResponse(`Organization not found with id of ${req.user.organization}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: organization.subscription
  });
});