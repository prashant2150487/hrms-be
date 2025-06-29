import Organization from "../models/Organization.js";
import { createTenantDatabase } from "../utils/tenantService.js";
import Attendance from "../models/Attendance.js";
// @desc    Clock in for the day
// @route   POST /api/v1/attendance/clock-in
// @access  Private
export const webClockIn = async (req, res) => {
  try {
    const { longitude, latitude } = req.body || {};
    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: "Longitude and latitude are required.",
      });
    }
    const organization = await Organization.findById(req.user.organization);
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }
    //connect to tenut detabase
    const tenantConn = await createTenantDatabase(organization.subdomain);
    const TenantAttendance = tenantConn.model("Attendance");

    //check if already webclockin today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existingAttendance = await TenantAttendance.findOne({
      user: req.user.id,
      clockIn: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: "you have already clocked in today",
      });
    }

    const now = new Date();
    // Create new attendance record
    const attendance = await TenantAttendance.create({
      user: req.user.id,
      organization: req.user.organization,
      clockIn: now,
      date: now,
      clockOut: null, // default until updated later
      workingHours: 0, // will be updated on clock out
      status: "present",

      location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
    });
    res.status(201).json({
      success: true,
      data: attendance,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// @desc    Clock out for the day
// @route   POST /api/v1/attendance/clock-out
// @access  Private

export const clockOut = async (req, res) => {
  try {
    const organization = await Organization.findById(req.user.organization);
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    const tenantConn = await createTenantDatabase(organization.subdomain);
    const TenantAttendance = tenantConn.model("Attendance");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const attendance = await TenantAttendance.findOne({
      user: req.user.id,
      organization: req.user.organization,
      clockIn: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "No attendance record found for today",
      });
    }

    if (attendance.clockOut) {
      return res.status(400).json({
        success: false,
        message: "You have already clocked out today",
      });
    }

    const clockOutTime = new Date();
    const workingHours = (clockOutTime - attendance.clockIn) / (1000 * 60 * 60);

    attendance.clockOut = clockOutTime;
    attendance.workingHours = workingHours;
    attendance.status = workingHours < 4 ? "half-day" : "present";

    await attendance.save();

    res.status(200).json({
      success: true,
      data: attendance,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get today's attendance status
// @route   GET /api/v1/attendance/status
// @access  Private
export const attendanceStatus = async (req, res) => {
  try {
    const organization = await Organization.findById(req.user.organization);
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    const tenantConn = await createTenantDatabase(organization.subdomain);
    const TenantAttendance = tenantConn.model("Attendance");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const attendance = await TenantAttendance.findOne({
      user: req.user.id,
      clockIn: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    // Not clocked in
    if (!attendance) {
      return res.status(200).json({
        success: true,
        status: "not_clocked_in",
        isClockIn: false,
        isClockOut: false,
        message: "You have not clocked in today",
      });
    }

    // Clocked in but not out
    if (!attendance.clockOut) {
      return res.status(200).json({
        success: true,
        status: "clocked_in",
        isClockIn: true,
        isClockOut: false,
        message: "You are currently clocked in but not yet clocked out",
        clockInTime: attendance.clockIn,
      });
    }

    // Fully done
    return res.status(200).json({
      success: true,
      status: "clocked_out",
      isClockIn: true,
      isClockOut: true,
      message: "You have clocked in and out today",
      clockInTime: attendance.clockIn,
      clockOutTime: attendance.clockOut,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
