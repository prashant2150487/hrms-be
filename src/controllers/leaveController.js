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
    const LeaveBalance = req.tenantConn.model("LeaveBalance");
    const HolidaysCalender = req.tenantConn.model("HolidaysCalender");

    // Prevent overlapping leaves for the same user
    const overLapping = await Leave.findOne({
      user,
      status: { $in: ["pending", "approved"] },
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
    // Get holidays
     const holidays = await HolidaysCalender.find({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    });
     // Calculate working days (excluding weekends and holidays)
     const workingDays= calculateWorkingDays(startDate, endDate, holidays);

    // Check leave balance
    const leaveBalance = await LeaveBalance.findOne({ user, year: new Date().getFullYear() });

    if (leaveType !== "unpaid") {
      const availableLeaves = leaveBalance ? leaveBalance[`${leaveType}Leaves`] : 0;
      
      if (availableLeaves < workingDays) {
        return res.status(400).json({
          success: false,
          message: `Insufficient ${leaveType} leave balance. Available: ${availableLeaves}, Requested: ${workingDays}`,
        });
      }
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
        workingDays,
        daysCount: Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1,
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

// export const updateLeaveStatus = async (req, res, next) => {
//   const { status, rejectionReason } = req.body;

//   if (!status || !["approved", "rejected", "cancelled"].includes(status)) {
//     return res.status(400).json({
//       success: false,
//       message:
//         "Please provide a valid status ('Approved', 'Rejected', or 'Cancelled').",
//     });
//   }

//   if (status === "Rejected" && !rejectionReason) {
//     return res.status(400).json({
//       success: false,
//       message: "Please provide a reason for rejection.",
//     });
//   }

//   const Leave = req.tenantConn.model("Leave");
//   const LeaveBalance=req.tenantConn.model("LeaveBalance")

//   let leave = await Leave.findById(req.params.id);

//   if (!leave) {
//     return res.status(404).json({
//       success: false,
//       message: `Leave not found with id of ${req.params.id}`,
//     });
//   }


//   // If status is being changed from Approved to something else, add back the leaves
//   if (leave.status === "Approved" && status !== "Approved") {
//     const leaveBalance = await LeaveBalance.findOne({ 
//       user: leave.user, 
//       year: new Date(leave.startDate).getFullYear() 
//     });
    
//     if (leaveBalance && leave.leaveType !== "unpaid") {
//       leaveBalance[`${leave.leaveType}Leaves`] += leave.workingDays;
//       await leaveBalance.save();
//     }
//   }

//   // If status is being changed to Approved, deduct the leaves
//   if (leave.status !== "Approved" && status === "Approved") {
//     let leaveBalance = await LeaveBalance.findOne({ 
//       user: leave.user, 
//       year: new Date(leave.startDate).getFullYear() 
//     });
    
//     // Create leave balance record if it doesn't exist
//     if (!leaveBalance) {
//       leaveBalance = await LeaveBalance.create({
//         user: leave.user,
//         organization: leave.organization,
//         year: new Date(leave.startDate).getFullYear(),
//       });
//     }
    
//     if (leave.leaveType !== "unpaid") {
//       if (leaveBalance[`${leave.leaveType}Leaves`] < leave.workingDays) {
//         return res.status(400).json({
//           success: false,
//           message: `Insufficient ${leave.leaveType} leave balance. Cannot approve leave.`,
//         });
//       }
      
//       leaveBalance[`${leave.leaveType}Leaves`] -= leave.workingDays;
//       await leaveBalance.save();
//     }
//   }

//   leave.status = status;
//   leave.approvedBy = req.user._id;
//   leave.rejectionReason = status === "Rejected" ? rejectionReason : undefined;

//   await leave.save();

//   // TODO: Notify the user who applied for leave about the status change.

//   res.status(200).json({ success: true, data: leave });
// };
export const updateLeaveStatus = async (req, res, next) => {
  const { status, rejectionReason } = req.body;

  if (!status || !["Approved", "Rejected", "Cancelled"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid status ('Approved', 'Rejected', or 'Cancelled').",
    });
  }

  if (status === "Rejected" && !rejectionReason) {
    return res.status(400).json({
      success: false,
      message: "Please provide a reason for rejection.",
    });
  }

  const Leave = req.tenantConn.model("Leave");
  const LeaveBalance = req.tenantConn.model("LeaveBalance");
  
  let leave = await Leave.findById(req.params.id).populate("user");

  if (!leave) {
    return res.status(404).json({
      success: false,
      message: `Leave not found with id of ${req.params.id}`,
    });
  }

  // If status is being changed from Approved to something else, add back the leaves
  if (leave.status === "Approved" && status !== "Approved") {
    const leaveBalance = await LeaveBalance.findOne({ 
      user: leave.user._id, 
      year: new Date(leave.startDate).getFullYear() 
    });
    
    if (leaveBalance && leave.leaveType !== "unpaid") {
      leaveBalance[`${leave.leaveType}Leaves`] += leave.workingDays;
      await leaveBalance.save();
    }
  }

  // If status is being changed to Approved, deduct the leaves
  if (leave.status !== "Approved" && status === "Approved") {
    let leaveBalance = await LeaveBalance.findOne({ 
      user: leave.user._id, 
      year: new Date(leave.startDate).getFullYear() 
    });
    
    // Create leave balance record if it doesn't exist (with default values)
    if (!leaveBalance) {
      const LeavePolicy = req.tenantConn.model("LeavePolicy");
      const policy = await LeavePolicy.findOne({
        organization: req.user.organization,
        year: new Date(leave.startDate).getFullYear()
      });
      
      leaveBalance = await LeaveBalance.create({
        user: leave.user._id,
        organization: leave.organization,
        year: new Date(leave.startDate).getFullYear(),
        paidLeaves: policy ? policy.paidLeaves : 12,
        sickLeaves: policy ? policy.sickLeaves : 8,
        emergencyLeaves: policy ? policy.emergencyLeaves : 4,
      });
    }
    
    if (leave.leaveType !== "unpaid") {
      if (leaveBalance[`${leave.leaveType}Leaves`] < leave.workingDays) {
        return res.status(400).json({
          success: false,
          message: `Insufficient ${leave.leaveType} leave balance. Cannot approve leave.`,
        });
      }
      
      leaveBalance[`${leave.leaveType}Leaves`] -= leave.workingDays;
      await leaveBalance.save();
    }
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


// @desc    Get leave balance for user
// @route   GET /api/v1/leaves/balance
// @access  Private
export const getLeaveBalance = async (req, res) => {
  try {
    const LeaveBalance = req.tenantConn.model("LeaveBalance");
    const year = req.query.year || new Date().getFullYear();
    
    const leaveBalance = await LeaveBalance.findOne({ 
      user: req.user._id, 
      year: parseInt(year) 
    });
    
    // If no record exists, create one with default values
    if (!leaveBalance) {
      const defaultBalance = await LeaveBalance.create({
        user: req.user._id,
        organization: req.user.organization,
        year: parseInt(year),
        paidLeaves: 12, // Default paid leaves
        sickLeaves: 8,  // Default sick leaves
        emergencyLeaves: 4, // Default emergency leaves
      });
      
      return res.status(200).json({
        success: true,
        data: defaultBalance,
      });
    }
    
    res.status(200).json({
      success: true,
      data: leaveBalance,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


// @desc    Update leave balance (Admin only)
// @route   PUT /api/v1/leaves/balance/:userId
// @access  Private (Admin)
export const updateLeaveBalance = async (req, res) => {
  try {
    const { paidLeaves, sickLeaves, emergencyLeaves, year } = req.body;
    const userId = req.params.userId;
    
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can update leave balances",
      });
    }
    
    const LeaveBalance = req.tenantConn.model("LeaveBalance");
    const selectedYear = year || new Date().getFullYear();
    
    let leaveBalance = await LeaveBalance.findOne({ 
      user: userId, 
      year: parseInt(selectedYear) 
    });
    
    if (!leaveBalance) {
      leaveBalance = await LeaveBalance.create({
        user: userId,
        organization: req.user.organization,
        year: parseInt(selectedYear),
        paidLeaves: paidLeaves || 0,
        sickLeaves: sickLeaves || 0,
        emergencyLeaves: emergencyLeaves || 0,
      });
    } else {
      if (paidLeaves !== undefined) leaveBalance.paidLeaves = paidLeaves;
      if (sickLeaves !== undefined) leaveBalance.sickLeaves = sickLeaves;
      if (emergencyLeaves !== undefined) leaveBalance.emergencyLeaves = emergencyLeaves;
      
      await leaveBalance.save();
    }
    
    res.status(200).json({
      success: true,
      data: leaveBalance,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};