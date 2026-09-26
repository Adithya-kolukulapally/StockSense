const express = require('express');
const router = express.Router();
const {
    getDashboardSummary,
    getDashboardOperations
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/summary', getDashboardSummary);
router.get('/operations', getDashboardOperations);

module.exports = router;
