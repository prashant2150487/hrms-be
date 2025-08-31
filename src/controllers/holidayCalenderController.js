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
// {
//   "title": "Independence Day",
//   "date": "2025-08-15",
//   "description": "National Holiday",
//   "createdBy": "64f7c8a8e8e1ab12c9a34567"
// }
