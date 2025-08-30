import express from "express";
import {
  createHoliday,
  getAllHolidays,
  getSingleHoliday,
} from "../controllers/holidayCalenderController.js";
import { authorize, protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/create-holiday", protect, authorize("admin"), createHoliday);
router.get("/all-holidays", protect, getAllHolidays);
router.get("/:id", protect, getSingleHoliday);

export default router;
