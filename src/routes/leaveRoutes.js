import express from "express";
import { protect } from "../middleware/auth.js";
import {
  applyForLeave,
  notifyUser,
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
router.get("/notifyUser", protect, notifyUser);


// router.route("/:id").get(getLeaveById);

// router.route("/:id/status").put(authorize("admin", "manager"), updateLeaveStatus);

export default router;
