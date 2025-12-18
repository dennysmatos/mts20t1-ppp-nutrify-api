import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import * as faker from 'k6/x/faker';
import { generateRandomEmail } from './helpers/generateRandomEmail.js';
import { getBaseUrl } from './helpers/getBaseUrl.js';

export const options = {
  // Stages define um ramp-up gradual de usuários virtuais
  // Isso simula um aumento gradual de carga em vez de picos repentinos
  stages: [
    { duration: '5s', target: 5 }, // Ramp-up: 0 a 5 VUs em 5 segundos
    { duration: '10s', target: 10 }, // Aumento: 5 a 10 VUs em 10 segundos
    { duration: '5s', target: 0 }, // Ramp-down: 10 a 0 VUs em 5 segundos
  ],

  // Thresholds: Define critérios de sucesso/falha para o teste
  // p(95)<2000 significa que 95% das requisições devem responder em menos de 2 segundos
  thresholds: {
    http_req_duration: ['p(95)<2000'],
  },
};

const foodCreateDuration = new Trend('food_create_duration');

const foodCategories = [
  'Fruta',
  'Proteína',
  'Carboidrato',
  'Legume',
  'Laticinío',
  'Grão',
  'Óleo',
  'Bebida',
];

export default function () {
  const baseUrl = getBaseUrl();
  const email = generateRandomEmail();
  const password = 'password123';
  const fakeGen = new faker.Faker();
  const name = fakeGen.person.firstName();

  group('User Registration', () => {
    const payload = JSON.stringify({
      name: name,
      email: email,
      password: password,
    });

    const params = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const response = http.post(`${baseUrl}/users/register`, payload, params);

    check(response, {
      'Register: Status is 201': (r) => r.status === 201,
    });
  });

  // Pausa para simular comportamento humano realista
  sleep(1);

  let token;
  group('User Login', () => {
    const payload = JSON.stringify({
      email: email,
      password: password,
    });

    const params = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const response = http.post(`${baseUrl}/users/login`, payload, params);

    check(response, {
      'Login: Status is 200': (r) => r.status === 200,
      'Login: Token is present': (r) => r.json('token') !== undefined,
    });

    // Extrai token da resposta para reutilização em requisições autenticadas
    token = response.json('token');
  });

  // Pausa para simular comportamento humano realista
  sleep(1);

  const foodData = {
    foodName: fakeGen.word.noun() + ' ' + fakeGen.word.noun(),
    category: foodCategories[Math.floor(Math.random() * foodCategories.length)],
    calories: Math.floor(Math.random() * 450) + 50,
    protein: parseFloat((Math.random() * 35).toFixed(1)),
    carbs: parseFloat((Math.random() * 80).toFixed(1)),
    fat: parseFloat((Math.random() * 20).toFixed(1)),
  };

  group('Food Creation', () => {
    const payload = JSON.stringify({
      name: foodData.foodName,
      category: foodData.category,
      calories: foodData.calories,
      protein: foodData.protein,
      carbs: foodData.carbs,
      fat: foodData.fat,
    });

    const params = {
      headers: {
        'Content-Type': 'application/json',
        // Uso de Token de Autenticação
        // O token JWT extraído do login é incluído como Bearer token
        // Isso simula uma requisição autenticada real
        Authorization: `Bearer ${token}`,
      },
    };

    const response = http.post(`${baseUrl}/foods`, payload, params);

    // Trend: Registra a duração desta requisição específica
    // Permite análise detalhada de desempenho do endpoint de criação de alimentos
    foodCreateDuration.add(response.timings.duration);

    check(response, {
      'Food Creation: Status is 201': (r) => r.status === 201,
    });
  });
}
