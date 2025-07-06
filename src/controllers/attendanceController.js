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
      return res
        .status(404)
        .json({ success: false, message: "Organization not found" });
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



// @desc    Get attendance summary for last 30 days (today + previous 29 days)
// @route   GET /api/v1/attendance/status/summary
// @access  Private
export const getAttendanceSummary = async (req, res) => {
  try {
    const organization = await Organization.findById(req.user.organization);
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found"
      });
    }

    const tenantConn = await createTenantDatabase(organization.subdomain);
    const TenantAttendance = tenantConn.model("Attendance");

    // Set up date range (today and previous 29 days)
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999); // End of today

    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 29);
    startDate.setHours(0, 0, 0, 0); // Start of day 30 days ago

    // Get all attendance records in this date range
    const allSessions = await TenantAttendance.find({
      user: req.user.id,
      clockIn: { $gte: startDate, $lte: endDate }
    }).sort({ clockIn: 1 });

    // Organize data by day
    const dailySummaries = {};
    const now = new Date();

    // Initialize all dates in range (to include days with no attendance)
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      dailySummaries[dateKey] = {
        date: new Date(d),
        status: 'absent',
        totalHours: 0,
        sessions: [],
        isToday: d.toDateString() === now.toDateString()
      };
    }

    // Process all sessions and populate daily summaries
    allSessions.forEach(session => {
      const sessionDate = new Date(session.clockIn);
      const dateKey = sessionDate.toISOString().split('T')[0];
      
      if (!dailySummaries[dateKey]) {
        dailySummaries[dateKey] = {
          date: new Date(sessionDate),
          status: 'absent',
          totalHours: 0,
          sessions: [],
          isToday: sessionDate.toDateString() === now.toDateString()
        };
      }

      const daySummary = dailySummaries[dateKey];
      
      // Add session to day
      const sessionData = {
        clockIn: session.clockIn,
        clockOut: session.clockOut,
        hours: session.workingHours || 0,
        location: session.location
      };
      
      daySummary.sessions.push(sessionData);
      daySummary.totalHours += sessionData.hours;

      // Update day status
      if (sessionData.hours > 0) {
        if (!session.clockOut) {
          daySummary.currentStatus = 'clocked_in';
        } else if (daySummary.currentStatus !== 'clocked_in') {
          daySummary.currentStatus = 'clocked_out';
        }

        if (daySummary.totalHours >= 8) {
          daySummary.status = 'present';
        } else if (daySummary.totalHours >= 4) {
          daySummary.status = 'half-day';
        }
      }
    });

    // Convert to array sorted by date (newest first)
    const summaryArray = Object.values(dailySummaries)
      .sort((a, b) => b.date - a.date);

    // Calculate overall stats
    const presentDays = summaryArray.filter(d => d.status === 'present').length;
    const halfDays = summaryArray.filter(d => d.status === 'half-day').length;
    const absentDays = summaryArray.filter(d => d.status === 'absent').length;
    const totalWorkingHours = summaryArray.reduce((sum, day) => sum + day.totalHours, 0);

    res.status(200).json({
      success: true,
      data: {
        startDate,
        endDate,
        totalDays: summaryArray.length,
        presentDays,
        halfDays,
        absentDays,
        totalWorkingHours,
        dailySummaries: summaryArray,
        todaySummary: summaryArray.find(d => d.isToday) || null
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};