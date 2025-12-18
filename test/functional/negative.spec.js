const request = require('supertest');
const { expect } = require('chai');
const app = require('../../src/server');
const { reset } = require('../../src/repositories/db');

describe('Testes funcionais negativos / validação', function () {
  beforeEach(() => reset());

  describe('Validação de usuários e erros de autenticação', function () {
    it('retorna 400 ao registrar sem senha', async () => {
      const res = await request(app)
        .post('/users/register')
        .send({ name: 'NoPass', email: 'nopass@example.com' });
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('errors').that.is.an('array');
    });

    it('retorna 400 ao registrar com nome vazio', async () => {
      const res = await request(app)
        .post('/users/register')
        .send({ name: '', email: 'blank@example.com', password: '123456' });
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('errors');
    });

    it('retorna 401 ao autenticar com credenciais incorretas', async () => {
      await request(app).post('/users/register').send({
        name: 'Login',
        email: 'login@example.com',
        password: 'correct',
      });
      const res = await request(app)
        .post('/users/login')
        .send({ email: 'login@example.com', password: 'wrong' });
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('error');
    });
  });

  describe('Validação de alimentos e autenticação', function () {
    it('retorna 401 ao criar alimento sem token', async () => {
      const res = await request(app)
        .post('/foods')
        .send({ name: 'NoAuth', calories: 10 });
      expect(res.status).to.equal(401);
      expect(res.body).to.have.property('error');
    });

    it('retorna 400 ao criar alimento sem nome', async () => {
      await request(app)
        .post('/users/register')
        .send({ name: 'F', email: 'f2@example.com', password: '123456' });
      const login = await request(app)
        .post('/users/login')
        .send({ email: 'f2@example.com', password: '123456' });
      const token = login.body.token;

      const res = await request(app)
        .post('/foods')
        .set('Authorization', `Bearer ${token}`)
        .send({ calories: 10 });
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('errors');
    });

    it('retorna 400 quando calories tem tipo errado', async () => {
      await request(app)
        .post('/users/register')
        .send({ name: 'F', email: 'f3@example.com', password: '123456' });
      const login = await request(app)
        .post('/users/login')
        .send({ email: 'f3@example.com', password: '123456' });
      const token = login.body.token;

      const res = await request(app)
        .post('/foods')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Apple', calories: 'not-a-number' });
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('errors');
    });

    it('retorna 403 quando usuário não-admin tenta atualizar alimento', async () => {
      // first register admin (first user is admin)
      await request(app).post('/users/register').send({
        name: 'Admin',
        email: 'admin@example.com',
        password: '123456',
      });
      // create another normal user
      await request(app)
        .post('/users/register')
        .send({ name: 'User', email: 'user@example.com', password: '123456' });
      const login = await request(app)
        .post('/users/login')
        .send({ email: 'user@example.com', password: '123456' });
      const token = login.body.token;

      // admin creates food
      const adminLogin = await request(app)
        .post('/users/login')
        .send({ email: 'admin@example.com', password: '123456' });
      const adminToken = adminLogin.body.token;
      const created = await request(app)
        .post('/foods')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Milk', calories: 42 });
      const id = created.body.id;

      // non-admin tries to update
      const res = await request(app)
        .put(`/foods/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Milk', calories: 50 });
      expect(res.status).to.equal(403);
      expect(res.body).to.have.property('error');
    });
  });

  describe('Validação de refeições e erros de negócio', function () {
    it('retorna 400 ao criar refeição sem lista de alimentos', async () => {
      await request(app)
        .post('/users/register')
        .send({ name: 'M', email: 'm2@example.com', password: '123456' });
      const login = await request(app)
        .post('/users/login')
        .send({ email: 'm2@example.com', password: '123456' });
      const token = login.body.token;

      const res = await request(app)
        .post('/meals')
        .set('Authorization', `Bearer ${token}`)
        .send({});
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('errors');
    });

    it('retorna 400 quando foods não é um array', async () => {
      await request(app)
        .post('/users/register')
        .send({ name: 'M', email: 'm3@example.com', password: '123456' });
      const login = await request(app)
        .post('/users/login')
        .send({ email: 'm3@example.com', password: '123456' });
      const token = login.body.token;

      const res = await request(app)
        .post('/meals')
        .set('Authorization', `Bearer ${token}`)
        .send({ foods: 'not-an-array' });
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('errors');
    });

    it('retorna 400 quando refeição referencia id de alimento inexistente', async () => {
      await request(app)
        .post('/users/register')
        .send({ name: 'M', email: 'm4@example.com', password: '123456' });
      const login = await request(app)
        .post('/users/login')
        .send({ email: 'm4@example.com', password: '123456' });
      const token = login.body.token;

      const res = await request(app)
        .post('/meals')
        .set('Authorization', `Bearer ${token}`)
        .send({ foods: ['non-existing-id'] });
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('error');
    });
  });
});
