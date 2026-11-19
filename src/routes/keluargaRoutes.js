const express = require('express');
const router = express.Router();
const keluargaController = require('../controllers/keluargaController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/public/search', keluargaController.publicSearch);
router.get('/public/:id', keluargaController.getById);
router.get('/', verifyToken, keluargaController.getAll);
router.get('/:id', verifyToken, keluargaController.getById);
router.delete('/:id', verifyToken, keluargaController.delete);

module.exports = router;
