const { body } = require('express-validator');

exports.create = [
  body('name')
    .isString()
    .notEmpty()
    .withMessage('Nome do alimento é obrigatório'),
  body('calories').isNumeric().withMessage('Calories deve ser numérico'),
];
exports.allowedFields = [
  'name',
  'category',
  'calories',
  'protein',
  'carbs',
  'fat',
];
