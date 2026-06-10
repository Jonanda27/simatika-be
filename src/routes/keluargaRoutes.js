const express = require('express');
const router = express.Router();
const keluargaController = require('../controllers/keluargaController');

router.get('/', keluargaController.getAll);
router.get('/:id', keluargaController.getById);

module.exports = router;
