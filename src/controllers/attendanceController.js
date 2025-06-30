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
      return res.status(404).json({ success: false, message: "Organization not found" });
    }

    const tenantConn = await createTenantDatabase(organization.subdomain);
    const TenantAttendance = tenantConn.model("Attendance");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Check for open session
    const openSession = await TenantAttendance.findOne({
      user: req.user.id,
      clockIn: { $gte: today, $lt: tomorrow },
      clockOut: null,
    });

    if (openSession) {
      return res.status(400).json({
        success: false,
        message: "You are already clocked in. Please clock out first.",
      });
    }

    const now = new Date();

    const attendance = await TenantAttendance.create({
      user: req.user.id,
      organization: req.user.organization,
      date: now,
      clockIn: now,
      clockOut: null,
      workingHours: 0, // This is for this session only; accumulated later
      status: "present",
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
    });

    res.status(201).json({
      success: true,
      data: attendance,
      message: "Clocked in successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


// @desc    Clock out for the day
// @route   POST /api/v1/attendance/clock-out
// @access  Private

export const clockOut = async (req, res) => {
  try {
    const organization = await Organization.findById(req.user.organization);
    if (!organization) {
      return res.status(404).json({ success: false, message: "Organization not found" });
    }

    const tenantConn = await createTenantDatabase(organization.subdomain);
    const TenantAttendance = tenantConn.model("Attendance");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Find last open session
    const attendance = await TenantAttendance.findOne({
      user: req.user.id,
      clockIn: { $gte: today, $lt: tomorrow },
      clockOut: null,
    });

    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: "You are not currently clocked in.",
      });
    }

    const clockOutTime = new Date();
    const sessionHours = (clockOutTime - attendance.clockIn) / (1000 * 60 * 60);

    // Update the session
    attendance.clockOut = clockOutTime;
    attendance.workingHours = sessionHours;
    await attendance.save();

    // Sum of all today's sessions
    const allTodaySessions = await TenantAttendance.find({
      user: req.user.id,
      clockIn: { $gte: today, $lt: tomorrow },
      clockOut: { $ne: null },
    });

    const totalWorkingHours = allTodaySessions.reduce((acc, s) => acc + s.workingHours, 0);

    // Optional: update status somewhere, or return total working hours
    res.status(200).json({
      success: true,
      data: attendance,
      totalWorkingHours,
      message: "Clocked out successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @desc    Get today's attendance status
// @route   GET /api/v1/attendance/status
// @access  Private
export const attendanceStatus = async (req, res) => {
  try {
    const organization = await Organization.findById(req.user.organization);
    if (!organization) {
      return res.status(404).json({ success: false, message: "Organization not found" });
    }

    const tenantConn = await createTenantDatabase(organization.subdomain);
    const TenantAttendance = tenantConn.model("Attendance");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const sessions = await TenantAttendance.find({
      user: req.user.id,
      clockIn: { $gte: today, $lt: tomorrow },
    });

    const openSession = sessions.find((s) => !s.clockOut);
    const totalWorkingHours = sessions.reduce((acc, s) => acc + (s.workingHours || 0), 0);

    if (sessions.length === 0) {
      return res.status(200).json({
        success: true,
        status: "not_clocked_in",
        isClockIn: false,
        isClockOut: false,
        message: "You have not clocked in today",
      });
    }

    if (openSession) {
      return res.status(200).json({
        success: true,
        status: "clocked_in",
        isClockIn: true,
        isClockOut: false,
        message: "You are currently clocked in",
        clockInTime: openSession.clockIn,
        totalWorkingHours,
      });
    }

    return res.status(200).json({
      success: true,
      status: "clocked_out",
      isClockIn: false,
      isClockOut: true,
      message: "You have completed your attendance for today",
      totalWorkingHours,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
