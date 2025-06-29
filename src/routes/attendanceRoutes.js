import express from "express";
import { protect } from "../middleware/auth.js";
import {
  attendanceStatus,
  clockOut,
  webClockIn,
} from "../controllers/attendanceController.js";

const router = express.Router();
router.post("/webCLockIn", protect, webClockIn);
router.post("/webClockOut", protect, clockOut);
router.get("/status", protect, attendanceStatus);
export default router;
