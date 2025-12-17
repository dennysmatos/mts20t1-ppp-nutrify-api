# Testes de Performance com K6

Documentação técnica sobre os testes de performance da Nutrify API.

## Estrutura de Arquivos

```
test/performance/k6/
├── README_K6.md                 # Este arquivo
├── registerFood.test.js         # Teste principal de performance
└── helpers/
    ├── generateRandomEmail.js   # Gera emails únicos
    ├── getBaseUrl.js            # Obtém URL base do ambiente
    └── loginUser.js             # Realiza login e retorna token
```

## Componentes Principais do Teste

### 1. Thresholds

Definem critérios de sucesso ou falha baseado em métricas. Se o threshold falhar, o teste retorna código de erro.

```javascript
export const options = {
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% das requisições devem ser <2s
  },
};
```

**Significado**: Se mais de 5% das requisições levarem mais de 2 segundos, o teste falha.

**Uso**: Integre em CI/CD para detectar automaticamente regressões de performance.

### 2. Checks

Validações que rastreiam sucesso/falha de condições específicas sem afetar o resultado final do teste.

```javascript
check(response, {
  'Status is 201': (r) => r.status === 201,
  'Token is present': (r) => r.json('token') !== undefined,
});
```

**Diferença de Threshold**: Checks relatam porcentagem de sucesso, thresholds causam falha se limite é violado.

### 3. Helpers

Funções reutilizáveis centralizadas em `helpers/` para evitar duplicação entre testes.

**generateRandomEmail.js**:

```javascript
export function generateRandomEmail() {
  return `user${Date.now()}${Math.random()}@example.com`;
}
```

Garante que cada iteração cria um novo usuário com email único.

**getBaseUrl.js**:

```javascript
export function getBaseUrl() {
  return __ENV.BASE_URL || 'http://localhost:3000';
}
```

Permite executar contra ambientes diferentes via variável de ambiente.

**loginUser.js**:

```javascript
export function loginUser(email, password) {
  const response = http.post(`${baseUrl}/users/login`, payload);
  return response.json('token');
}
```

Encapsula lógica de login para reutilização em múltiplos testes.

### 4. Trends (Métricas Customizadas)

Rastreiam durações específicas de operações além das métricas padrão do K6.

```javascript
import { Trend } from 'k6/metrics';

const foodCreateDuration = new Trend('food_create_duration');

// Durante teste
foodCreateDuration.add(response.timings.duration);
```

**Resultado**:

```
food_create_duration: avg=35.59ms  min=3.97ms  max=232.09ms  p(95)=135.72ms
```

Permite análise granular de performance por endpoint.

### 5. Geração de Dados (Faker Pattern)

O teste implementa padrão similar a bibliotecas Faker:

- **Email aleatório**: Timestamp + número aleatório garantem unicidade
- **Data-Driven Testing**: Array `testDataVariations` com múltiplos alimentos

```javascript
const testDataVariations = [
  { foodName: 'Banana', calories: 89, ... },
  { foodName: 'Frango', calories: 165, ... },
  { foodName: 'Arroz', calories: 111, ... },
];

const selectedFood = testDataVariations[__VU % testDataVariations.length];
```

Cada VU (Virtual User) recebe um alimento diferente, testando variações de dados.

### 6. Variáveis de Ambiente

Configuráveis via linha de comando com `--env`.

```bash
# Usar padrão (localhost:3000)
k6 run registerFood.test.js

# Especificar URL customizada
k6 run registerFood.test.js --env BASE_URL=https://api.producao.com
```

A função helper `getBaseUrl()` acessa via `__ENV.BASE_URL`.

### 7. Stages (Ramp-up de Carga)

Definem como o número de VUs varia ao longo do tempo.

```javascript
stages: [
  { duration: '5s', target: 5 },    // Ramp-up: 0→5 VUs
  { duration: '10s', target: 10 },  // Ramp-up: 5→10 VUs
  { duration: '5s', target: 0 },    // Ramp-down: 10→0 VUs
],
```

Simula aumento gradual de carga em vez de pico repentino. Melhor para identificar em que ponto a API começa a degradar.

**Vs Duração Fixa**:

```javascript
// Alternativa: Duração constante com VUs fixos
{ vus: 10, duration: '15s' }  // 10 VUs durante 15s
```

### 8. Reaproveitamento de Resposta

Extrai dados de uma resposta para usar em requisições posteriores.

```javascript
let token;
group('User Login', () => {
  const response = http.post(loginUrl, payload);
  token = response.json('token'); // Extrai token
});

group('Food Creation', () => {
  const params = {
    headers: {
      Authorization: `Bearer ${token}`, // Reutiliza
    },
  };
  http.post(foodUrl, payload, params);
});
```

Essencial para simular fluxos realistas onde etapas dependem de dados anteriores.

### 9. Uso de Token de Autenticação

Implementa fluxo JWT Bearer:

