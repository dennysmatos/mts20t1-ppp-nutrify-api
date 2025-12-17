# Nutrify API

API REST para gerenciamento de alimentação, dieta e controle de calorias.

## Recursos

- Cadastro e autenticação de usuários (JWT)
- Gerenciamento de alimentos
- Registro de refeições
- Controle diário de consumo calórico e progresso
- Permissões de administrador para gerenciar refeições e progresso de todos os usuários
- Documentação Swagger
- Testes unitários
- Workflow GitHub Actions

## Como rodar

1. Instale as dependências: `npm install`
2. Configure o arquivo `.env` baseado no `.env.example` (apenas `JWT_SECRET` e `PORT` são usados).
3. Inicie o servidor: `npm run dev` (a aplicação usa armazenamento em memória; não é necessário MongoDB).

## Documentação

Acesse `/api-docs` após iniciar o servidor.

## Requisitos

Consulte o documento `REQUISITOS.md` para a especificação completa dos requisitos funcionais e não-funcionais do projeto.

## Políticas de API

- Strict validation: as rotas de criação e atualização (`POST`/`PUT` em `/users`, `/foods`, `/meals`) rejeitam campos extras no corpo da requisição com resposta `400` e mensagem explicando os campos não permitidos. Use apenas os campos documentados no Swagger.
- Timestamps: as entidades retornadas incluem `createdAt` e `updatedAt` (ISO 8601), gerados automaticamente pelo repositório em memória.

### Nota sobre criação de Refeições

- O endpoint `POST /meals` aceita apenas o corpo contendo a lista de IDs de alimentos (`foods`).
- Os campos `date`, `createdAt` e `updatedAt` são gerados automaticamente pelo servidor no momento da criação da refeição e não devem ser enviados pelo cliente.
- Os campos `totalCalories`, `totalProtein`, `totalCarbs` e `totalFat` também são calculados automaticamente com base nos alimentos referenciados tanto na criação quanto na atualização.

## Controle de Progresso Diário

O endpoint `GET /progress` permite consultar o progresso diário de consumo calórico do usuário. A progressão é feita através da comparação diária do registro das calorias existentes nas refeições do usuário com sua meta calórica (`calorieGoal`).

### Parâmetros

- `date` (opcional): Data no formato `YYYY-MM-DD`. Se não fornecido, usa a data atual.
- `userId` (opcional): ID do usuário. Apenas administradores podem usar este parâmetro para consultar o progresso de outros usuários. Usuários comuns sempre consultam seu próprio progresso.

### Resposta

```json
{
  "userId": "user-1",
  "date": "2025-01-20",
  "totalCalories": 1850,
  "calorieGoal": 2000,
  "difference": 150,
  "status": "below"
}
```

O campo `status` pode ter três valores:

- `below`: Consumo abaixo da meta
- `equal`: Consumo exatamente na meta
- `above`: Consumo acima da meta

## Permissões de Administrador

Usuários com role `admin` têm acesso a funcionalidades adicionais:

- **Refeições**: Podem listar, atualizar e excluir refeições de qualquer usuário
  - `GET /meals?userId=<id>`: Lista refeições de um usuário específico (ou todas se omitido)
  - `PUT /meals/:id`: Atualiza refeição de qualquer usuário
  - `DELETE /meals/:id`: Remove refeição de qualquer usuário

- **Progresso**: Podem consultar o progresso diário de qualquer usuário
  - `GET /progress?userId=<id>&date=YYYY-MM-DD`: Consulta progresso de qualquer usuário

Exemplo de payload para criar uma refeição:

```json
{
  "foods": ["food-id-1", "food-id-2"]
}
```

Resposta de exemplo (parcial):

```json
{
  "id": "meal-1",
  "user": "user-1",
  "date": "2025-08-21T12:34:56.789Z",
  "foods": ["food-id-1", "food-id-2"],
  "totalCalories": 200,
  "totalProtein": 8.5,
  "createdAt": "2025-08-21T12:34:56.789Z",
  "updatedAt": "2025-08-21T12:34:56.789Z"
}
```

## Idioma dos testes

Todos os testes funcionais e unitários foram traduzidos para Português (pt-BR). Os relatórios gerados pelos frameworks de teste (mochawesome, jest-junit) conterão títulos e descrições em pt-BR quando executados localmente nesta base.

## Testes de Performance com K6

A API inclui testes de performance usando K6, uma ferramenta para testes de carga e desempenho. Os testes estão localizados em `test/performance/k6/`.

