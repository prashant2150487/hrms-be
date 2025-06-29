import express from "express";
// const {
//   login,
//   getMe,
//   forgotPassword,
// } = require("../controllers/authController");
// const { protect } = require("../middlewares/auth");

import { getMe, login } from "../controllers/authControllers.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/login", login);
router.get("/getme", protect, getMe);
// router.post("/forgotpassword", forgotPassword);

// module.exports = router;
export default router;
