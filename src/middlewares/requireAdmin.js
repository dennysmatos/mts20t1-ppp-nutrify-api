const HttpError = require('../errors/HttpError');

module.exports = (req, _res, next) => {
  if (req.userRole !== 'admin')
    throw new HttpError(403, 'Admin access required');
  next();
};
