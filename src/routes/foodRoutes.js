const express = require('express');
const router = express.Router();
const foodController = require('../controllers/foodController');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const {
  create: foodCreateValidator,
  allowedFields: foodAllowed,
} = require('../validators/foodValidators');
const strict = require('../validators/strictValidator');
const requireAdmin = require('../middlewares/requireAdmin');

router.post(
  '/',
  auth,
  strict(foodAllowed),
  foodCreateValidator,
  validate,
  foodController.createFood
);
router.get('/', auth, foodController.getFoods);
router.put(
  '/:id',
  auth,
  requireAdmin,
  strict(foodAllowed),
  foodCreateValidator,
  validate,
  foodController.updateFood
);
router.delete('/:id', auth, requireAdmin, foodController.deleteFood);

module.exports = router;
