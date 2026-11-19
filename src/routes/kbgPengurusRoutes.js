const express = require('express');
const router = express.Router();
const kbgPengurusController = require('../controllers/kbgPengurusController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Get pengurus for a specific KBG
router.get('/:kbg_id', kbgPengurusController.getByKbgId);

// Protected routes (Admin Stasi, Admin Paroki, Ketua KBG)
router.use(verifyToken);
router.post('/', kbgPengurusController.create);
router.put('/:id', kbgPengurusController.update);
router.delete('/:id', kbgPengurusController.delete);

module.exports = router;
