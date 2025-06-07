const express = require('express');
const router = express.Router();
const gymController = require('../controllers/gymController');

router.post('/create-gym-house', gymController.createGymHouse);
router.put('/membership-update', gymController.updateMembership);

module.exports = router;