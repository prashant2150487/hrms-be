import express from "express";
import { authorize, protect } from "../middleware/auth.js";
import {
  applyPolicyToAllEmployees,
  getOrganizationLeavePolicy,
  setOrganizationLeavePolicy,
} from "../controllers/leavePolicyController.js";

const router = express.Router();

router.post("/set-policy", protect, authorize("admin"), setOrganizationLeavePolicy);
router.post("/apply", protect, applyPolicyToAllEmployees);
router.get("/", protect, authorize("admin"), getOrganizationLeavePolicy);
export default router;
