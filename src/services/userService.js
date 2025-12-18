const { UserRepo } = require('../repositories/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const HttpError = require('../errors/HttpError');

exports.register = async (data) => {
  const existing = await UserRepo.findByEmail(data.email);
  if (existing) throw new HttpError(400, 'Email já cadastrado');
  const hashed = await bcrypt.hash(data.password, 10);
  // if first user, make admin
  const userCount = await UserRepo.count();
  const role = userCount === 0 ? 'admin' : data.role || 'user';
  const user = await UserRepo.create({
    name: data.name,
    email: data.email,
    password: hashed,
    calorieGoal: data.calorieGoal || 2000,
    role,
  });
  return { id: user.id, name: user.name, email: user.email, role: user.role };
};

exports.login = async ({ email, password }) => {
  const user = await UserRepo.findByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new HttpError(401, 'Credenciais inválidas');
  }
  return jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};

exports.getProfile = async (userId) => {
  const user = await UserRepo.findById(userId);
  if (!user) throw new HttpError(404, 'Usuário não encontrado');
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    calorieGoal: user.calorieGoal,
    role: user.role,
  };
};
