# Parqueadero

Sistema de gestión de parqueadero: registro de entradas y salidas, cobro manual y caja diaria.

## Estructura

```
parqueadero/
  ParqueaderoBack/    API: Node + Express + TypeScript + MongoDB (Mongoose)
  ParqueaderoFront/   Aplicación Angular
```

## Backend

```bash
cd ParqueaderoBack
cp .env.example .env      # completar MONGODB_URI, JWT_SECRET y contraseñas
npm install
npm run dev               # http://localhost:3000
```

Scripts útiles: `npm run typecheck`, `npm run build`, `npm run seed:tipos`, `npm run seed:usuarios`.

## Frontend

```bash
cd ParqueaderoFront
npm install
npx ng serve              # http://localhost:4200
```

## Ramas

- `main`: versión estable.
- `develop`: integración.
- `feature/<nombre>`: se crean desde `develop` y vuelven a `develop` mediante pull request.
