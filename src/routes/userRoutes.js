import express from "express";
import { createUser, getAllUsers, getUser } from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.post("/users", protect, createUser);
router.get("/users", protect, getAllUsers);

export default router;
