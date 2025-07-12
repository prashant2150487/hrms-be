import express from "express";
import { createUser, deactivateUser, getAllUsers, getUser } from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.post("/users", protect, createUser);
router.get("/users", protect, getAllUsers);
router.delete("/users/:id",protect,deactivateUser)

export default router;
