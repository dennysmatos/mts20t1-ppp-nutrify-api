const request = require('supertest');
const { expect } = require('chai');
const app = require('../../src/server');
const { reset } = require('../../src/repositories/db');

describe('Endpoints de Refeição (funcional)', function () {
  beforeEach(() => reset());

  it('deve criar uma refeição e computar totais', async () => {
    await request(app)
      .post('/users/register')
      .send({ name: 'M', email: 'm@example.com', password: '123456' });
    const login = await request(app)
      .post('/users/login')
      .send({ email: 'm@example.com', password: '123456' });
    const token = login.body.token;

    const foodRes = await request(app)
      .post('/foods')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Apple', calories: 52, protein: 0.3, carbs: 14, fat: 0.2 });
    const foodId = foodRes.body.id;

    const res = await request(app)
      .post('/meals')
      .set('Authorization', `Bearer ${token}`)
      .send({ foods: [foodId] });

    expect(res.status).to.equal(201);
    expect(res.body).to.have.property('totalCalories');
    expect(res.body.totalCalories).to.equal(52);
  });
});
