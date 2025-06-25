import {
  createOrganization,
  deleteOrganization,
  getAllOrganizations,
  getOrganization,
  getOrganizationBySubdomain,
  updateOrganization,
} from "../controllers/superAdminController.js";
import express from "express";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.post("/organization", createOrganization);
router.get("/organization", getAllOrganizations);
router.get("/organization/:id", getOrganization);
router.put("/organization/:id", updateOrganization);
router.delete("/organization/:id", deleteOrganization)
router.get("/organization/subdomain/:subdomain", getOrganizationBySubdomain);






// router.use(protect);
// router.use(authorize('superadmin'));

// router
//   .route('/organizations')
//   .post(createOrganization)
//   .get(getOrganizations);

// router
//   .route('/organizations/:id')
//   .put(updateOrganization)
//   .delete(deleteOrganization);

export default router;
