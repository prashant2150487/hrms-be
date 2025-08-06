import express from "express";
import { protect } from "../middleware/auth.js";
import {
  applyForLeave,
  // getAllLeaves,
  // getLeaveById,
  // updateLeaveStatus,
} from "../controllers/leaveController.js";

const router = express.Router();

// All routes below are protected
router.use(protect);
router.post(
  "/apply-leave",
  protect,
  applyForLeave
);

// router.route("/:id").get(getLeaveById);

// router.route("/:id/status").put(authorize("admin", "manager"), updateLeaveStatus);

export default router;
