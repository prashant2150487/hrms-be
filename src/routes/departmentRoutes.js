import express from "express";
import {
  createDepartment,
  deleteDepartment,
  getDepartment,
  getDepartments,
  updateDepartment,
} from "../controllers/departmentController.js";
import { protect } from "../middleware/auth.js";
import { getDesignation } from "../controllers/designationController.js";

const router = express.Router();

router.post("/", protect, createDepartment); // Create
router.get("/", protect, getDepartments); // List all
router.get("/:id", protect, getDepartment); // Get one
router.put("/:id", protect, updateDepartment); // Update
router.delete("/:id", protect, deleteDepartment); // Soft delete

export default router;
