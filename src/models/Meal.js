const mongoose = require('mongoose');

const MealSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  foods: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Food' }],
  totalCalories: { type: Number, default: 0 },
  totalProtein: { type: Number, default: 0 },
  totalCarbs: { type: Number, default: 0 },
  totalFat: { type: Number, default: 0 },
});

module.exports = mongoose.model('Meal', MealSchema);
