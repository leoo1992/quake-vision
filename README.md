# QuakeVision

QuakeVision é um centro visual de monitoramento sísmico que transforma dados reais do **USGS Earthquake Catalog** em um mapa global interativo, filtros, métricas e análises temporais.

## Stack

### Frontend
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Redux Toolkit
- MapLibre GL
- OpenFreeMap
- Recharts

### Backend
- NestJS
- cache em memória para chamadas USGS
- proxy/normalização de dados
- endpoint serverless compatível com Vercel

## Funcionalidades

- mapa mundial WebGL;
- dados reais do USGS;
- períodos de 24 horas, 7 dias e 30 dias;
- filtros por magnitude mínima e profundidade máxima;
- modos **Epicentros** e **Heatmap**;
- lista dos eventos mais relevantes;
- seleção de terremoto sincronizada com o mapa;
- métricas de magnitude, profundidade, tsunami e eventos sentidos;
- distribuição por magnitude;
- atividade sísmica por hora/dia;
- tratamento de loading/erro;
- responsivo para desktop e celular;
- fallback direto para USGS quando o NestJS não estiver publicado;
- CI, testes, Docker, ESLint, licença MIT e .env.example.

## Executar

Requisito: Node 22.12+.

```bash
npm install
npm run dev:api
```

Em outro terminal:

```bash
npm run dev:web
```

Web: http://localhost:3000  
API: http://localhost:3001

## Variáveis

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Nenhuma chave é necessária para USGS ou OpenFreeMap.

## Qualidade

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Deploy na Vercel

### Web
Crie um projeto Vercel com Root Directory `apps/web`.

O frontend funciona sozinho consultando o USGS diretamente.

### API NestJS
Opcionalmente crie um segundo projeto com Root Directory `apps/api`, depois configure:

```env
NEXT_PUBLIC_API_URL=https://sua-api.vercel.app
```

no projeto web.

## Fonte dos dados

O QuakeVision usa o USGS FDSN Event Web Service em GeoJSON. A API permite filtrar por período, magnitude, profundidade, região e ordenação.

Mapa vetorial: OpenFreeMap + MapLibre GL.

## Arquitetura

```text
USGS Earthquake API
        ↓
   NestJS API
  cache + normalize
        ↓
   Next.js / React
        ↓
   Redux Toolkit
        ↓
MapLibre + Recharts
```

Se o backend não estiver disponível:

```text
Next.js → USGS diretamente
```

## Licença

MIT © 2026 Leonardo Santos Custódio.
