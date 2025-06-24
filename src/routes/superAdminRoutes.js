import { createOrganization, getAllOrganizations } from "../controllers/superAdminController.js";
import express from "express"

// const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();
router.post("/organization",createOrganization)
router.get("/organization/:id",getAllOrganizations)

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