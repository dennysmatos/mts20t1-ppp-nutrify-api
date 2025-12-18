const request = require('supertest');
const { expect } = require('chai');
const app = require('../../src/server');
const { reset } = require('../../src/repositories/db');

describe('Endpoints de Alimentos (funcional)', function () {
  beforeEach(() => reset());

  it('deve criar um alimento', async () => {
    await request(app)
      .post('/users/register')
      .send({ name: 'Food', email: 'f@example.com', password: '123456' });
    const login = await request(app)
      .post('/users/login')
      .send({ email: 'f@example.com', password: '123456' });
    const token = login.body.token;

    const res = await request(app)
      .post('/foods')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Banana', category: 'Fruta', calories: 89 });

    expect(res.status).to.equal(201);
    expect(res.body).to.have.property('id');
    expect(res.body).to.have.property('createdAt');
    expect(res.body).to.have.property('updatedAt');
  });
});
