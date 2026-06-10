const express = require('express');
const router = express.Router();
const sacramentController = require('../controllers/sacramentController');

router.get('/', sacramentController.getAll);
router.get('/:id', sacramentController.getById);
router.delete('/:id', sacramentController.delete);

module.exports = router;
