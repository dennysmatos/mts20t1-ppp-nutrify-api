const request = require('supertest');
const { expect } = require('chai');
const app = require('../../src/server');
const { reset } = require('../../src/repositories/db');

describe('Validação strict (funcional)', function () {
  beforeEach(() => reset());

  it('POST /users/register rejeita campos extras', async () => {
    const res = await request(app).post('/users/register').send({
      name: 'X',
      email: 'x@example.com',
      password: '123456',
      extra: 'no',
    });
    expect(res.status).to.equal(400);
    expect(res.body).to.have.property('error');
  });

  it('POST /foods rejects extra fields', async () => {
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
    expect(res.status).to.equal(400);
    expect(res.body).to.have.property('error');
  });
});
