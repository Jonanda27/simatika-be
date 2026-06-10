const express = require('express');
const router = express.Router();
const mutationController = require('../controllers/mutationController');

router.get('/', mutationController.getAll);
router.get('/:id', mutationController.getById);
router.delete('/:id', mutationController.delete);

module.exports = router;
