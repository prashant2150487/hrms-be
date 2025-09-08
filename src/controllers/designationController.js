import Designation from "../models/Designation.js";

// Create Designation
export const createDesignation = async (req, res) => {
  try {
    const { title, level, department, description } = req.body;
    const designation = await Designation.create({
      title,
      level,
      department,
      description,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: designation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get All Designations
export const getDesignations = async (req, res) => {
  try {
    const designations = await Designation.find({ isActive: true }).populate(
      "department"
    );
    res.status(200).json({ success: true, data: designations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get Single Designation
export const getDesignation = async (req, res) => {
  try {
    const designation = await Designation.findById(req.params.id).populate(
      "department"
    );
    if (!designation)
      return res
        .status(404)
        .json({ success: false, message: "Designation not found" });
    res.status(200).json({ success: true, data: designation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update Designation
export const updateDesignation = async (req, res) => {
  try {
    const designation = await Designation.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user._id },
      { new: true }
    );
    if (!designation)
      return res
        .status(404)
        .json({ success: false, message: "Designation not found" });
    res.status(200).json({ success: true, data: designation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete Designation (soft delete)
export const deleteDesignation = async (req, res) => {
  try {
    const designation = await Designation.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedBy: req.user._id },
      { new: true }
    );
    if (!designation)
      return res
        .status(404)
        .json({ success: false, message: "Designation not found" });
    res.status(200).json({ success: true, message: "Designation deactivated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
