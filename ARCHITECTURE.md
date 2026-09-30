# Arquitetura

Quake Vision é um monorepo orientado a visualização geoespacial de terremotos.

- **apps/web**: Next.js, mapa, filtros, gráficos e interação do usuário.
- **apps/api**: API de apoio e integração com as fontes de eventos sísmicos.
- **Delivery**: containers independentes para web/API e GitHub Actions.

O pipeline executa type checking, lint, testes, cobertura mínima de 80% e build dos workspaces.
