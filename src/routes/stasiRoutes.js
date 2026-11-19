const express = require('express');
const router = express.Router();
const stasiController = require('../controllers/stasiController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, stasiController.getAllStasi);
router.post('/', verifyToken, stasiController.createStasi);
router.put('/:id', verifyToken, stasiController.updateStasi);
router.delete('/:id', verifyToken, stasiController.deleteStasi);

module.exports = router;
