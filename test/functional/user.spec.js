const request = require('supertest');
const { expect } = require('chai');
const app = require('../../src/server');
const { reset } = require('../../src/repositories/db');

describe('Endpoints de Usuário (funcional)', function () {
  beforeEach(() => reset());

  it('deve registrar e autenticar um usuário', async () => {
    const res1 = await request(app)
      .post('/users/register')
      .send({ name: 'User', email: 'u@example.com', password: '123456' });
    expect(res1.status).to.equal(201);
    expect(res1.body).to.have.property('id');

    const res2 = await request(app)
      .post('/users/login')
      .send({ email: 'u@example.com', password: '123456' });
    expect(res2.status).to.equal(200);
    expect(res2.body).to.have.property('token');
  });
});
