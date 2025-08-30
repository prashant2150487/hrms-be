import express from "express";
import {
  createHoliday,
  deleteHoliday,
  getAllHolidays,
  getSingleHoliday,
  updateHoliday,
} from "../controllers/holidayCalenderController.js";
import { authorize, protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/create-holiday", protect, authorize("admin"), createHoliday);
router.get("/all-holidays", protect, getAllHolidays);
router.get("/:id", protect, getSingleHoliday);
router.put("/:id", protect, authorize("admin"), updateHoliday);
router.delete("/:id", protect, authorize("admin"), deleteHoliday);

export default router;
