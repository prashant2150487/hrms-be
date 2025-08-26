// @desc    Apply for a leave
// @route   POST /api/v1/leaves
// @access  Private (Employee)
export const applyForLeave = async (req, res, next) => {
  try {
    const { startDate, endDate, leaveType, reason, notifyTo } = req.body;

    const user = req.user._id;
    const organization = req.user.organization;

    if (!startDate || !endDate || !leaveType || !reason) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields.",
      });
    }
    // Validate dates
    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: "Start date cannot be after end date.",
      });
    }
    const Leave = req.tenantConn.model("Leave");
    // Prevent overlapping leaves for the same user
    const overLapping = await Leave.findOne({
      user,
      $or: [
        {
          startDate: { $lt: new Date(endDate) },
          endDate: { $gt: new Date(startDate) },
        },
      ],
    });
    if (overLapping) {
      return res.status(400).json({
        success: false,
        message: "You already have a leave request for this date range.",
      });
    }

    // Optional: Validate notifyTo users exist
    if (notifyTo?.length > 0) {
      const TenantUser = req.tenantConn.model("User");
      const usersExist = await TenantUser.find({ _id: { $in: notifyTo } });
      if (usersExist.length !== notifyTo.length) {
        return res.status(400).json({
          success: false,
          message: "One or more users to notify are invalid.",
        });
      }
    }

    const leave = await Leave.create({
      user,
      organization,
      startDate,
      endDate,
      leaveType,
      reason,
      notifyTo,
    });

    res.status(201).json({
      success: true,
      data: leave,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "server Error",
    });
  }

  // TODO: Implement notification logic for users in `notifyTo`
};

// @desc    Get all leave requests for the organization
// @route   GET /api/v1/leaves
// @access  Private (Admin/Manager/TeamLead)
export const getAllLeaves = async (req, res) => {
  const Leave = req.tenantConn.model("Leave");
  const leaves = await Leave.find({
    organization: req.user.organization,
  }).populate("user", "firstName lastName email");

  res.status(200).json({
    success: true,
    count: leaves.length,
    data: leaves,
  });
};

// @desc    Get a single leave request by ID
// @route   GET /api/v1/leaves/:id
// @access  Private
export const getLeaveById = async (req, res) => {
  const Leave = req.tenantConn.model("Leave");
  const leave = await Leave.findById(req.params.id).populate(
    "user",
    "firstName lastName email"
  );

  if (!leave) {
    return res.status(404).json({
      success: false,
      message: `Leave not found with id of ${req.params.id}`,
    });
  }

  // Allow user to see their own leave, or admin/manager/teamlead to see any
  if (
    leave.user._id.toString() !== req.user._id.toString() &&
    !["admin", "manager", "teamlead"].includes(req.user.role)
  ) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to view this leave request",
    });
  }

  res.status(200).json({
    success: true,
    data: leave,
  });
};

// @desc    Update leave status (approve/reject)
// @route   PUT /api/v1/leaves/:id/status
// @access  Private (Admin/Manager)

export const updateLeaveStatus = async (req, res, next) => {
  const { status, rejectionReason } = req.body;

  if (!status || !["Approved", "Rejected", "Cancelled"].includes(status)) {
    return res.status(400).json({
      success: false,
      message:
        "Please provide a valid status ('Approved', 'Rejected', or 'Cancelled').",
    });
  }

  if (status === "Rejected" && !rejectionReason) {
    return res.status(400).json({
      success: false,
      message: "Please provide a reason for rejection.",
    });
  }

  const Leave = req.tenantConn.model("Leave");
  let leave = await Leave.findById(req.params.id);

  if (!leave) {
    return res.status(404).json({
      success: false,
      message: `Leave not found with id of ${req.params.id}`,
    });
  }

  leave.status = status;
  leave.approvedBy = req.user._id;
  leave.rejectionReason = status === "Rejected" ? rejectionReason : undefined;

  await leave.save();

  // TODO: Notify the user who applied for leave about the status change.

  res.status(200).json({ success: true, data: leave });
};
// @desc    Search users for notification (by name or email)
// @route   GET /api/v1/leaves/notifyUser
// @access  Private
export const notifyUser = async (req, res) => {
  try {
    const { search } = req.query;

    if (!search || search.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least 3 characters to search",
      });
    }

    const TenantUsers = req.tenantConn.model("User");

    // Case-insensitive search for firstName, lastName, or email containing the search term
    const users = await TenantUsers.find({
      $or: [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    })
      .select("firstName lastName email role") // Only return essential fields
      .limit(3); // Limit to 3 results for performance

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// @desc    Get all leaves for the logged-in user
// @route   GET /api/v1/leaves/my
// @access  Private (Employee)
export const getAllLeavesByUser = async (req, res) => {
  try {
    const Leave = req.tenantConn.model("Leave");

    const leaves = await Leave.find({ user: req.user._id }).populate(
      "user",
      "firstName lastName email"
    );

    res.status(200).json({
      success: true,
      count: leaves.length,
      data: leaves,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
