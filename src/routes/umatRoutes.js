const express = require('express');
const router = express.Router();
const umatController = require('../controllers/umatController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, umatController.getAll);
router.get('/:id', verifyToken, umatController.getById);
router.delete('/:id', verifyToken, umatController.delete);

module.exports = router;
