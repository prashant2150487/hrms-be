import express from "express";
import { authorize, protect } from "../middleware/auth.js";
import {
  applyForLeave,
  getAllLeaves,
  getAllLeavesByUser,
  getLeaveById,
  notifyUser,
  updateLeaveStatus,
  // getLeaveById,
  // updateLeaveStatus,
} from "../controllers/leaveController.js";

const router = express.Router();

// All routes below are protected
router.post("/apply-leave", protect, applyForLeave);
router.get("/notifyUser", protect, notifyUser);
router.get("/all-leaves", protect, authorize("admin"), getAllLeaves);
router.get("/my", protect, getAllLeavesByUser);
router.get("/:id", protect, getLeaveById);
router.put(
  "/:id/status",
  protect,
  authorize("admin", "manager", "teamlead"),
  updateLeaveStatus
);



export default router;
