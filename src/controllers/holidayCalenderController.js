import HolidaysCalender from "../models/Calender.js";

export const createHoliday = async (req, res) => {
  try {
    const { title, date, description } = req.body;
    if (!title || !date) {
      return res.status(400).json({
        success: false,
        message: "Please provide title and date.",
      });
    }
    const holiday = req.tenantConn.model("HolidaysCalender");
    const existingHolidays = await holiday.findOne({
      title: title,
    });
    if (existingHolidays) {
      return res.status(400).json({
        success: false,
        message: "A holiday with the same title and date already exists.",
      });
    }

    const response = await holiday.create({ title, date, description });
    res.status(201).json({
      success: true,
      message: "Holiday created successfully",
      data: response,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllHolidays = async (req, res) => {
  try {
    const holiday = req.tenantConn.model("HolidaysCalender");
    const holidays = await holiday.find();
    res.status(200).json({
      success: true,
      data: holidays,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getSingleHoliday = async (req, res) => {
  try {
    const HolidaysCalender = req.tenantConn.model("HolidaysCalender");
    const holiday = await HolidaysCalender.findById(req.params.id);
    // Check if holiday exists
    if (!holiday) {
      return res.status(404).json({
        success: false,
        message: "Holiday not found",
      });
    }
    res.status(200).json({
      success: true,
      data: holiday,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve holiday",
    });
  }
};

export const updateHoliday = async (req, res) => {
  try {
    const HolidaysCalender = req.tenantConn.model("HolidaysCalender");
    const holiday = await HolidaysCalender.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.status(200).json({
      success: true,
      data: holiday,
      message: "Holiday update successfully."
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteHoliday = async (req, res) => {
  try {
    const HolidaysCalender = req.tenantConn.model("HolidaysCalender");
    const holiday = await HolidaysCalender.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: "Holiday deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete holiday",
    });
  }
};
// @desc    Get holidays for a specific date range
// @route   GET /api/v1/holidays/range
// @access  Private
export const getHolidaysInRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Please provide startDate and endDate parameters.",
      });
    }
    
    const HolidaysCalender = req.tenantConn.model("HolidaysCalender");
    const holidays = await HolidaysCalender.find({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    });
    
    res.status(200).json({
      success: true,
      count: holidays.length,
      data: holidays,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// @desc    Check if a date is a holiday
// @route   GET /api/v1/holidays/check
// @access  Private
export const checkHoliday = async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Please provide a date parameter.",
      });
    }
    
    const HolidaysCalender = req.tenantConn.model("HolidaysCalender");
    const holiday = await HolidaysCalender.findOne({
      date: new Date(date),
    });
    
    res.status(200).json({
      success: true,
      isHoliday: !!holiday,
      data: holiday || null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



// {
//   "title": "Independence Day",
//   "date": "2025-08-15",
//   "description": "National Holiday",
//   "createdBy": "64f7c8a8e8e1ab12c9a34567"
// }
