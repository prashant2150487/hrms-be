import Organization from '../models/Organization.js';

// @desc    Create user within an organization
// @route   POST /api/v1/users
// @access  Private/Admin
export const createUser = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, role } = req.body;

    // Check if user already exists in tenant DB
    const TenantUser = req.tenantConn.model('User');
    const existingUser = await TenantUser.findOne({ email });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists in this organization'
      });
    }

    // Create user in tenant database
    const user = await TenantUser.create({
      email,
      password,
      firstName,
      lastName,
      phone,
      role: role || 'employee',
      organization: req.user.organization,
      isActive: true
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
        isActive: user.isActive
      }
    });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error creating user'
    });
  }
};

// @desc    Get all users in organization
// @route   GET /api/v1/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
  try {
    const TenantUser = req.tenantConn.model('User');
    const users = await TenantUser.find({ organization: req.user.organization })
      .select('-password')
      .lean();

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error fetching users'
    });
  }
};

// @desc    Get single user
// @route   GET /api/v1/users/:id
// @access  Private/Admin
export const getUser = async (req, res) => {
  try {
    const TenantUser = req.tenantConn.model('User');
    const user = await TenantUser.findOne({
      _id: req.params.id,
      organization: req.user.organization
    }).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found in this organization'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user'
    });
  }
};

// @desc    Update user
// @route   PUT /api/v1/users/:id
// @access  Private/Admin
export const updateUser = async (req, res) => {
  try {
    const TenantUser = req.tenantConn.model('User');
    
    // Prevent changing certain fields
    const { password, email, organization, ...updateData } = req.body;

    const user = await TenantUser.findOneAndUpdate(
      {
        _id: req.params.id,
        organization: req.user.organization
      },
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found in this organization'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error updating user'
    });
  }
};

// @desc    Deactivate user
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
export const deactivateUser = async (req, res) => {
  try {
    const TenantUser = req.tenantConn.model('User');
    const user = await TenantUser.findOneAndUpdate(
      {
        _id: req.params.id,
        organization: req.user.organization
      },
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found in this organization'
      });
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error('Deactivate user error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error deactivating user'
    });
  }
};