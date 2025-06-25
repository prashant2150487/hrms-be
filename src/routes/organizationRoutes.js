


// router.use(protect);
// router.use(authorize('admin'));

// router.route('/')
//   .get(getOrganization)
//   .put(updateOrganization);

// router.route('/logo').put(uploadLogo);
// router.route('/users').get(getOrganizationUsers);
// router.route('/stats').get(getOrganizationStats);
// router.route('/subscription')
//   .get(getSubscription)
//   .put(updateSubscription);

// module.exports = router;
import express from 'express';
import { getOrganization } from '../controllers/organizationController.js';
import { protect } from '../middleware/auth.js';
const router =express.Router()
// router.post("/organization/onboard",onboardEmployee)
router.get("/organization", protect, getOrganization)


export default router;
