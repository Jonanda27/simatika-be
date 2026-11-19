const express = require('express');
const router = express.Router();
const draftController = require('../controllers/draftController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.post('/import', draftController.importDrafts);
router.get('/', draftController.getDraftsByKbg);
router.delete('/:id', draftController.deleteDraft);

module.exports = router;
