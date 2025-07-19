import express from "express";

import {
  forgotPassword,
  getMe,
  login,
  resetPassword,
} from "../controllers/authControllers.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/login", login);
router.get("/getme", protect, getMe);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:resetToken", resetPassword);

export default router;
