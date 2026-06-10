const express = require('express');
const router = express.Router();
const syncController = require('../controllers/syncController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');

// Configure multer for memory storage (buffer)
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/sync
router.post('/', authMiddleware.verifyToken, upload.any(), syncController.syncFamilyData);

// PUT /api/sync/:id
router.put('/:id', authMiddleware.verifyToken, upload.any(), syncController.updateFamilyData);

module.exports = router;
