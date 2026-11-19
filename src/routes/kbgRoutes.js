const express = require('express');
const router = express.Router();
const kbgController = require('../controllers/kbgController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.use(verifyToken);
router.get('/', kbgController.getAllKbgs);
router.post('/', kbgController.createKbg);
router.put('/:id', kbgController.updateKbg);
router.put('/:id/location', kbgController.updateKbgLocation);
router.delete('/:id', kbgController.deleteKbg);

module.exports = router;
