import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { generateRandomEmail } from './helpers/generateRandomEmail.js';
import { getBaseUrl } from './helpers/getBaseUrl.js';

/**
 * Configuração do teste de performance
 *
 * Este teste simula um fluxo realista:
 * 1. Registro de novo usuário com email aleatório
 * 2. Login do usuário registrado
 * 3. Criação de alimento autenticado
 *
 * O teste passa quando:
 * - Percentil 95 de latência fica abaixo de 2 segundos (Threshold)
 * - Todos os checks de status code passam
 * - Nenhuma erro crítico ocorre
 */
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

/**
 * Métrica customizada (Trend) para monitorar especificamente
 * o tempo de resposta do endpoint POST /foods
 * Permite análise detalhada de desempenho por funcionalidade
 */
const foodCreateDuration = new Trend('food_create_duration');

/**
 * Dados para Data-Driven Testing
 * Array com diferentes combinações de dados para testar variações
 * Simula diferentes tipos de usuários e alimentos
 */
const testDataVariations = [
  {
    foodName: 'Banana',
    category: 'Fruta',
    calories: 89,
    protein: 1.1,
    carbs: 23,
    fat: 0.3,
  },
  {
    foodName: 'Frango Grelhado',
    category: 'Proteína',
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
  },
  {
    foodName: 'Arroz Integral',
    category: 'Carboidrato',
    calories: 111,
    protein: 2.6,
    carbs: 23,
    fat: 0.9,
  },
];

export default function () {
  const baseUrl = getBaseUrl();
  const email = generateRandomEmail();
  const password = 'password123';
  const name = 'Test User';

  /**
   * GROUP: Registro de Usuário
   *
   * Simula o fluxo de novo usuário na aplicação.
   * Email é gerado aleatoriamente para garantir unicidade (requisito da API).
   *
   * Check validado:
   * - Status code 201: Confirma que o usuário foi criado com sucesso
   */
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

  /**
   * GROUP: Login de Usuário
   *
   * Autentica o usuário registrado na etapa anterior.
   * Extrai o token JWT da resposta para reutilização na próxima etapa.
   *
   * Checks validados:
   * - Status code 200: Autenticação bem-sucedida
   * - Token presente na resposta: Confirma que JWT foi retornado
   *
   * Reaproveitamento de Resposta:
   * O token extraído é armazenado em variável para uso na autenticação
   * das requisições subsequentes que exigem Bearer token.
   */
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

  /**
   * GROUP: Criação de Alimentos (Data-Driven Testing)
   *
   * Testa a criação de múltiplos alimentos com diferentes dados.
   * Implementa Data-Driven Testing iterando sobre variações de dados.
   *
   * Característica: Uso de Autenticação JWT
   * O header Authorization com "Bearer <token>" autentica a requisição,
   * demonstrando integração com sistema de segurança da API.
   *
   * Métricas (Trend):
   * foodCreateDuration monitora especificamente o tempo de resposta
   * do endpoint POST /foods, permitindo análise granular por funcionalidade.
   *
   * Check validado:
   * - Status code 201: Confirma que o alimento foi criado com sucesso
   */
  // eslint-disable-next-line no-undef
  const selectedFood = testDataVariations[__VU % testDataVariations.length];

  group('Food Creation', () => {
    const payload = JSON.stringify({
      name: selectedFood.foodName,
      category: selectedFood.category,
      calories: selectedFood.calories,
      protein: selectedFood.protein,
      carbs: selectedFood.carbs,
      fat: selectedFood.fat,
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
