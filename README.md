# Umbral — Landing

Landing page de Umbral, el sistema de fichas clínicas para terapeutas que atienden por su cuenta.

## Stack

- [Astro](https://astro.build) 5
- [Tailwind CSS](https://tailwindcss.com) v4
- TypeScript (`strict`, vía `astro/tsconfigs/strict`)

## Requisitos

- Node.js 18+
- npm

## Desarrollo

```bash
npm install
npm run dev
```

El sitio queda disponible en `http://localhost:4321`.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con hot reload |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Sirve el build de `dist/` localmente |
| `npm run check` | Corre `astro check` (typecheck en modo strict) |

## Deploy

El sitio se despliega automáticamente en Vercel a partir de `main`/`master` en este repositorio.
