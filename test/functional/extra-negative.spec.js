const request = require('supertest');
const { expect } = require('chai');
const app = require('../../src/server');
const { reset } = require('../../src/repositories/db');

describe('Casos funcionais negativos extras (pt-BR)', function () {
  beforeEach(() => reset());

  it('retorna 400 ao enviar nome como número no registro', async () => {
    const res = await request(app)
      .post('/users/register')
      .send({ name: 123, email: 'a@b.com', password: '123456' });
    expect(res.status).to.equal(400);
  });

  it('retorna 400 ao criar alimento com calories nulo', async () => {
    await request(app)
      .post('/users/register')
      .send({ name: 'A', email: 'a2@b.com', password: '123456' });
    const login = await request(app)
      .post('/users/login')
      .send({ email: 'a2@b.com', password: '123456' });
    const token = login.body.token;
    const res = await request(app)
      .post('/foods')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'X', calories: null });
    expect(res.status).to.equal(400);
  });

  it('retorna 400 ao criar refeição com array vazio de foods', async () => {
    await request(app)
      .post('/users/register')
      .send({ name: 'B', email: 'b@b.com', password: '123456' });
    const login = await request(app)
      .post('/users/login')
      .send({ email: 'b@b.com', password: '123456' });
    const token = login.body.token;
    const res = await request(app)
      .post('/meals')
      .set('Authorization', `Bearer ${token}`)
      .send({ foods: [] });
    expect(res.status).to.equal(400);
  });

  it('retorna 401 ao acessar rota protegida com token inválido', async () => {
    const res = await request(app)
      .post('/foods')
      .set('Authorization', 'Bearer invalid.token')
      .send({ name: 'Z', calories: 10 });
    expect(res.status).to.equal(401);
  });

  it('retorna 400 ao atualizar alimento com campo extra inesperado', async () => {
    await request(app)
      .post('/users/register')
      .send({ name: 'C', email: 'c@c.com', password: '123456' });
    const login = await request(app)
      .post('/users/login')
      .send({ email: 'c@c.com', password: '123456' });
    const token = login.body.token;
    const f = await request(app)
      .post('/foods')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Y', calories: 20 });
    const id = f.body.id;
    const res = await request(app)
      .put(`/foods/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Y', calories: 22, unexpected: true });
    expect(res.status).to.equal(400);
  });
});
