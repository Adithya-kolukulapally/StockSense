const express = require('express');
const router = express.Router();
const {
    getLocations,
    createLocation,
    updateLocation,
    deleteLocation
} = require('../controllers/locationController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
    .get(getLocations)
    .post(authorize('inventory_manager'), createLocation);

router.route('/:id')
    .put(authorize('inventory_manager'), updateLocation)
    .delete(authorize('inventory_manager'), deleteLocation);

module.exports = router;
