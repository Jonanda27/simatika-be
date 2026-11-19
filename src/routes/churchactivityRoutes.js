const express = require('express');
const router = express.Router();
const churchactivityController = require('../controllers/churchactivityController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, churchactivityController.getAll);
router.get('/:id', verifyToken, churchactivityController.getById);
router.delete('/:id', verifyToken, churchactivityController.delete);

module.exports = router;
