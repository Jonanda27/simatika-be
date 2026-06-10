const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verificationController');

const { verifyToken } = require('../middlewares/authMiddleware');

// In a real app, add authentication & role-checking middlewares here
// e.g. router.get('/', authMiddleware, roleCheck(['Admin Stasi', 'Admin Paroki']), verificationController.getQueue);

router.get('/', verificationController.getQueue);
router.get('/my-submissions', verifyToken, verificationController.getMySubmissions);
router.post('/:id/verify-stasi', verificationController.verifyStasi);
router.post('/:id/approve-paroki', verificationController.approveParoki);
router.post('/:id/reject', verificationController.rejectData);

module.exports = router;
