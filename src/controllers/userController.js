const UserService = require('../services/userService');

exports.register = async (req, res, next) => {
  try {
    const user = await UserService.register(req.body);
    // include timestamps if present
    const payload = { ...user };
    if (user.createdAt) payload.createdAt = user.createdAt;
    if (user.updatedAt) payload.updatedAt = user.updatedAt;
    res.status(201).json(payload);
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const token = await UserService.login(req.body);
    res.json({ token });
  } catch (err) {
    next(err);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const user = await UserService.getProfile(req.userId);
    res.json(user);
  } catch (err) {
    next(err);
  }
};