```javascript
const params = {
  headers: {
    Authorization: `Bearer ${token}`,
  },
};
const response = http.post(url, payload, params);
```

Valida que a API corretamente:

1. Autentica requisições com token válido
2. Rejeita requisições sem token ou com token inválido

### 10. Data-Driven Testing

Executa o mesmo teste com múltiplos conjuntos de dados.

```javascript
const testData = [
  { food: 'Banana', ... },
  { food: 'Frango', ... },
  { food: 'Arroz', ... },
];

const selected = testData[__VU % testData.length];
```

**Benefícios**:

- Cobre múltiplos cenários em uma execução
- Valida que API funciona com diferentes tipos de dados
- Mais eficiente que múltiplos testes separados

### 11. Groups

Organizam ações relacionadas em seções lógicas.

```javascript
group('User Registration', () => {
  // Todas as operações de registro
  http.post(...);
  check(...);
});

sleep(1);  // Pausa entre grupos

group('User Login', () => {
  // Todas as operações de login
  http.post(...);
  check(...);
});
```

**Benefícios**:

- Código mais organizado e legível
- Relatórios mostram performance por group
- Facilita identificação de bottlenecks específicos

## Executando o Teste

### Execução Básica

```bash
k6 run test/performance/k6/registerFood.test.js
```

Usa configuração padrão (stages de 20s total, 10 VUs máximo).

### Com Ambiente Customizado

```bash
k6 run test/performance/k6/registerFood.test.js --env BASE_URL=https://api.producao.com
```

### Com VUs e Duração Override

```bash
k6 run test/performance/k6/registerFood.test.js --vus 20 --duration 30s
```

Ignora stages configurados, usa 20 VUs por 30 segundos.

### Integrando com CI/CD

```bash
# Falha se threshold não for atendido
k6 run test/performance/k6/registerFood.test.js || exit 1
```

## Interpretando Resultados

### Exemplo de Saída

```
checks_succeeded...: 100.00% 216 out of 216
http_req_duration..: avg=101.92ms  min=3.97ms  max=384.22ms  p(95)=277.37ms
food_create_duration: avg=35.59ms   min=3.974ms max=232.089ms p(95)=135.72ms
iterations.........: 54 complete
```

### O que Significa

- **checks_succeeded**: 100% = Todos os checks passaram
- **http_req_duration p(95)**: 277.37ms = 95% das requisições responderam em <277ms (bem abaixo do threshold de 2000ms)
- **food_create_duration p(95)**: 135.72ms = Endpoint específico de criação de alimentos tem p(95) de 135.72ms
- **iterations**: 54 ciclos completos foram executados

### Threshold Pass/Fail

```
THRESHOLDS
  http_req_duration
  ✓ 'p(95)<2000' p(95)=277.37ms  ← Passou
```

Se fosse:

```
  ✗ 'p(95)<2000' p(95)=2500ms    ← Falhou
```

O teste retornaria código de erro.

## Expandindo o Teste

### Adicionando Novas Trends

```javascript
import { Trend } from 'k6/metrics';

const mealCreationDuration = new Trend('meal_creation_duration');
const progressQueryDuration = new Trend('progress_query_duration');

export default function () {
  // ...
  mealCreationDuration.add(mealResponse.timings.duration);
  progressQueryDuration.add(progressResponse.timings.duration);
}
```

### Adicionando Novos Helpers

Crie `test/performance/k6/helpers/novoHelper.js`:

```javascript
export function functionComum(param) {
  // lógica reutilizável
}
```

Importe em qualquer teste:

```javascript
import { functionComum } from './helpers/novoHelper.js';
```

### Criando Novo Teste

Crie `test/performance/k6/outroFluxo.test.js`:

```javascript
import { generateRandomEmail } from './helpers/generateRandomEmail.js';
import { getBaseUrl } from './helpers/getBaseUrl.js';

export const options = {
  vus: 15,
  duration: '20s',
  thresholds: {
    http_req_duration: ['p(95)<1500'],
  },
};

export default function () {
  // Seu teste aqui
}
```

Execute com: `k6 run test/performance/k6/outroFluxo.test.js`

## Boas Práticas

1. **Sempre use helpers**: Evite duplicação de código entre testes
2. **Configure thresholds realistas**: Base em requirements e capacidade atual
3. **Monitore trends customizadas**: Para endpoints críticos
4. **Use stages**: Melhor que VUs fixos para simular cenários reais
5. **Organize com groups**: Melhora legibilidade e análise
6. **Data-driven**: Sempre teste com múltiplos dados quando possível
7. **Documente**: Adicione comentários explicando o objetivo do teste
8. **Revise resultados**: Analise p(95) e p(90), não apenas médias

## Recursos Adicionais

- K6 Documentação: https://k6.io/docs/
- K6 Scripting API: https://k6.io/docs/javascript-api/
- Boas Práticas: https://k6.io/docs/best-practices/