### Conceitos Cobertos no Teste de Performance

O teste `registerFood.test.js` demonstra os principais conceitos de testes de performance com K6:

- **Thresholds**: Define limites de desempenho como p(95)<2000ms
- **Checks**: Valida respostas com verificações de status code e presença de dados
- **Helpers**: Funções reutilizáveis centralizadas para reduzir duplicação
- **Trends**: Métricas customizadas para monitorar endpoints específicos
- **Geração de Dados (Faker pattern)**: Emails aleatórios e data-driven testing
- **Variáveis de Ambiente**: BASE_URL configurável via linha de comando
- **Stages**: Ramp-up gradual de carga (0→5→10→0 VUs)
- **Reaproveitamento de Resposta**: Extrai token JWT do login para usar em requisições subsequentes
- **Uso de Token de Autenticação**: Implementa fluxo Bearer JWT
- **Data-Driven Testing**: Testa com múltiplos conjuntos de dados
- **Groups**: Organiza ações em seções lógicas (Registration, Login, Food Creation)

### Arquivos Criados para Testes de Performance

```
test/performance/k6/
├── registerFood.test.js              # Teste principal com fluxo completo
├── README_K6.md                      # Documentação técnica detalhada
└── helpers/
    ├── generateRandomEmail.js        # Gera emails únicos (padrão Faker)
    ├── getBaseUrl.js                 # Obtém URL do ambiente
    └── loginUser.js                  # Realiza login e retorna token JWT
```

Consulte `test/performance/k6/README_K6.md` para documentação técnica detalhada sobre cada conceito implementado.

### Executando os testes de performance

Para executar o teste de performance, certifique-se de que o servidor está rodando na porta 3000 e execute:

```bash
k6 run test/performance/k6/registerFood.test.js --vus 10 --duration 15s --env BASE_URL=http://localhost:3000
```

Você também pode executar o teste com a variável de ambiente padrão (localhost:3000) sem especificar a URL:

```bash
k6 run test/performance/k6/registerFood.test.js
```

### Estrutura dos testes de performance

#### Helpers reutilizáveis

Os helpers estão organizados em `test/performance/k6/helpers/` para promover reusabilidade entre diferentes testes:

**generateRandomEmail.js**: Função auxiliar que gera emails aleatórios únicos usando timestamp e número aleatório. Essencial para testes de criação de usuários, já que a API rejeita emails duplicados.

```javascript
export function generateRandomEmail() {
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 100000);
  return `user${timestamp}${randomNum}@example.com`;
}
```

**getBaseUrl.js**: Obtém a URL base da API a partir de variável de ambiente. Permite executar os testes contra diferentes ambientes passando a variável `BASE_URL` por linha de comando. Se não for especificada, usa o padrão `http://localhost:3000`.

```javascript
export function getBaseUrl() {
  return __ENV.BASE_URL || 'http://localhost:3000';
}
```

Isso possibilita rodar testes contra ambientes diferentes:

```bash
k6 run test/performance/k6/registerFood.test.js --env BASE_URL=https://api.producao.com
```

**loginUser.js**: Helper para realizar login e extrair token JWT. Pode ser reaproveitado em outros testes que precisem de autenticação, evitando duplicação de código.

#### Configuração de Thresholds

Thresholds são limites de desempenho que definem critérios de sucesso/falha para o teste. Na seção `options`, configuramos:

```javascript
export const options = {
  vus: 10, // 10 usuários virtuais simultâneos
  duration: '15s', // Duração total: 15 segundos
  thresholds: {
    http_req_duration: ['p(95)<2000'], // Percentil 95 deve ser menor que 2 segundos
  },
};
```

O threshold `p(95)<2000` significa que 95% das requisições devem ser respondidas em menos de 2000 milissegundos. Se essa condição não for atendida, o teste falhará. Essa abordagem garante que a API mantém desempenho adequado sob carga.

#### Métricas Customizadas com Trends

Trends são métricas customizadas para rastrear a duração de operações específicas. No teste, criamos uma Trend para monitorar exclusivamente o tempo de resposta do endpoint de criação de alimentos:

```javascript
const foodCreateDuration = new Trend('food_create_duration');
```

Essa métrica é alimentada durante o teste quando a requisição é executada:

```javascript
const response = http.post(`${baseUrl}/foods`, payload, params);
foodCreateDuration.add(response.timings.duration); // Registra duração
```

Os relatórios ao final do teste exibem estatísticas dessa métrica: min, max, avg, p(95), p(90), etc.

