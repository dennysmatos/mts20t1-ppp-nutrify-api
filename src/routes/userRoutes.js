const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const {
  register: registerValidator,
  login: loginValidator,
  allowedFields: userAllowed,
} = require('../validators/userValidators');
const strict = require('../validators/strictValidator');

router.post(
  '/register',
  strict(userAllowed.register),
  registerValidator,
  validate,
  userController.register
);
router.post(
  '/login',
  strict(userAllowed.login),
  loginValidator,
  validate,
  userController.login
);
router.get('/profile', auth, userController.getProfile);

module.exports = router;
