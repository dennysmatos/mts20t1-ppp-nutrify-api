const request = require('supertest');
const app = require('../src/server');
const { reset } = require('../src/repositories/db');

describe('Meal Endpoints', () => {
  beforeAll(() => reset());
  let token;
  let foodId;
  beforeAll(async () => {
    await request(app)
      .post('/users/register')
      .send({ name: 'Meal', email: 'meal@exemplo.com', password: '123456' });
    const res = await request(app)
      .post('/users/login')
      .send({ email: 'meal@exemplo.com', password: '123456' });
    token = res.body.token;
    const foodRes = await request(app)
      .post('/foods')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Arroz',
        category: 'Cereal',
        calories: 130,
        protein: 2.7,
        carbs: 28,
        fat: 0.3,
      });
    foodId = foodRes.body.id;
  });

  it('should create a meal', async () => {
    const res = await request(app)
      .post('/meals')
      .set('Authorization', `Bearer ${token}`)
      .send({ foods: [foodId] });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('totalCalories');
    expect(res.body.totalCalories).toBeGreaterThan(0);
  });
});
