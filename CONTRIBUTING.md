# Contribuição (pt-BR)

Obrigado por contribuir com o projeto!

Antes de submeter pull requests, rode os testes localmente e gere os relatórios:

Instale dependências:

```bash
npm install
```

Rodar testes unitários (Jest) e gerar relatório JUnit:

```bash
npm run test:unit
```

Rodar testes funcionais (Mocha) e gerar relatório mochawesome (títulos em pt-BR):

```bash
npm run test:functional
```

Relatórios gerados:

- `reports/mocha/mochawesome.html` (relatório visual mochawesome — contém títulos em pt-BR)
- `junit.xml` gerado pelo jest-junit na raiz (quando configurado)

Padronização:

- Mensagens de teste e descrições estão em Português (pt-BR).
- Code style: ESLint + Prettier. Execute `npm run lint` e `npm run prettier` antes de abrir PR.

Obrigado!
