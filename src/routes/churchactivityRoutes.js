const express = require('express');
const router = express.Router();
const churchactivityController = require('../controllers/churchactivityController');

router.get('/', churchactivityController.getAll);
router.get('/:id', churchactivityController.getById);
router.delete('/:id', churchactivityController.delete);

module.exports = router;
