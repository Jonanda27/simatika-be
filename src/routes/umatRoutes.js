const express = require('express');
const router = express.Router();
const umatController = require('../controllers/umatController');

router.get('/', umatController.getAll);
router.get('/:id', umatController.getById);

module.exports = router;
