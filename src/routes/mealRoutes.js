const express = require('express');
const router = express.Router();
const mealController = require('../controllers/mealController');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const {
  create: mealCreateValidator,
  allowedFields: mealAllowed,
} = require('../validators/mealValidators');
const strict = require('../validators/strictValidator');

router.post(
  '/',
  auth,
  strict(mealAllowed),
  mealCreateValidator,
  validate,
  mealController.createMeal
);
router.get('/', auth, mealController.getMeals);
router.put(
  '/:id',
  auth,
  strict(mealAllowed),
  mealCreateValidator,
  validate,
  mealController.updateMeal
);
router.delete('/:id', auth, mealController.deleteMeal);

module.exports = router;
