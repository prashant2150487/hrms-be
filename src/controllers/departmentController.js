
import Department from "../models/Department.js";

// Create Department
export const createDepartment = async (req, res) => {
  try {
    const { name, description } = req.body;
    const department = await Department.create({
      name,
      description,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: department });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get All Departments
export const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true });
    res.status(200).json({ success: true, data: departments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
//get single designation
export const getDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const department = await Department.findById(id);
    if (!department) {
      return res
        .status(404)
        .json({ success: false, message: "Department not found" });
    }
    res.status(200).json({ success: true, data: department });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update Department
export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const department = await Department.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!department)
      return res
        .status(404)
        .json({ success: false, message: "Department not found" });
    res.status(200).json({ success: true, data: department });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete Department (soft delete)
export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const department = await Department.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    if (!department)
      return res
        .status(404)
        .json({ success: false, message: "Department not found" });
    res.status(200).json({ success: true, message: "Department deactivated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
