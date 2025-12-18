const { body } = require('express-validator');

exports.create = [
  body('foods')
    .isArray()
    .withMessage('Foods deve ser um array')
    .bail()
    .custom((arr) => Array.isArray(arr) && arr.length > 0)
    .withMessage('Foods deve ser um array não vazio'),
];

// Allowed fields for update: foods (ids). date/createdAt are server-generated; totals are computed.
exports.allowedFields = ['foods'];
