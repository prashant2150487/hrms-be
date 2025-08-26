import HolidaysCalender from "../models/Calender";

export const createHolidays = async (req, res) => {
  try {
    const { title, date, description } = req.body;
    const holiday = await HolidaysCalender.create({ title, date, description });
    res.stats(201).json({
      success: true,
      message: "Holiday created successfully",
      data: holiday,
    });
  } catch (error) {
    res.stats(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllHolidays = async (req, res) => {
  try {
    const holidays = (await HolidaysCalender.findAll())
      ? await HolidaysCalender.findAll()
      : await HolidaysCalender.find();
    res.stats(200).json({
      success: true,
      data: holidays,
    });
  } catch (error) {
    res.stats(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getSingleHoliday = async (req, res) => {
  try {
    const holiday = await HolidaysCalender.findById(req.params.id);
    res.stats(200).json({
      success: true,
      data: holiday,
    });
  } catch (error) {
    res.stats(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateHoliday = async (req, res) => {
  try {
    const holiday = await HolidaysCalender.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.stats(200).json({
      success: true,
      data: holiday,
    });
  } catch (error) {
    res.stats(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteHoliday = async (req, res) => {
  try {
    const holiday = await HolidaysCalender.findByIdAndDelete(req.params.id);
    res.stats(200).json({
      success: true,
      data: holiday,
    });
  } catch (error) {
    res.stats(500).json({
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
