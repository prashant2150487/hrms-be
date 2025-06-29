import express from "express";
import { protect } from "../middleware/auth.js";
import { clockOut, webClockIn } from "../controllers/attendanceController.js";

const router = express.Router();
router.post("/webCLockIn", protect, webClockIn);
router.post("/webClockOut", protect, clockOut);
export default router;
