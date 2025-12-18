# Nutrify API

API REST para gerenciamento de alimentação, dieta e controle de calorias.

## Visão Geral

A Nutrify API fornece funcionalidades completas para registrar refeições, rastrear consumo de calorias e macronutrientes, com suporte a diferentes níveis de acesso (usuário comum e administrador).

## Stack Técnico

- Node.js com Express
- Autenticação via JWT
- Armazenamento em memória (sem banco externo)
- Testes unitários e funcionais em pt-BR
- Testes de performance com K6
- Documentação via Swagger/OpenAPI
- ESLint e Prettier para qualidade de código
- GitHub Actions para CI/CD

## Início Rápido

Instale as dependências:

```bash
npm install
```

Configure o arquivo `.env` baseado em `.env.example`. Apenas `JWT_SECRET` e `PORT` são obrigatórios:

```bash
cp .env.example .env
```

Inicie o servidor:

```bash
npm run dev
```

Acesse a documentação Swagger em `http://localhost:3000/api-docs`.

## Comandos

Testes unitários com cobertura:

```bash
npm run test:unit
```

Testes funcionais:

```bash
npm run test:functional
```

Linting e formatação:

```bash
npm run lint
npm run prettier
```

Testes de performance com K6:

```bash
k6 run test/performance/k6/registerFood.test.js --vus 10 --duration 15s
```

## Funcionalidades

A API implementa os seguintes requisitos:

- Cadastro e autenticação de usuários com JWT
- CRUD completo de alimentos com valores nutricionais
- Registro de refeições vinculadas a usuários
- Cálculo automático de totais de calorias e macronutrientes
- Rastreamento diário de consumo versus meta calórica
- Controle de acesso baseado em funções (admin e usuário comum)
- Documentação automática via Swagger
- Validação de entrada com rejeição de campos extras
- Geração automática de timestamps em operações

## Políticas de API

Strict validation: as rotas de criação e atualização (`POST`/`PUT` em `/users`, `/foods`, `/meals`) rejeitam campos extras com resposta `400`. Use apenas os campos documentados no Swagger.

Timestamps: todas as entidades retornam `createdAt` e `updatedAt` em ISO 8601, gerados automaticamente pelo servidor.

## Endpoints

### Refeições

O endpoint `POST /meals` aceita apenas a lista de IDs de alimentos. Os campos `date`, `createdAt` e `updatedAt` são gerados automaticamente. Os totais nutricionais (`totalCalories`, `totalProtein`, `totalCarbs`, `totalFat`) também são calculados automaticamente com base nos alimentos referenciados.

Exemplo de payload:

```json
{
  "foods": ["food-id-1", "food-id-2"]
}
```

### Progresso Diário

O endpoint `GET /progress` retorna o consumo calórico do usuário em relação à meta diária.

Parâmetros:

- `date` (opcional): Data em formato `YYYY-MM-DD`. Usa data atual se não informado.
- `userId` (opcional): ID do usuário. Apenas administradores podem consultar outros usuários.

Resposta:

```json
{
  "userId": "user-1",
  "date": "2025-01-20",
  "totalCalories": 1850,
  "calorieGoal": 2000,
  "status": "below"
}
```

O campo `status` indica: `below` (abaixo da meta), `equal` (na meta) ou `above` (acima da meta).

### Permissões de Admin

Usuários com role `admin` podem:

Refeições:

- `GET /meals?userId=<id>`: Listar refeições de qualquer usuário
- `PUT /meals/:id`: Atualizar refeição de qualquer usuário
- `DELETE /meals/:id`: Remover refeição de qualquer usuário

Progresso:

- `GET /progress?userId=<id>&date=YYYY-MM-DD`: Consultar progresso de outro usuário

## Testes

### Teste Unitário

Os testes unitários cobrem serviços e rotas principais:

```bash
npm run test:unit
```

Relatório de cobertura em `coverage/lcov-report/index.html`.

### Teste Funcional

Os testes funcionais cobrem fluxos completos de usuário:

```bash
npm run test:functional
```

Relatório em `reports/mocha/mochawesome.html`.

Todos os testes estão em português (pt-BR).

### Testes de Performance com K6

O teste `test/performance/k6/registerFood.test.js` valida a performance da API simulando um fluxo completo: registrar usuário, fazer login e criar alimentos.

```bash
k6 run test/performance/k6/registerFood.test.js
```

Com URL customizada:

```bash
k6 run test/performance/k6/registerFood.test.js --env BASE_URL=https://api.example.com
```

Conceitos implementados:

Thresholds: Limites de desempenho como p(95)<2000ms que determinam sucesso/falha do teste.

Checks: Validações de status code e presença de dados nas respostas.

Helpers reutilizáveis: Funções centralizadas em `test/performance/k6/helpers/`:

- `generateRandomEmail.js`: Gera emails únicos usando timestamp
- `getBaseUrl.js`: Obtém URL base da API via variável de ambiente
- `loginUser.js`: Realiza login e extrai token JWT

Faker Pattern: Geração dinâmica de dados em cada iteração:

```javascript
import { faker } from 'k6/x/faker';

const name = faker.person.name();
const foodData = {
  foodName: faker.animal.name() + ' ' + faker.animal.type(),
  category: ['Fruta', 'Proteína', 'Carboidrato'][Math.random() * 3],
  calories: faker.datatype.number({ min: 50, max: 500 }),
};
```

Trends customizadas: Métricas específicas para endpoints críticos, permitindo análise detalhada de desempenho.

Stages: Ramp-up gradual de carga em vez de aumento instantâneo, simulando cenário realista.

Variáveis de Ambiente: BASE_URL configurável via linha de comando para testar contra diferentes ambientes.

## Contribuindo

Antes de submeter pull requests, rode os testes localmente:

```bash
npm install
npm run test:unit
npm run test:functional
npm run lint
npm run prettier
```

Todos os testes e mensagens devem estar em português (pt-BR).

Consulte também o documento `CONTRIBUTING.md`.

## Estrutura do Projeto

```
src/
├── controllers/        # Lógica de requisição-resposta
├── services/          # Lógica de negócio
├── routes/            # Definição de endpoints
├── models/            # Estruturas de dados
├── repositories/      # Acesso aos dados
├── middlewares/       # Middleware de autenticação e validação
├── validators/        # Validadores de entrada
└── errors/            # Classes de erro customizadas

test/
├── unit/              # Testes unitários
├── functional/        # Testes funcionais de API
└── performance/       # Testes de carga com K6

.github/
└── workflows/         # Workflows de CI/CD

swagger.yaml          # Documentação OpenAPI
```

## Armazenamento

A aplicação usa armazenamento em memória. Os dados não persistem entre reinicializações. Para produção, considere integrar um banco de dados persistente como MongoDB ou PostgreSQL.

## Segurança

A API implementa:

- Autenticação JWT para endpoints protegidos
- Hash de senhas com bcrypt
- Validação de entrada com rejeição de campos extras
- Middleware de autenticação em rotas protegidas
- Role-based access control (RBAC) para funcionalidades administrativas

## Próximos Passos

- Integrar banco de dados persistente
- Adicionar autenticação por OAuth2
- Implementar rate limiting
- Adicionar cache de respostas
- Expandir testes de performance
- Configurar deploy automático
