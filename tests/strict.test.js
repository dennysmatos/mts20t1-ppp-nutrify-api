const request = require('supertest');
const app = require('../src/server');
const { reset } = require('../src/repositories/db');

describe('Strict validation rejects extra fields', () => {
  beforeAll(() => reset());

  test('POST /users/register rejects extra fields', async () => {
    const res = await request(app).post('/users/register').send({
      name: 'X',
      email: 'x@example.com',
      password: '123456',
      extra: 'no',
    });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('POST /foods rejects extra fields', async () => {
    // create and login a user to get token
    await request(app)
      .post('/users/register')
      .send({ name: 'F', email: 'f@example.com', password: '123456' });
    const login = await request(app)
      .post('/users/login')
      .send({ email: 'f@example.com', password: '123456' });
    const token = login.body.token;

    const res = await request(app)
      .post('/foods')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Banana', calories: 89, extra: 'no' });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('POST /meals rejects extra fields', async () => {
    // create and login a user
    await request(app)
      .post('/users/register')
      .send({ name: 'M', email: 'm@example.com', password: '123456' });
    const login = await request(app)
      .post('/users/login')
      .send({ email: 'm@example.com', password: '123456' });
    const token = login.body.token;

    // create a food
    const foodRes = await request(app)
      .post('/foods')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Apple', calories: 52 });
    const foodId = foodRes.body.id;

    const res = await request(app)
      .post('/meals')
      .set('Authorization', `Bearer ${token}`)
      .send({ date: new Date().toISOString(), foods: [foodId], extra: 'no' });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});
