// @desc    Set organization leave policy (Admin only)
// @route   POST /api/v1/leaves/policy
// @access  Private (Admin)
export const setOrganizationLeavePolicy = async (req, res) => {
  try {
    const { paidLeaves, sickLeaves, emergencyLeaves, year } = req.body;

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can set organization leave policy",
      });
    }

    const organizationId = req.user.organization;
    const selectedYear = year || new Date().getFullYear();

    const LeavePolicy = req.tenantConn.model("LeavePolicy");

    // Check if policy already exists for this year
    const existingPolicy = await LeavePolicy.findOne({
      organization: organizationId,
      year: selectedYear,
    });

    let policy;

    if (existingPolicy) {
      // Update existing policy
      if (paidLeaves !== undefined) existingPolicy.paidLeaves = paidLeaves;
      if (sickLeaves !== undefined) existingPolicy.sickLeaves = sickLeaves;
      if (emergencyLeaves !== undefined)
        existingPolicy.emergencyLeaves = emergencyLeaves;

      policy = await existingPolicy.save();
    } else {
      // Create new policy
      policy = await LeavePolicy.create({
        organization: organizationId,
        paidLeaves: paidLeaves || 12,
        sickLeaves: sickLeaves || 8,
        emergencyLeaves: emergencyLeaves || 4,
        year: selectedYear,
      });
    }

    res.status(200).json({
      success: true,
      message: "Organization leave policy updated successfully",
      data: policy,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
// @desc    Apply leave policy to all employees (Admin only)
// @route   POST /api/v1/leaves/policy/apply
// @access  Private (Admin)
export const applyPolicyToAllEmployees = async (req, res) => {
  try {
    const { year, resetBalances } = req.body;
    
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can apply leave policy to all employees",
      });
    }
    
    const organizationId = req.user.organization;
    const selectedYear = year || new Date().getFullYear();
    const shouldReset = resetBalances || false;
    
    const LeavePolicy = req.tenantConn.model("LeavePolicy");
    const LeaveBalance = req.tenantConn.model("LeaveBalance");
    const User = req.tenantConn.model("User");
    
    // Get the organization policy
    const policy = await LeavePolicy.findOne({
      organization: organizationId,
      year: selectedYear
    });
    
    if (!policy) {
      return res.status(404).json({
        success: false,
        message: "No leave policy found for this organization and year. Please set a policy first.",
      });
    }
    
    // Get all active employees in the organization
    const employees = await User.find({
      organization: organizationId,
      status: "active"
    }).select("_id");
    
    if (!employees.length) {
      return res.status(404).json({
        success: false,
        message: "No active employees found in this organization.",
      });
    }
    
    const employeeIds = employees.map(emp => emp._id);
    const results = {
      updated: 0,
      created: 0,
      total: employeeIds.length
    };
    
    // Apply policy to each employee
    for (const employeeId of employeeIds) {
      let leaveBalance = await LeaveBalance.findOne({
        user: employeeId,
        year: selectedYear
      });
      
      if (leaveBalance) {
        // Update existing balance if reset is requested or keep current values if not
        if (shouldReset) {
          leaveBalance.paidLeaves = policy.paidLeaves;
          leaveBalance.sickLeaves = policy.sickLeaves;
          leaveBalance.emergencyLeaves = policy.emergencyLeaves;
        } else {
          // Only update if the policy values are higher than current balance
          if (policy.paidLeaves > leaveBalance.paidLeaves) {
            leaveBalance.paidLeaves = policy.paidLeaves;
          }
          if (policy.sickLeaves > leaveBalance.sickLeaves) {
            leaveBalance.sickLeaves = policy.sickLeaves;
          }
          if (policy.emergencyLeaves > leaveBalance.emergencyLeaves) {
            leaveBalance.emergencyLeaves = policy.emergencyLeaves;
          }
        }
        await leaveBalance.save();
        results.updated++;
      } else {
        // Create new balance record
        await LeaveBalance.create({
          user: employeeId,
          organization: organizationId,
          year: selectedYear,
          paidLeaves: policy.paidLeaves,
          sickLeaves: policy.sickLeaves,
          emergencyLeaves: policy.emergencyLeaves
        });
        results.created++;
      }
    }
    
    res.status(200).json({
      success: true,
      message: `Leave policy applied to ${results.total} employees. ${results.created} new records created, ${results.updated} existing records updated.`,
      data: results,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
// @desc    Get organization leave policy
// @route   GET /api/v1/leaves/policy
// @access  Private (Admin)
// export const getOrganizationLeavePolicy = async (req, res) => {
//   try {
//     const { year } = req.query;
    
//     if (req.user.role !== "admin") {
//       return res.status(403).json({
//         success: false,
//         message: "Only admin can view organization leave policy",
//       });
//     }
    
//     const organizationId = req.user.organization;
//     const selectedYear = year || new Date().getFullYear();
    
//     const LeavePolicy = req.tenantConn.model("LeavePolicy");
    
//     const policy = await LeavePolicy.findOne({
//       organization: organizationId,
//       year: selectedYear
//     });
    
//     if (!policy) {
//       return res.status(404).json({
//         success: false,
//         message: "No leave policy found for this organization and year.",
//       });
//     }
    
//     res.status(200).json({
//       success: true,
//       data: policy,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({
//       success: false,
//       message: "Server Error",
//     });
//   }
// };
export const getOrganizationLeavePolicy = async (req, res) => {
  try {
    const { year } = req.query;

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can view organization leave policy",
      });
    }

    const organizationId = req.user.organization;
    const LeavePolicy = req.tenantConn.model("LeavePolicy");

    let policies;

    if (year) {
      // fetch for specific year
      policies = await LeavePolicy.findOne({
        organization: organizationId,
        year: year,
      });
      if (!policies) {
        return res.status(404).json({
          success: false,
          message: `No leave policy found for year ${year}.`,
        });
      }
    } else {
      // fetch all leave policies for organization
      policies = await LeavePolicy.find({
        organization: organizationId,
      }).sort({ year: -1 }); // optional: latest year first

      if (!policies.length) {
        return res.status(404).json({
          success: false,
          message: "No leave policies found for this organization.",
        });
      }
    }

    res.status(200).json({
      success: true,
      data: policies,
    });
  } catch (err) {
    console.error("Error fetching leave policy:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
