import express from 'express';
import { createUser } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';



const router=express.Router()
router.post("/users", protect , createUser)
export default router; 