import express from "express";
import {
  createDesignation,
  getDesignations,
  getDesignation,
  updateDesignation,
  deleteDesignation,
} from "../controllers/designationController.js";
import { protect } from "../middleware/auth.js"; // If you have authentication

const router = express.Router();

router.post("/", protect, createDesignation); // Create
router.get("/", protect, getDesignations); // List all
router.get("/:id", protect, getDesignation); // Get one
router.put("/:id", protect, updateDesignation); // Update
router.delete("/:id", protect, deleteDesignation); // Soft delete

export default router;
