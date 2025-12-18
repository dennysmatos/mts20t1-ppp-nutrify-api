const { body } = require('express-validator');

exports.register = [
  body('name')
    .isString()
    .notEmpty()
    .withMessage('Nome é obrigatório e deve ser uma string'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres'),
];

exports.login = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Senha é obrigatória'),
];

exports.allowedFields = {
  register: ['name', 'email', 'password'],
  login: ['email', 'password'],
};
