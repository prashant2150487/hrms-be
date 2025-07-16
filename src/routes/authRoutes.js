import express from "express";


import { forgotPassword, getMe, login } from "../controllers/authControllers.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/login", login);
router.get("/getme", protect, getMe);
router.post("/forgot-password", forgotPassword);

export default router;
