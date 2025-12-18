const request = require('supertest');
const { expect } = require('chai');
const app = require('../../src/server');
const { reset } = require('../../src/repositories/db');

describe('Validação strict em atualização (funcional)', function () {
  beforeEach(() => reset());

  it('PUT /foods/:id rejeita campos extras', async () => {
    await request(app)
      .post('/users/register')
      .send({ name: 'U', email: 'u@example.com', password: '123456' });
    const login = await request(app)
      .post('/users/login')
      .send({ email: 'u@example.com', password: '123456' });
    const token = login.body.token;

    const create = await request(app)
      .post('/foods')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Orange', calories: 47 });
    const id = create.body.id;

    const res = await request(app)
      .put(`/foods/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Orange', calories: 50, extra: 'no' });
    expect(res.status).to.equal(400);
    expect(res.body).to.have.property('error');
  });

  it('PUT /meals/:id rejects extra fields', async () => {
    await request(app)
      .post('/users/register')
      .send({ name: 'V', email: 'v@example.com', password: '123456' });
    const login = await request(app)
      .post('/users/login')
      .send({ email: 'v@example.com', password: '123456' });
    const token = login.body.token;

    const foodRes = await request(app)
      .post('/foods')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Pear', calories: 57 });
    const foodId = foodRes.body.id;

    const mealRes = await request(app)
      .post('/meals')
      .set('Authorization', `Bearer ${token}`)
      .send({ foods: [foodId] });
    const mealId = mealRes.body.id;

    const res = await request(app)
      .put(`/meals/${mealId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ date: new Date().toISOString(), foods: [foodId], extra: 'no' });
    expect(res.status).to.equal(400);
    expect(res.body).to.have.property('error');
  });
});
