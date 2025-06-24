// import express from 'express';
// // const {
// //   getOrganization,
// //   updateOrganization,
// //   uploadLogo,
// //   getOrganizationUsers,
// //   getOrganizationStats,
// //   updateSubscription,
// //   getSubscription
// // } = require('../controllers/organizationController');
// const { protect, authorize } = require('../middlewares/auth');

// const router = express.Router();

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