#### Checks (Validações)

Checks validam aspectos específicos da resposta. Diferente de thresholds que afetam o resultado final, checks apenas registram se condições foram atendidas:

```javascript
check(response, {
  'Register: Status is 201': (r) => r.status === 201,
  'Login: Status is 200': (r) => r.status === 200,
  'Login: Token is present': (r) => r.json('token') !== undefined,
  'Food Creation: Status is 201': (r) => r.status === 201,
});
```

Cada check retorna verdadeiro ou falso. Nos relatórios, você verá a porcentagem de sucesso para cada validação. Neste teste, todas as validações devem passar (100%), indicando que os endpoints retornam os códigos de status esperados e os tokens são extraídos corretamente.

#### Reaproveitamento de Dados de Resposta

O teste demonstra como extrair e reutilizar dados das respostas. O token JWT retornado pelo login é capturado e usado na requisição subsequente de criação de alimento:

```javascript
// Extrair token da resposta de login
let token;
group('User Login', () => {
  const response = http.post(`${baseUrl}/users/login`, payload, params);
  token = response.json('token'); // Extrai propriedade token
});

// Reutilizar token como autenticação
group('Food Creation', () => {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`, // Usa o token extraído
    },
  };
  const response = http.post(`${baseUrl}/foods`, payload, params);
});
```

Esse padrão é fundamental para simular fluxos realistas onde cada etapa depende da anterior.

#### Uso de Token de Autenticação

O teste demonstra o fluxo completo de autenticação baseada em JWT. Após fazer login com sucesso, o token retornado é incluído no header `Authorization` usando o padrão `Bearer <token>`:

```javascript
Authorization: `Bearer ${token}`;
```

Esse token autentica requisições subsequentes como o endpoint de criação de alimentos que requer autenticação (`security: [bearerAuth: []]` no Swagger).

#### Groups (Agrupamento de Ações)

Groups organizam o código em seções lógicas relacionadas, facilitando a leitura e análise dos resultados. Cada grupo é executado sequencialmente dentro de uma iteração:

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

sleep(1);  // Pausa entre grupos

group('Food Creation', () => {
  // Todas as operações de criação de alimento
  http.post(...);
  check(...);
});
```

Os grupos melhoram a organização e aparecem nos relatórios como seções separadas, permitindo análise detalhada de desempenho por funcionalidade.

#### Stages (Ramp-Up Gradual de Carga)

Stages definem como a carga deve aumentar e diminuir ao longo do tempo do teste. Em vez de começar com todos os usuários virtuais imediatamente, os stages permitem um aumento gradual que simula um cenário mais realista:

```javascript
export const options = {
  stages: [
    { duration: '5s', target: 5 }, // Ramp-up: 0 a 5 VUs em 5 segundos
    { duration: '10s', target: 10 }, // Aumento: 5 a 10 VUs em 10 segundos
    { duration: '5s', target: 0 }, // Ramp-down: 10 a 0 VUs em 5 segundos
  ],
};
```

Neste exemplo, o teste começa com 0 usuários, aumenta para 5 em 5 segundos, depois para 10 em 10 segundos adicionais, e finalmente diminui para 0 em 5 segundos. Isso é mais realista que aumentar instantaneamente para 10 VUs e melhor para identificar quando a API começa a degradar com aumento de carga.

#### Data-Driven Testing (Testes com Múltiplos Dados)

Data-Driven Testing permite executar o mesmo teste com diferentes conjuntos de dados. No exemplo, criamos um array com variações de alimentos:

```javascript
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
```

Durante a execução, cada usuário virtual seleciona um alimento diferente baseado em seu ID:

```javascript
const selectedFood = testDataVariations[__VU % testDataVariations.length];
```

A variável `__VU` contém o ID do usuário virtual atual. Usando módulo (%), distribuímos os usuários igualmente entre os dados disponíveis. Isso garante que o teste cubra múltiplos cenários (diferentes alimentos com diferentes valores nutricionais) em uma única execução, tornando o teste mais abrangente.

### Resultados do Teste de Performance

Ao executar o teste, K6 exibe um resumo com métricas importantes:

```
checks_succeeded...: 100.00% 192 out of 192
http_req_duration..: avg=186.3ms   min=4.07ms  max=651.09ms  p(95)=547.22ms
food_create_duration: avg=68.91ms   min=4.078ms max=303.217ms p(95)=253.695ms
iterations.........: 48 complete
```

