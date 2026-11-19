const express = require('express');
const router = express.Router();
const mutationController = require('../controllers/mutationController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, mutationController.getAll);
router.get('/:id', verifyToken, mutationController.getById);
router.delete('/:id', verifyToken, mutationController.delete);

module.exports = router;
