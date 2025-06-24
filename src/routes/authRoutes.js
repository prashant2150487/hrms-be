import express from 'express';
// const {
//   login,
//   getMe,
//   forgotPassword,
// } = require("../controllers/authController");
// const { protect } = require("../middlewares/auth");

import { login } from "../controllers/authControllers.js";

const router = express.Router();

router.post("/login", login);
// router.get("/me", protect, getMe);
// router.post("/forgotpassword", forgotPassword);

// module.exports = router;
export default router;