Esses dados indicam:

- Todas as validações (checks) passaram (100%)
- O tempo médio de resposta foi 186.3ms
- O percentil 95 foi 547.22ms, bem abaixo do threshold de 2000ms
- A métrica específica de criação de alimentos teve p(95) de 253.695ms
- 48 iterações foram completadas com sucesso durante os stages
- Não houve falhas de requisição (0%)

#### Interpretação dos Thresholds

O threshold configurado `p(95)<2000` significa que 95% das requisições devem responder em menos de 2 segundos. No resultado acima, o p(95) foi 547.22ms, o que indica que a API está performante e confortavelmente dentro do limite especificado. A utilização de thresholds garante que você será notificado automaticamente se o desempenho cair abaixo das expectativas.

#### Impacto dos Stages no Teste

Os stages causam uma ramp-up gradual que resulta em:

- Número variável de VUs ao longo do teste (0 a 10)
- Melhor representação de cenários reais onde usuários chegam gradualmente
- Identificação mais clara de quando a API começa a degradar
- Execução total de 20 segundos (5s + 10s + 5s) vs 15s em teste com duração fixa

### Extensão dos Testes de Performance

Os helpers criados podem ser reaproveitados em novos testes. Você pode criar um arquivo `test/performance/k6/outroTeste.test.js` que importa os mesmos helpers:

```javascript
import { generateRandomEmail } from './helpers/generateRandomEmail.js';
import { getBaseUrl } from './helpers/getBaseUrl.js';
import { loginUser } from './helpers/loginUser.js';

export const options = {
  vus: 20,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<3000'],
  },
};

export default function () {
  const email = generateRandomEmail();
  const token = loginUser(email, 'password123');
  // ... resto do teste
}
```

Dessa forma, você mantém um repositório centralizado de funções comuns, reduzindo duplicação de código entre testes de performance.

### Conceitos Avançados em Testes de Performance

#### Geração de Dados Realistas (Faker)

Embora o teste atual implemente geração de dados manualmente (como `generateRandomEmail`), em cenários mais complexos você pode utilizar bibliotecas como Faker para gerar dados mais realistas. A abordagem atual no teste já implementa um padrão similar:

- **generateRandomEmail**: Cria emails únicos combinando timestamp e número aleatório
- **testDataVariations**: Array pré-definido simula diferentes tipos de dados

Para testes futuros, essa estrutura pode ser expandida importando uma biblioteca de Faker que geraria:

```javascript
// Exemplo conceitual (não está no teste atual)
import { faker } from '@faker-js/faker';

export function generateRandomUser() {
  return {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    password: faker.internet.password(),
  };
}
```

O teste atual já segue esse princípio gerando dados variados e realistas através de:

1. Emails aleatórios que garantem unicidade
2. Múltiplas variações de alimentos (Data-Driven Testing)
3. Distribuição de dados entre usuários virtuais

#### Monitoramento Contínuo e Alertas

Os thresholds e checks servem como sistema de alertas. Configure seu pipeline CI/CD para:

1. Executar testes de performance regularmente
2. Comparar resultados com limites estabelecidos
3. Alertar quando limiares são violados

Exemplo de como integrar ao CI/CD:

```bash
k6 run test/performance/k6/registerFood.test.js --env BASE_URL=https://api.producao.com || exit 1
```

Se qualquer threshold falhar, o comando retorna código de erro, abortando o pipeline.

#### Análise de Resultados com Trends

Trends customizadas como `food_create_duration` permitem:

- Monitorar especificamente endpoints críticos
- Detectar degradação de performance em funcionalidades específicas
- Comparar performance entre diferentes operações

Para adicionar mais trends em novos testes:

```javascript
import { Trend } from 'k6/metrics';

const mealCreationDuration = new Trend('meal_creation_duration');
const progressQueryDuration = new Trend('progress_query_duration');

export default function () {
  // Usar diferentes trends para diferentes operações
  mealCreationDuration.add(mealResponse.timings.duration);
  progressQueryDuration.add(progressResponse.timings.duration);
}
```

#### Composição de Testes Complexos

Os helpers reutilizáveis permitem compor testes complexos que simulam jornadas completas de usuários. Por exemplo:

1. Registrar usuário
2. Fazer login
3. Criar múltiplos alimentos
4. Registrar refeições com esses alimentos
5. Consultar progresso diário

Cada etapa pode ser envolvida em seu próprio group, com seus próprios checks e possíveis trends customizadas para rastrear métrica específica.
