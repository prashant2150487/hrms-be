import express from "express";
import {
  createUser,
  deactivateUser,
  getAllUsers,
  getUser,
} from "../controllers/userController.js";
import { authorize, protect } from "../middleware/auth.js";

const router = express.Router();
router.post("/users", protect, authorize("admin"), createUser);
router.get("/users", protect, authorize("admin"), getAllUsers);
router.delete("/users/:id", protect, authorize("admin"), deactivateUser);

export default router;
